import AWS from 'aws-sdk'
import validator from './validator'
import mailer from './mailer'
import zlib from 'zlib'

const s3    = new AWS.S3()
const debug = require('debug')('lambda-form')

/**
 * Handle s3 submission event
 *
 * @param  object     event
 * @param  object     context
 * @param  Function   callback
 */
export default (event, context, callback) => {
  debug(JSON.stringify(event))
  const s3Object = event.Records[0].s3

  s3.getObject({
    Bucket: s3Object.bucket.name,
    Key: s3Object.object.key,
  }, (err, data) => {
    if (err) {
      return callback(err)
    }

    zlib.gunzip(data.Body, async (error, buff) => {
      if (error) {
        return callback(error)
      }

      const cont       = buff.toString('utf-8')
      const locals     = JSON.parse(cont)
      const form       = locals.config
      const body       = locals.body
      const userEmail  = validator.isEmail(body[form.email_field]) ? body[form.email_field] : null
      const ownerEmail = form.notify_email
      const id         = form.id

      // send owner email
      if (ownerEmail && validator.isEmail(ownerEmail)) {
        debug(id, ' sending owner email ', ownerEmail)

        // owner reply go to user
        await mailer(locals, ownerEmail, locals.ownerSubject, locals.ownerBody, userEmail)
      }

      // send user email
      if (userEmail) {
        debug(id, ' sending user email ', userEmail)

        // user reply go to owner
        await mailer(locals, userEmail, locals.userSubject, locals.userBody, ownerEmail)
      }

      callback(null, s3Object)
    })
  })
}
