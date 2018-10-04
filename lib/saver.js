import AWS from 'aws-sdk'

const s3 = new AWS.S3()

export default (locals) => {
  return s3.putObject({
    Bucket: process.env.FORMBUCKET,
    Body: locals,
    Key: `${locals.config.form.id}/${locals.id}.all`,
    ContentType: 'application/json'
  }).promise()
}
