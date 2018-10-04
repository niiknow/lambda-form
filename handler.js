import fs from 'fs'
import path from 'path'
import url from 'url'
import consolidate from 'consolidate'
import uuidv4 from 'uuid/v4'
import reCaptcha from 'recaptcha2'
import qs from 'qs'
import nunjucks from 'nunjucks'

import mailer from './lib/mailer'
import readconfig from './lib/readconfig'
import saver from './lib/saver'
import validator from './lib/validator'

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
  const isNotJson  = event.headers && (event.headers['content-type'].indexOf('application/x-www-form-urlencoded') > -1)
  const id         = event.pathParameters.id
  const rspHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  }

  let form = null, body = event.body;
  debug(id, ' raw form body ', body, ' header ', event.headers)
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
  form.name = form.name || ''
  if (typeof(body) === 'string') {
    try {
      if (isNotJson) {
        body = qs.parse(body)
      }
      else {
        body = JSON.parse(body)
      }
    } catch(e) {
      debug(id, ' error parsing form body ', e)
      return callback(null, {
        statusCode: 422,
        headers: rspHeaders,
        body: JSON.stringify({code: 422, message: `Invalid form data.`})
      })
    }
  }

  // define context for view-engine
  const locals = {
    headers: event.headers,
    body: body,
    config: form,
    id: uuidv4(),
    stage: event.stageVariables || {}
  }

  // validate origins
  const origins = ',' + (form.validate_origins || '').trim(',') + ','
  const origin  = (event.headers.origin || '').trim()

  // if form.validate_origins then
  if (origins.length > 3) {
    // if origin is empty or not valid, error
    if (origin.length < 4 || origins.indexOf(',' + url.parse(origin).hostname.toLowerCase() + ',') < 0) {
      return callback(null, {
        statusCode: 403,
        headers: rspHeaders,
        body: JSON.stringify({code: 403, message: `Invalid origin (${origin}) submission.`})
      })
    }
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

  // render subject
  const tplOwnerSubject = form.owner_subject || `New form ${form.name} submission`
  const tplUserSubject  = form.user_subject || tplOwnerSubject
  const ownerSubject    = await nunjucks.renderString(tplOwnerSubject, locals)
  const userSubject     = await nunjucks.renderString(tplUserSubject, locals)

  // allow for template to be pass in as template name
  const ownerFile = (form.owner_template || 'fallback/owner.mjml').trim()
  const userFile  = (form.user_template || 'fallback/user.mjml').trim()

  // render body
  let ownerBody = null
  try {
    const tplOBody = ownerFile.endsWith('.mjml') ? fs.readFileSync('templates/' + ownerFile, 'utf-8') : ownerFile
    ownerBody      = await viewEngine.render(tplOBody, locals)
  } catch(e) {
    debug(id, ' owner file read error ', tplOBody, e)

    return callback(null, {
      statusCode: 500,
      headers: rspHeaders,
      body: JSON.stringify({code: 500, message: `Form ${id} error in owner template.`})
    })
  }

  let userBody  = ownerBody
  if (ownerFile != userFile) {
    try {
      const tplUBody  = userFile.endsWith('.mjml') ? fs.readFileSync('templates/' + userFile, 'utf-8') : userFile
      userBody        = await viewEngine.render(tplUBody, locals)
    } catch(e) {
      debug(id, ' submitter file read error ', tplUBody, e)

      return callback(null, {
        statusCode: 500,
        headers: rspHeaders,
        body: JSON.stringify({code: 500, message: `Form ${id} error in submitter template.`})
      })
    }
  }

  const userEmail  = validator.isEmail(body[form.email_user]) ? body[form.email_user] : null
  const ownerEmail = form.owner_email
  const persistAll = [saver(locals)]

  // send owner email
  if (ownerEmail && validator.isEmail(ownerEmail)) {
    debug(id, ' sending owner email ', ownerEmail)
    // owner reply go to user
    persistAll.push(mailer(locals, ownerEmail, ownerSubject, ownerBody, userEmail))
  }

  // send user email
  if (userEmail) {
    debug(id, ' sending user email ', userEmail)
    // user reply go to owner
    persistAll.push(mailer(locals, userEmail, userSubject, userBody, ownerEmail))
  }

  // execute all permistences
  await Promise.all(persistAll);

  // handle redirect, possibly to thank you page
  if (locals.config.redir) {
    return callback(null, {
      statusCode: 301,
      headers: {
        Location: locals.config.redir,
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
