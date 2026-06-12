# Servers Overview

Hono-based servers for running Lowdefy applications.

## Package Summary

| Package               | Purpose            | Use Case                     |
| --------------------- | ------------------ | ---------------------------- |
| `@lowdefy/server`     | Production server  | Deployment                   |
| `@lowdefy/server-dev` | Development server | Local development            |
| `@lowdefy/server-e2e` | E2E testing server | Playwright testing with auth |

## Architecture

All three servers are a [Hono](https://hono.dev) server with a [Vite](https://vite.dev)-built React client, and share:

- Core API handlers for requests and endpoints (`@lowdefy/api`)
- Plugin loading from build artifacts
- HTML shell rendering — no SSR; React renders client-side

Production and e2e run the Hono app on `@hono/node-server` and serve pre-built client assets from `dist/client/`. The dev server inverts this: a manager process spawns Vite, which serves client modules with HMR and routes everything else to the Hono app via `@hono/vite-dev-server`.

The production and dev servers use Auth.js (v5, `@auth/core` via `@hono/auth-js`) for authentication. The e2e server replaces the auth engine with cookie-based session injection for Playwright testing.

## Key Differences

| Aspect        | Production               | Development                    | E2E                      |
| ------------- | ------------------------ | ------------------------------ | ------------------------ |
| Startup       | `node src/index.js`      | Manager spawns Vite child      | `node src/index.js`      |
| Client assets | Pre-built `dist/client/` | Vite dev modules + HMR         | Pre-built `dist/client/` |
| Build         | Pre-built artifacts      | Skeleton build + JIT pages     | Pre-built artifacts      |
| Watching      | None                     | 4 concurrent watchers          | None                     |
| Reload        | N/A                      | SSE-based hot reload           | N/A                      |
| Auth          | Auth.js                  | Auth.js + mock user            | Cookie-based             |
| Sentry        | Yes                      | No                             | No                       |

## Build Artifacts

All three servers load from the `./build/` directory:

```
build/
├── config.json           # Main configuration (basePath, etc.)
├── app.json              # App HTML config (appendHead/appendBody)
├── auth.json             # Auth configuration
├── theme.json            # Theme tokens, dark mode
├── globals.css           # Tailwind entry (imported by client/main.jsx)
├── layer-order.css       # CSS layer order (imported first)
├── tailwind-candidates.css  # Touched to retrigger Tailwind compilation
├── reload                # SSE trigger file (dev only)
├── pages/                # Page configurations
└── plugins/
    ├── blocks.js         # Block components
    ├── actions.js        # Action handlers
    ├── connections.js    # Connection types
    ├── icons.js          # Icon components
    ├── agents.js         # Agent configs
    ├── blockMetas.json   # Block metadata
    ├── auth/             # adapters.js, callbacks.js, events.js, providers.js
    └── operators/
        ├── client.js     # Client operators
        ├── server.js     # Server operators
        ├── clientJsMap.js
        └── serverJsMap.js
```

Server-read artifacts (`config.json`, `auth.json`, `plugins/connections.js`, `plugins/operators/server.js`, `plugins/auth/*`) are imported by the Hono app through Node ESM. Client-side artifacts (`plugins/blocks.js`, `plugins/operators/client.js`, `globals.css`, ...) are imported by `client/main.jsx` — bundled by `vite build` in production, served as modules with HMR in dev. The dev server additionally writes JIT build state (`pageRegistry.json`, `refMap.json`, `keyMap.json`, `skeletonSourceFiles.json`, `invalidatePages`).

## API Routes

### Shared Routes

| Route               | Purpose                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `/api/request/*`    | Execute requests                                                   |
| `/api/endpoints/*`  | Execute API endpoints                                              |
| `/api/page/*`       | Page config JSON (dev: triggers JIT build)                         |
| `/api/auth/*`       | Auth.js handlers (production/dev; e2e: session-from-cookie only)   |
| `/api/agent/*`      | Agent chat streaming (production/dev only)                         |
| `/api/usage`        | Usage logging                                                      |
| `/api/client-error` | Client error reporting                                             |

### Dev-Only Routes

| Route                | Purpose                                  |
| -------------------- | ---------------------------------------- |
| `/api/reload`        | SSE for hot reload                       |
| `/api/ping`          | Health check                             |
| `/api/root`          | Root config fetch                        |
| `/api/js/:env`       | Serves clientJsMap.js / serverJsMap.js   |
| `/api/icons/dynamic` | Serves JIT-discovered icon data          |
| `/api/dev-tools`     | Dev tooling metadata (config directory)  |

## Page Routes

| Route          | Purpose                                                       |
| -------------- | ------------------------------------------------------------- |
| `/`            | Homepage (redirects to home page if not directly configured)  |
| `/:rest{.+}`   | Catch-all — renders the HTML shell for any page path          |
| `/404`         | Not found page (production renders with HTTP 404 status)      |

Production embeds the page config in the HTML shell; the dev server renders the same config-free shell for every path and the client fetches config over the API.

## Context Object

The `apiContext` middleware builds a context for API handlers and stores it on the Hono context (`c.set('lowdefyContext', context)`):

```javascript
{
  rid: 'request-uuid',
  agents,           // From build/plugins/agents.js
  appMeta,
  buildDirectory,
  config,           // From build/config.json
  connections,      // Available connections
  fileCache,        // Cached files
  headers,          // Request headers
  i18n,             // i18n config
  jsMap,            // Server JS operator map
  logger,           // Pino logger
  handleError,      // Structured error logging
  operators,        // Available operators
  req,              // { url, method, hostname }
  secrets,          // Environment secrets
  session,          // Auth.js session (skipped for /api/auth/* paths)
}
```

The dev server adds `configDirectory` (for JIT page builds) and reloads `jsMap` dynamically when JIT builds rewrite `serverJsMap.js`.

## See Also

- [server.md](./server.md) - Production server details
- [server-dev.md](./server-dev.md) - Development server details
- [server-e2e.md](./server-e2e.md) - E2E testing server details
