# docker-compose build --no-cache
FROM node:16-alpine

# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"
ENV CHROMIUM_PATH="/usr/bin/chromium-browser"
ENV PUPPETEER_EXECUTABLE_PATH="${CHROMIUM_PATH}"
RUN apk add --no-cache \
    git \
    build-base \
    g++ \
    libpng \
    libpng-dev \
    jpeg-dev \
    pango-dev \
    cairo-dev \
    giflib-dev \
    python3 \
    chromium \
    ;

RUN npm i pm2 -g
RUN pm2 install pm2-auto-pull

## Setup the bots folder
RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot
# Copy and Install our bot
COPY ./package.json /usr/src/bot/package.json
RUN npm install

# NOTES:
# To re-build without cache:
# docker-compose build --no-cache