FROM node:14-buster AS build

WORKDIR /lowdefy

COPY . .

# Install all dependencies needed for production build
# Can't try and cache this for src changes (just copy package.json)
# since we yarn install later
RUN yarn install
RUN yarn build

# Build lowdefy starter app
RUN yarn build:lowdefy-starter

# clean all depencies
RUN rm -rf node_modules
RUN yarn cache clean

# install production dependencies only
RUN yarn install --production


FROM node:14-alpine

ENV NODE_ENV=production

RUN mkdir -p /home/node/lowdefy && chown -R node:node /home/node/lowdefy

WORKDIR /home/node/lowdefy

USER node

COPY --from=build --chown=node:node /lowdefy/node_modules ./node_modules

COPY --from=build --chown=node:node /lowdefy/dist ./dist

COPY --chown=node:node ./.lowdefy/build ./build

CMD ["node", "/home/node/lowdefy/dist/server.js"]