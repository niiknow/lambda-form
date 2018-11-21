FROM node:8.10

WORKDIR /app

COPY . /app/
RUN npm install

EXPOSE 5000

ENTRYPOINT [ "node", "--inspect=0.0.0.0:9777", "--nolazy", "./node_modules/.bin/sls", "offline", "start", "--host", "0.0.0.0", "--port", "5000", "--corsAllowOrigin", "*" ]
