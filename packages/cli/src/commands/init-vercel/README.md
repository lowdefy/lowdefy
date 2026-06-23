# Vercel Deployment

Lowdefy v6 builds a [Hono](https://hono.dev) server serving a [Vite](https://vite.dev)-built React
client. To run that on Vercel, the app is deployed as **static assets on the CDN plus one
Serverless Function** that runs the Hono app for every dynamic request.

`lowdefy init-vercel` scaffolds everything into a `deploy/` directory next to your `lowdefy.yaml`:

- `vercel.install.sh` — install command: downloads the Lowdefy server into `deploy/` (skips the
  client build, which Vercel runs as the build step).
- `vercel.json` — tells Vercel to serve the built client (`dist/client`, which also contains your
  `public/` files) from the CDN and rewrite every other request to the function.
- `api/index.js` — the Serverless Function; wraps the Lowdefy Hono app via `hono/vercel`.

## Project settings

In the Vercel project settings:

- **Framework Preset:** `Other` (not Next.js — Lowdefy v6 is not a Next.js app).
- **Root Directory:** `<config-directory>/deploy`
  - `<config-directory>` is where your `lowdefy.yaml` lives. If `lowdefy.yaml` is at the repo root,
    use `deploy`; if it is in `apps/my-app`, use `apps/my-app/deploy`.
- **Build & Install Commands / Output Directory:** `vercel.json` sets the build command
  (`pnpm run build:client`) and output directory (`dist/client`). Set the **Install Command** to
  `sh vercel.install.sh`.
- Enable **"Include files outside the root directory in the Build Step"** — the Lowdefy config
  usually lives in the parent of `deploy/`.

## Public files

Files in your app's `public/` directory (favicon, icons, images, `manifest.webmanifest`, etc.) are
copied into `dist/client` by Vite during the build and served by the Vercel CDN — no extra
configuration needed.

## Secrets and environment variables

Set secrets in the Vercel project's Environment Variables, prefixed with `LOWDEFY_SECRET_`. Use
`AUTH_SECRET` (and, for OAuth, `AUTH_URL`) for auth. Different values can be set for Production and
Preview deployments.

## How it works

`vercel.json` serves `dist/client` statically and rewrites all other paths to `api/index.js`, which
runs the Hono app with `serveStaticAssets: false` (the CDN owns the static files). The function
reads `build/**`, `dist/client/.vite/manifest.json` and `package.json` at runtime; `vercel.json`
`functions[].includeFiles` bundles those into the function.

> The function runs on the Vercel **Node.js** runtime. Streaming agent responses (`/api/agent/*`)
> are subject to Vercel's function response/duration limits; for heavy streaming or agent workloads
> a long-lived Node host (Docker, Fly.io, Railway, Render) running `node src/index.js` may suit
> better.

## Manual setup

The same files can be created by hand at `<config-directory>/deploy/` instead of running
`lowdefy init-vercel`. All other Vercel configuration (domains, preview branches, regions,
redirects) can be set as desired.
