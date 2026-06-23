---
'lowdefy': minor
'@lowdefy/server': minor
'@lowdefy/docs': patch
---

feat(cli): `lowdefy init-vercel` instruments an app for Vercel deployment of the Hono server.

`init-vercel` now scaffolds a complete Vercel setup into `<config-directory>/deploy/`, so a v6
Lowdefy app (Hono server + Vite client) deploys to Vercel as static assets on the CDN plus one
Serverless Function:

- `vercel.json` — serves the built client (`dist/client`, which includes the app's `public/` files
  via Vite's `publicDir`) from the CDN, sets the build command (`pnpm run build:client`) and output
  directory, and rewrites all other requests to the function. `functions[].includeFiles` bundles the
  build artifacts read at runtime (`build/**`, `dist/client/.vite/manifest.json`, `package.json`).
- `api/index.js` — a Serverless Function wrapping the Hono app via `hono/vercel`.
- `vercel.install.sh` — downloads the server into `deploy/` (`--no-client-build`); the client is
  built by Vercel's build step.
- `README.md` — deployment instructions (framework preset `Other`, root directory, install command).

`@lowdefy/server`'s `createApp` gains a `{ serveStaticAssets }` option (default `true`); the Vercel
function passes `false` so the CDN owns static files and the function only handles dynamic routes.
The Vercel docs page is updated to match.
