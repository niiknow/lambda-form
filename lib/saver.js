import AWS from 'aws-sdk'
import zlib from 'zlib'

const s3    = new AWS.S3()
const debug = require('debug')('lambda-form')

export default (locals) => {
  return new Promise((resolve, reject) => {
    const key = `${locals.config.id}/${locals.id}.submit`
    if (locals.stage.debug) {
      debug(key)
      return resolve(true)
    }

    zlib.gunzip(JSON.stringify(locals, null, 2), function(err, compData) {
      if (err) {
        return reject(err)
      }

      s3.putObject({
        Bucket: process.env.FORMBUCKET,
        Body: compData,
        Key: key,
        ContentEncoding: 'gzip',
        ContentType: 'application/json'
      }, (err2, data) => {
          if (err2) {
            return reject(err2)
          }

          return resolve(data)
        }
      )
    })
  })
}
