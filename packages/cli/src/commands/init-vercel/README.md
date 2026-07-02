# Vercel Deployment

Lowdefy v6 builds a [Hono](https://hono.dev) server serving a [Vite](https://vite.dev)-built React
client. To run that on Vercel, the app is deployed via the
[Build Output API](https://vercel.com/docs/build-output-api) as **static assets on the CDN plus one
Serverless Function** that runs the Hono app for every dynamic request.

`lowdefy init-vercel` scaffolds everything into a `deploy/` directory next to your `lowdefy.yaml`:

- `vercel.install.sh` — install command: downloads the Lowdefy server into `deploy/` and builds the
  config artifacts (skips the client build, which the build step runs).
- `vercel.build.sh` — build command: builds the Vite client, then runs `lowdefy vercel-output` to
  assemble the Vercel Build Output (`.vercel/output/`).
- `vercel.json` — sets the build command; the deployment itself is described by the generated
  `.vercel/output/config.json`.

## Project settings

In the Vercel project settings:

- **Framework Preset:** `Other` (not Next.js — Lowdefy v6 is not a Next.js app).
- **Root Directory:** `<config-directory>/deploy`
  - `<config-directory>` is where your `lowdefy.yaml` lives. If `lowdefy.yaml` is at the repo root,
    use `deploy`; if it is in `apps/my-app`, use `apps/my-app/deploy`.
- **Install Command:** `bash vercel.install.sh`.
- **Build Command:** comes from `vercel.json` (`bash vercel.build.sh`); leave the dashboard override
  off. There is no Output Directory setting — the build emits `.vercel/output`, which Vercel detects
  automatically.
- Enable **"Include files outside the root directory in the Build Step"** — the Lowdefy config
  usually lives in the parent of `deploy/`.

## Public files

Files in your app's `public/` directory (favicon, icons, images, `manifest.webmanifest`, etc.) are
copied into `dist/client` by Vite during the build, placed in `.vercel/output/static`, and served by
the Vercel CDN — no extra configuration needed.

## Secrets and environment variables

Set secrets in the Vercel project's Environment Variables, prefixed with `LOWDEFY_SECRET_`. Use
`AUTH_SECRET` (and, for OAuth, `AUTH_URL`) for auth. Different values can be set for Production and
Preview deployments.

## Scheduled endpoints (cron)

An `Api` (or `InternalApi`) endpoint can declare `schedules` to run its routine on a timer:

```yaml
id: purge-stale-conversations
type: Api
schedules:
  - cron: '0 6 * * *'
    payload: { mode: full }
  - cron: '*/15 * * * *'
    payload: { mode: incremental }
routine:
  - id: purge
    type: MongoDBDeleteMany
    connectionId: conversations
    properties:
      filter: { updatedAt: { $lt: { _payload: cutoff } } }
```

`lowdefy vercel-output` turns each schedule into a Vercel cron job in `.vercel/output/config.json`,
pointing at `/api/cron/<endpointId>`. When it fires, Vercel makes a GET request to that path and the
Hono app runs the endpoint's routine.

- **Secure it:** add a project Environment Variable named exactly `CRON_SECRET` (a random string of
  16+ characters). Vercel automatically sends it as `Authorization: Bearer <CRON_SECRET>`, and the
  `/api/cron/*` route rejects any request whose header does not match. If `CRON_SECRET` is unset the
  route always returns `401` (fail closed).
- **System context:** scheduled runs have no logged-in user, so `_user` is `undefined`. The routine
  has full access to connections, requests, operators and secrets — just not a user. The `payload`
  for a run comes from the matching schedule's `payload`.
- **UTC only.** Cron expressions use 5 fields (`minute hour day-of-month month day-of-week`); named
  values like `MON`/`JAN` are not supported and day-of-month and day-of-week are mutually exclusive.
- **Plan limits:** Vercel **Hobby** only allows daily crons (a sub-daily expression fails the
  deployment); **Pro**/**Enterprise** allow per-minute. Up to 100 cron jobs per project.
- **Idempotency:** Vercel does not retry failed runs and delivery is best-effort (a run can be
  missed or delivered more than once). Write scheduled routines to be idempotent.

## How it works

`vercel.build.sh` builds the client and runs `lowdefy vercel-output`, which assembles:

- `.vercel/output/static/` — the built client and `public/` files, served by the CDN.
- `.vercel/output/functions/api.func/` — one Node Serverless Function: the Hono app plus its exact
  runtime dependency closure, traced with [`@vercel/nft`](https://github.com/vercel/nft) (pnpm
  symlinks and workspace packages included), and the `build/**`,
  `dist/client/.vite/manifest.json` and `package.json` files it reads at runtime, with a
  `.vc-config.json`.
- `.vercel/output/config.json` — routes that serve static files first and send every other request
  to the function (running with `serveStaticAssets: false`), plus the `crons` array.

> The function runs on the Vercel **Node.js** runtime. Streaming agent responses (`/api/agent/*`)
> are subject to Vercel's function response/duration limits; for heavy streaming or agent workloads
> a long-lived Node host (Docker, Fly.io, Railway, Render) running `node src/index.js` may suit
> better.

## Manual setup

The same files can be created by hand at `<config-directory>/deploy/` instead of running
`lowdefy init-vercel`. All other Vercel configuration (domains, preview branches, regions,
redirects) can be set as desired.
