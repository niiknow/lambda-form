# Lambda Form
> A [Serverless](https://serverless.com/) service to handle form submissions using AWS Lambda.

 
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
