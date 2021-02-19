# @lowdefy/renderer

The Lowdefy renderer is the main part of the Lowdefy web client.

It has the following responsibilities:

- It contains the Graphql client
- It contains the the router
- It creates Lowdefy contexts, from `@lowdefy/engine`
- It controls component layout using `@lowdefy/layout`
- It loads blocks using [webpack module federation](https://webpack.js.org/concepts/module-federation/).
- It rerenders blocks when they should update.

A Lowdefy server serves a lightweight shell, that loads the renderer using module federation.

## Running a development server

- Run a Lowdefy development server using [`@lowdefy/server-dev`](https://github.com/lowdefy/lowdefy/tree/main/packages/servers/serverDev).
- Run the dev server using `yarn start`.
- The renderer will be hosted at port 3001, but the Lowdefy app will be served from port 3000 by the development server.
- If changes have been made in any dependencies (like `@lowdefy/engine`), they need to be built using `yarn build`, and the server restarted.

## More Lowdefy resources

- Getting started with Lowdefy - https://docs.lowdefy.com/tutorial-setup
- Lowdefy docs - https://docs.lowdefy.com
- Lowdefy website - https://lowdefy.com
- Community forum - https://github.com/lowdefy/lowdefy/discussions
- Bug reports and feature requests - https://github.com/lowdefy/lowdefy/issues

## Licence

[Apache-2.0](https://github.com/lowdefy/lowdefy/blob/main/LICENSE)
