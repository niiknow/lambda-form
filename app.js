require("@babel/register")

const post = require('./lib/postHandler')
const http = require('http')

http.createServer((req, res) => {
  const ctype = req.headers['Content-Type'] | req.headers['content-type']
  if (ctype.indexof('/json') > -1) {
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
  console.log('Listening for requests');
});
