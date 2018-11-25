require('@babel/register')

const post  = require('./lib/postHandler')
const http  = require('http')
const URL   = require('url')
const resp  = require('./lib/response').default
const debug = require('debug')('lambda-form')

http.createServer((req, res) => {
  if (req.method !== 'POST') {
    return resp(res, null)(`Invalid request method: ${req.method}`, 422)
  }

  const url   = URL.parse(req.url, true)
  const ctype = req.headers['Content-Type'] | req.headers['content-type']

  // parse query string
  req.queryStringParameters = url.query

  // parse form id
  const path = url.pathname.replace(/^\/*|\/*$/g, '')
  req.pathParameters = {
    id: path.split('/')[0]
  }

  if (ctype.indexOf('application/json') > -1) {
    let data = ''
    req.on('data', (chunk) => { data += chunk })
    req.on('end', () => {
      req.rawBody = data
      post(req, res, null)
    })
  } else {
    return post(req, res, null)
  }
}).listen(process.env.PORT || 5000, () => {
  debug('Listening for requests');
});
