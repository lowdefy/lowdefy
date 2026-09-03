---
'lowdefy': minor
'@lowdefy/server': minor
'@lowdefy/build': minor
'@lowdefy/docs': patch
---

feat: `lowdefy init-vercel` instruments an app for Vercel, plus a configurable request timeout.

**`init-vercel`** now scaffolds a complete Vercel setup into `<config-directory>/deploy/`, so a v6
Lowdefy app (Hono server + Vite client) deploys to Vercel as static assets on the CDN plus one
Serverless Function:

- `vercel.json` — serves the built client (`dist/client`, which includes the app's `public/` files
  via Vite's `publicDir`) from the CDN, sets the build command (`pnpm run build:client`) and output
  directory, rewrites all other requests to the function, bundles the runtime-read build artifacts
  via `includeFiles`, and caps the function with `maxDuration`.
- `api/index.js` — a Node Serverless Function that `chdir`s to the deploy directory, builds a Web
  `Request` from the buffered Node request body, and runs the Hono app. (Vercel's Node runtime does
  not drain a lazily-read body stream, so a streaming adapter hangs on every request with a body.)
- `vercel.install.sh` + `README.md`.

**Request timeout.** `@lowdefy/server`'s `createApp` now bounds request duration with a `timeout`
middleware, configured by a new **`config.requestTimeout`** (milliseconds) in `lowdefy.yaml`
(default `30000`, `0` disables). This protects against requests that hang on an upstream call
(database, SMTP, external API) running to the host's function limit — important on serverless
platforms billed by duration. Agent streaming routes are exempt. `@lowdefy/build` adds
`config.requestTimeout` to the schema.

`createApp` also gains a `{ serveStaticAssets }` option (default `true`); the Vercel function passes
`false` so the CDN owns static files and the function only handles dynamic routes. Docs updated
(deployment/Vercel and the config reference).
