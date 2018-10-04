import AWS from 'aws-sdk'

const s3    = new AWS.S3()
const debug = require('debug')('lambda-form')

export default (locals) => {
  return new Promise((resolve, reject) => {
    const key = `${locals.config.id}/${locals.id}.submit`
    if (locals.stage.debug) {
      debug(key)
      return resolve(true)
    }

    return s3.putObject({
      Bucket: process.env.FORMBUCKET,
      Body: locals,
      Key: key,
      ContentType: 'application/json'
    }, (err, data) => {
        if (err) {
          return reject(err)
        }
        return resolve(data)
      }
    );
  })
}
