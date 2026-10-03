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
│   ├── index.js               # Node entry: initServer(), serve(app), graceful shutdown
│   ├── initServer.js          # Shared startup: Sentry, guards, app import
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

**Every production entry starts through `initServer`.** `src/initServer.js` runs the startup both production entries need, in order: `initSentryServer()`, `checkEnvironmentGuards` for the current environment, then the app import (after Sentry, so instrumentation observes the module graph). Guards run before the app loads so a misconfigured start fails without importing every plugin under the wrong variables. A guard failure is captured and flushed to Sentry explicitly before it is rethrown: the Vercel launcher catches errors thrown while it imports the function entry, so no global handler would report it. The entries are `src/index.js` (Node and `lowdefy docker-output`) and the Vercel function entry that `lowdefy vercel-output` generates (`packages/cli/src/commands/vercelOutput/apiHandler.js`), which imports it dynamically after its chdir because the build artifacts are read relative to the cwd. A step added to only one entry drifts: `captureSentryError` only checks `SENTRY_DSN`, so an entry that skips Sentry init silently drops every server event. The Vercel entry also flushes Sentry once each request settles, including one that fails, through Vercel's `waitUntil`, because the function can be suspended once the response ends. WebSocket upgrades are not flushed per request. A failed guard throws out of the Vercel entry's module init, so the function fails every request rather than serving with the wrong variables. `server-dev` and `server-e2e` have no Sentry.

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
- `<link>`/`<script type="module">` asset URLs resolved from `dist/client/.vite/manifest.json`, **read once at startup** (`src/html/getAssets.js`) — deploys must build before restarting. The page's plugin chunks (its types chunk, which carries its icons, and its import closure, `collectPageTypesAssets.js`) are preloaded alongside the main entry, plus the app-wide icons chunk for a page flagged `loadAllIcons` or `loadAllTypes` (`getPageAssets.js`).
- A server-side `<title>` from `pageConfig.properties.title`.

## Per-Page Plugin Chunks

The production client does not import the app-wide plugin barrels. The full build counts each page's client types while it builds the page (`createPageTypeCounters` tees every block, action and client-operator increment into a per-page counter), adds the types the page runs without naming them (`buildPages/countImpliedClientTypes.js`: block `meta.actions`/`meta.operators` for events a block registers itself, and the operators the `_js` accessors call, `build/jsAccessorOperators.js`), adds the mandatory set (`build/mandatoryClientTypes.js`), and writes one module per distinct type set to `build/plugins/pageTypes/<hash>.js` plus the registry `build/plugins/pageTypes.js` (`build/full/buildPageTypes.js`, `writePageTypes.js`). Each page carries its `typesKey`. Keys are content hashes, never page ids, so the public registry does not reveal protected pages.

Icons are the fourth category of a page's type set, inlined as data in its module. `build/full/createGetPageIcons.js` restricts the app's icons (`components.imports.icons`, from the whole-app scan in `buildIconImports`) to what the page can reach: the same text scan over the built page, the `_js` sources whose hashes the page references, its blocks' `meta.icons`, the always-bundled client icons, and the names in `menus` and `global` (every page renders or reads them). Names that only arrive at runtime (`theme.icons.include`, endpoints, server `_js`, other pages, state) stay in the app-wide `plugins/icons.js`.

`client/loadPageTypes.js` loads a page's chunk and merges it in place into the long-lived registries in `client/types.js`, which `initLowdefyContext` holds by reference. `main.jsx` awaits the first page's types before rendering (reloading once on failure, `shouldReloadForTypes.js`); `Page.jsx` awaits them on navigation before `setPageConfig`. `client/loadAllIcons.js` loads the app-wide icons chunk into `types.icons` once per tab (a failed load clears itself so the next miss retries); `Page.jsx` passes it to `Client`, and `createIcon` and the `data-icon` enhancer call it the first time a name is missing, drawing an empty icon of the same size (or nothing, for `data-icon`) until it settles. After one load, a missing name is unknown and draws `icon-missing`.

`_operator` calls an operator by name at runtime. `countOperators` counts the names its config fixes (a literal, the literal branches of an `_if` or `_switch`); a name read at runtime must come with an `operators` list, which is counted instead (the build fails without one) and which `_operator` enforces when it runs, so a page never calls an operator its chunk does not hold.

Dynamic content may use any type the app bundles. `resolveDynamicContent` records fragment types and, when one falls outside the page's set (`build/pageTypeSets.json`, server-only), sets `pageConfig.loadAllTypes` so the client also loads the app-wide barrels, and logs a warning naming the type to declare.

A `loadAllTypes` page also loads every icon, since the blocks outside its set draw their own. `flagIconsOutsidePage` runs the build's icon scan (`@lowdefy/build/collectIconNames`) over the resolved page and sets `pageConfig.loadAllIcons` when it names an app icon (`build/iconImports.json`, server-only) outside the page's icons, so the first render has them without a placeholder; no warning, since runtime content is expected to use such icons.

Plugin packages declare `"sideEffects": ["**/*.css"]` so a page importing one block from a package barrel does not keep the whole package. Hashed assets under `/assets/` are served `Cache-Control: public, max-age=31536000, immutable` (`app.js`, and a route in `lowdefy vercel-output`).

## SPA Navigation

First load renders from the embedded config. Navigation is client-side: `client/Page.jsx` subscribes to the custom router (`@lowdefy/client/adapters/createRouter.js` — History API, scroll restoration, `forceReload` escape hatch) and fetches `GET /api/page/:pageId` (`src/routes/apiPage.js`) to swap `pageConfig`. A navigation that stays on the shown static page (only the query changes) skips the fetch and re-renders, so the page context picks up the new URL; dynamic pages refetch on every navigation. Missing pages replace to `/404`.

**Stale bundle after a deploy.** The response also carries `buildId` from `build/appMeta.json`, and the client bundle imports the same file at Vite build time. When the two differ the server was redeployed after the tab loaded, and the new config may reference `_js` functions or plugins the running bundle never shipped, so `client/shouldReloadForBuild.js` triggers one `window.location.reload()` (the router has already pushed the target URL). It reloads at most once per server build, recorded in `sessionStorage`, so a rolling deploy answering from mixed versions cannot loop.

The framework adapters passed to `@lowdefy/client` (`Components.Head`, `Components.Link`, `router`) come from `@lowdefy/client/adapters/*` — there is no framework router dependency.

## Agent Streaming

**File:** `src/routes/agent.js`

`POST /api/agent/*` parses `pageId`/`agentId` from the catch-all, validates with translated messages, and returns the Web `Response` body from `callAgent()` directly as `text/event-stream`. A `hono/body-limit` middleware enforces the 10mb request limit, and the route is excluded from compression so streaming is never buffered.

## Authentication

**Files:** `src/routes/auth.js`, `lib/server/auth/getAuthConfig.js`, `lib/server/auth/session.js`

- When `authJson.configured`, `initAuthConfig` is mounted app-wide; `getAuthConfig` (in `@lowdefy/api`) assembles providers/callbacks/events/adapter from the build plugins and adds the Auth.js v5 needs: `secret: AUTH_SECRET ?? NEXTAUTH_SECRET`, `trustHost: true`, `basePath: '/api/auth'`.
- `/api/auth/*` delegates to `authHandler()` from `@hono/auth-js`. The corporate-email **HEAD pre-check** branches inside this middleware (Hono routes HEAD requests through GET handlers, so a separate HEAD route would never match).
- Server-side sessions come from `getAuthUser(c)`; the client uses `SessionProvider`/`useSession` from `@hono/auth-js/react` (`lib/client/auth/AuthConfigured.jsx`), with `authConfigManager.setConfig({ basePath })` when a Lowdefy basePath is set.

## Unbundled ESM Constraint

The Hono server runs as plain Node ESM — server-side imports from `build/plugins/*.js` use standard Node resolution. Two consequences:

- `lib/build/*.js` artifact loaders read JSON with `fs.readFileSync` + `serializer.deserialize` (no JSON import attributes); client code imports the `build/*.json` files directly through Vite instead.
- Plugin package subpath exports must resolve to **files**, not directories. A `"./*": "./dist/*"` wildcard mapping `pkg/connections` to a `dist/connections/` directory throws `ERR_UNSUPPORTED_DIR_IMPORT` (bundlers silently completed it to `.js`). Packages need explicit entries like `"./connections": "./dist/connections.js"`.

## Vite Configuration

**File:** `vite.config.js`

- `base` from `build/config.json` `basePath`; `build.outDir: 'dist/client'`; `build.manifest: true`; input `client/main.jsx`.
- `define: { 'process.env.NODE_ENV': ... }` — Vite does not replace it inside dependencies.
- `resolve.dedupe` for linked plugin packages: React, antd, dayjs and every `@lowdefy/*` package in the server's dependencies, so a plugin pinned to another release cannot bundle a second copy of the libraries whose module state the client and blocks share.
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
