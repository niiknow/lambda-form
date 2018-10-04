# Lambda Form
> A [Serverless](https://serverless.com/) service to handle form submissions using AWS Lambda.

A contact form usually email both Submitter and Form's Creator/Owner.  This Serverless function handle sending of email to both parties.

- Deploy this function and create the associated s3 bucket to store form config and submissions.
- Create the form config and upload to s3 bucket.  This can be done manually or by creating some kind of admin (outside the scope of this project).
- Create the front-end of the form and submit to the endpoint.  Example: https://niiknow.github.io/lambda-form/demo/ and the backend form configuration for this demo: https://github.com/niiknow/lambda-form/blob/master/demo/!config.json

Fill in the demo form with a real email and wait for result.

**Result**
1. An email is sent to the Submitter
2. An email is sent to the Owner
3. A form submission record is stored on S3 with the extension '.submit'

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

# Features
- [x] Per form confirmation, no hardcoding of config
- [x] Email to both form Submitter and Owner
- [x] Flexible email templating with mjml and nunjucks
- [x] Validate origin domain, recaptcha2, and honeypot
- [x] Completely serverless, store form configuration and result on s3 
- [x] Email sent are replyable, e.g. emails are sent with 'Reply-To' header *as on behalf of* the Owner/Submitter
- [x] One of the biggest advantage is that form fields are not hardcoded.  It can take unlimited number of fields that are either *application/json or application/x-www-form-urlencoded*.  At the moment, there is no defined strategy to accept file upload/binary or multipart/form-data form type.

# Why S3 and not directly into some database or sqs/sns?
Because it is serverless and event triggerable.  SQS and SNS has a limit on the message size.

You can use s3 event to trigger other actions such as Zapier callback.  It can also trigger and store this data somewhere or on [Amazon Aurora Serverless](https://aws.amazon.com/rds/aurora/serverless/).

Usually, we want the form to be fast.  The form is already doing a lot of work so we don't want to tack on any unnecessary work.  The benefit of s3 event is that it can defer the work at a later time allowing for quick return of result to the user.

# Project Structure
```shell
forms/     - example and for unit testing
lib/       - helpers
templates/ - email templates
tests/     - test data
handler.js - main form submit handler
env.yml    - define environment variable such as FORMBUCKET

# on AWS s3 - bucket
form-id-folder/!config.json
form-id-folder/guid-guid-guid-guid.submit
form-id-folder/result-guid-result-guid.submit
use-random-guid-for-best-form-id-performance/!config.json
```

# Form/Config Schema
```json
{
    "smtp_from": "from email",
    "smtp_host": "mail.example.com",
    "smtp_user": "username",
    "smtp_pass": "password",
    "smtp_port": 465,
    "smtp_secure": false,
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
    "owner_email": "who to notify user's submission to",
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
* This project require AWS S3 private bucket.  Please make sure you have your bucket is not public or you will expose your smtp credential.
* AWS may block or limit sends from port 25, so you should use a different port.  It is also best to send with SSL only.
* Outside of FORMBUCKET, there is no other config on the server. Each form configuration contain it's own SMTP setup.  Everything rely on you correctly setting up your FORM config.
* Remember, if you use application/x-www-form-urlencoded, you should set a redirection (redir property) to provide redirect result.

# TODO/FUTURE ENHANCEMENTS
- [ ] Filters to include or exclude fields so hidden form field won't come through to the email
- [ ] Per field validation - possibly use [Indicative](https://indicative.adonisjs.com/) for validation of json
- [ ] Handle Image/File form submit/upload
- [ ] Probably a plugin system to allow plugins enabling base on form config.  Possible plugins:  fallback with SES, more spam validation, ability to track email with google analytic pixel

# Point of Interest
Since this is Serverless, this setup can really scale.  It can be use as a component in your Software-as-a-Service *SaaS* platform, like a clone of wufoo.  All you need is an Admin portal with a FormBuilder - hint - [grapejs](https://github.com/artf/grapesjs)

# MIT
