# Deploy with Node.js

### Run with Lowdefy CLI:

To test the production server, it can be run locally. In order to do this, first create the production build output using:

`pnpx lowdefy@6 build`

The production server can then be run using:

`pnpx lowdefy@6 start`

### Deploying the built server:

`pnpx lowdefy@6 build` writes a complete server into `<config-directory>/.lowdefy/server` — the Hono server (`src/`), the built client assets (`dist/client/`), the app build artifacts (`build/`), and `public/`.

Copy that folder (with its `node_modules`, or run `pnpm install --prod` inside it on the target machine) to your server and run:

```sh
node src/index.js
```

from inside the folder, or `pnpm start`. The server listens on `PORT` (default 3000).

Always run the build before restarting the server — the server reads the client asset manifest once at startup.

### Alternative

An alternative option would be to make use of [Docker](./docker) to deploy the app. Docker has a few advantages, including scalability, application portability, version control and deployment speed, amoung others.
