import fs from 'fs'
import path from 'path'
import url from 'url'
import consolidate from 'consolidate'
import uuidv4 from 'uuid/v4'
import reCaptcha from 'recaptcha2'

import mailer from './lib/mailer'
import readconfig from './lib/readconfig'
import saver from './lib/saver'

const viewEngine = consolidate['nunjucks']
const debug = require('debug')('lambda-form');

export const formPostHandler = async (event, context, callback) => {
  const id         = event.params.id
  const rspHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  }

  let form = null;
  try {
    // get form definition
    form      = await readconfig(id)
  } catch(e) {
    debug(id, ' form retrieve error: ', e)

    return callback(null, {
      statusCode: 404,
      headers: rspHeaders,
      body: JSON.stringify({code: 404, message: `Please check to make sure form ${id} exists.`})
    })
  }

  // apply defaults
  form.name    = form.name || ''

  // define context for view-engine
  const locals = {
    headers: event.headers,
    body: event.body,
    config: form,
    id: uuidv4()
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
  if (form.validate_honeypot && locals.body[form.validate_honeypot]) {
    return callback(null, {
      statusCode: 422,
      headers: rspHeaders,
      body: JSON.stringify({code: 422, message: 'Invalid robot submission.'})
    })
  }

  // validate recaptcha
  if (form.validate_recaptcha) {
    const recap = new reCaptcha({
      siteKey: form.validate_recaptcha.site_key,
      secretKey: form.validate_recaptcha.secret_key,
      ssl: true
    });
    const token = locals.body[form.validate_recaptcha.field || 'g-recaptcha-response']
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
  const tplAdminSubject = form.admin_subject || `New form ${form.name} submission`
  const tplUserSubject  = form.user_subject || tplAdminSubject
  const userSubject     = await viewEngine.render(tplUserSubject, locals)
  const adminSubject    = await viewEngine.render(tplAdminSubject, locals)

  // allow for template to be pass in as template name
  const adminFile  = (form.admin_template || 'index/admin.mjml').trim()
  const userFile   = (form.user_template || 'index/user.mjml').trim()

  // render body
  const tplABody   = adminFile.endsWith('.mjml') ? fs.readFileSync(path.combine(__dirname, 'template/' + adminFile), 'utf8') : adminFile
  const tplUBody   = userFile.endsWith('.mjml') ? fs.readFileSync(path.combine(__dirname, 'template/' + userFile), 'utf8') : userFile
  const adminBody  = await viewEngine.render(tplABody, locals)
  let userBody     = adminBody

  if (tplUBody == tplABody) {
    userBody = await viewEngine.render(tplUBody, locals)
  }

  const userEmail  = locals.body[locals.config.email_user]
  const adminEmail = locals.body[locals.config.admin_email]
  const persistAll = [saver(locals)]

  // send admin email
  if (adminEmail) {
    // admin reply go to user
    persistAll.push(mailer(locals, adminEmail, adminSubject, adminBody, userEmail))
  }

  // send user email
  if (userEmail) {
    // user reply go to admin
    persistAll.push(mailer(locals, userEmail, userSubject, userBody, adminEmail))
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
