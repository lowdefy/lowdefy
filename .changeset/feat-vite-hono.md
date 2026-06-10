---
'@lowdefy/server': major
'@lowdefy/server-dev': major
'@lowdefy/server-e2e': major
'lowdefy': major
'@lowdefy/api': major
'@lowdefy/client': major
'@lowdefy/build': major
'@lowdefy/plugin-next-auth': major
'@lowdefy/connection-mongodb': major
'@lowdefy/e2e-utils': major
---

feat!: Replace Next.js with Vite + Hono.

Lowdefy servers no longer run on Next.js. The production server is a
[Hono](https://hono.dev) app serving a [Vite](https://vite.dev)-built React
client; the dev server runs Vite with the Hono app mounted as middleware,
giving instant hot module replacement for plugin changes (~700ms instead of
the previous 20–40s rebuild-and-restart cycle). Authentication moves from
NextAuth v4 to the Auth.js v5 engine (`@auth/core` via `@hono/auth-js`) with
the `auth:` YAML schema unchanged.

**Your YAML config does not change.** `lowdefy build`, `lowdefy dev` and
`lowdefy start` work as before.

Breaking changes:

- **Auth sessions invalidate once on upgrade.** The session cookie prefix
  changes from `next-auth.*` to `authjs.*` — users sign in again after the
  upgrade. Provider, adapter, callback and event configuration is unchanged.
- **`NEXTAUTH_SECRET` and `NEXTAUTH_URL` still work**, but `AUTH_SECRET` and
  `AUTH_URL` are now the preferred names.
- **Custom `next.config.js` files no longer apply.** Customize the client
  build with a `vite.config.js` in the server directory instead.
- **`LOWDEFY_BUILD_OUTPUT_STANDALONE` is removed.** `lowdefy build` writes a
  complete runnable server to `.lowdefy/server` — copy that folder (or build
  in Docker) and run `node src/index.js`. See the updated Docker and node
  server deployment docs.
- **`NEXT_PUBLIC_SENTRY_DSN` is removed.** Set `SENTRY_DSN` on the server —
  it is passed to the browser client at runtime, so rotating it no longer
  requires a rebuild. Source maps upload via `@sentry/vite-plugin` when
  `SENTRY_AUTH_TOKEN` is set.
- **Page navigation is now client-side (SPA).** The first page load embeds
  config in the HTML; navigating fetches page config from `/api/page/*`
  without a full browser reload.
