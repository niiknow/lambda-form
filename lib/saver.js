import AWS from 'aws-sdk'
import zlib from 'zlib'

const s3    = new AWS.S3()
const debug = require('debug')('lambda-form')

export default (id, locals) => {
  return new Promise((resolve, reject) => {
    const key = `${id}/${locals.id}.submit`
    if (locals.stage.debug) {
      debug(key)
      return resolve(true)
    }

    const buff = Buffer.from(JSON.stringify(locals, null, 2), 'utf-8')
    zlib.gzip(buff, (err, compData) => {
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
