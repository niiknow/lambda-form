import fs from 'fs'
import consolidate from 'consolidate'
import uuidv4 from 'uuid/v4'
import reCaptcha from 'recaptcha2'
import qs from 'qs'
import nunjucks from 'nunjucks'

import readconfig from './lib/readconfig'
import saver from './lib/saver'
import validator from './lib/validator'
import submission from './lib/submission'
import formparser from './lib/formparser'
import uploadfile from './lib/uploadfile'

const viewEngine = consolidate['nunjucks']
const debug      = require('debug')('lambda-form')
/**
 * Handle form post of type application/(json or x-www-form-urlencoded)
 *
 * @param  object     event    [description]
 * @param  object     context  [description]
 * @param  Function   callback [description]
 */
export const formPostHandler = async (event, context, callback) => {
  // possible use isNotJson to change respones to redirect instead of error json?
  const id         = event.pathParameters.id
  const rspHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  }
  const tasks      = []

  let form = null,
    body = event.body,
    redir = (event.queryStringParameters || {}).redir

  debug(id, ' header ', event.headers)
  try {
    // get form definition
    form = await readconfig(id, (event.stageVariables || {}).debug)
  } catch(e) {
    debug(id, ' form retrieve error: ', e)

    return callback(null, {
      statusCode: 404,
      headers: rspHeaders,
      body: JSON.stringify({code: 404, message: `Please check to make sure form ${id} exists.`})
    })
  }

  if (form.deleted_at) {
    return callback(null, {
      statusCode: 404,
      headers: rspHeaders,
      body: JSON.stringify({code: 404, message: `Form ${id} no longer accept submission.`})
    })
  }

  // apply defaults
  redir     = redir || form.redir
  form.name = form.name || ''
  const pf  = await formparser(event)
  body      = pf.fields

  debug(id, ' fields ', pf.fields, ' files ', pf.files)

  // define context for view-engine
  const locals = {
    headers: event.headers || {},
    body: body || {},
    config: form,
    id: uuidv4(),
    files: {},
    stage: event.stageVariables || {},
    query: event.queryStringParameters || {}
  }

  // validate origins
  if (!validator.validOrigin(locals)) {
    return callback(null, {
      statusCode: 403,
      headers: rspHeaders,
      body: JSON.stringify({code: 403, message: `Invalid origin (${locals.origin}) submission.`})
    })
  }

  // if honeypot is a field on this form, return false if it has a value
  if (form.validate_honeypot && body[form.validate_honeypot]) {
    return callback(null, {
      statusCode: 422,
      headers: rspHeaders,
      body: JSON.stringify({code: 422, message: 'Missing data in submission.'})
    })
  }

  // validate recaptcha
  if (form.validate_recaptcha) {
    const recap = new reCaptcha({
      siteKey: form.validate_recaptcha.site_key,
      secretKey: form.validate_recaptcha.secret_key,
      ssl: true
    });
    const token = body[form.validate_recaptcha.field || 'g-recaptcha-response']
    try {
      await recap.validate(token)
    } catch (e) {
      debug(id, ' recaptcha validate error: ', e)
      return callback(null, {
        statusCode: 422,
        headers: rspHeaders,
        body: JSON.stringify({code: 422, message: `Invalid captcha (${token}) response.`})
      })
    }
  }

  // exclude fields
  if (form.field_exclude_regex) {
    const newBody = {}
    const regex   = new RegExp(form.field_exclude_regex)

    Object.keys(locals.body).forEach((k) => {
      // debug(k, ' key ', form.field_exclude_regex)
      if (!regex.test(k))
      {
        // debug(k, ' match ')
        newBody[k] = locals.body[k]
      }
    })

    locals.body = newBody
  }

  // parsing files
  Object.keys(pf.files || {}).forEach((k) => {
    const f  = pf.files[k]
    const fi = {
      key: `${id}/${locals.id}/${k}-${f.File.name}`,
      ref: k,
      bucket: process.env.FORMBUCKET
    }
    locals.files[k] = fi

    tasks.push(uploadfile(fi, f.File))
  })

  // render subject
  const tplOwnerSubject = form.owner_subject || `New form ${form.name} submission`
  const tplUserSubject  = form.user_subject || tplOwnerSubject
  locals.ownerSubject   = await nunjucks.renderString(tplOwnerSubject, locals)
  locals.userSubject    = await nunjucks.renderString(tplUserSubject, locals)

  // allow for template to be pass in as template name
  const ownerFile = (form.owner_template || 'fallback/owner.mjml').trim()
  const userFile  = (form.user_template || 'fallback/user.mjml').trim()

  // render body
  locals.ownerBody = null
  try {
    const tplOBody   = ownerFile.endsWith('.mjml') ? fs.readFileSync('templates/' + ownerFile, 'utf-8') : ownerFile
    locals.ownerBody = await viewEngine.render(tplOBody, locals)
  } catch(e) {
    debug(id, ' owner file read error ', e)

    return callback(null, {
      statusCode: 500,
      headers: rspHeaders,
      body: JSON.stringify({code: 500, message: `Form ${id} error in owner template.`})
    })
  }

  locals.userBody = locals.ownerBody
  if (ownerFile != userFile) {
    try {
      const tplUBody  = userFile.endsWith('.mjml') ? fs.readFileSync('templates/' + userFile, 'utf-8') : userFile
      locals.userBody = await viewEngine.render(tplUBody, locals)
    } catch(e) {
      debug(id, ' submitter file read error ', e)

      return callback(null, {
        statusCode: 500,
        headers: rspHeaders,
        body: JSON.stringify({code: 500, message: `Form ${id} error in submitter template.`})
      })
    }
  }

  // do file upload, future: stripe charges
  await Promise.all(tasks);

  // execute all persistences
  await saver(locals)

  // handle redirect, possibly to thank you page
  if (redir) {
    return callback(null, {
      statusCode: 301,
      headers: {
        Location: redir,
      },
      body: '',
    })
  }

  return callback(null, {
    statusCode: 200,
    headers: rspHeaders,
    body: JSON.stringify({code: 200, message: `${id} submission accepted.`})
  })
}

export const submissionHandler = submission
