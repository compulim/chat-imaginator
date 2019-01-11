FROM node:alpine

RUN apk update && \
    apk upgrade && \
    apk add --no-cache bash git openssh

ENV PORT=80
EXPOSE 80
ENTRYPOINT ["node", "/var/web/lib/index.js"]

ADD . /var/web
WORKDIR /var/web
RUN npm install --ignore-scripts && \
    npm run build
