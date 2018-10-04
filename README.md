# Lambda Form
> A [Serverless](https://serverless.com/) service to handle form submissions using AWS Lambda.

A contact form usually email both Submitter and Form's Creator/Owner.  This Serverless function handle sending of email to both parties.

- Deploy this function and create the associated s3 bucket to store form config and submissions.
- Create the form config and upload to s3 bucket.  This can be done manually or by creating some kind of admin (outside the scope of this project).
- Create the front-end of the form and submit to the endpoint.  Example: https://niiknow.github.io/lambda-form/demo/ with backend configuration of https://github.com/niiknow/lambda-form/blob/master/demo/!config.json

Fill out the demo form with a real email and wait for result.

**Result**
1. An email is sent to the Submitter
2. An email is sent to the Owner
3. A form submission record is stored on S3 with the extension '.submit'

**Bot/Span deterrent features**
- Define a honeypot hidden input to protect from generic spam bot - if run any kind of commentable blog/website, you've probably seen bots that auto-submit these forms with spam.  Honeypot help deny majority of these dumb bots.
- Define website origins to protect being use with unknown website.
- Setup recaptcha to prevent smarter bots.

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

# Commands
**To Test**
```
npm install
./run-data-tests.sh
```

**To Run/Deploy**
1. Create s3 bucket
2. Create environment file from example and set the FORMBUCKET value
```
cp env.yml.example env.yml
```
3. Deploy
```
npm install
npm run deploy
```
4. It will deploy dev and give you a URL that you can post to, something like: https://{some-id}.execute-api.us-east-1.amazonaws.com/dev/form/{id}
5. Update *demo/!config.json* line 2-7 to your SMTP and email
6. Upload this file to your s3 bucket like so
```
demo/!config.json
```
7. Post to your new endpoint, in this case, *demo* is your form {id}
```
https://{some-id}.execute-api.us-east-1.amazonaws.com/dev/form/demo
```
8. Repeat for any new form.  Use random guid as form id to improve performance.
9. When ready, update serverless.yml to prod and deploy
```yml
provider:
  name: aws
  runtime: nodejs8.10
  stage: dev # change dev to prod
  region: us-east-1
```

# Features
- [x] Per Form configuration, no hardcoding of config or field names
- [x] No restriction on field name and/or accept any number of inputs
- [x] Send email to form Submitter and Owner
- [x] Flexible email subject and body templating with mjml and nunjucks
- [x] Validate origin domain, recaptcha2, and honeypot
- [x] Completely serverless, store and read configuration and result on s3 
- [x] Email sent are replyable, e.g. email sent with 'Reply-To' header *as on behalf of* the Owner/Submitter
- [ ] At the moment, there is no defined strategy to accept binary file upload or multipart/form-data form type.

# Why S3 and not directly into some database or sqs/sns?
Because it is Serverless and event triggerable.  SQS and SNS has a limit on message size.

You can use s3 event to trigger followup actions, such as Zapier callback, email subscription, etc...  It can also store this data somewhere like on [Amazon Aurora Serverless](https://aws.amazon.com/rds/aurora/serverless/).

Usually, we want the form to be fast.  The form is already doing a lot of work so we don't want to tack on any unnecessary work.  The benefit of s3 event is to defer the work at a later time, allowing for faster response time.

Other things that can add more delays in the future is support of plugins like Payment Gateways, such as Stripe and/or Paypal.  It may result in pushing email to a later s3 event trigger.

# Project Organization
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

# Note
* This project require AWS S3 private bucket.  Please make sure your bucket is not public or you will expose your SMTP and other credentials.
* AWS may block or limit sends from port 25, so you should use a different port.
* Outside of FORMBUCKET, there is no other config on the server. Each form configuration contain it's own SMTP setup.
* Remember, if you use application/x-www-form-urlencoded, you should set a redirection (redir property) to provide redirect result.  The front-end can also pass in a "redir" query string parameter.

# TODO/Future Enhancements
- [ ] Filters to include or exclude fields so hidden form field won't come through to the email
- [ ] Per field validation - possibly use [Indicative](https://indicative.adonisjs.com/) for validation of json
- [ ] Handle Image/File form submit/upload
- [ ] Probably a plugin system to allow plugins enabling base on form config.  Possible plugins:  fallback with SES, more spam validation, ability to track email with google analytic pixel
- [ ] Payment gateway integration strategy start with Stripe.  Maybe it will be part of plugin system.
- [ ] Refactor email and google recaptcha into plugin?

# Point of Interest
Since this is Serverless, this setup can really scale.  It can be use as a component in your Software-as-a-Service *SaaS* platform, like a clone of wufoo.  All you need is an Admin portal with a FormBuilder - hint - [grapejs](https://github.com/artf/grapesjs)

# MIT
