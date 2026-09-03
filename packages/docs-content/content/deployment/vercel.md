# Deploy with Vercel

A Lowdefy app builds a [Hono](https://hono.dev) server serving a Vite-built React client. On Vercel it is deployed with the [Build Output API](https://vercel.com/docs/build-output-api) as **static assets on the CDN plus one Serverless Function** that runs the Hono app for every dynamic request (page rendering, `/api/*` requests, endpoints, cron, auth and agents).

Run the `init-vercel` CLI command in your project to scaffold everything into a `deploy/` directory next to your `lowdefy.yaml`:

```bash
npx lowdefy@latest init-vercel
```

This creates:

- `deploy/vercel.install.sh` — the install command; downloads the Lowdefy server into `deploy/` and builds the config artifacts (skipping the client build, which the build step runs).
- `deploy/vercel.build.sh` — the build command; builds the Vite client, then runs `lowdefy vercel-output` to assemble the Vercel Build Output (`.vercel/output/`).
- `deploy/vercel.json` — sets the build command. The deployment itself is described by the generated `.vercel/output/config.json`.
- `deploy/README.md` — these instructions.

All four files are safe to commit.

###### Project settings

In the Vercel project:

- **Framework Preset:** `Other` (Lowdefy is not a Next.js app).
- **Root Directory:** `<config-directory>/deploy`
    - `<config-directory>` is the directory in which the `lowdefy.yaml` file is placed.
    - Eg: if `lowdefy.yaml` is at the top level of the repository, set the root directory to `deploy`; if it is in `apps/app_name`, set it to `apps/app_name/deploy`.
- **Install Command:** `bash vercel.install.sh`. Leave the **Build Command** to `vercel.json` (do not override it in the dashboard). There is no **Output Directory** setting — the build emits `.vercel/output`, which Vercel detects automatically.
- Enable **"Include files outside the root directory in the Build Step"** — the Lowdefy config usually lives in the parent of `deploy/`.

###### Public files

Files in your app's `public/` directory (favicon, icons, images, `manifest.webmanifest`, etc.) are copied into `dist/client` by Vite during the build, placed in `.vercel/output/static`, and served by the Vercel CDN — no extra configuration needed.

###### Secrets and environment variables

Secrets can be set in the Environment Variables settings section by creating environment variables prefixed with `LOWDEFY_SECRET_`. Use `AUTH_SECRET` (and `AUTH_URL` for OAuth) for authentication. Different secrets can be set for production and preview deployments.

###### Function settings

The whole app runs as a single Serverless Function, so its settings are configured once, app-wide, in `lowdefy.yaml`:

```yaml
config:
  vercel:
    maxDuration: 300 # seconds, default 60
    memory: 2048 # MB — omit to use the Vercel default
```

- **`maxDuration`** — the hard cap on function execution time, in seconds. Defaults to `60`. Your plan's limits apply; Vercel rejects an over-limit value at deploy time.
- **`memory`** — function memory in MB. Omit to use the Vercel default.

Each build writes these into the generated `.vercel/output/functions/api.func/.vc-config.json`. The output is regenerated on every deploy, so there is nothing to edit by hand — and because the deployment is prebuilt (Build Output API), `functions` settings in `vercel.json` or the dashboard's function defaults do not apply; `lowdefy.yaml` is the single source of truth.

###### Scheduled endpoints (cron)

An `Api` (or `InternalApi`) endpoint can declare `schedules` to run its routine on a timer. Each build turns those schedules into Vercel cron jobs in `.vercel/output/config.json`, so nothing is committed by hand and the crons stay in sync with your config:

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

Each schedule becomes a cron job pointing at `/api/cron/<endpointId>`. When it fires, Vercel makes a GET request to that path and the Hono app runs the endpoint's routine with the matching schedule's `payload` (available as `_payload`).

- **Secure it:** add an Environment Variable named exactly `CRON_SECRET` (a random string of 16+ characters). Vercel automatically sends it as `Authorization: Bearer <CRON_SECRET>`; the `/api/cron/*` route rejects requests whose header does not match, and returns `401` if `CRON_SECRET` is unset (fail closed).
- **System context:** scheduled runs have no logged-in user, so `_user` is `undefined`. The routine still has full access to connections, requests, operators and secrets — write scheduled routines so they do not depend on a user.
- **UTC only.** Cron expressions have 5 fields (`minute hour day-of-month month day-of-week`); named values like `MON`/`JAN` are not supported, and day-of-month and day-of-week are mutually exclusive.
- **Plan limits:** Vercel **Hobby** only allows daily crons (a sub-daily expression fails the deployment); **Pro**/**Enterprise** allow per-minute. Up to 100 cron jobs per project.
- **Idempotency:** Vercel does not retry failed runs and delivery is best-effort (a run can be missed or delivered more than once). Design scheduled routines to be idempotent.

###### Background work: async endpoints and detached calls

Two [API endpoint](/api) controls exist for work that should not hold up a response — they behave differently on Vercel:

- **`async: true` endpoints** respond `{ accepted: true }` immediately and run the routine in the background. On Vercel the invocation is kept alive via the platform request context (Fluid compute) until the routine settles — but it is still the *same* invocation, so the background work remains bounded by `maxDuration`. Raise `config.vercel.maxDuration` to cover your longest async routine.
- **`detached: true` on `CallApi` steps** fire-and-forget the target endpoint through a `POST` to the deployment's own `/api/detached/<endpointId>` route, so the target runs in its **own** invocation with a fresh `maxDuration` budget. The route is secured by `CRON_SECRET` (same secret as cron, fail closed), and detached steps fail with a config error if it is not set. Delivery is at-most-once with no retry; targets run as system context (`_user` is `undefined`) and must be idempotent.

See [Async Endpoints](/api) and [Detached Endpoint Calls](/api) in the API docs for full semantics.

###### Cost protection

Vercel Fluid bills by execution duration, so a request that hangs (a stuck database, SMTP or external API call) is a real cost risk. Two guardrails apply:

- **`config.requestTimeout`** (in `lowdefy.yaml`, default `30000` ms) — the server returns a timeout instead of letting a request run on. Set to `0` to disable. Agent streaming routes are exempt.
- **`config.vercel.maxDuration`** (default `60`) — a hard platform cap; Vercel stops the function at this many seconds. See Function settings above.

> The function runs on Vercel's Node.js runtime. Streaming agent responses (`/api/agent/*`) are exempt from `config.requestTimeout` and are bounded only by `maxDuration` — for heavy streaming or agent workloads, a long-lived Node host (Docker, Fly.io, Railway, Render) may suit better.

All other Vercel configuration like domain names, preview deploy branches, serverless regions and redirects can be configured as desired.
