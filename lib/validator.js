import url from 'url'

const regexEmail = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

class Validator {
  static isEmail (email) {
    return !email ? false : regexEmail.test(email)
  }

  static validOrigin(locals) {
    const origins = ',' + (locals.config.validate_origins || '').trim(',') + ','
    const origin  = (locals.headers.Referer || '').trim()

    // if form.validate_origins then
    if (origins.length > 3) {
      // if origin is empty or not valid, error
      if (origin.length < 7 || origins.indexOf(',' + url.parse(origin).hostname.toLowerCase() + ',') < 0) {
        return false;
      }
    }

    return true
  }
}

export default Validator
