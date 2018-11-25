FROM node:10
LABEL maintainer="noogen <friends@niiknow.org>"
ENV NPM_CONFIG_LOGLEVEL=warn \
  LAMBDA_FORM_VERSION=1.2.3
EXPOSE 5000

RUN apt-get update && apt-get upgrade -y \
  && apt-get install git -y \
  && npm install -g pm2 \
  && mkdir -p /usr/local/lambdaform \
  && groupadd -r lambdaform && useradd -r -g lambdaform -d /usr/local/lambdaform lambdaform \
  && chown lambdaform:lambdaform /usr/local/lambdaform \
  && apt-get clean -y && apt-get autoclean -y \
  && apt-get autoremove --purge -y \
  && rm -rf /var/lib/apt/lists/* /var/lib/log/* /tmp/* /var/tmp/*

USER lambdaform
RUN cd /usr/local/lambdaform \
  && git clone https://github.com/niiknow/lambda-form --branch ${LAMBDA_FORM_VERSION} /usr/local/lambdaform/app \
  && cd app && npm install
WORKDIR /usr/local/lambdaform/app

CMD ["npm", "run", "prod"]
