import AWS from 'aws-sdk'
import gzip from 'gzip'

const s3    = new AWS.S3()
const debug = require('debug')('lambda-form')

export default (fi, f) => {
  return new Promise((resolve, reject) => {
    const key = fi.key
    if (locals.stage.debug) {
      debug(key)
      return resolve(true)
    }

    const bodyStream = fs.createReadStream( f.path );
    const params = {
      Bucket        : fi.bucket,
      Key           : key,
      ContentLength : fs.size,
      Body          : bodyStream,
      ContentType   : fs.type
    };

    s3.putObject(params, (err2, data) => {
        if (err) {
          return reject(err)
        }

        return resolve(data)
      }
    )
  })
}
