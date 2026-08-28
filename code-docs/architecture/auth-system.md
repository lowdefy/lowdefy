# Auth System Architecture

> **STALE — describes the removed Auth.js engine.** The auth system moved to
> BetterAuth (`@lowdefy/plugin-better-auth`, `packages/api/src/routes/auth/`,
> `packages/build/src/build/buildAuth/`); providers, strategies, hooks, steps
> and organizations replaced the callback/event pipeline documented below.
> Read the code (and `apps/auth-reference/`) as the source of truth until this
> document is rewritten via `/l-docs-architecture`.

How authentication integrates with Lowdefy.

## Overview

Lowdefy authentication is built on [Auth.js](https://authjs.dev) v5 (`@auth/core`), wired into the Hono server via `@hono/auth-js`, and provides:

- OAuth/OIDC providers (Google, GitHub, Auth0, etc.)
- Database adapters for session storage
- Role-based access control
- Protected pages and API endpoints

## Configuration Structure

### In lowdefy.yaml

```yaml
auth:
  providers:
    - id: google
      type: GoogleProvider
      properties:
        clientId:
          _secret: GOOGLE_CLIENT_ID
        clientSecret:
          _secret: GOOGLE_CLIENT_SECRET

  adapter:
    type: MongoDBAdapter
    properties:
      connectionString:
        _secret: MONGODB_URI

  callbacks:
    session:
      - _function:
          __session.user.roles: __token.roles
    jwt:
      - _function:
          __token.roles: __user.roles

  pages:
    protected: [dashboard, settings]
    public: [home, about]
    roles:
      admin: [admin-panel]

  authPages:
    signIn: /login
    error: /auth/error

  session:
    strategy: jwt
    maxAge: 2592000
```

## Build-Time Processing

### Auth Configuration Building

**File:** `packages/build/src/build/buildAuth/buildAuth.js`

```javascript
function buildAuth({ components, context }) {
  const configured = !type.isNone(components.auth);
  validateAuthConfig({ components, context });
  components.auth.configured = configured;
  buildApiAuth({ components, context }); // API endpoint protection
  buildPageAuth({ components, context }); // Page protection
  buildAuthPlugins({ components, context });

  return components;
}
```

### Page Protection

**File:** `packages/build/src/build/buildAuth/buildPageAuth.js`

```javascript
function buildPageAuth({ components }) {
  const protectedPages = getProtectedPages({ components });
  const pageRoles = getPageRoles({ components });

  components.pages.forEach((page) => {
    if (pageRoles[page.id]) {
      page.auth = { public: false, roles: pageRoles[page.id] };
    } else if (protectedPages.includes(page.id)) {
      page.auth = { public: false };
    } else {
      page.auth = { public: true };
    }
  });
}
```

### API Protection

**File:** `packages/build/src/build/buildAuth/buildApiAuth.js`

```javascript
function buildApiAuth({ components }) {
  const protectedEndpoints = getProtectedApi({ components });
  const apiRoles = getApiRoles({ components });

  components.api.forEach((endpoint) => {
    if (apiRoles[endpoint.id]) {
      endpoint.auth = { public: false, roles: apiRoles[endpoint.id] };
    } else if (protectedEndpoints.includes(endpoint.id)) {
      endpoint.auth = { public: false };
    } else {
      endpoint.auth = { public: true };
    }
  });
}
```

## Auth.js Configuration

### Config Translation

**File:** `packages/api/src/routes/auth/getAuthConfig.js` (replaces `getNextAuthConfig.js`)

Assembled once per process (module-scoped cache) and consumed by the `initAuthConfig` middleware from `@hono/auth-js`, which the servers mount app-wide when `authJson.configured` is true (`src/app.js`). Each server wraps it (`lib/server/auth/getAuthConfig.js`) to inject the build auth plugins and env secrets.

```javascript
const authConfigCache = {};
let initialized = false;

function getAuthConfig({ appMeta, authJson, logger, plugins, secrets }) {
  if (initialized) return authConfigCache;

  // Parse operators (_app and _secret support)
  const operatorsParser = new ServerParser({
    lowdefyApp: appMeta,
    operators: { _app, _secret },
    secrets,
    user: {},
  });

  const { output: authConfig, errors: operatorErrors } = operatorsParser.parse({
    input: authJson,
    location: 'auth',
    payload: {},
  });
  if (operatorErrors.length > 0) {
    throw operatorErrors[0];
  }

  // Build Auth.js options
  authConfigCache.adapter = createAdapter({ authConfig, logger, plugins });
  authConfigCache.callbacks = createCallbacks({ authConfig, logger, plugins });
  authConfigCache.events = createEvents({ authConfig, logger, plugins });
  authConfigCache.logger = createLogger({ logger });
  authConfigCache.providers = createProviders({ authConfig, logger, plugins });
  authConfigCache.debug = authConfig.debug ?? logger?.isLevelEnabled('debug') === true;
  authConfigCache.pages = authConfig.authPages;
  authConfigCache.session = authConfig.session;
  authConfigCache.theme = authConfig.theme;
  authConfigCache.cookies = authConfig?.advanced?.cookies;
  // Auth.js v5 reads AUTH_SECRET from env but not NEXTAUTH_SECRET — map the
  // v4 variable here so existing deployments keep working without env changes.
  authConfigCache.secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  // Self-hosted servers run behind arbitrary proxies; derive URLs from request
  // headers (v4 derived them from NEXTAUTH_URL, aliased to AUTH_URL at startup).
  authConfigCache.trustHost = true;
  authConfigCache.basePath = '/api/auth';
  initialized = true;
  return authConfigCache;
}
```

`createLogger.js` adapts Lowdefy's logger to the Auth.js v5 logger contract: `error(error)`, `warn(code)`, `debug(message, metadata)`.

**Environment variables:** `AUTH_SECRET` and `AUTH_URL` are the preferred names. The `NEXTAUTH_*` variables are still honored for compatibility — `getAuthConfig` maps `NEXTAUTH_SECRET` into `secret`, and `src/index.js` aliases `NEXTAUTH_URL` → `AUTH_URL` at startup before any auth config loads.

### Provider Creation

**File:** `packages/api/src/routes/auth/createProviders.js`

```javascript
function createProviders({ authConfig, plugins }) {
  return authConfig.providers.map((providerConfig) =>
    plugins.providers[providerConfig.type]({
      ...providerConfig.properties,
      id: providerConfig.id,
    })
  );
}
```

### Available Providers

**File:** `packages/plugins/plugins/plugin-next-auth/src/auth/providers.js`

62 providers, re-exported directly from `@auth/core/providers/*` (provider type names unchanged from v4):

- OAuth: Google, GitHub, Discord, LinkedIn, Twitter
- Enterprise: Okta, Azure AD, Keycloak, Auth0
- SAML: BoxyHQ SAML
- Custom: OpenIDConnectProvider (built on the Auth.js v5 `type: 'oidc'` provider type — discovery and ID token handling are built in, so the v4 `idToken: true` flag is gone)

The package keeps the name `@lowdefy/plugin-next-auth` for this release even though the engine is Auth.js.

## Callback Pipeline

### JWT Callback

**File:** `packages/api/src/routes/auth/callbacks/createJWTCallback.js`

Runs on login and token refresh:

```javascript
async function jwtCallback({ token, user, account, profile, isNewUser }) {
  // Extract OIDC claims
  if (profile) {
    token = {
      id,
      sub,
      name,
      given_name,
      family_name,
      email,
      email_verified,
      picture,
      ...token,
    };
  }

  // Add custom userFields
  if (authConfig.userFields) {
    addUserFieldsToToken({ authConfig, account, profile, token, user });
  }

  // Execute custom callback plugins
  for (const plugin of jwtCallbackPlugins) {
    token = await plugin.fn({ account, profile, token, user });
  }

  return token;
}
```

### Session Callback

**File:** `packages/api/src/routes/auth/callbacks/createSessionCallback.js`

Runs on session updates:

```javascript
async function sessionCallback({ session, token, user }) {
  // Map token to session.user
  session.user = {
    id, sub, name, given_name, family_name,
    email, picture, ...
  };

  // Add custom userFields
  if (authConfig.userFields) {
    addUserFieldsToSession({ authConfig, session, token, user });
  }

  // Execute custom plugins
  for (const plugin of sessionCallbackPlugins) {
    session = await plugin.fn({ session, token, user });
  }

  // Validate roles after all sources have written to the session.
  // Throws ConfigError if roles is present but not an array of strings.
  validateSessionRoles({ session });

  // Create anonymized hash for analytics
  session.hashed_id = crypto.createHash('sha256')
    .update(identifier ?? '')
    .digest('base64');

  return session;
}
```

### SignIn Callback

**File:** `packages/api/src/routes/auth/callbacks/createSignInCallback.js`

Controls login authorization:

```javascript
async function signInCallback({ account, credentials, email, profile, user }) {
  let allowSignIn = true;

  for (const plugin of signInCallbackPlugins) {
    allowSignIn = await plugin.fn({
      account,
      credentials,
      email,
      profile,
      user,
    });
    if (allowSignIn === false) break;
  }

  return allowSignIn;
}
```

### User Fields Mapping

**Files:** `addUserFieldsToToken.js`, `addUserFieldsToSession.js`

```yaml
# Configuration
auth:
  userFields:
    company: 'profile.company'
    department: 'profile.department'
    roles: 'profile.roles'
```

```javascript
// Implementation
function addUserFieldsToToken({ authConfig, account, profile, token, user }) {
  Object.entries(authConfig.userFields).forEach(([fieldName, providerField]) => {
    const value = get({ account, profile, user }, providerField);
    set(token, fieldName, value);
  });
}
```

## Authorization

### Authorize Function

**File:** `packages/api/src/context/createAuthorize.js`

```javascript
function createAuthorize({ session }) {
  const authenticated = !!session;
  const roles = session?.user?.roles ?? [];

  // Defense-in-depth: throw if roles bypassed session callback validation.
  // A string would cause silent authorization bypass via substring matching.
  if (!Array.isArray(roles)) {
    throw new ConfigError('session.user.roles must be an array of strings.', {
      received: roles,
    });
  }

  function authorize(config) {
    const { auth } = config;
    if (auth.public === true) return true;

    if (auth.public === false) {
      if (auth.roles) {
        // Role-based: user must have one of the required roles
        return authenticated && auth.roles.some((role) => roles.includes(role));
      }
      // Auth-only: user must be authenticated
      return authenticated;
    }

    throw new ConfigError('auth.public must be true or false.', {
      received: auth.public,
      configKey: config['~k'],
    });
  }

  return authorize;
}
```

### Page Authorization

**File:** `packages/api/src/routes/page/getPageConfig.js`

```javascript
async function getPageConfig({ authorize, readConfigFile }, { pageId }) {
  const pageConfig = await readConfigFile(`pages/${pageId}.json`);

  if (pageConfig && authorize(pageConfig)) {
    const { auth, ...rest } = pageConfig; // Remove auth metadata
    // serializer.serialize re-enumerates ~k keys for JSON transfer to client
    return serializer.serialize(rest);
  }

  return null; // 404 for unauthorized
}
```

### API Authorization

**File:** `packages/api/src/routes/endpoints/authorizeApiEndpoint.js`

```javascript
function authorizeApiEndpoint({ authorize, logger }, { endpointConfig }) {
  if (!authorize(endpointConfig)) {
    // "does not exist" rather than "not authorized" — hides endpoint existence
    throw new ConfigError(`API Endpoint "${endpointConfig.endpointId}" does not exist.`);
  }
}
```

## Session Injection

### Server-Side Context

**Files:** `packages/servers/server/src/middleware/apiContext.js`, `packages/servers/server/lib/server/auth/session.js`

The `apiContext` middleware (mounted on `/api/*` and the page routes, replaces `serverSidePropsWrapper`) builds the request context, fetches the session, and stores everything on the Hono context:

```javascript
if (!c.req.path.includes('/api/auth')) {
  context.session = await getSession(c);
}
createApiContext(context); // adds user + authorize
c.set('lowdefyContext', context);
```

`getSession` (replaces `getServerSession.js`) reads the session that the app-wide `initAuthConfig` middleware resolved onto the Hono context:

```javascript
import { getAuthUser } from '@hono/auth-js';

async function getSession(c) {
  if (authJson.configured !== true) {
    return undefined;
  }
  const authUser = await getAuthUser(c);
  return authUser?.session ?? undefined;
}
```

Page renders embed the session in the HTML shell: `src/html/renderPage.js` includes `session` in the `__LOWDEFY_CONFIG__` JSON script, so the client hydrates with the server session without an extra fetch.

### Client-Side Context

**File:** `packages/servers/server/lib/client/auth/AuthConfigured.jsx`

`SessionProvider`, `useSession`, `getSession`, `signIn`, and `signOut` come from `@hono/auth-js/react`. Fetch paths are configured through the module-level `authConfigManager` instead of `SessionProvider` props:

```javascript
import { authConfigManager, getSession, SessionProvider, signIn, signOut, useSession } from '@hono/auth-js/react';

if (lowdefyConfig.basePath) {
  authConfigManager.setConfig({ basePath: `${lowdefyConfig.basePath}/api/auth` });
}

function AuthConfigured({ authConfig, children, serverSession }) {
  const auth = { authConfig, getSession, signIn, signOut };
  return (
    <SessionProvider session={serverSession}>
      <Session>
        {(session) => {
          auth.session = session;
          return children(auth);
        }}
      </Session>
    </SessionProvider>
  );
}
```

## The \_user Operator

**File:** `packages/plugins/operators/operators-js/src/operators/shared/user.js`

The `user` object is `session.user` (`lowdefy.user = auth?.session?.user ?? null` in `initLowdefyContext`). Plain params read from it via `getFromObject`; the `hasRole`, `hasSomeRoles`, and `hasAllRoles` methods check `user.roles`:

```javascript
function _user({ arrayIndices, location, methodName, params, user }) {
  if (methodName === 'hasRole') { /* userRoles.includes(role) */ }
  if (methodName === 'hasSomeRoles') { /* required.some(...) */ }
  if (methodName === 'hasAllRoles') { /* required.every(...) */ }
  return getFromObject({
    arrayIndices,
    location,
    object: user,
    operator: '_user',
    params,
  });
}
```

**Usage:**

```yaml
# In block properties
content:
  _string:
    - 'Welcome, '
    - _user: name

# Role checks
visible:
  _user.hasRole: admin
```

## Auth Routes

**File:** `packages/servers/server/src/routes/auth.js`

A Hono middleware mounted at `/api/auth/*` (replaces `pages/api/auth/[...nextauth].js`). The `initAuthConfig(() => getAuthConfig({ logger }))` middleware is mounted app-wide in `src/app.js` when auth is configured; the route itself delegates to `authHandler()` from `@hono/auth-js`. The corporate-email HEAD pre-check branches **inside** the middleware because Hono routes HEAD requests through GET handlers — a separate HEAD route would never match:

```javascript
function authMiddleware() {
  const handler = authJson.configured === true ? authHandler() : null;
  return async function auth(c, next) {
    if (authJson.configured !== true) {
      return c.json({ message: 'Auth not configured' }, 404);
    }
    // Corporate email link check
    if (c.req.method === 'HEAD') {
      return c.body(null, 200);
    }
    return handler(c, next);
  };
}
```

Handles:

- `/api/auth/signin` - Login
- `/api/auth/signout` - Logout
- `/api/auth/callback/[provider]` - OAuth callbacks
- `/api/auth/session` - Session retrieval
- `/api/auth/csrf` - CSRF protection

## Auth Events

**File:** `packages/api/src/routes/auth/events/createEvents.js`

```javascript
const events = {
  createUser, // First login - user created
  linkAccount, // Account linked to user
  signIn, // User signed in
  signOut, // User signed out
  updateUser, // Profile updated
  session, // Session events
};
```

## Architecture Diagram

```
lowdefy.yaml
    ↓
buildAuth() [BUILD TIME]
    ├→ validateAuthConfig()
    ├→ buildPageAuth() → page.auth = { public, roles }
    ├→ buildApiAuth() → endpoint.auth = { public, roles }
    └→ buildAuthPlugins()
    ↓
auth.json
    ↓
[RUNTIME - REQUEST]
    ↓
initAuthConfig (app-wide, when configured)
    └→ getAuthConfig() [cached per process]
        ├→ createProviders()
        ├→ createCallbacks()
        ├→ createEvents()
        ├→ createAdapter()
        └→ createLogger()
    ↓
apiContext middleware
    ├→ getSession() → getAuthUser(c)
    └→ createApiContext() → createAuthorize(session)
    ↓
/api/auth/* → authHandler()    Page/API routes
                                └→ getPageConfig() → authorize(pageConfig)
    ↓
renderPage embeds session in __LOWDEFY_CONFIG__
    ↓
client App.jsx [CLIENT]
    ↓
Auth Component (SessionProvider from @hono/auth-js/react)
    ↓
Page Component
    ├→ auth.session
    ├→ _user operator
    └→ auth.signIn/signOut
```

## Key Files

| Component         | File                                                                    |
| ----------------- | ----------------------------------------------------------------------- |
| Config Validation | `packages/build/src/build/buildAuth/validateAuthConfig.js`              |
| Page Protection   | `packages/build/src/build/buildAuth/buildPageAuth.js`                   |
| API Protection    | `packages/build/src/build/buildAuth/buildApiAuth.js`                    |
| Auth.js Config    | `packages/api/src/routes/auth/getAuthConfig.js`                         |
| Providers         | `packages/api/src/routes/auth/createProviders.js`                       |
| Session Callback  | `packages/api/src/routes/auth/callbacks/createSessionCallback.js`       |
| JWT Callback      | `packages/api/src/routes/auth/callbacks/createJWTCallback.js`           |
| Authorization     | `packages/api/src/context/createAuthorize.js`                           |
| \_user Operator   | `packages/plugins/operators/operators-js/src/operators/shared/user.js`  |
| Auth Routes       | `packages/servers/server/src/routes/auth.js`                            |
| Session Lookup    | `packages/servers/server/lib/server/auth/session.js`                    |
| Client Auth       | `packages/servers/server/lib/client/auth/AuthConfigured.jsx`            |

## Mock User for Testing (Dev Server Only)

The dev server supports mock users for testing, bypassing the login flow.

### Configuration

**Environment Variable (takes precedence):**

```bash
LOWDEFY_DEV_USER='{"sub":"test-user","email":"test@example.com","roles":["admin"]}'
```

**Config File:**

```yaml
auth:
  providers:
    - id: google
      type: GoogleProvider
      # ...
  dev:
    mockUser:
      sub: test-user
      email: test@example.com
      roles:
        - admin
```

### How It Works

**File:** `packages/servers/server-dev/lib/server/auth/getMockSession.js`

```javascript
async function getMockSession() {
  // 1. Check env var first (takes precedence)
  const mockUserJson = process.env.LOWDEFY_DEV_USER;
  let mockUser = mockUserJson ? JSON.parse(mockUserJson) : authJson.dev?.mockUser;

  if (!mockUser) return undefined;

  // 2. Deserialize to restore arrays from ~arr markers and remove build markers
  mockUser = serializer.deserialize(mockUser);

  // 3. Validate auth is configured
  if (authJson.configured !== true) {
    throw new Error('Mock user configured but auth is not configured');
  }

  // 4. Transform through session callback (userFields, custom callbacks apply)
  const sessionCallback = createSessionCallback({ authConfig: authJson, plugins: { callbacks } });
  const session = await sessionCallback({
    session: { user: {} },
    token: mockUser,
    user: mockUser,
  });

  return session;
}
```

### Integration Points

1. **Server-side requests:** `server-dev/lib/server/auth/session.js` returns the mock session before calling `getAuthUser(c)` — the mock applies everywhere `context.session` is used (page, request, endpoint, and agent authorization)
2. **Startup warning:** `manager/processes/checkMockUserWarning.mjs` logs "Mock user active - login bypassed"

### Key Files

| File                                                   | Purpose                                          |
| ------------------------------------------------------ | ------------------------------------------------ |
| `server-dev/lib/server/auth/getMockSession.js`         | Core mock session logic                          |
| `server-dev/lib/server/auth/session.js`                | Server-side integration (mock before `getAuthUser`) |
| `server-dev/manager/processes/checkMockUserWarning.mjs` | Startup warning                                  |
| `build/src/lowdefySchema.js`                           | Schema for `auth.dev.mockUser`                   |

### Security Note

Mock user is **only available in server-dev**. The production server (`@lowdefy/server`) has no mock user code paths.

## E2E Testing with Cookie-Based Auth (server-e2e)

The e2e server (`@lowdefy/server-e2e`) provides a separate auth mechanism for Playwright testing, distinct from the dev server's mock user.

### Comparison with Dev Server Mock User

| Aspect          | Dev Server Mock User           | E2E Server Cookie Auth         |
| --------------- | ------------------------------ | ------------------------------ |
| Set by          | Env var or `auth.dev.mockUser` | `ldf.user()` in test code      |
| Scope           | Global (all requests)          | Per browser context            |
| Transforms      | Runs through session callback  | No transforms (direct mapping) |
| Change mid-test | No                             | Yes (`ldf.user(newUser)`)      |
| Clear mid-test  | No                             | Yes (`ldf.user(null)`)         |
| Server          | `@lowdefy/server-dev`          | `@lowdefy/server-e2e`          |

### How It Works

1. **Test sets cookie:** `ldf.user({ id, roles })` → `base64(JSON)` → `lowdefy_e2e_user` cookie via `browserContext.addCookies()`
2. **Server reads cookie:** `lib/server/auth/session.js` `getSession(c)` parses the cookie → returns `{ user }`
3. **Authorization runs normally:** `createAuthorize(session)` → `authorize(pageConfig)` — same as production
4. **Client receives session:** `renderPage` embeds the session in `__LOWDEFY_CONFIG__`; the client `Auth` component passes it through to `lowdefy.user`

### Client Auth

`lib/client/auth/Auth.jsx` replaces the `@hono/auth-js/react` integration — there is no Auth.js engine in server-e2e. `getSession` fetches `/api/auth/session` (served by `src/routes/sessionMock.js`, which returns `context.session ?? {}` and doubles as the e2e harness health check). The `signIn` and `signOut` methods throw:

```javascript
function e2eNotSupported() {
  throw new Error('Sign-in and sign-out are not supported in e2e testing.');
}
```

### Unauthorized Pages

Protected pages follow the production flow: `getPageConfig` returns `null` for unauthorized pages, and `renderPage` redirects to `/404` (302).

### Key Files

| File                                       | Purpose                           |
| ------------------------------------------ | --------------------------------- |
| `server-e2e/lib/server/auth/session.js`    | Reads cookie, returns `{ user }`  |
| `server-e2e/lib/client/auth/Auth.jsx`      | Client auth (no Auth.js)          |
| `server-e2e/src/routes/sessionMock.js`     | Returns `context.session ?? {}`   |
| `e2e-utils/src/core/userCookie.js`         | Sets/clears cookie via Playwright |
| `e2e-utils/src/proxy/createPageManager.js` | Exposes `ldf.user()` API          |

See [server-e2e.md](../servers/server-e2e.md) for full server architecture.

## Security Considerations

1. **404 for Unauthorized**: Returns 404 instead of 403 to hide existence
2. **Session Hashing**: `hashed_id` for privacy-preserving analytics
3. **Role Checking**: Array-based role matching
4. **Roles Validation**: `validateSessionRoles` in the session callback throws `ConfigError` if `session.user.roles` is not an array of strings. Without this, a misconfigured string value (e.g., `roles: "admin"`) causes `String.prototype.includes` to do substring matching — a silent authorization bypass. `createAuthorize` has a defense-in-depth guard for the same check.
5. **Secret Operator**: `_secret` for credentials in config
6. **PKCE & State**: OAuth security via Auth.js
7. **Cookie Security**: Session cookies use the Auth.js v5 `authjs.*` prefix; configurable via `auth.advanced.cookies`
