# Vercel deployment — Lowdefy docs (from this monorepo)

The docs app (`packages/docs`, `lowdefy: local`) is a Lowdefy v6 app: a [Hono](https://hono.dev)
server serving a [Vite](https://vite.dev)-built React client. On Vercel it is deployed via the
[Build Output API](https://vercel.com/docs/build-output-api) — static assets on the CDN plus one
Node serverless function that runs the Hono app.

Unlike a standalone Lowdefy app (which downloads a published server with `npx lowdefy@<version>`),
the docs app builds against the **workspace**: `lowdefy: local` uses the server and plugins in this
repo directly, via the CLI's `--server-directory` flag pointing at `@lowdefy/server` here. Because
`@lowdefy/server` is a workspace member, `lowdefy vercel-output` traces the function against the repo
root (where `pnpm-workspace.yaml` lives), so the linked `@lowdefy/*` files resolve and are copied
into the function.

The Build Output is written to `packages/servers/server/.vercel/output` — i.e. inside the Root
Directory — where Vercel picks it up automatically.

## Vercel project settings

- **Framework Preset:** `Other`
- **Root Directory:** `packages/servers/server`
- **"Include files outside the root directory in the Build Step":** **ON** (the workspace, config and
  linked packages all live above the server package)
- **Install Command:** `bash vercel.install.docs.sh`
- **Build Command:** `bash vercel.build.docs.sh`
- **Output Directory:** leave blank — the build emits `.vercel/output`, auto-detected

`vercel.json` here sets `framework: null`; install and build commands are set per-project in the
Vercel dashboard (so other apps can deploy from the same server package with their own scripts).

## Environment variables

Set secrets in the Vercel project, prefixed with `LOWDEFY_SECRET_`. Use `AUTH_SECRET` (and, for
OAuth, `AUTH_URL`) for auth. `CRON_SECRET` is only needed if the app uses scheduled endpoints.

## How the build works

`vercel.build.docs.sh`:

1. `pnpm build` — builds every `@lowdefy/*` workspace package (`dist/`).
2. `lowdefy build --config-directory packages/docs --server-directory packages/servers/server
--no-client-build` — builds the docs config + Hono server artifacts into the server package.
3. `build:client` — the Vite client build into `packages/servers/server/dist/client`.
4. `lowdefy vercel-output ...` — assembles `.vercel/output` (static assets, the traced function, and
   `config.json` routing everything not on disk to the function).

## Notes

- Building writes generated artifacts into `packages/servers/server` (`build/`, `dist/`, `.vercel/`)
  and may add plugin deps to its `package.json`. These are gitignored / build-time only; do not
  commit them.
- The function runs on Vercel's Node.js runtime; streaming agent responses are subject to Vercel's
  function duration limits. For heavy streaming, a long-lived Node host (`node src/index.js`) suits
  better.
