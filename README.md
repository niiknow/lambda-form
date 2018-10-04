# Lambda Form
> A [Serverless](https://serverless.com/) service to handle form submissions using AWS Lambda.

A contact form usually send email to both Submitter and Form's Creator/Owner.  This Serverless function handle sending of email to both parties.

- Deploy this function and create the associated s3 bucket to store form config and submissions.
- Create the form config and upload to s3 bucket.  This can be done manually or by creating some kind of admin (outside the scope of this project).
- Create the front-end of the form and submit to the endpoint.

**Result**
1. An email is sent to the Submitter
2. An email is sent to the Owner
3. A form submission record is stored on S3 with the extension '.submit'
4. A subsequent s3 event trigger another lamba and store this data somewhere or on [Amazon Aurora Serverless](https://aws.amazon.com/rds/aurora/serverless/)

**bot deterrent features**
- Define a honeypot hidden input to protect from generic spam bot - if you ever run a wordpress blog, you may find that there are these bots that go around to auto-submit form and comments with spam messages.
- Define origins to protect post from unknown website.
- Define and place google recaptcha to prevent more advanced bots.

# Tech Stacks
**Dev Stack**
* [debug](https://github.com/visionmedia/debug) - u know, for debugging
* [aws-sdk-js](https://github.com/aws/aws-sdk-js) - for AWS Lambda function and s3 storage
* [Serverless](https://serverless.com/) - deployment
* [Webpack](https://github.com/webpack/webpack) - transform and packaging

**Run Stack**
* [MJML](https://mjml.io/) and [Nunjucks](https://mozilla.github.io/nunjucks/)- so you can customize your email
* [nodemailer](https://github.com/nodemailer/nodemailer) - send smtp email (pretty much everybody does smtp, including: ses, sendgrid, mailgun, sendinblue, etc...)
* [recaptcha2](https://github.com/fereidani/recaptcha2) - to protect your form

# Project Structure
```
forms/     - example and for unit testing
lib/       - helpers
templates/ - email templates
tests/     - test data
handler.js - main form submit handler
env.yml    - define environment variable such as FORMBUCKET
```

# Form/Config Schema
```json
{
    "smtp_from": "from email",
    "smtp_host": "mail.example.com",
    "smtp_user": "username",
    "smtp_pass": "password",
    "smtp_port": 465,
    "smtp_insecure": false,
    "business_name": "niiknow",
    "validate_recaptcha": {
      "site_key": "the site key",
      "secret_key": "the secret key",
      "field": "the form field name, default g-recaptcha-response"
    },
    "validate_origins": "a comma separated list of valid origins",
    "validate_honeypot": "honeypot field name",
    "id": "some guid representing the form id",
    "name": "User friendly name for this form",
    "owner_email": "who to notify user's sumission to",
    "owner_subject": "the subject to notify owner_email with",
    "owner_body": "actual mjml template or empty to use fallback/owner.mjml",
    "redir": "https://www.example.com/thank-you-page",
    "email_user": "identify the email field on the form to send a copy",
    "user_subject": "user subject, can be templated like owner_subject",
    "user_body": "actual mjml template or empty to use fallback/user.mjml",
    "deleted_at": "if there is a value, then this form has been deleted"
}
```

# NOTE
* AWS may block or limit sends from port 25, so you should use a different port.  It is also best to send with SSL only.
* Outside of FORMBUCKET, there is no other config on the server. Each form configuration contain it's own SMTP setup.  Everything rely on you correctly setting up your FORM config.

# TODO/FUTURE ENHANCEMENTS
- [] Filters to include or exclude fields so hidden form field won't come through to the email.
- [] Per field validation with regex.
- [] Handle Image/File form submit/upload.
- [] Probably a plugin system to allow plugins enabling base on form config.  Possible plugins:  fallback with SES, more spam validation, ability to track email with google analytic pixel

# MIT
