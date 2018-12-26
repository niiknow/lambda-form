import fs from 'fs'
import consolidate from 'consolidate'
import uuidv4 from 'uuid/v4'
import reCaptcha from 'recaptcha2'
import nunjucks from 'nunjucks'

import readconfig from './readconfig'
import saver from './saver'
import validator from './validator'
import formparser from './formparser'
import uploadfile from './uploadfile'
import res from './response'

const viewEngine = consolidate['nunjucks']
const debug      = require('debug')('lambda-form')

/**
 * Handle form post of type:
 *  application/json
 *  application/x-www-form-urlencoded
 *  multipart/form-data
 *
 * @param  object     event    the event
 * @param  object     context  the context
 * @param  Function   callback the callback
 */
export default async (event, context, callback) => {
  // possible use isNotJson to change respones to redirect instead of error json?
  const id         = event.pathParameters.id
  const tasks      = []
  const rspHandler = res(context, callback)
  const temp       = require('temp')
  temp.track()

  let form = null,
    body = event.body,
    redir = (event.queryStringParameters || {}).redir

  debug(id, ' header ', event.headers)
  try {
    // get form definition
    form = await readconfig(id, (event.stageVariables || {}).debug)
  } catch(e) {
    debug(id, ' form retrieve error: ', e)
    return rspHandler(`Please check to make sure form ${id} exists.`, 404)
  }

  if (form.deleted_at) {
    return rspHandler(`Form ${id} no longer accept submission.`, 404)
  }

  // apply defaults
  redir     = redir || form.redir
  form.name = form.name || ''
  const pf  = await formparser(event, temp)
  body      = pf.fields

  debug(id, ' fields ', pf.fields, ' files ', pf.files)
  if (pf.err) {
    return rspHandler(pf.err, 422)
  }

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
    return rspHandler(`Invalid origin (${locals.origin}) submission.`, 422)
  }

  // if honeypot is a field on this form, return false if it has a value
  if (form.validate_honeypot && body[form.validate_honeypot]) {
    return rspHandler('Missing data in submission.', 422)
  }

  // validate recaptcha
  if (form.recaptcha_key && form.recaptcha_secret) {
    const recap = new reCaptcha({
      siteKey: form.recaptcha_key,
      secretKey: form.recaptcha_secret,
      ssl: true
    });
    const token = body[form.recaptcha_field || 'g-recaptcha-response']
    try {
      await recap.validate(token)
    } catch (e) {
      debug(id, ' recaptcha validate error: ', e)
      return rspHandler(`Invalid captcha (${token}) response.`, 422)
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
      key: `${id}/${locals.id}/${k}-${f.name}`,
      ref: k,
      bucket: process.env.FORMBUCKET
    }
    locals.files[k] = fi
    tasks.push(uploadfile(locals, fi, f))
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
    return rspHandler(`Form ${id} error in owner template.`, 500)
  }

  locals.userBody = locals.ownerBody
  if (ownerFile != userFile) {
    try {
      const tplUBody  = userFile.endsWith('.mjml') ? fs.readFileSync('templates/' + userFile, 'utf-8') : userFile
      locals.userBody = await viewEngine.render(tplUBody, locals)
    } catch(e) {
      debug(id, ' submitter file read error ', e)
      return rspHandler(`Form ${id} error in submitter template.`, 500)
    }
  }

  debug('upload files: ', tasks.length)
  // do file upload, future: stripe charges
  await Promise.all(tasks);

  // clean up file
  temp.cleanup()
  // save form post
  await saver(locals)

  // handle redirect, possibly to thank you page
  if (redir) {
    return rspHandler('', 301, { Location: redir })
  }

  return rspHandler(`${id} submission accepted.`, 200)
}
