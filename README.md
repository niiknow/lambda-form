# Lambda Form
> A [Serverless](https://serverless.com/) service to handle form submissions using AWS Lambda.

A contact form usually email both Submitter and Form's Creator/Owner.  This Serverless function handle sending of email to both parties.

- Deploy this function and create the associated s3 bucket to store form config and submissions.
- Create the form config and upload to s3 bucket.  This can be done manually or by creating some kind of admin (outside the scope of this project).
- Create the front-end of the form and submit to the endpoint.  Example: https://niiknow.github.io/lambda-form/demo/ with backend configuration of https://github.com/niiknow/lambda-form/blob/master/demo/!config.json

Fill out the demo form with a real email and wait for result.

**Result**
1. A form submission record is stored on S3 with the extension '.submit'
2. All files are stored in the same location under the form-id/submission-id/filename.extension
3. FUTURE: process stripe transaction.

**S3 Trigger**
1. At the moment, it sends email to Owner and User.

![](https://raw.githubusercontent.com/niiknow/lambda-form/master/demo/lambda-form.jpg?raw=true)

**Bot/Spam deterrent features**
- Define a honeypot (hidden input) to protect from generic spam bot - if you run any kind of commentable blog/website, you've probably seen bots that auto-submit these forms with spam.  Honeypot help deny majority of these dumb bots.
- Define website origins to protect form being use on unknown website.
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
* [recaptcha2](https://github.com/fereidani/recaptcha2) - to protect your form, it will work with g-recaptcha v3 since it uses the same API endpoint

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
- [x] Support multipart/form-data (file upload) - max payload of 10 MB - impose by [AWS Limit](https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html).

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
    "name": "friendly form name, field can be use in email subject",
    "form_id": "74d15a89-e358-4980-a29b-0c3daf7fcd95",
    "form_creds": "protect form with: username,password",
    "admin_creds": "protect form admin page with: username,password",
    "from_name": "Friends",
    "from_email": "friends@yourdomain.com",
    "smtp_host": "yourdomain.com",
    "smtp_port": "587",
    "smtp_user": "login@yourdomain.com",
    "smtp_pass": "YourPassword",
    "recaptcha_field": "the form field name, default g-recaptcha-response",
    "recaptcha_key": "the site key",
    "recaptcha_secret": "the secret key",
    "valid_origins": "a comma separated list of valid origins or * for all",
    "honeypot_field": "honeypot form field name",
    "redir": "https://www.yourdomain.com/thank-you-page",
    "post_url": "url to post the result to",
    "post_message": "thank you message",
    "business_name": "this field can provide company name in email",
    "business_url": "this field can provide link in email",
    "image_url": "this field can provide logo in email",
    "notify_email": "friends@yourdomain.com",
    "notify_subject": "New form submit by {{ email }}",
    "notify_body": "actual mjml template or empty to use fallback/owner.mjml",
    "email_field": "identify the submitter's email, e.g. email field name on the form",
    "email_subject": "{{ name }}, thank you for contacting us",
    "email_body": "actual mjml template or empty to use fallback/submitter.mjml",
    "pay_gateway": "stripe",
    "pay_client_id": "stripe client id",
    "pay_secret": "stripe secret",
    "pay_public_key": "stripe public key",
    "pay_connect_string": "additional connection string separate by semicolon",
    "started_at": "yyyy-mm-dd when the form start",
    "ended_at": "yyyy-mm-dd when the form end"
}
```

# Note
* This project require AWS S3 private bucket.  Please make sure your bucket is not public or you will expose your SMTP and other credentials.
* AWS may block or limit sends from port 25, so you should use a different port.
* Outside of FORMBUCKET, there is no other config on the server. Each form configuration contain it's own SMTP setup.
* Remember, if you don't use ajax, you should set a redirection (redir property) to provide redirect result.  The front-end can also pass in a "redir" query string parameter.

# TODO/Future Enhancements
- [ ] Filters to include or exclude fields so hidden form field won't come through to the email
- [ ] Per field validation - possibly use [Indicative](https://indicative.adonisjs.com/) for validation of json
- [ ] Probably a plugin system to allow plugins enabling base on form config.  Possible plugins:  fallback with SES, more spam validation, ability to track email with google analytic pixel
- [ ] Payment gateway integration strategy start with Stripe.  Maybe it will be part of plugin system.

# Point of Interest
Since this is Serverless, this setup can really scale.  It can be use as a component in your Software-as-a-Service *SaaS* platform, like a clone of wufoo.  All you need is an Admin portal with a FormBuilder - hint - [grapejs](https://github.com/artf/grapesjs)

# MIT
