import res from './response'
import readconfig from './readconfig'

const debug      = require('debug')('lambda-form-auth')

/**
 * Handle form post of type:
 *  application/json
 *  application/x-www-form-urlencoded
 *  multipart/form-data
 *
 * @param  object     event    the event
 * @param  object     context  the context
 * @param  Function   callback the callback
 */
export default async (event, context, callback) => {
  // possible use isNotJson to change respones to redirect instead of error json?
  const id         = event.pathParameters.id
  const type       = event.pathParameters.type
  const rspHandler = res(context, callback)

  let form = null,
    body = event.body

  debug(id, ' header ', event.headers)
  try {
    // get form definition
    form = await readconfig(id, (event.stageVariables || {}).debug)
  } catch(e) {
    debug(id, ' form retrieve error: ', e)
    return rspHandler(`Please check to make sure form ${id} exists.`, 404)
  }

  let creds = (form.form_creds || '').trim()

  // validate credential type
  if (type === 'admin') {
    creds = (form.admin_creds || '').trim()
  }

  if (creds === '') {
    return rspHandler('true', 200)
  }

  creds = creds.split(',')
  if (body.user === creds[0] && body.pass === creds[1])
  {
    return rspHandler('true', 200)
  }

  return rspHandler('false', 403)
}
