# docker-compose build --no-cache
FROM node:18-alpine

# Install app dependencies
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"
ENV CHROMIUM_PATH="/usr/bin/chromium-browser"
ENV PUPPETEER_EXECUTABLE_PATH="${CHROMIUM_PATH}"
RUN apk add --no-cache \
    git \
    chromium \
    ;

# Install PM2 and auto pull for updates
RUN npm i pm2 -g
RUN pm2 install pm2-auto-pull

## Setup the bots folder
RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot

# Copy and Install the bot dependencies
COPY ./package.json /usr/src/bot/package.json
RUN npm install

# NOTES:
# To re-build without cache:
# docker-compose build --no-cache