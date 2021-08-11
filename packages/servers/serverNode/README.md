# @lowdefy/server-node

A production Lowdefy server that runs using Node.js is published on npm as [@lowdefy/server-node](https://www.npmjs.com/package/@lowdefy/server-node).

## Running the server

### Step 1 - Create a `package.json` file

To run the server in a Lowdefy project, first, initialise a Node.js project by creating a `package.json` file in the root of your project. To do this, you can run

```
npm init
```

### Step 2 - Add the `@lowdefy/server-node` package to your project as a dependency

To add the server as a dependency, run

```
npm install @lowdefy/server-node --save
```

### Step 3 - Build the Lowdefy project

Build the Lowdefy configuration files in the project by running:

```
npx lowdefy build
```

> You can also install the Lowdefy CLI as a dev dependency using `npm install lowdefy --save-dev` and run the build command using `lowdefy build`.

### Step 4 - Start the server

To start the server, run:

```
npm run start
```

or

```
node dist/server.js
```

## Configuration

The Lowdefy server can be configured using command-line arguments or environment variables. The command-line arguments take precedence over the environment variables.

The following command-line arguments can be specified:

- `--build-directory`: The directory of the built Lowdefy configuration (The output of `lowdefy build`, usually found at `./.lowdefy/build` in your project repository). The default is `./.lowdefy/build`.
- `--port`: The port at which to run the server. The default is `3000`.
- `--public-directory`: The directory of the public assets to be served. The default is `./public`.

The following environment variables can be specified:

- `LOWDEFY_SERVER_BUILD_DIRECTORY`: The directory of the built Lowdefy configuration (The output of `lowdefy build`, usually found at `./.lowdefy/build` in your project repository). The default is `./.lowdefy/build`.
- `LOWDEFY_SERVER_PORT`: The port at which to run the server. The default is `3000`.
- `LOWDEFY_SERVER_PUBLIC_DIRECTORY`: The directory of the public assets to be served. The default is `./public`.

## More Lowdefy resources

- Getting started with Lowdefy - https://docs.lowdefy.com/tutorial-start
- Lowdefy docs - https://docs.lowdefy.com
- Lowdefy website - https://lowdefy.com
- Community forum - https://github.com/lowdefy/lowdefy/discussions
- Bug reports and feature requests - https://github.com/lowdefy/lowdefy/issues

## Licence

[Apache-2.0](https://github.com/lowdefy/lowdefy/blob/main/LICENSE)
