# @lowdefy/server-e2e

E2E testing server with cookie-based user injection for Playwright tests.

## Overview

The e2e server is a variant of the production server (`@lowdefy/server`) — the same Hono app + Vite-built client — that replaces the Auth.js engine with cookie-based session injection. This allows Playwright tests to set a user per browser context without requiring real auth providers.

**Key differences from production server:**

| Aspect | Production (`server`) | E2E (`server-e2e`) |
|--------|----------------------|---------------------|
| Auth | Auth.js (OAuth, JWT, etc.) | Cookie-based (`lowdefy_e2e_user`) |
| Session | `getAuthUser(c)` via `@hono/auth-js` | `lib/server/auth/session.js` reads cookie |
| Client auth | `SessionProvider` (`@hono/auth-js/react`) | `Auth.jsx` render-prop (session from embedded config) |
| signIn/signOut | Real OAuth/credentials flow | Throws "not supported in e2e testing" |
| Auth API routes | `/api/auth/*` (`authHandler()`) | `GET /api/auth/session` mock only |
| Sentry | `@sentry/node` + `@sentry/browser` | None |
| `window.lowdefy` | Not exposed | Exposed (`stage="e2e"` passed to `Client`) |
| Secrets | `getSecretsFromEnv()` | `getE2eSecrets()` (`LOWDEFY_E2E_SECRET_*` overrides) |

## Installation

```bash
# Built automatically by CLI with --server flag
lowdefy build --server e2e
```

The `e2e-utils` config handles this automatically — users never call this directly.

## Cookie-Based Session

### How It Works

```
Test Code                    Browser                      Server
─────────                    ───────                      ──────
ldf.user({ id, roles })
    │
    ├─→ base64(JSON) ──→ lowdefy_e2e_user cookie
    │                         │
    │                    ldf.goto('/page')
    │                         │
    │                    Cookie sent with request ──→ getSession(c)
    │                                                    │
    │                                              Parse cookie
    │                                              Return { user }
    │                                                    │
    │                                              createAuthorize(session)
    │                                              authorize(pageConfig)
    │                                                    │
    │                                              renderPage embeds session
    │                                                    │
    │                    ◄── HTML + __LOWDEFY_CONFIG__ ──┘
    │                         │
    │                    Auth.jsx reads session from the embedded config
    │                    lowdefy.user = session.user
```

### Cookie Format

- **Name:** `lowdefy_e2e_user`
- **Value:** `base64(JSON.stringify(userObj))`
- **Set by:** `e2e-utils/src/core/userCookie.js` via `page.context().addCookies()`
- **Read by:** `server-e2e/lib/server/auth/session.js`

### Server-Side Session Extraction

**File:** `lib/server/auth/session.js`

```javascript
function getSession(c) {
  const cookieHeader = c.req.header('cookie') ?? '';
  const match = cookieHeader.match(/lowdefy_e2e_user=([^;]+)/);
  if (!match) {
    return undefined;
  }

  try {
    const decoded = Buffer.from(decodeURIComponent(match[1]), 'base64').toString();
    const user = JSON.parse(decoded);
    return { user };
  } catch {
    return undefined;
  }
}
```

The user object maps directly to `session.user` with no transforms — no `userFields`, no session callbacks. Whatever the test sets is exactly what `lowdefy.user` receives.

## Client-Side Auth

**File:** `lib/client/auth/Auth.jsx`

Replaces the production `Auth.jsx`/`AuthConfigured.jsx` pair (which wrap `@hono/auth-js/react`'s `SessionProvider`) with a single render-prop component — no conditional between configured/not-configured:

```javascript
function Auth({ children, session }) {
  const auth = {
    authConfig,
    session,
    getSession: async () => {
      const res = await fetch('/api/auth/session');
      return res.ok ? res.json() : null;
    },
    signIn: e2eNotSupported,
    signOut: e2eNotSupported,
  };
  return children(auth);
}
```

- The initial session comes from the `__LOWDEFY_CONFIG__` script embedded by `renderPage` (populated by the cookie parser).
- `getSession` fetches from `GET /api/auth/session`, which also reads the cookie.
- `signIn`/`signOut` throw `'Sign-in and sign-out are not supported in e2e testing.'`
- `client/Page.jsx` passes `stage="e2e"` to `Client`, which exposes `window.lowdefy` for test assertions.

## Page Protection

Page protection works the same as production: `renderPage` builds the context (with the cookie session), `createApiContext` adds `authorize`, and `getPageConfig` returns `null` for pages the session may not view — which redirects to `/404`. No separate middleware is involved.

## API Routes

| Route | Purpose |
|-------|---------|
| `GET /api/auth/session` | Returns `context.session ?? {}` (from cookie) — also the e2e-utils webServer health check |
| `/api/request/*` | Execute requests (same as production) |
| `/api/endpoints/*` | Execute API endpoints (same as production) |
| `GET /api/page/*` | Page config JSON for SPA navigation (same as production) |
| `/api/usage` | Usage logging (same as production) |
| `/api/client-error` | Client error reporting (no Sentry) |

No `initAuthConfig`/`authHandler` mounting — there is no Auth.js engine in this server.

## Directory Structure

```
server-e2e/
├── src/                      # Hono server (mirrors production src/)
│   ├── index.js
│   ├── app.js                # No auth engine, no Sentry, no agent route
│   ├── middleware/
│   │   ├── apiContext.js     # getE2eSecrets + cookie session + configDirectory
│   │   └── errorHandler.js   # No Sentry capture
│   ├── routes/
│   │   ├── sessionMock.js    # GET /api/auth/session
│   │   ├── apiPage.js / clientError.js / endpoints.js / request.js / usage.js
│   ├── html/                 # template.js / renderPage.js / getAssets.js
│   └── lib/                  # safeScriptJson.js / getPathSegments.js
├── client/
│   ├── main.jsx
│   ├── App.jsx               # No Sentry init
│   └── Page.jsx              # stage="e2e"
├── lib/
│   ├── build/                # Same fs-based artifact loaders as production
│   ├── server/
│   │   ├── fileCache.js
│   │   ├── getE2eSecrets.js  # LOWDEFY_E2E_SECRET_* overrides
│   │   ├── auth/session.js   # Cookie-based (not Auth.js)
│   │   └── log/
│   └── client/
│       ├── createLogUsage.js
│       └── auth/Auth.jsx     # Cookie session, no Auth.js
├── vite.config.js            # No Sentry plugin
├── postcss.config.cjs
└── package.json
```

## Key Files

| File | Purpose |
|------|---------|
| `lib/server/auth/session.js` | Reads `lowdefy_e2e_user` cookie → `{ user }` |
| `lib/server/getE2eSecrets.js` | Secrets with `LOWDEFY_E2E_SECRET_*` overrides |
| `lib/client/auth/Auth.jsx` | Client auth component (no Auth.js) |
| `src/routes/sessionMock.js` | Returns session from cookie |
| `src/html/renderPage.js` | Page rendering with embedded session |
| `client/Page.jsx` | Passes `stage="e2e"` (exposes `window.lowdefy`) |

## See Also

- [server.md](./server.md) - Production server
- [server-dev.md](./server-dev.md) - Development server
- [auth-system.md](../architecture/auth-system.md) - Auth architecture
- [e2e-utils.md](../utils/e2e-utils.md) - E2E testing utilities
