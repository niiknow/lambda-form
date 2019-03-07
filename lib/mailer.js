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

  let smtpEmail = locals.config.smtp_user

  // use from_email if smtp_user is a simple user name
  if (smtpEmail.indexOf('@') < 0) {
    smtpEmail = locals.config.from_email
  }

  const mailOptions = {
    from: smtpEmail,
    to: to,
    subject: subject,
    html: mjml2html(mjmlBody).html
  }

  // use from_email if bad replyTo and smtpEmail is the same as from_email
  if (!replyTo && (smtpEmail !== locals.config.from_email)) {
    replyTo = locals.config.from_email
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
