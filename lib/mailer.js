const nodemailer = require('nodemailer');

export default (config, cb) => {
  const smtpConfig = {
    host: config.smtpHost,
    port: 587,
    secure: true, // use SSL
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass
    }
  }

  const transporter = nodemailer.createTransport(smtpConfig);
  const mailOptions = {
    from: config.from,
    to: config.to,
    cc: config.cc,
    subject: config.subject,
    html: config.html
  }
  transporter.sendMail(mailOptions, cb);
};
