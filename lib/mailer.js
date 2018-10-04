import mjml2html from 'mjml'
import validator from './validator'
const nodemailer = require('nodemailer');
const debug      = require('debug')('lambda-form')

export default (locals, to, subject, mjmlBody, replyTo = null) => {
  const smtpConfig = {
    host: locals.config.smtp_host,
    port: locals.config.smtp_port || 587,
    secure: !locals.config.smtp_insecure,
    auth: {
      user: locals.config.smtp_user,
      pass: locals.config.smtp_pass
    }
  }

  if (replyTo) {
    smtpConfig.replyTo = replyTo
    smtpConfig.sender  = replyTo
  }

  const transporter = nodemailer.createTransport(smtpConfig);
  const mailOptions = {
    from: locals.config.smtp_from,
    to: to,
    subject: subject,
    html: mjml2html(mjmlBody).html
  }

  return new Promise((resolve) => {
    // do not send email if debug or bad from address
    if (locals.stage.debug || !validator.isEmail(mailOptions.from)) {
      debug(mailOptions)
      return resolve(true)
    }

    transporter.sendMail(mailOptions, resolve);
  });
};
