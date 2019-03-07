import fs from 'fs'
import consolidate from 'consolidate'
import uuidv4 from 'uuid/v4'
import reCaptcha from 'recaptcha2'
import nunjucks from 'nunjucks'

import readconfig from './readconfig'
import saver from './saver'
import validator from './validator'
import formparser from './formparser'
import uploadfile from './uploadfile'
import res from './response'

const viewEngine = consolidate['nunjucks']
const debug      = require('debug')('lambda-form')

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
  const tasks      = []
  const rspHandler = res(context, callback)
  const temp       = require('temp')
  temp.track()

  let form = null,
    body = event.body,
    redir = (event.queryStringParameters || {}).redir

  debug(id, ' header ', event.headers)
  try {
    // get form definition
    form = await readconfig(id, (event.stageVariables || {}).debug)
  } catch(e) {
    debug(id, ' form retrieve error: ', e)
    return rspHandler(`Please check to make sure form ${id} exists.`, 404)
  }

  if (form.deleted_at) {
    return rspHandler(`Form ${id} no longer accept submission.`, 404)
  }

  // validate credential type
}
