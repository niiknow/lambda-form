import formidable from 'formidable'

const Stream = require('stream').Readable

export default (req, opts={}) => {
  // convert event to stream
  let evt = req
  if (evt.requestContext) {
    const stream = new Stream()
    stream.push( evt.body )
    stream.push( null )

    // convert headers
    const headers = {}
    evt.headers.forEach((k) => {
      const kLower = k.toLowerCase()
      headers[kLower] = evt.headers[k]
    })
    if (!headers['content-length']) {
      headers['content-length'] = evt.body.length
    }
    stream.headers = headers

    req = stream
  }

  return new Promise(function (resolve, reject) {
    var form = new formidable.IncomingForm(opts)
    form.parse(req, function (err, fields, files) {
      if (err) {
        return reject(err)
      }

      resolve({ fields: fields, files: files, evt: evt })
    })
  })
}
