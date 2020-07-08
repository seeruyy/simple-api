FROM node:12.8-alpine
MAINTAINER Sergey Opria <seeruyy@gmail.com>

ARG GITLAB_PV_KEY
ARG NODE_ENV
ENV GITLAB_PV_KEY $GITLAB_PV_KEY
ENV NODE_ENV $NODE_ENV

RUN apk add git \
  && which ssh-agent || ( apk --update add openssh-client ) \
  && eval $(ssh-agent -s) && echo "$GITLAB_PV_KEY" | tr -d '\r' | ssh-add - > /dev/null \
  && mkdir -p ~/.ssh \
  && chmod 700 ~/.ssh \
  && git config --global user.email "launchci@prideglobal.com" \
  && git config --global user.name "Launch CI" \
  && ssh-keyscan gitlab.com >> ~/.ssh/known_hosts \
  && chmod 644 ~/.ssh/known_hosts

ENV HOME /webhome/src
RUN mkdir -p $HOME
WORKDIR /webhome/src

RUN npm init --yes
RUN npm install -g pm2

COPY . $HOME/

RUN apk add git \
  && rm -rf $HOME/node_modules \
  && rm -rf $HOME/coverage \
  && rm -rf $HOME/.nyc_output \
  && npm install --no-optional --production

EXPOSE 3000

ENTRYPOINT NODE_ENV=$NODE_ENV npm start