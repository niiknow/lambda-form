import mjml2html from 'mjml'
import validator from './validator'
const nodemailer = require('nodemailer');
const debug      = require('debug')('lambda-form')

export default (locals, to, subject, mjmlBody, replyTo = null) => {
  const smtpConfig = {
    host: locals.config.smtp_host,
    port: locals.config.smtp_port || 587,
    secure: !!locals.config.smtp_secure,
    auth: {
      user: locals.config.smtp_user,
      pass: locals.config.smtp_pass
    },
    tls: { rejectUnauthorized: false }
  }

  const transporter = nodemailer.createTransport(smtpConfig);

  let formEmail = locals.config.from_email
  if (locals.config.from_name) {
    fromEmail = `${local.config.form_name} ${fromEmail}`
  }

  const mailOptions = {
    from: fromEmail,
    to: to,
    subject: subject,
    html: mjml2html(mjmlBody).html
  }

  if (replyTo) {
    debug(locals.id, ' setting reply to ', replyTo)
    mailOptions.replyTo = replyTo
    mailOptions.sender  = replyTo
  }

  return new Promise((resolve) => {
    // do not send email if debug or bad from address
    if (locals.stage.debug || !validator.isEmail(mailOptions.from)) {
      debug(locals.id, ' mail options ', mailOptions)
      return resolve(true)
    }

    transporter.sendMail(mailOptions, resolve);
  });
};
