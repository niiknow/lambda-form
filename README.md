# Lambda Form
> A [Serverless](https://serverless.com/) service to handle form submissions using AWS Lambda.

A contact form usually send email to both Submitter and Form's Creator/Owner.  This Serverless function handle sending of email to both parties.

- Deploy this function and create the associated s3 bucket to store form config and submissions.
- Create the form config and upload to s3 bucket.  This can be done manually or by creating some kind of admin (outside the scope of this project).
- Create the front-end of the form and submit to the endpoint.

**Result**
1. An email is sent to the Submitter
2. An email is sent to the Owner
3. A form submission record is stored on S3 with the extension '.all'
A subsequent trigger can be setup to store form result somewhere else or execute another lambda function to store on Amazon Aurora Serverless (https://aws.amazon.com/rds/aurora/serverless/)

**bot deterrent features**
- Define a honeypot field in form and hide on the front-end to protect from generic spam bot - if you ever run a wordpress blog, there are bots that go around to autofill form and comments with spam messages.
- Define origins to protect form from being post from unknown website.
- Define and place google recaptcha to prevent more advanced bots.

## Tech Stacks

### Dev Stack
* [debug](https://github.com/visionmedia/debug) - u know, for debugging
* [aws-sdk-js](https://github.com/aws/aws-sdk-js) - for AWS Lambda function and s3 storage
* [Serverless](https://serverless.com/) - deployment
* [Webpack](https://github.com/webpack/webpack) - transform and packaging

### Run Stack
* [MJML](https://mjml.io/) and [Nunjucks](https://mozilla.github.io/nunjucks/)- so you can customize your email
* [nodemailer](https://github.com/nodemailer/nodemailer) - send smtp email (pretty much everybody does smtp, including: ses, sendgrid, mailgun, sendinblue, etc...)
* [recaptcha2](https://github.com/fereidani/recaptcha2) - to protect your form

## NOTE
* AWS may block or limit sends from port 25, so you should use a different port.  It is also best to send with SSL only.

## MIT
