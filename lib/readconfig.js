import fs from 'fs'
import path from 'path'
import AWS from 'aws-sdk'

const s3 = new AWS.S3()

export default (id, debug = false) => {
  return new Promise((resolve, reject) => {
    if (debug) {
      return fs.readFile(
        `forms/${id}/!config.json`,
        'utf-8',
        (err, data) => {
          err ? reject(err) : resolve(JSON.parse(data))
        }
      )
    } else {
      return s3.getObject({
        Bucket: process.env.FORMBUCKET,
        Key: `${id}/!config.json`
      }, (err, data) => {
        if (err) {
          return reject(err)
        }
        const body = data.Body.toString('utf-8')
        resolve(JSON.parse(body))
      })
    }
  })
}
