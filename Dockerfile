FROM node:12.8-alpine
MAINTAINER Sergey Opria <seeruyy@gmail.com>

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

ENV HOME /webhome/src
RUN mkdir -p $HOME
WORKDIR /webhome/src

RUN npm init --yes
RUN npm install -g pm2 js-yaml

COPY . $HOME/

RUN apk add git \
  && rm -rf $HOME/node_modules \
  && rm -rf $HOME/coverage \
  && rm -rf $HOME/.nyc_output \
  && npm install --no-optional --production

EXPOSE 3000

ENTRYPOINT NODE_ENV=$NODE_ENV npm start