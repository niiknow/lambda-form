FROM node:8
LABEL maintainer="noogen <friends@niiknow.org>"
ENV NPM_CONFIG_LOGLEVEL=warn \
  LAMBDA_FORM_VERSION=1.1.0

EXPOSE 5000
RUN apt-get update && apt-get upgrade -y \
  && apt-get install git -y \
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

ENTRYPOINT [ "node", "--inspect=0.0.0.0:9777", "--nolazy", "./node_modules/.bin/sls", "offline", "start", "--host", "0.0.0.0", "--port", "5000", "--corsAllowOrigin", "*" ]
# ENTRYPOINT ["/bin/bash"]
