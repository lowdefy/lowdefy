# @lowdefy/server

Production Hono server for deploying Lowdefy applications.

## Overview

The production server is a lightweight [Hono](https://hono.dev) application serving a [Vite](https://vite.dev)-built React client. It:

- Loads pre-built configuration from `./build/`
- Renders an HTML shell per page with the page config embedded as JSON (no SSR — React renders client-side)
- Handles API requests, agent streaming, and authentication (Auth.js via `@hono/auth-js`)
- Serves the content-hashed Vite client assets from `dist/client/`

## Installation

```bash
# Installed automatically by CLI
lowdefy build
```

## Scripts

```json
{
  "build": "cp package.json package.original.json",
  "build:client": "vite build",
  "build:lowdefy": "node lowdefy/build.mjs",
  "start": "node src/index.js"
}
```

`lowdefy build` runs `build:lowdefy` (config → `build/` artifacts) and then `build:client` (Vite bundles `client/main.jsx` → `dist/client/` with a `.vite/manifest.json`). `lowdefy start` runs the `start` script.

## Dependencies

### Core Lowdefy

- `@lowdefy/api` - Backend API logic
- `@lowdefy/client` - Frontend framework (including `@lowdefy/client/adapters/*` — router, Link, Head)
- `@lowdefy/helpers` - Utility functions
- `@lowdefy/layout` - Grid layout system
- `@lowdefy/node-utils` - Node utilities

### Blocks & Actions

- `@lowdefy/actions-core` - Core actions
- `@lowdefy/blocks-antd` - Ant Design blocks
- `@lowdefy/blocks-basic` - Basic blocks
- `@lowdefy/blocks-loaders` - Loading indicators
- `@lowdefy/block-utils` - Block utilities

### Framework

- `hono` + `@hono/node-server` - HTTP server (Web Standards Request/Response)
- `@auth/core` + `@hono/auth-js` - Auth.js engine and Hono integration
- `vite` + `@vitejs/plugin-react` - Client bundling
- `@sentry/node` + `@sentry/browser` + `@sentry/vite-plugin` - Error tracking
- `react` (18.2.0)
- `pino` (via `@lowdefy/logger`)

## Directory Structure

```
server/
├── src/                       # Hono server (unbundled Node ESM)
│   ├── index.js               # Entry: env aliasing, Sentry init, serve(app)
│   ├── app.js                 # createApp(): routes, middleware, static, onError
│   ├── middleware/
│   │   ├── apiContext.js      # Builds the request context (replaces apiWrapper)
│   │   ├── errorHandler.js    # app.onError — serializes errors for API routes
│   │   └── sentry.js          # http.server span per request
│   ├── routes/
│   │   ├── agent.js           # POST /api/agent/* — streams the Web Response
│   │   ├── apiPage.js         # GET /api/page/* — page config JSON for SPA nav
│   │   ├── auth.js            # /api/auth/* — authHandler + HEAD pre-check
│   │   ├── clientError.js     # POST /api/client-error
│   │   ├── endpoints.js       # /api/endpoints/* (catch-all)
│   │   ├── request.js         # /api/request/* (catch-all)
│   │   └── usage.js           # POST /api/usage
│   ├── html/
│   │   ├── template.js        # HTML shell (pre-hydration scripts, config embed)
│   │   ├── renderPage.js      # Home redirect, 404 flow, template rendering
│   │   └── getAssets.js       # Vite manifest read once at startup
│   └── lib/
│       ├── safeScriptJson.js  # Script-context JSON escaping
│       └── getPathSegments.js # Catch-all path parsing (nested ids)
├── client/                    # Vite client entry (bundled to dist/client/)
│   ├── main.jsx               # CSS imports, __LOWDEFY_CONFIG__ parse, createRoot
│   ├── App.jsx                # Providers: StyleProvider, XProvider, Auth, Sentry
│   └── Page.jsx               # Wires Client with router/Link/Head adapters, SPA nav
├── lib/
│   ├── build/                 # Build artifact loaders (fs read + deserialize)
│   │   ├── app.js / appMeta.js / auth.js / config.js / i18n.js / logger.js / theme.js
│   ├── server/
│   │   ├── fileCache.js       # LRU cache injected into the api context
│   │   ├── auth/
│   │   │   ├── getAuthConfig.js  # Wires build auth plugins into api getAuthConfig
│   │   │   └── session.js        # getAuthUser(c) → session
│   │   ├── log/               # createLogger, createHandleError, logRequest
│   │   └── sentry/            # initSentry, captureSentryError, setSentryUser
│   └── client/
│       ├── createLogUsage.js
│       ├── sentry/            # @sentry/browser init + helpers
│       └── auth/              # Auth.jsx, AuthConfigured.jsx (@hono/auth-js/react)
├── lowdefy/
│   └── build.mjs              # Build orchestration
├── public_default/
├── vite.config.js
├── postcss.config.cjs         # @tailwindcss/postcss (read by Vite)
└── package.json               # "type": "module"
```

## Request Context

**File:** `src/middleware/apiContext.js`

Mounted on `/api/*` and (guarded against double-build) on the page routes. Builds the context consumed by `@lowdefy/api` functions and stores it on the Hono context:

```javascript
const context = {
  rid: uuid(),
  agents, appMeta, buildDirectory, config, connections, fileCache,
  headers: c.req.header(),
  i18n, jsMap, logger, operators, secrets,
  req: { url: c.req.path, method: c.req.method, hostname: c.req.header('host') },
};
context.logger = createLogger({ rid: context.rid });
context.handleError = createHandleError({ context });
context.session = await getSession(c); // skipped for /api/auth/* paths
createApiContext(context);             // adds user + authorize
c.set('lowdefyContext', context);
```

## Error Handling

**File:** `src/middleware/errorHandler.js` (registered via `app.onError`)

**Hono routes handler errors to the app-level error handler at each compose dispatch level — upstream middleware `try/catch` around `next()` never sees them.** The error contract therefore lives in `app.onError`:

- API paths: `serializer.serialize(error)` with `~e.received`, `~e.stack` and `~e.configKey` stripped, returned as JSON 500 — byte-compatible with the old `apiWrapper` behavior.
- Page paths: plain `Internal Server Error` 500.
- `context.handleError(error)` (structured pino log + Sentry capture) runs for both.

## Page Rendering

**Files:** `src/html/renderPage.js`, `src/html/template.js`, `src/routes/page.js` (routes `GET /`, `GET /404`, `GET /:rest{.+}`)

`renderPage`:

1. Reads root config; `pageId === ''` → if no home page configured, 302 to `/${home.pageId}`.
2. `getPageConfig` — missing page → 302 to `/404`; `GET /404` renders the 404 page config **with HTTP 404 status**.
3. Renders the HTML template and returns `c.html(html, status)`.

The template embeds everything the client needs in one response:

- Pre-hydration **layer-order MutationObserver** script (locks `@layer theme, base, antd, components, utilities;` as the first `<head>` child against antd's prependQueue) and the **dark-mode flash prevention** script — both interpolated via `safeScriptJson`.
- `appendHead` / `appendBody` from app config injected as raw HTML.
- `<script id="__LOWDEFY_CONFIG__" type="application/json">` containing `{ pageConfig, rootConfig, session, basePath, sentryDsn }` (escaped by `safeScriptJson`).
- `<link>`/`<script type="module">` asset URLs resolved from `dist/client/.vite/manifest.json`, **read once at startup** (`src/html/getAssets.js`) — deploys must build before restarting.
- A server-side `<title>` from `pageConfig.properties.title`.

## SPA Navigation

First load renders from the embedded config. Navigation is client-side: `client/Page.jsx` subscribes to the custom router (`@lowdefy/client/adapters/createRouter.js` — History API, scroll restoration, `forceReload` escape hatch) and fetches `GET /api/page/:pageId` (`src/routes/apiPage.js`) to swap `pageConfig`. Missing pages replace to `/404`.

The framework adapters passed to `@lowdefy/client` (`Components.Head`, `Components.Link`, `router`) come from `@lowdefy/client/adapters/*` — there is no framework router dependency.

## Agent Streaming

**File:** `src/routes/agent.js`

`POST /api/agent/*` parses `pageId`/`agentId` from the catch-all, validates with translated messages, and returns the Web `Response` body from `callAgent()` directly as `text/event-stream`. A `hono/body-limit` middleware enforces the 10mb request limit, and the route is excluded from compression so streaming is never buffered.

## Authentication

**Files:** `src/routes/auth.js`, `lib/server/auth/getAuthConfig.js`, `lib/server/auth/session.js`

- When `authJson.configured`, `initAuthConfig` is mounted app-wide; `getAuthConfig` (in `@lowdefy/api`) assembles providers/callbacks/events/adapter from the build plugins and adds the Auth.js v5 needs: `secret: AUTH_SECRET ?? NEXTAUTH_SECRET`, `trustHost: true`, `basePath: '/api/auth'`.
- `/api/auth/*` delegates to `authHandler()` from `@hono/auth-js`. The corporate-email **HEAD pre-check** branches inside this middleware (Hono routes HEAD requests through GET handlers, so a separate HEAD route would never match).
- Server-side sessions come from `getAuthUser(c)`; the client uses `SessionProvider`/`useSession` from `@hono/auth-js/react` (`lib/client/auth/AuthConfigured.jsx`), with `authConfigManager.setConfig({ basePath })` when a Lowdefy basePath is set.
- `src/index.js` aliases `NEXTAUTH_URL` → `AUTH_URL` at startup for v4 compatibility.

## Unbundled ESM Constraint

The Hono server runs as plain Node ESM — server-side imports from `build/plugins/*.js` use standard Node resolution. Two consequences:

- `lib/build/*.js` artifact loaders read JSON with `fs.readFileSync` + `serializer.deserialize` (no JSON import attributes); client code imports the `build/*.json` files directly through Vite instead.
- Plugin package subpath exports must resolve to **files**, not directories. A `"./*": "./dist/*"` wildcard mapping `pkg/connections` to a `dist/connections/` directory throws `ERR_UNSUPPORTED_DIR_IMPORT` (bundlers silently completed it to `.js`). Packages need explicit entries like `"./connections": "./dist/connections.js"`.

## Vite Configuration

**File:** `vite.config.js`

- `base` from `build/config.json` `basePath`; `build.outDir: 'dist/client'`; `build.manifest: true`; input `client/main.jsx`.
- `define: { 'process.env.NODE_ENV': ... }` — Vite does not replace it inside dependencies.
- `resolve.dedupe: ['react', 'react-dom']` for linked plugin packages.
- `sentryVitePlugin` (source map upload) gated on `SENTRY_AUTH_TOKEN`.
- PostCSS (`@tailwindcss/postcss`) is read automatically from `postcss.config.cjs` — `client/main.jsx` imports `build/layer-order.css` **first**, then `build/globals.css`.

## Key Files

| File                              | Purpose                                       |
| --------------------------------- | --------------------------------------------- |
| `src/app.js`                      | Hono app assembly (routes, middleware, static) |
| `src/middleware/apiContext.js`    | Request context setup                          |
| `src/middleware/errorHandler.js`  | `app.onError` — serialized error contract      |
| `src/html/renderPage.js`          | Page render, home redirect, 404 flow           |
| `src/html/template.js`            | HTML shell + pre-hydration scripts             |
| `src/routes/agent.js`             | Agent streaming route                          |
| `client/main.jsx`                 | Client entry (CSS order, config parse)         |
| `lib/server/auth/getAuthConfig.js`| Auth configuration                             |
| `lowdefy/build.mjs`               | Build orchestration                            |
| `vite.config.js`                  | Client build config                            |

## Environment Variables

| Variable             | Purpose                                                       |
| -------------------- | ------------------------------------------------------------- |
| `PORT`               | Server port (default: 3000)                                   |
| `LOWDEFY_LOG_LEVEL`  | Logging level (default: info)                                 |
| `AUTH_SECRET`        | Session encryption key (`NEXTAUTH_SECRET` still honored)      |
| `AUTH_URL`           | App URL for OAuth (`NEXTAUTH_URL` still honored; usually auto-detected via `trustHost`) |
| `SENTRY_DSN`         | Sentry DSN — used server-side and passed to the client at runtime via the embedded config |
| `SENTRY_AUTH_TOKEN`  | Enables source map upload during `vite build`                 |
