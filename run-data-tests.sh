#!/bin/sh

serverless invoke local -f formPostHandler -p ./data.json
serverless invoke local -f formPostHandler -p ./honeypot.json
