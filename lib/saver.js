import AWS from 'aws-sdk'
import gzip from 'gzip'

const s3    = new AWS.S3()
const debug = require('debug')('lambda-form')

export default (locals) => {
  return new Promise((resolve, reject) => {
    const key = `${locals.config.id}/${locals.id}.submit`
    if (locals.stage.debug) {
      debug(key)
      return resolve(true)
    }

    gzip(JSON.stringify(locals), (err, compData) => {
      if (err) {
        return reject(err)
      }

      s3.putObject({
        Bucket: process.env.FORMBUCKET,
        Body: compData,
        Key: key,
        ContentType: 'application/json',
        ContentEncoding: 'gzip'
      }, (err2, data) => {
          if (err) {
            return reject(err)
          }

          return resolve(data)
        }
      )
    })
  })
}
