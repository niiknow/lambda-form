import fs from 'fs'
import qs from 'qs'
import stream from 'stream'
import Multipart from 'lambda-multipart'

const debug = require('debug')('lambda-form')

export default (req, opts={}) => {
  // convert event to stream
  const ctype = req.headers['content-type'] || req.headers['Content-Type']

  return new Promise( (resolve) => {
    try {
      if (ctype.indexOf('/json') > -1) {
        return resolve({fields: JSON.parse(req.body) })
      } else if (ctype.indexOf('/form-data') > -1) {
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
      } else if (ctype.indexOf('/x-www-form-urlencoded') > -1) {
        // parse form
        return resolve({fields: qs.parse(req.body)})
      }
    } catch(e) {
      debug('error parsing form body ', e)
      return resolve({err: `Form data is invalid: parsing error`})
    }

    return resolve({err: `Invalid form post type ${ctype}`})
  })
}
