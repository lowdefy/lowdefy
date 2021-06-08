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
RUN yarn cache clean

# install production dependencies only
RUN yarn install --production


FROM amazon/aws-lambda-nodejs:14

ENV NODE_ENV=production

WORKDIR /var/task

# Copy build artifacts
COPY --from=build /lowdefy/node_modules /var/task/node_modules

COPY --from=build /lowdefy/dist /var/task/dist

COPY --from=build /lowdefy/.lowdefy/build ./build

# Copy default public files from shell
# These can be overridden by copying different files to ./public
RUN cp -R ./node_modules/@lowdefy/shell/dist/public ./public

CMD [ "dist/server.handler"]