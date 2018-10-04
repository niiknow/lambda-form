import AWS from 'aws-sdk'

const s3 = new AWS.S3()

export default (id) => {
  return s3.getObject({
    Bucket: process.env.FORMBUCKET,
    Key: `${id}/!config.json`
  }).promise()
}
