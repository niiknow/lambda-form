import busboy from 'busboy'

const debug   = require('debug')('lambda-form')

export default (req, temp) => {
  // convert event to stream
  const ctype = req.headers['content-type'] || req.headers['Content-Type']
  const rst   = { fields: {}, files: {} }

  return new Promise( (resolve) => {
    try {
      if (ctype.indexOf('/json') > -1) {
        rst.fields = JSON.parse(req.rawBody || req.body)
        return resolve(rst)
      } else {
        const bb = new busboy({
          headers: { 'content-type': ctype },
          limits: {
            fileSize: 31457280,  // 30 megabytes
            files: 10  // limit to 10 files
          }
        })

        bb.on('file', function (fieldname, file, filename, encoding, mimetype) {
          const stream = temp.createWriteStream()
          rst.files[fieldname] = { name: filename, path: stream.path, f: file, type: mimetype }
          file.pipe(stream)
        }).on('field', (fieldname, val) => {
          rst.fields[fieldname] = val
        }).on('finish', () => {
          resolve(rst)
        }).on('error', err => {
          debug('error parsing multipart/form-data body ', err)
          resolve( { err: 'Form data is invalid: parsing error' } )
        })

        if (req.end) {
          req.pipe(bb)
        } else {
          bb.write(req.body, req.isBase64Encoded ? 'base64' : 'binary')
        }

        return bb.end()

        /*
        const parser = new Multipart(req)

        return parser.on('finish', (result) => {
          const rst = {fields: result.fields, files: {}}
          if (result.files) {
            result.files.forEach((f) => {
              const pass = new stream.PassThrough()
              f.pipe(pass)
              rst.files[f.name] = { name: f.filename, pass: pass, f: f, type: f.headers['content-type'] }
            })
          }

          resolve(rst)
        })
        */
      }
    } catch(e) {
      debug('error parsing form body ', e)
      return resolve({err: 'Form data is invalid: parsing error'})
    }

    return resolve({err: `Invalid form post type ${ctype}`})
  })
}
