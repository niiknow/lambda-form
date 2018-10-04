import mjml2html from 'mjml'

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
    html: mjml2html(mjmlBody)
  }

  return new Promise((resolve) => {
    if (locals.stage.debug) {
      debug(mailOptions)
      return resolve(true)
    }

    transporter.sendMail(mailOptions, resolve);
  });
};
