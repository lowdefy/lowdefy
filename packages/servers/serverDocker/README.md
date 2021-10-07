# @lowdefy/server-docker

The [official Lowdefy Docker](https://hub.docker.com/repository/docker/lowdefy/lowdefy) images can be found on Docker Hub.

Examples of Docker configuration can be found in the [example repository](https://github.com/lowdefy/lowdefy-example-docker).

The Lowdefy Docker images contain a Lowdefy server. The configuration of the Lowdefy app can either be built into a new image based on the Lowdefy image, or the configuration read from the file system, usually provided as a volume.

The Lowdefy server can be configured using the following environment variables:

- `LOWDEFY_SERVER_BUILD_DIRECTORY`: The directory of the built Lowdefy configuration (The output of `lowdefy build`, usually found at `./.lowdefy/build` in your project repository). The default is `./build` (or `/home/node/lowdefy/build`).
- `LOWDEFY_SERVER_PUBLIC_DIRECTORY`: The directory of the public assets to be served. The default is `./public` (or `/home/node/lowdefy/public`).
- `LOWDEFY_SERVER_PORT`: The port (inside the container) at which to run the server. The default is `3000`.

> When updating your app to a new Lowdefy version, make sure to update the Lowdefy version in the Dockerfile

# Building a Lowdefy app image

To build the configuration into an image, the following Dockerfile can be used:

```text
FROM node:14-buster AS build

# Set working directory and node user
WORKDIR /home/node/lowdefy

RUN chown node:node /home/node/lowdefy

USER node

# Copy app config and change ownership of files to "node" user
COPY  --chown=node:node  . .

# Build the Lowdefy config using the Lowdefy CLI
RUN npx lowdefy@3.21.2 build

# Use the correct Lowdefy base image
FROM lowdefy/lowdefy:3.21.2

# Copy build output from build stage
COPY --from=build --chown=node:node /home/node/lowdefy/.lowdefy/build ./build

# Copy contents of public directory into image
COPY --chown=node:node ./public ./public

# Run the server on start
CMD ["node", "./dist/server.js"]
```

with a `.dockerignore` file:

```
.lowdefy/**
.env
```

An image can be built by running:

```
docker build -t <tag> .
```

The container can be run by:

```
docker run -p 3000:3000 <tag>
```

Docker compose can also be used. Use a `docker-compose.yaml` file:

```
version: "3.8"
services:
  lowdefy:
    build: .
    ports:
      - "3000:3000"
```

To build the image, run:

```
docker compose build
```

To run the app, run:

```
docker compose up
```

## More Lowdefy resources

- Getting started with Lowdefy - https://docs.lowdefy.com/tutorial-start
- Lowdefy docs - https://docs.lowdefy.com
- Lowdefy website - https://lowdefy.com
- Community forum - https://github.com/lowdefy/lowdefy/discussions
- Bug reports and feature requests - https://github.com/lowdefy/lowdefy/issues

## Licence

[Apache-2.0](https://github.com/lowdefy/lowdefy/blob/main/LICENSE)
