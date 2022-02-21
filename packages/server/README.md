# @lowdefy/server

## Development

To run the server in locally as a development server, run the following:

- Run `yarn && yarn build` at the root of the repository.
- Add a `lowdefy.yaml` file in the server directory (`packages/server`).
- run `yarn dev` in the server directory.

To run the server in locally as a development server, with a next production build, run the following:

- Run `yarn && yarn build` at the root of the repository.
- Add a `lowdefy.yaml` file in the server directory (`packages/server`).
- run `yarn dev:prod` in the server directory.

> When running a development server, the `package.json` file is updated with the plugins used in the Lowdefy app. Please do not commit the changes made to the `package.json`, `.pnp.cjs` and `yarn.lock` files.

## Licence

[Apache-2.0](https://github.com/lowdefy/lowdefy/blob/main/LICENSE)
