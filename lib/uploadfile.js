import AWS from 'aws-sdk'
import fs from 'fs'

const s3    = new AWS.S3()
const debug = require('debug')('lambda-form')

export default (locals, fi, f) => {
  fi.url = s3.getSignedUrl('getObject', {
    Bucket: fi.bucket,
    Key: fi.key,
    Expires: 31557600  // one year in seconds
  })

  return new Promise((resolve, reject) => {
    const key = fi.key
    if (locals.stage.debug) {
      debug(key)
      return resolve(true)
    }

    const bodyStream = f.pass ? f.pass : fs.createReadStream(f.path)
    const params = {
      Bucket        : fi.bucket,
      Key           : key,
      Body          : bodyStream,
      ContentType   : f.type || 'application/octet-stream'
    }

    s3.upload(params, (err2, data) => {
        if (err2) {
          return reject(err2)
        }

        return resolve(data)
      }
    )
  })
}
