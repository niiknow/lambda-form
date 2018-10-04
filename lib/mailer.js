const nodemailer = require('nodemailer');

export default (locals, to, subject, body) => {
  const smtpConfig = {
    host: locals.config.smtp_host,
    port: locals.config.smtp_port || 587,
    secure: !locals.config.smtp_insecure,
    auth: {
      user: locals.config.smtp_user,
      pass: locals.config.smtp_pass
    }
  }

  if (locals.config.smtp_sender) {
    smtpConfig.sender = locals.config.smtp_sender
  }

  if (locals.config.smtp_reply) {
    smtpConfig.replyTo = locals.config.smtp_reply
  }

  const transporter = nodemailer.createTransport(smtpConfig);
  const mailOptions = {
    from: locals.config.smtp_from,
    to: to,
    subject: subject,
    html: body
  }

  return new Promise((resolve) => {
    transporter.sendMail(mailOptions, resolve);
  });
};
