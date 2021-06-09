FROM node:14-buster AS build

WORKDIR /lowdefy

COPY . .

# Install all dependencies needed for production build
# Can't try and cache this for src changes (just copy package.json)
# since we yarn install later
RUN yarn install
RUN yarn build

# Build lowdefy default app
RUN yarn build:lowdefy-default

# clean all depencies
RUN rm -rf node_modules

# install production dependencies only
RUN yarn install --production


FROM node:14-alpine

ENV NODE_ENV=production

# Set up working directory and use non-root "node" user
RUN mkdir -p /home/node/lowdefy && chown -R node:node /home/node/lowdefy

WORKDIR /home/node/lowdefy

USER node

# Copy build artifacts
COPY --from=build --chown=node:node /lowdefy/node_modules ./node_modules

COPY --from=build --chown=node:node /lowdefy/dist ./dist

COPY --from=build --chown=node:node /lowdefy/.lowdefy/build ./build

# Copy default public files from shell
# These can be overridden by copying different files to ./public
RUN cp -R ./node_modules/@lowdefy/shell/dist/public ./public

CMD ["node", "/home/node/lowdefy/dist/server.js"]