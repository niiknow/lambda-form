import fs from 'fs'
import url from 'url'
import uuidv4 from 'uuid/v4'
import consolidate from 'consolidate'
import reCaptcha from 'recaptcha2'

import mailer from './lib/mailer'
import saver from './lib/saver'
import readconfig from './lib/readconfig'

const viewEngine = consolidate['nunjucks']

export const formPostHandler = async (event, context, callback) => {
  const id         = event.params.id
  const rspHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  }

  // get form definition from url
  const formDef = await readconfig(id)
  formDef.name = formDef.name || ''

  // validate origins
  const origins = ',' + (formDef.validate_origins || '').trim(',') + ','
  const origin  = (event.headers.origin || '').trim()
  if (origins.length > 3) {
    if (origin.length < 4 || origins.indexOf(',' + url.parse(origin).hostname.toLowerCase() + ',') < 0) {
      return callback(null, {
        statusCode: 403,
        headers: rspHeaders,
        body: JSON.stringify({code: 403, message: `Invalid origin (${origin}) submission.`})
      })
    }
  }

  const postId = uuidv4();
  const locals = {
    headers: event.headers,
    body: event.body,
    config: formDef,
    id: postId
  }

  // validate recaptcha
  if (formDef.validate_recaptcha) {
    const recaptcha = new reCaptcha({
      siteKey: formDef.validate_recaptcha.site_key,
      secretKey: formDef.validate_recaptcha.secret_key,
      ssl: true
    });
    const token = locals.body[formDef.validate_recaptcha.field || 'g-recaptcha-response']
    try {
      await recaptcha.validate(token)
    } catch (errorCodes) {
      return callback(null, {
        statusCode: 422,
        headers: rspHeaders,
        body: JSON.stringify({code: 422, message: `Invalid captcha (${token}) response.`})
      })
    }
  }

  // if honeypot is a field on this form, return false if it has a value
  if (formDef.validate_honeypot && locals.body[formDef.validate_honeypot]) {
    return callback(null, {
      statusCode: 422,
      headers: rspHeaders,
      body: JSON.stringify({code: 422, message: 'Invalid robot submission.'})
    })
  }

  // render subject
  const tplAdminSubject = formDef.admin_subject || `New form ${formDef.name} submission`
  const tplUserSubject  = formDef.user_subject || tplAdminSubject
  const userSubject     = await viewEngine.render(tplUserSubject, locals)
  const adminSubject    = await viewEngine.render(tplAdminSubject, locals)

  // render content
  const adminFile    = (formDef.admin_template || 'templates/index.mjml').trim()
  const tplAdminBody = adminFile.endsWith('.mjml') ? fs.readFileSync(adminFile, 'utf8') : adminFile

  // TODO: for now, both user and admin body are the same - separate in the future
  const adminBody = await viewEngine.render(tplAdminBody, locals)
  const userBody  = adminBody
  const userEmail = locals.body[locals.config.email_user]

  // send admin email
  const promises = [mailer(locals, locals.smtp_to, adminSubject, adminBody), saver(locals)];
  if (userEmail) {
    promises.push(mailer(locals, userEmail, userSubject, userBody))
  }
  await Promise.all(promises);

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
    statusCode: 403,
    headers: rspHeaders,
    body: JSON.stringify({code: 403, message: `Invalid origin (${origin}) submission.`})
  })
}
