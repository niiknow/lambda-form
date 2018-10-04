#!/bin/sh

serverless invoke local -f formPostHandler -p ./honeypot.json
serverless invoke local -f formPostHandler -p ./origins.json
serverless invoke local -f formPostHandler -p ./recaptcha.json
serverless invoke local -f formPostHandler -p ./email-default.json
serverless invoke local -f formPostHandler -p ./email-custom.json
