#!/bin/sh
export DEBUG=lambda-form
export SLS_DEBUG=*

serverless invoke local -f formPostHandler -p tests/404.json
serverless invoke local -f formPostHandler -p tests/deleted.json | grep 'Form deleted no longer accept submission.'
serverless invoke local -f formPostHandler -p ./tests/email-custom.json | grep '"https://www.example.com/thank-you-page'
serverless invoke local -f formPostHandler -p ./tests/email-default.json | grep 'email-default submission accepted.'
serverless invoke local -f formPostHandler -p tests/honeypot.json | grep 'Missing data in submission.'
serverless invoke local -f formPostHandler -p tests/origins.json | grep 'Invalid origin (http://localhost:3000) submission.'
serverless invoke local -f formPostHandler -p tests/recaptcha.json | grep 'Invalid captcha (undefined) response.'
