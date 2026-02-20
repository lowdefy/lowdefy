# BetterAuth Migration Plan

> Migrate Lowdefy auth from NextAuth (next-auth v4) to Better Auth. Assumes all other v5 changes
> (antd v6, Next.js 15, React 19, slots rename, styling architecture) are complete.

---

## Context: Auth.js Has Joined Better Auth

As of late 2025, Auth.js (formerly NextAuth.js) is now maintained by the Better Auth team. Better
Auth is the official successor. Existing Auth.js projects continue to receive security patches, but
**Better Auth is the recommended path forward for new projects**. This makes migration strategically
sound — Lowdefy v5 should ship with the future-standard auth library rather than a legacy one.

---

## Current Lowdefy Auth Architecture

### How Auth Works Today

Lowdefy wraps NextAuth v4 behind a YAML config layer. Users never write NextAuth code — they
configure auth declaratively:

```yaml
lowdefy: 4.5.0
auth:
  providers:
    - id: google
      type: GoogleProvider
      properties:
        clientId:
          _secret: GOOGLE_CLIENT_ID
        clientSecret:
          _secret: GOOGLE_CLIENT_SECRET
  callbacks:
    - id: my_callback
      type: MySessionCallback
  events:
    - id: my_event
      type: MySignInEvent
  adapter:
    id: mongo_adapter
    type: MongoDBAdapter
    properties:
      uri:
        _secret: MONGODB_URI
  userFields:
    roles: profile.roles
    org_id: account.org_id
  pages:
    protected: true
    roles:
      admin:
        - admin-dashboard
      editor:
        - content-editor
    public:
      - landing-page
  api:
    protected: true
    public:
      - public-api
  authPages:
    signIn: /auth/signin
    signOut: /auth/signout
    error: /auth/error
  session:
    strategy: jwt
    maxAge: 86400
  theme:
    colorScheme: auto
  advanced:
    cookies: {}
```

### Code Layers (What Touches NextAuth)

**14 files form the core NextAuth integration.** Every one must change.

#### Layer 1: Server Route Handler
| File | Role |
|------|------|
| `servers/server/pages/api/auth/[...nextauth].js` | Next.js API route — calls `NextAuth(req, res, authOptions)` |

#### Layer 2: Server Auth Config
| File | Role |
|------|------|
| `servers/server/lib/server/auth/getAuthOptions.js` | Imports build artifacts + plugins, calls `getNextAuthConfig()` |
| `servers/server/lib/server/auth/getServerSession.js` | Wraps `getServerSession` from `next-auth/next` |

#### Layer 3: Client Auth Components
| File | Role |
|------|------|
| `servers/server/lib/client/auth/Auth.js` | Branches: `AuthConfigured` vs `AuthNotConfigured` |
| `servers/server/lib/client/auth/AuthConfigured.js` | `SessionProvider` + `useSession` from `next-auth/react` |
| `servers/server/lib/client/auth/AuthNotConfigured.js` | Stub `signIn`/`signOut`/`getSession` that throw |
| `servers/server/pages/_app.js` | Renders `<Auth session={session}>` around the app |

#### Layer 4: API (Framework-Agnostic Auth Config)
| File | Role |
|------|------|
| `api/src/routes/auth/getNextAuthConfig.js` | Builds the NextAuth options object from YAML config |
| `api/src/routes/auth/createAdapter.js` | Creates NextAuth adapter from plugin |
| `api/src/routes/auth/createProviders.js` | Maps YAML provider configs to NextAuth provider instances |
| `api/src/routes/auth/callbacks/createCallbacks.js` | Orchestrates jwt, session, redirect, signIn callbacks |
| `api/src/routes/auth/callbacks/createJWTCallback.js` | NextAuth JWT callback — adds OIDC claims + userFields to token |
| `api/src/routes/auth/callbacks/createSessionCallback.js` | NextAuth session callback — copies token fields to session |
| `api/src/routes/auth/callbacks/createRedirectCallback.js` | NextAuth redirect callback |
| `api/src/routes/auth/callbacks/createSignInCallback.js` | NextAuth signIn callback |
| `api/src/routes/auth/callbacks/addUserFieldsToToken.js` | Maps `userFields` config to JWT token fields |
| `api/src/routes/auth/callbacks/addUserFieldsToSession.js` | Maps `userFields` from token/user to session |
| `api/src/routes/auth/callbacks/createCallbackPlugins.js` | Filters callback plugins by type (jwt/session/redirect/signIn) |
| `api/src/routes/auth/events/createEvents.js` | Creates NextAuth event handlers |
| `api/src/routes/auth/events/createEventPlugins.js` | Filters event plugins by type |
| `api/src/routes/auth/events/create*Event.js` (5 files) | Individual event creators (signIn, signOut, createUser, etc.) |
| `api/src/routes/auth/createLogger.js` | Wraps Lowdefy logger for NextAuth |

#### Layer 5: Client Auth Methods
| File | Role |
|------|------|
| `client/src/auth/createAuthMethods.js` | Creates `login()`/`logout()`/`updateSession()` — wraps `signIn`/`signOut` from next-auth |

#### Layer 6: Authorization
| File | Role |
|------|------|
| `api/src/context/createAuthorize.js` | Checks `session.user.roles` against `config.auth.roles` |
| `api/src/routes/request/authorizeRequest.js` | Authorizes request access using session |
| `api/src/routes/page/getPageConfig.js` | Authorizes page access using session |
| `api/src/routes/endpoints/authorizeApiEndpoint.js` | Authorizes API endpoint access using session |

#### Layer 7: Build
| File | Role |
|------|------|
| `build/src/build/buildAuth/buildAuth.js` | Orchestrates auth build |
| `build/src/build/buildAuth/buildAuthPlugins.js` | Validates and registers auth plugin types |
| `build/src/build/buildAuth/buildPageAuth.js` | Computes per-page `auth.public`/`auth.roles` |
| `build/src/build/buildAuth/buildApiAuth.js` | Computes per-endpoint `auth.public`/`auth.roles` |
| `build/src/build/buildAuth/validateAuthConfig.js` | Schema validation + `NEXTAUTH_SECRET` check |
| `build/src/build/buildAuth/getProtectedPages.js` | Resolves which pages are protected |
| `build/src/build/buildAuth/getPageRoles.js` | Resolves which pages require which roles |
| `build/src/build/buildImports/buildImportsDev.js` | Generates dev plugin imports (includes auth) |
| `build/src/build/buildImports/buildImportsProd.js` | Generates prod plugin imports (includes auth) |
| `build/src/lowdefySchema.js` | JSON Schema for `auth` config (lines 114–510) |

#### Layer 8: Plugin Package
| File | Role |
|------|------|
| `plugins/plugins/plugin-next-auth/src/auth/providers.js` | Imports and re-exports all 60+ NextAuth providers |
| `plugins/plugins/plugin-next-auth/src/auth/OpenIDConnectProvider.js` | Custom OIDC provider wrapper |
| `plugins/plugins/plugin-next-auth/src/types.js` | Registers provider type names |

#### Layer 9: MongoDB Adapter
| File | Role |
|------|------|
| `plugins/connections/connection-mongodb/` | Contains `@next-auth/mongodb-adapter` dependency |

---

## NextAuth vs Better Auth: Concept Mapping

### Core Architecture

| Concept | NextAuth v4 (Current) | Better Auth |
|---------|----------------------|-------------|
| **Instance** | `NextAuth(req, res, options)` per-request | `betterAuth({ ... })` singleton |
| **Route** | `pages/api/auth/[...nextauth].js` | `pages/api/auth/[...all].js` with `toNextJsHandler(auth)` |
| **Client** | `import { signIn, signOut, useSession } from 'next-auth/react'` | `createAuthClient()` returns `authClient.signIn.social()`, `authClient.signOut()`, `authClient.useSession()` |
| **Server session** | `getServerSession(req, res, authOptions)` | `auth.api.getSession({ headers })` |
| **Secret env var** | `NEXTAUTH_SECRET` | `BETTER_AUTH_SECRET` |
| **URL env var** | `NEXTAUTH_URL` | `BETTER_AUTH_URL` |

### Providers

| NextAuth | Better Auth |
|----------|-------------|
| Provider functions from `next-auth/providers/*` | `socialProviders: { github: { clientId, clientSecret } }` in config |
| 60+ provider imports, each a factory function | 40+ built-in providers as config keys |
| `OpenIDConnectProvider` custom wrapper | Generic OAuth plugin or built-in OIDC support |
| Provider `id` explicit in config | Provider key is the id (e.g., `github`) |

**Provider coverage gap:** NextAuth v4 has ~60 providers. Better Auth has ~40 built-in plus a
Generic OAuth plugin for any OAuth2/OIDC provider. Most common providers (Google, GitHub, Apple,
Discord, Facebook, Twitter, Microsoft, Okta, Auth0, Keycloak, LinkedIn, Slack, Spotify, GitLab,
etc.) are covered. Obscure providers (42School, Osso, Passage, Pipedrive, Trakt, etc.) would need
Generic OAuth config.

### Callbacks → Hooks

NextAuth uses callbacks that receive and return specific objects. Better Auth uses a **hook/plugin
system** instead:

| NextAuth Callback | Better Auth Equivalent |
|-------------------|----------------------|
| `jwt({ token, user, account, profile })` | **No JWT callback** — Better Auth is database-session by default. Token enrichment happens via plugins that extend the session/user table |
| `session({ session, token, user })` | Plugin hooks or `session.cookieCache` + custom fields on user table |
| `signIn({ user, account, profile })` | `before` hook on sign-in endpoint, or `denySignIn` callback |
| `redirect({ url, baseUrl })` | `afterSignIn` redirect, or custom plugin endpoint |

**Critical difference:** NextAuth's JWT callback is the primary mechanism Lowdefy uses to shuttle
OIDC profile claims (given_name, family_name, etc.) and `userFields` into the session. Better Auth
doesn't have JWT callbacks because it uses **database sessions** by default. The user's profile
data is stored in the database `user` table, and the session references it. This is architecturally
cleaner but means the `userFields` mapping needs a different approach.

### Events → Hooks

| NextAuth Event | Better Auth Equivalent |
|---------------|----------------------|
| `signIn` | `after` hook on `/sign-in/*` endpoints |
| `signOut` | `after` hook on `/sign-out` endpoint |
| `createUser` | `after` hook on `/sign-up/*` endpoints |
| `updateUser` | `after` hook on user update endpoints |
| `linkAccount` | `after` hook on account linking endpoints |
| `session` | `after` hook on `/get-session` endpoint |

### Adapter → Database Config

| NextAuth | Better Auth |
|----------|-------------|
| Separate adapter packages (`@next-auth/mongodb-adapter`, `@next-auth/prisma-adapter`) | Built-in database support via `database` config |
| Adapter is a plugin-style object | `database: { type: 'mongodb', uri: '...' }` or Prisma/Drizzle/Kysely adapters |
| Users manage their own schema | Better Auth manages schema + provides CLI migrations |

### Session Strategy

| NextAuth | Better Auth |
|----------|-------------|
| JWT (default) or database sessions | Database sessions (default), with optional `session.cookieCache` for performance |
| `session.strategy: 'jwt'` | No JWT-only mode — sessions always have a database record |
| JWT contains all user data | Session cookie contains token that references DB record |
| Token size grows with claims | Consistent small cookie size |

### Auth Pages

| NextAuth | Better Auth |
|----------|-------------|
| `pages: { signIn, signOut, error, verifyRequest, newUser }` | No built-in pages — auth is API-only, bring your own UI |
| Default themed pages if not customized | No default pages at all |

---

## What Changes for Lowdefy Users (YAML Config)

### Breaking Changes to Auth Config

#### 1. Provider Config Restructured

```yaml
# BEFORE (NextAuth):
auth:
  providers:
    - id: google
      type: GoogleProvider
      properties:
        clientId:
          _secret: GOOGLE_CLIENT_ID
        clientSecret:
          _secret: GOOGLE_CLIENT_SECRET

# AFTER (Better Auth):
auth:
  providers:
    - id: google
      type: google           # lowercase, no "Provider" suffix
      properties:
        clientId:
          _secret: GOOGLE_CLIENT_ID
        clientSecret:
          _secret: GOOGLE_CLIENT_SECRET
```

The `type` field changes from NextAuth provider class names (`GoogleProvider`, `GitHubProvider`) to
Better Auth social provider keys (`google`, `github`). Lowdefy build should provide a clear
migration error with a mapping table.

#### 2. Environment Variable Rename

```
NEXTAUTH_SECRET → BETTER_AUTH_SECRET
NEXTAUTH_URL → BETTER_AUTH_URL (optional — Better Auth auto-detects in most cases)
```

Build validation must check for `BETTER_AUTH_SECRET` instead of `NEXTAUTH_SECRET`.

#### 3. Session Config Simplified

```yaml
# BEFORE:
auth:
  session:
    strategy: jwt
    maxAge: 86400

# AFTER:
auth:
  session:
    expiresIn: 86400          # seconds (same value, renamed key)
    updateAge: 86400          # how often session is refreshed (optional)
    cookieCache:
      enabled: true           # optional: cache session in cookie for performance
      maxAge: 300             # cookie cache TTL in seconds
```

The `strategy: jwt` option is removed — Better Auth always uses database sessions. The
`cookieCache` option provides similar performance benefits to JWT (avoiding DB lookups on every
request) while keeping the authoritative session in the database.

#### 4. Callbacks → Hooks (Plugin System Change)

```yaml
# BEFORE:
auth:
  callbacks:
    - id: my_session_callback
      type: MySessionCallback
      properties:
        allowedDomains:
          - example.com

# AFTER:
auth:
  hooks:                      # renamed from callbacks
    - id: my_hook
      type: MyAuthHook        # new plugin type
      properties:
        allowedDomains:
          - example.com
```

**Migration path for callback plugins:** Existing NextAuth callback plugins
(`plugins.callbacks[type]`) need to be rewritten as Better Auth hook plugins. The function signature
changes significantly.

#### 5. Events → Hooks (Merged)

```yaml
# BEFORE:
auth:
  events:
    - id: log_signin
      type: MySignInEvent

# AFTER:
auth:
  hooks:                      # events merge into hooks
    - id: log_signin
      type: MySignInHook      # new unified hook plugin type
```

Events and callbacks merge into a single `hooks` concept. This is actually simpler.

#### 6. Adapter → Database

```yaml
# BEFORE:
auth:
  adapter:
    id: mongo_adapter
    type: MongoDBAdapter
    properties:
      uri:
        _secret: MONGODB_URI

# AFTER:
auth:
  database:
    type: mongodb             # or 'prisma', 'drizzle', 'kysely'
    properties:
      uri:
        _secret: MONGODB_URI
```

#### 7. authPages → Custom UI (No Built-in Pages)

```yaml
# BEFORE:
auth:
  authPages:
    signIn: /auth/signin
    signOut: /auth/signout
    error: /auth/error
    verifyRequest: /auth/verify-request
    newUser: /auth/new-user

# AFTER:
auth:
  pages:                      # repurposed — these become redirect targets
    signIn: /auth/signin      # where to redirect for sign-in
    signOut: /auth/signout    # where to redirect after sign-out
    error: /auth/error        # where to redirect on error
```

Better Auth doesn't serve default auth pages — it's API-only. Lowdefy users must build their own
sign-in pages using Lowdefy blocks. This is actually more aligned with how most Lowdefy users
already work (custom pages with `Login`/`Logout` actions).

#### 8. userFields Behavior Change

```yaml
# BEFORE — maps provider profile fields to session via JWT:
auth:
  userFields:
    roles: profile.roles
    org_id: account.org_id

# AFTER — maps provider profile fields to user DB record:
auth:
  userFields:
    roles: profile.roles      # stored in user table, available via session
    org_id: account.org_id
```

Same YAML syntax, but the underlying mechanism changes. Instead of JWT token enrichment,
`userFields` are written to the user database record on sign-in and read back via the session's
user reference. This is actually more robust — fields persist across sessions.

#### 9. advanced.cookies Removed

```yaml
# BEFORE:
auth:
  advanced:
    cookies: { ... }

# AFTER:
# Better Auth manages cookies internally. Custom cookie config is not
# exposed the same way. If needed, use the advanced.cookies option
# in Better Auth's config object.
```

### Non-Breaking (Same Config, Different Implementation)

These YAML config sections work the same way — the build/runtime handles the mapping:

- `auth.pages.protected` / `auth.pages.public` / `auth.pages.roles` — Lowdefy's own authorization
  layer, independent of auth library
- `auth.api.protected` / `auth.api.public` / `auth.api.roles` — same
- `auth.debug` — maps to Better Auth's `logger.level`
- `auth.theme` — **removed** (Better Auth has no themed pages)

---

## Implementation Plan: Package-by-Package Changes

### Phase 1: Core Infrastructure

#### 1.1 New Plugin Package: `@lowdefy/plugin-better-auth`

**Replace** `@lowdefy/plugin-next-auth` with `@lowdefy/plugin-better-auth`.

```
plugins/plugins/plugin-better-auth/
├── src/
│   ├── auth/
│   │   ├── providers.js        # Maps Lowdefy provider types to Better Auth socialProviders keys
│   │   └── genericOAuth.js     # Wrapper for Better Auth Generic OAuth plugin (replaces OpenIDConnectProvider)
│   └── types.js                # Registers provider type names
├── package.json                # depends on "better-auth"
```

**Key difference:** Instead of importing 60+ provider factory functions, this maps provider type
names to Better Auth `socialProviders` config keys. Much simpler:

```javascript
// BEFORE (plugin-next-auth/src/auth/providers.js): 200+ lines of imports
import google from 'next-auth/providers/google';
const GoogleProvider = google.default;
export { GoogleProvider, ... };

// AFTER (plugin-better-auth/src/auth/providers.js): Simple mapping
const providerMap = {
  google: 'google',
  github: 'github',
  apple: 'apple',
  discord: 'discord',
  // ... etc
};
export default providerMap;
```

#### 1.2 API Layer: `getNextAuthConfig.js` → `getBetterAuthConfig.js`

**File:** `packages/api/src/routes/auth/getBetterAuthConfig.js`

The entire auth config assembly changes:

```javascript
import { betterAuth } from 'better-auth';
import { toNextJsHandler } from 'better-auth/next-js';

function getBetterAuthConfig({ authJson, logger, plugins, secrets }) {
  // Parse operators (_secret, etc.)
  const operatorsParser = new ServerParser({ ... });
  const { output: authConfig } = operatorsParser.parse({ input: authJson });

  // Build Better Auth instance
  const auth = betterAuth({
    database: createDatabase({ authConfig, plugins }),
    socialProviders: createSocialProviders({ authConfig, plugins }),
    plugins: createBetterAuthPlugins({ authConfig, plugins }),
    session: {
      expiresIn: authConfig.session?.expiresIn ?? 86400,
      updateAge: authConfig.session?.updateAge ?? 86400,
      cookieCache: authConfig.session?.cookieCache,
    },
    secret: secrets.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    logger: createLogger({ logger }),
  });

  return { auth, handler: toNextJsHandler(auth) };
}
```

**Files to delete:**
- `createAdapter.js` → replaced by `createDatabase.js`
- `createProviders.js` → replaced by `createSocialProviders.js`
- `callbacks/` entire directory → replaced by hooks in plugin system
- `events/` entire directory → replaced by hooks in plugin system
- `getNextAuthConfig.js` → replaced by `getBetterAuthConfig.js`

**Files to create:**
- `getBetterAuthConfig.js` — main config builder
- `createDatabase.js` — maps YAML database config to Better Auth database option
- `createSocialProviders.js` — maps YAML providers array to `socialProviders` object
- `createHooks.js` — maps YAML hooks config to Better Auth hooks/plugins

#### 1.3 Callbacks/Events → Hooks Rewrite

The entire `callbacks/` and `events/` directories (11 files) are replaced by a single hooks system.

**Before:** NextAuth has 4 callback types (jwt, session, signIn, redirect) and 6 event types
(signIn, signOut, createUser, updateUser, linkAccount, session), each with a Lowdefy wrapper that
loads plugins and chains them.

**After:** Better Auth hooks are `before`/`after` handlers on specific endpoints. Lowdefy creates
a custom Better Auth plugin that registers these hooks:

```javascript
function createLowdefyAuthPlugin({ authConfig, plugins, logger }) {
  return {
    id: 'lowdefy-auth',
    hooks: {
      after: [
        {
          matcher: (context) => context.path.startsWith('/sign-in'),
          handler: async (ctx) => {
            // Run signIn event plugins
            // Run signIn callback plugins (for allow/deny)
            // Map userFields to user record
          },
        },
        {
          matcher: (context) => context.path === '/get-session',
          handler: async (ctx) => {
            // Run session callback plugins
            // Add hashed_id
          },
        },
      ],
    },
  };
}
```

**userFields handling:** Instead of the JWT callback chain
(`profile → addUserFieldsToToken → token → addUserFieldsToSession → session`), Better Auth stores
user data in the database. The `userFields` mapping runs once on sign-in (writing to the user
table), and the session automatically includes user data from the database.

#### 1.4 Server Route Handler

**Before:** `pages/api/auth/[...nextauth].js`
```javascript
import NextAuth from 'next-auth';
return NextAuth(req, res, context.authOptions);
```

**After:** `pages/api/auth/[...all].js`
```javascript
import { auth } from '../../../lib/server/auth/betterAuth.js';
import { toNextJsHandler } from 'better-auth/next-js';
const { GET, POST } = toNextJsHandler(auth);
export { GET, POST };
```

**Note:** The route changes from `[...nextauth]` to `[...all]`. This changes the API URL pattern:
- Before: `/api/auth/callback/google`, `/api/auth/signin`, etc.
- After: `/api/auth/sign-in/social`, `/api/auth/sign-out`, `/api/auth/get-session`, etc.

This is a **server-side only change** — Lowdefy users don't configure these URLs directly. The
OAuth callback URLs configured with providers will change though, which users need to update.

#### 1.5 Server Session

**Before:**
```javascript
import { getServerSession } from 'next-auth/next';
return getServerSession(req, res, authOptions);
```

**After:**
```javascript
return auth.api.getSession({ headers: req.headers });
```

The session object shape changes slightly:
- NextAuth: `{ user: { name, email, image, ...customFields }, expires }`
- Better Auth: `{ user: { id, name, email, image, emailVerified, createdAt, ...customFields }, session: { id, expiresAt, token, ... } }`

The `createAuthorize.js` function reads `session.user.roles` — this continues to work as long as
`roles` is properly stored on the user record.

### Phase 2: Client-Side Changes

#### 2.1 AuthConfigured.js Rewrite

**Before:** Uses `SessionProvider`, `useSession`, `getSession`, `signIn`, `signOut` from
`next-auth/react`.

**After:** Uses `createAuthClient()` from `better-auth/react`:

```javascript
import { createAuthClient } from 'better-auth/react';

const authClient = createAuthClient();

function AuthConfigured({ authConfig, children }) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return '';

  const auth = {
    authConfig,
    session,
    signIn: authClient.signIn,
    signOut: authClient.signOut,
    getSession: authClient.getSession,
  };

  return children(auth);
}
```

**Key changes:**
- No more `SessionProvider` wrapper — Better Auth client manages state internally via nanostores
- `useSession()` returns `{ data, isPending }` instead of `{ data, status }`
- `signIn('google')` becomes `authClient.signIn.social({ provider: 'google' })`
- `signOut()` becomes `authClient.signOut()`
- `getSession()` becomes `authClient.getSession()`

#### 2.2 createAuthMethods.js Update

The `login()` and `logout()` functions need updated signatures:

```javascript
// BEFORE:
function login({ authUrl, callbackUrl, providerId, ...rest } = {}) {
  return auth.signIn(providerId, { callbackUrl: ... }, authUrl?.urlQuery);
}

// AFTER:
function login({ callbackUrl, providerId, ...rest } = {}) {
  return auth.signIn.social({
    provider: providerId,
    callbackURL: getCallbackUrl({ lowdefy, callbackUrl }),
    ...rest,
  });
}
```

The `Logout` and `Login` actions (`actions-core`) call `methods.login(params)` and
`methods.logout(params)` — these continue to work since `createAuthMethods` abstracts the
underlying auth library.

### Phase 3: Build Changes

#### 3.1 Schema Update (`lowdefySchema.js`)

The `authConfig` definition changes:

- **Remove:** `adapter` (object with id/type/properties)
- **Add:** `database` (object with type/properties)
- **Rename:** `callbacks` → `hooks`
- **Remove:** `events` (merged into `hooks`)
- **Rename:** `authPages` → `pages` (if not conflicting with existing `pages`)
- **Update:** `session` properties (remove `strategy`, add `expiresIn`/`updateAge`/`cookieCache`)
- **Remove:** `theme` (Better Auth has no themed pages)
- **Remove:** `advanced.cookies` (or remap to Better Auth equivalent)

#### 3.2 Validation Update (`validateAuthConfig.js`)

- Change `NEXTAUTH_SECRET` check to `BETTER_AUTH_SECRET`
- Update default initialization for new config shape
- Validate new `database` config instead of `adapter`
- Validate `hooks` instead of `callbacks` + `events`

#### 3.3 Plugin Type Registration

`buildAuthPlugins.js` currently registers types for `adapters`, `callbacks`, `events`, `providers`.
Update to register `database`, `hooks`, `providers`.

#### 3.4 Import Generation

`buildImportsDev.js` and `buildImportsProd.js` generate import code for auth plugins. Update to
import from `@lowdefy/plugin-better-auth` instead of `@lowdefy/plugin-next-auth`.

### Phase 4: Package Dependencies

#### Remove
| Package | Where |
|---------|-------|
| `next-auth` (v4.24.5) | `server`, `server-dev`, `connection-mongodb` |
| `@lowdefy/plugin-next-auth` | `server`, `server-dev`, `build` |
| `@next-auth/mongodb-adapter` | `connection-mongodb` |

#### Add
| Package | Where |
|---------|-------|
| `better-auth` | `server`, `server-dev`, `api` |
| `@lowdefy/plugin-better-auth` | `server`, `server-dev`, `build` |

---

## Risk Analysis

### High Risk

1. **Database session vs JWT** — Lowdefy currently defaults to JWT sessions (stateless). Better
   Auth requires a database for sessions. Apps that use auth without a database adapter will now
   **require** a database config. This is a significant behavioral change.

   **Mitigation:** Build validation should error clearly if `auth.providers` are configured but no
   `auth.database` is set, with a migration message explaining that Better Auth requires a database.
   Recommend `cookieCache` for performance parity with JWT.

2. **Custom callback plugins** — Any user-written callback plugin (`auth.callbacks`) will break.
   The function signatures change completely (NextAuth callback args → Better Auth hook context).

   **Mitigation:** Document the migration path. Provide adapter wrappers if feasible. At minimum,
   throw a clear build error if old-style `callbacks` key is used, pointing to migration docs.

3. **Provider coverage gap** — ~20 obscure NextAuth providers don't have direct Better Auth
   equivalents. Users of these providers need to switch to Generic OAuth config.

   **Mitigation:** Build validation can detect unknown provider types and suggest Generic OAuth.
   Provide a mapping table in migration docs.

### Medium Risk

4. **Session object shape change** — Code that reads `session.expires` (NextAuth) won't find
   `session.session.expiresAt` (Better Auth). The `createAuthorize.js` function reads
   `session.user.roles` which should work, but other session field access patterns may break.

   **Mitigation:** Normalize the session shape in the Lowdefy session callback to match the
   existing structure as closely as possible.

5. **OAuth callback URL changes** — Better Auth uses different callback URL patterns than NextAuth.
   Users need to update their OAuth provider configurations (Google Console, GitHub App settings,
   etc.).

   **Mitigation:** Clear documentation. Build-time warning with old and new callback URLs.

6. **`next-auth/react` SessionProvider removal** — The `SessionProvider` context is used for
   session state management. Better Auth's `createAuthClient()` uses nanostores instead. Need to
   verify this works correctly with Lowdefy's `ssr: false` client-only rendering.

### Low Risk

7. **Pages Router compatibility** — Better Auth's Next.js integration docs focus on App Router.
   Need to verify the Pages Router `[...all].js` handler works correctly. The `toNextJsHandler`
   should support both, but needs testing.

8. **Build artifact format** — The `auth.json` build artifact format changes slightly but the
   build pipeline handles this internally.

---

## Migration Checklist (Implementation Order)

- [ ] Create `@lowdefy/plugin-better-auth` package with provider mapping
- [ ] Rewrite `getBetterAuthConfig.js` (replaces `getNextAuthConfig.js`)
- [ ] Implement `createDatabase.js` (replaces `createAdapter.js`)
- [ ] Implement `createSocialProviders.js` (replaces `createProviders.js`)
- [ ] Implement `createHooks.js` (replaces `callbacks/` + `events/` directories)
- [ ] Implement `userFields` mapping via Better Auth hook (on sign-in, write to user record)
- [ ] Implement `hashed_id` computation in session hook
- [ ] Rewrite `[...nextauth].js` → `[...all].js` route handler
- [ ] Rewrite `getServerSession.js` to use `auth.api.getSession()`
- [ ] Rewrite `AuthConfigured.js` to use `createAuthClient()`
- [ ] Update `createAuthMethods.js` for new signIn/signOut API
- [ ] Verify `AuthNotConfigured.js` still works (should be trivial)
- [ ] Update `_app.js` if Auth wrapper changes
- [ ] Update `lowdefySchema.js` auth config definition
- [ ] Update `validateAuthConfig.js` (env var check, new shape)
- [ ] Update `buildAuthPlugins.js` for new plugin types
- [ ] Update `buildImportsDev.js` / `buildImportsProd.js` for new package
- [ ] Update `createAuthorize.js` if session shape changes
- [ ] Update all `package.json` files (remove next-auth, add better-auth)
- [ ] Handle MongoDB adapter migration (`connection-mongodb`)
- [ ] Add build-time migration errors for old config format
- [ ] Update tests across all affected packages
- [ ] Verify Pages Router compatibility with `toNextJsHandler`

---

## Decisions to Make Before Starting

1. **Should `callbacks` and `events` merge into `hooks`, or keep them separate?** Better Auth's
   plugin system is flexible enough to support either YAML shape. Merging is simpler. Keeping
   separate preserves familiarity for existing users.

2. **How to handle the JWT → database session transition?** Apps without database config currently
   work with JWT-only auth. Should Lowdefy provide a lightweight built-in database (SQLite?) or
   require users to configure one?

3. **Should `authPages` be kept?** Better Auth has no default pages. The `authPages` config in
   NextAuth controlled redirect URLs for built-in pages. With Better Auth, sign-in pages are
   user-built Lowdefy pages. Should `authPages` become redirect config only?

4. **Provider type naming convention** — Should Lowdefy adopt Better Auth's lowercase provider
   names (`google`, `github`) or maintain the PascalCase names (`GoogleProvider`, `GitHubProvider`)
   with build-time mapping? Lowercase is simpler and matches Better Auth directly.

5. **Generic OAuth for missing providers** — How should the YAML config look for providers that
   need Generic OAuth? Should it be a special provider `type: genericOAuth` with full OAuth config
   in `properties`, or should `OpenIDConnectProvider` be preserved as a Lowdefy-specific wrapper?

---

## Estimated Scope

| Area | Files Changed | Files Deleted | Files Created | Effort |
|------|:------------:|:------------:|:------------:|--------|
| Plugin package | 0 | 3 (plugin-next-auth) | 3 (plugin-better-auth) | Small |
| API auth routes | 0 | ~15 (callbacks/, events/, old config) | ~4 (new config, hooks) | Large |
| Server auth | 3 | 0 | 1 ([...all].js) | Medium |
| Client auth | 2 | 0 | 0 | Medium |
| Build | 4 | 0 | 0 | Medium |
| Package deps | 5 | 0 | 0 | Small |
| Tests | ~20 | ~10 | ~15 | Large |
| **Total** | **~34** | **~28** | **~23** | |

Net change: **~29 files** (28 deleted, 23 created, 34 modified). The API auth routes layer sees
the biggest churn — the entire callbacks/events architecture is replaced by a simpler hooks system.
