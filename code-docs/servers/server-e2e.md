# @lowdefy/server-e2e

E2E testing server with cookie-based user injection for Playwright tests.

## Overview

The e2e server is a variant of the production server (`@lowdefy/server`) that replaces NextAuth with cookie-based session injection. This allows Playwright tests to set a user per browser context without requiring real auth providers.

**Key differences from production server:**

| Aspect | Production (`server`) | E2E (`server-e2e`) |
|--------|----------------------|---------------------|
| Auth | NextAuth (OAuth, JWT, etc.) | Cookie-based (`lowdefy_e2e_user`) |
| Session | `getServerSession()` calls NextAuth | `getServerSession()` reads cookie |
| Client auth | `SessionProvider` (NextAuth) | `AuthE2E` (reads from SSR props) |
| signIn/signOut | Real OAuth/credentials flow | Throws "not supported in e2e testing" |
| API routes | `/api/auth/[...nextauth]` | `/api/auth/session` only |
| Auth redirect | NextAuth middleware | Page handler checks `authJson.configured && !session` |

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
    │                    Cookie sent with request ──→ getServerSession()
    │                                                    │
    │                                              Parse cookie
    │                                              Return { user }
    │                                                    │
    │                                              createAuthorize(session)
    │                                              authorize(pageConfig)
    │                                                    │
    │                                              Page rendered with session
    │                                                    │
    │                    ◄── HTML + session prop ────────┘
    │                         │
    │                    AuthE2E reads session from props
    │                    lowdefy.user = session.user
```

### Cookie Format

- **Name:** `lowdefy_e2e_user`
- **Value:** `base64(JSON.stringify(userObj))`
- **Set by:** `e2e-utils/src/core/userCookie.js` via `page.context().addCookies()`
- **Read by:** `server-e2e/lib/server/auth/getServerSession.js`

### Server-Side Session Extraction

**File:** `lib/server/auth/getServerSession.js`

```javascript
function getServerSession({ req }) {
  const cookieHeader = req?.headers?.cookie ?? '';
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

**File:** `lib/client/auth/AuthE2E.js`

Replaces `AuthConfigured.js` (which wraps NextAuth's `SessionProvider`):

```javascript
function AuthE2E({ authConfig, children, session }) {
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

- Session comes from SSR props (populated by `getServerSession` reading the cookie)
- `getSession` fetches from `/api/auth/session` which also reads the cookie
- `signIn`/`signOut` throw `'Sign-in and sign-out are not supported in e2e testing.'`

**File:** `lib/client/auth/Auth.js`

Routes directly to `AuthE2E` — no conditional between configured/not-configured:

```javascript
function Auth({ children, session }) {
  return (
    <AuthE2E session={session} authConfig={authConfig}>
      {(auth) => children(auth)}
    </AuthE2E>
  );
}
```

## Auth Redirect

The production server relies on NextAuth middleware to redirect unauthenticated users before page handlers run. The e2e server doesn't have NextAuth middleware, so page handlers check auth explicitly.

**File:** `pages/[pageId].js`

```javascript
if (!pageConfig) {
  // getPageConfig returns null for unauthorized pages
  if (authJson.configured && !session) {
    const loginPage = authJson.pages?.public?.[0] ?? '404';
    return { redirect: { destination: `/${loginPage}`, permanent: false } };
  }
  return { redirect: { destination: '/404', permanent: false } };
}
```

**File:** `pages/index.js`

```javascript
// Early check before homepage resolution
if (authJson.configured && !session) {
  const loginPage = authJson.pages?.public?.[0] ?? '404';
  return { redirect: { destination: `/${loginPage}`, permanent: false } };
}
```

## API Routes

| Route | Purpose |
|-------|---------|
| `/api/auth/session` | Returns `context.session ?? {}` (from cookie) |
| `/api/request/[pageId]/[requestId]` | Execute requests (same as production) |
| `/api/endpoints/[endpointId]` | Execute API endpoints (same as production) |
| `/api/usage` | Usage logging (same as production) |
| `/api/client-error` | Client error reporting (no Sentry) |

No `/api/auth/[...nextauth]` route — there is no NextAuth.

## Directory Structure

```
server-e2e/
├── lib/
│   ├── build/            # Same as production
│   ├── server/
│   │   ├── apiWrapper.js
│   │   ├── serverSidePropsWrapper.js
│   │   ├── fileCache.js
│   │   ├── auth/
│   │   │   └── getServerSession.js     # Cookie-based (not NextAuth)
│   │   └── log/
│   │       ├── createLogger.js
│   │       ├── logError.js             # No Sentry
│   │       └── logRequest.js
│   └── client/
│       ├── Page.js
│       ├── createLogUsage.js
│       └── auth/
│           ├── Auth.js                 # Routes to AuthE2E
│           └── AuthE2E.js              # Cookie session, no NextAuth
├── pages/
│   ├── _app.js
│   ├── _document.js
│   ├── index.js                        # Auth redirect added
│   ├── 404.js
│   ├── [pageId].js                     # Auth redirect added
│   └── api/
│       ├── auth/session.js             # Session only (no [...nextauth])
│       ├── client-error.js             # No Sentry
│       ├── endpoints/[endpointId].js
│       ├── request/[pageId]/[requestId].js
│       └── usage.js
└── package.json
```

## Key Files

| File | Purpose |
|------|---------|
| `lib/server/auth/getServerSession.js` | Reads `lowdefy_e2e_user` cookie → `{ user }` |
| `lib/client/auth/AuthE2E.js` | Client auth component (no NextAuth) |
| `lib/client/auth/Auth.js` | Routes to AuthE2E |
| `pages/api/auth/session.js` | Returns session from cookie |
| `pages/[pageId].js` | Page rendering with auth redirect |
| `pages/index.js` | Homepage with auth redirect |

## See Also

- [server.md](./server.md) - Production server
- [server-dev.md](./server-dev.md) - Development server
- [auth-system.md](../architecture/auth-system.md) - Auth architecture
- [e2e-utils.md](../utils/e2e-utils.md) - E2E testing utilities
