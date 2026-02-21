# Technical Implementation Plan: BetterAuth Auth Strategy

> **Branch**: `claude/betterauth-auth-strategy-AWFIR`
> **Status**: Draft
> **Scope**: Replace NextAuth with BetterAuth across the Lowdefy platform — CLI auth, portal auth, developer app auth, and managed end-user auth.

---

## 1. Current State Analysis

### 1.1 How Auth Works Today

Lowdefy uses **NextAuth v4** (`next-auth@4.x`) for authentication. The integration points are:

| File | Role |
|------|------|
| `packages/api/src/routes/auth/getNextAuthConfig.js` | Parses `auth.json` build artifact, creates NextAuth config (adapter, callbacks, events, providers) |
| `packages/api/src/routes/auth/createAdapter.js` | Creates the DB adapter from plugin config |
| `packages/api/src/routes/auth/createProviders.js` | Creates OAuth/credentials providers from config |
| `packages/api/src/routes/auth/callbacks/createCallbacks.js` | Composes NextAuth callbacks (jwt, session, redirect, signIn) |
| `packages/api/src/routes/auth/events/createEvents.js` | Composes NextAuth events (signIn, signOut, createUser, etc.) |
| `packages/servers/server/lib/server/auth/getServerSession.js` | Calls `getServerSession` from `next-auth/next` |
| `packages/servers/server/lib/server/auth/getAuthOptions.js` | Wraps `getNextAuthConfig` with server-specific secrets/plugins |
| `packages/servers/server/lib/server/apiWrapper.js` | Calls `getServerSession` for every non-auth API request |
| `packages/servers/server/pages/api/auth/[...nextauth].js` | NextAuth catch-all API route |
| `packages/api/src/context/createApiContext.js` | Sets `context.user = context.session?.user` |
| `packages/api/src/context/createAuthorize.js` | Role-based authorization from session |
| `packages/build/src/build/buildAuth/` | Build-time validation and processing of auth config |

### 1.2 Auth Config Flow

```
lowdefy.yaml (auth section)
    ↓  build
auth.json (build artifact)
    ↓  server startup
getNextAuthConfig() parses with ServerParser (_secret resolution)
    ↓
NextAuth config object (adapter, providers, callbacks, events)
    ↓  per request
getServerSession() → session object → context.user → authorize()
```

### 1.3 Key Dependencies

- `next-auth@4.x` — core auth library
- `@lowdefy/plugin-next-auth` — Lowdefy's NextAuth adapter plugin
- Auth adapter plugins (e.g., `@next-auth/mongodb-adapter`)
- Auth provider plugins (Google, GitHub, Credentials, etc.)

### 1.4 Auth Build Artifacts

The build system produces:
- `build/auth.js` — serialized auth config with `{ configured: true/false }`
- Auth config includes: `providers`, `adapter`, `callbacks`, `events`, `session`, `theme`, `authPages`, `advanced`

---

## 2. Target Architecture

### 2.1 Overview

Replace NextAuth with BetterAuth as the authentication engine. BetterAuth runs as a library within the Lowdefy server (not a separate service for self-hosted apps). For the managed Lowdefy platform, a central auth server handles CLI, portal, and managed app auth.

```
┌─────────────────────────────────────────────────────┐
│              LOWDEFY APP SERVER                      │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │           BetterAuth Instance                  │  │
│  │                                                │  │
│  │  Core: email/password, social OAuth, sessions  │  │
│  │  Plugins: organization, jwt, device-auth,      │  │
│  │           oauth-provider (managed mode)         │  │
│  │  Adapter: MongoDB                              │  │
│  └─────────────────────┬──────────────────────────┘  │
│                        │                              │
│  ┌─────────────────────┴──────────────────────────┐  │
│  │         Lowdefy Auth Adapter Layer             │  │
│  │                                                │  │
│  │  getBetterAuthConfig()  — config from YAML     │  │
│  │  getServerSession()     — session resolution   │  │
│  │  createAuthorize()      — role-based authz     │  │
│  │  Auth API routes        — /api/auth/*          │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 2.2 Two Deployment Modes

**Self-hosted mode** (default): BetterAuth runs inside the Lowdefy app server. Each app has its own auth instance and database. This is the open-source, config-driven experience.

**Managed mode** (Lowdefy Cloud): A central BetterAuth server (`auth.lowdefy.com`) handles auth for the CLI, portal, and optionally for end-user apps via the OAuth Provider plugin. Apps can opt into managed auth via `auth.plan: managed` in their config.

The implementation plan focuses on **self-hosted mode first** (Phases 1–3), then adds managed mode (Phases 4–5).

---

## 3. Config Schema Design

### 3.1 Basic Auth Config (Self-Hosted)

```yaml
# lowdefy.yaml
auth:
  providers:
    - id: google
      type: google
      properties:
        clientId:
          _secret: GOOGLE_CLIENT_ID
        clientSecret:
          _secret: GOOGLE_CLIENT_SECRET
    - id: github
      type: github
      properties:
        clientId:
          _secret: GITHUB_CLIENT_ID
        clientSecret:
          _secret: GITHUB_CLIENT_SECRET
    - id: email
      type: emailPassword
      properties:
        requireEmailVerification: true

  database:
    uri:
      _secret: AUTH_DATABASE_URI
    # Defaults to the app's MongoDB connection if not specified

  session:
    strategy: cookie        # cookie (default) | jwt
    maxAge: 2592000         # 30 days in seconds
    updateAge: 86400        # 24 hours — refresh session if older than this

  callbacks:
    - id: onSignIn
      type: SignInCallback
      # ... plugin-based callbacks (same pattern as today)

  pages:
    signIn: /auth/sign-in
    signUp: /auth/sign-up
    error: /auth/error

  roles:
    # Static role assignment rules
    - match:
        email: "*@lowdefy.com"
      roles:
        - admin
    - match:
        provider: google
      roles:
        - user

  advanced:
    trustedOrigins:
      - https://myapp.example.com
    rateLimit:
      enabled: true
      window: 60             # seconds
      max: 100               # requests per window
```

### 3.2 Managed Auth Config (Lowdefy Cloud)

```yaml
auth:
  plan: managed              # Uses Lowdefy's managed auth server
  providers:
    - emailPassword
    - google
    - github
  roles:
    - admin
    - editor
    - viewer
  userManagement: true        # Enables user management dashboard
```

### 3.3 Config Mapping: NextAuth → BetterAuth

| NextAuth Config | BetterAuth Config | Notes |
|-----------------|-------------------|-------|
| `providers` | `socialProviders` + `emailAndPassword` | BetterAuth separates social from email/password |
| `adapter` | `database` (adapter created internally) | BetterAuth uses `mongodbAdapter` directly |
| `callbacks.signIn` | `hooks.after.signIn` | BetterAuth uses hooks, not callbacks |
| `callbacks.session` | `session.cookieCache` or custom | Different session enrichment pattern |
| `callbacks.jwt` | `plugins: [jwt()]` | JWT is a plugin, not a callback |
| `callbacks.redirect` | `advanced.redirectTo` | Simpler redirect config |
| `events` | `hooks.after.*` | Events become hooks |
| `pages` | Custom pages via Lowdefy blocks | BetterAuth serves JSON API; UI is separate |
| `session.strategy` | `session.type` | `cookie` or `jwt` |
| `theme` | N/A (UI is separate) | Lowdefy controls its own UI |

---

## 4. Package Changes

### 4.1 New Package: `@lowdefy/auth-betterauth`

A new package that encapsulates the BetterAuth integration. This replaces the NextAuth-specific code in `packages/api/src/routes/auth/`.

```
packages/auth-betterauth/
├── package.json
├── src/
│   ├── index.js                         # Public API
│   ├── createBetterAuthConfig.js        # Maps Lowdefy auth YAML → BetterAuth config
│   ├── createBetterAuthInstance.js       # Creates and caches the BetterAuth instance
│   ├── createMongoDBAdapter.js          # MongoDB adapter setup with indexes
│   ├── createProviders.js               # Maps provider config → BetterAuth social providers
│   ├── createPlugins.js                 # Assembles BetterAuth plugins from config
│   ├── createHooks.js                   # Maps Lowdefy callbacks/events → BetterAuth hooks
│   ├── getSession.js                    # Session resolution (replaces getServerSession)
│   ├── handleAuthRequest.js             # Route handler for /api/auth/* requests
│   ├── mapUserToLowdefy.js             # Maps BetterAuth user → Lowdefy user shape
│   └── plugins/
│       ├── organizationPlugin.js        # Organization/multi-tenancy setup
│       ├── deviceAuthPlugin.js          # CLI device code flow setup
│       └── oauthProviderPlugin.js       # OAuth provider for managed auth
```

### 4.2 Modified Packages

| Package | Changes |
|---------|---------|
| `packages/api` | Replace NextAuth imports with `@lowdefy/auth-betterauth`. Update `createApiContext` for new session shape. |
| `packages/servers/server` | Replace `[...nextauth].js` catch-all with BetterAuth route handler. Update `apiWrapper.js` to use new `getSession`. Update `getAuthOptions` → `getBetterAuthConfig`. |
| `packages/servers/server-dev` | Same changes as server, plus dev-mode auth debugging. |
| `packages/build` | Update `buildAuth` to validate new config schema. Add BetterAuth-specific validations. |
| `packages/cli` | Add `lowdefy login`, `lowdefy logout`, `lowdefy whoami` commands (Phase 2). |
| `packages/client` | Update auth context/hooks to use BetterAuth client SDK. |

### 4.3 Removed/Deprecated Packages

| Package | Action |
|---------|--------|
| `packages/api/src/routes/auth/getNextAuthConfig.js` | Remove — replaced by `createBetterAuthConfig.js` |
| `packages/api/src/routes/auth/createAdapter.js` | Remove — BetterAuth manages its own adapter |
| `packages/api/src/routes/auth/createProviders.js` | Remove — replaced by new `createProviders.js` |
| `packages/api/src/routes/auth/callbacks/` | Remove — replaced by `createHooks.js` |
| `packages/api/src/routes/auth/events/` | Remove — replaced by hooks |
| `packages/api/src/routes/auth/createLogger.js` | Remove — BetterAuth has built-in logging |

### 4.4 Dependencies

**Add:**
- `better-auth` — core library
- `@better-auth/mongodb` — MongoDB adapter (or use built-in if available)

**Remove (eventually, after migration):**
- `next-auth`
- `@next-auth/mongodb-adapter` (or equivalent)

**Keep:**
- `mongodb` — still needed for the adapter

---

## 5. Server Integration

### 5.1 BetterAuth Instance Creation

BetterAuth is created once at server startup (same as the current `getNextAuthConfig` singleton pattern).

```javascript
// packages/auth-betterauth/src/createBetterAuthInstance.js

import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { MongoClient } from 'mongodb';

let authInstance = null;

function createBetterAuthInstance({ authConfig, plugins: lowdefyPlugins, secrets }) {
  if (authInstance) return authInstance;

  const client = new MongoClient(authConfig.database.uri);
  const db = client.db();

  authInstance = betterAuth({
    database: mongodbAdapter(db, { client }),
    experimental: {
      joins: true,  // 2-3x faster session/org lookups
    },
    emailAndPassword: authConfig.emailAndPassword ?? { enabled: false },
    socialProviders: createSocialProviders({ authConfig, secrets }),
    plugins: createPlugins({ authConfig, lowdefyPlugins }),
    session: {
      cookieCache: {
        enabled: true,
        maxAge: authConfig.session?.maxAge ?? 2592000,
      },
    },
    advanced: {
      crossSubDomainCookies: authConfig.advanced?.crossSubDomainCookies,
      defaultCookieAttributes: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
      },
    },
    trustedOrigins: authConfig.advanced?.trustedOrigins ?? [],
    rateLimit: authConfig.advanced?.rateLimit ?? { enabled: true },
  });

  return authInstance;
}

export default createBetterAuthInstance;
```

### 5.2 Route Handler

BetterAuth uses a single catch-all handler. This replaces the NextAuth `[...nextauth].js` page.

```javascript
// packages/servers/server/pages/api/auth/[...all].js

import { toNextJsHandler } from 'better-auth/next-js';
import { getAuthInstance } from '../../../lib/server/auth/getAuthInstance.js';

const authInstance = getAuthInstance();
export default toNextJsHandler(authInstance);

// Or if using the newer export pattern:
// export const { GET, POST } = toNextJsHandler(authInstance);
```

### 5.3 Session Resolution

Replace `getServerSession` with BetterAuth's session API.

```javascript
// packages/auth-betterauth/src/getSession.js

function getSession({ authInstance, req, res }) {
  // BetterAuth provides session via its API
  // The exact API depends on whether we use the Next.js helper or the generic one
  return authInstance.api.getSession({ headers: req.headers });
}

export default getSession;
```

### 5.4 Updated `apiWrapper.js`

```javascript
// Changes to packages/servers/server/lib/server/apiWrapper.js

// Before:
// import getServerSession from './auth/getServerSession.js';
// import getAuthOptions from './auth/getAuthOptions.js';

// After:
import { getSession, getAuthInstance } from '@lowdefy/auth-betterauth';

function apiWrapper(handler) {
  return async function wrappedHandler(req, res) {
    const context = { /* ... same as today ... */ };
    try {
      context.logger = createLogger({ rid: context.rid });
      context.authInstance = getAuthInstance(context);
      if (!req.url.startsWith('/api/auth')) {
        const sessionResult = await getSession({
          authInstance: context.authInstance,
          req,
        });
        context.session = sessionResult
          ? { user: mapUserToLowdefy(sessionResult.user, sessionResult.session) }
          : null;
        setSentryUser({
          user: context.session?.user,
          sentryConfig: loggerConfig.sentry,
        });
      }
      createApiContext(context);
      logRequest({ context });
      const response = await handler({ context, req, res });
      return response;
    } catch (error) {
      await logError({ error, context });
      res.status(500).json({ name: error.name, message: error.message });
    }
  };
}
```

### 5.5 User Object Shape

BetterAuth and NextAuth return different user shapes. We need a mapping layer to keep `context.user` (and the `_user` operator) consistent.

```javascript
// packages/auth-betterauth/src/mapUserToLowdefy.js

function mapUserToLowdefy(betterAuthUser, session) {
  return {
    // Standard fields (backward compatible with NextAuth shape)
    id: betterAuthUser.id,
    sub: betterAuthUser.id,
    name: betterAuthUser.name,
    email: betterAuthUser.email,
    image: betterAuthUser.image,
    emailVerified: betterAuthUser.emailVerified,

    // Roles (from organization membership or config-based rules)
    roles: session?.roles ?? [],

    // Provider info
    provider: session?.activeProvider,

    // Pass-through for any custom fields plugins add
    ...betterAuthUser.additionalFields,
  };
}

export default mapUserToLowdefy;
```

---

## 6. Build System Changes

### 6.1 Auth Config Validation

Update `packages/build/src/build/buildAuth/` to validate the new BetterAuth config schema.

**New validations:**
- Provider `type` must be a known BetterAuth social provider or `emailPassword`
- `database.uri` is required (or defaults to app's MongoDB)
- `session.strategy` must be `cookie` or `jwt`
- Role match rules have valid structure
- Plugin configs are valid (organization, jwt, deviceAuth, oauthProvider)

**Removed validations:**
- NextAuth-specific adapter plugin validation
- NextAuth callback type validation
- NextAuth provider plugin validation

### 6.2 Build Artifact Changes

The `auth.json` build artifact schema changes:

```javascript
// Before (NextAuth)
{
  configured: true,
  providers: [{ id: 'google', type: 'GoogleProvider', properties: { ... } }],
  adapter: { type: 'MongoDBAdapter', properties: { ... } },
  callbacks: [{ id: 'onSignIn', type: 'SignInCallback', ... }],
  events: [{ ... }],
  session: { strategy: 'jwt' },
  authPages: { signIn: '/auth/sign-in' },
  theme: { ... },
  debug: false,
}

// After (BetterAuth)
{
  configured: true,
  providers: [
    { id: 'google', type: 'google', properties: { clientId: '...', clientSecret: '...' } },
    { id: 'email', type: 'emailPassword', properties: { requireEmailVerification: true } },
  ],
  database: { uri: '...' },
  session: { strategy: 'cookie', maxAge: 2592000 },
  hooks: [{ id: 'onSignIn', type: 'SignInHook', ... }],
  pages: { signIn: '/auth/sign-in', signUp: '/auth/sign-up' },
  roles: [{ match: { email: '*@lowdefy.com' }, roles: ['admin'] }],
  plugins: {
    organization: { enabled: false },
    jwt: { enabled: false },
    deviceAuth: { enabled: false },
    oauthProvider: { enabled: false },
  },
  advanced: { trustedOrigins: [], rateLimit: { enabled: true } },
  debug: false,
}
```

### 6.3 Migration Path for `auth.configured`

The `auth.configured` flag is used by `getServerSession.js` to short-circuit when no auth is configured. This pattern stays the same — BetterAuth instance is only created when `configured: true`.

---

## 7. Client-Side Changes

### 7.1 Auth Client SDK

BetterAuth provides a client SDK (`better-auth/client`) that replaces `next-auth/react`.

```javascript
// Before (NextAuth):
import { signIn, signOut, useSession } from 'next-auth/react';

// After (BetterAuth):
import { createAuthClient } from 'better-auth/react';

const authClient = createAuthClient({
  baseURL: '/api/auth',  // Same path, different handler
});

export const { signIn, signOut, useSession } = authClient;
```

### 7.2 Client Package Updates

In `packages/client/`, update auth-related components:

| Component | Change |
|-----------|--------|
| `SessionProvider` | Replace NextAuth `SessionProvider` with BetterAuth context |
| Auth blocks (SignIn, SignUp, etc.) | Update to use BetterAuth client methods |
| `_user` operator | No change needed if `mapUserToLowdefy` preserves shape |
| Auth actions (Login, Logout, etc.) | Update to use BetterAuth client SDK |

### 7.3 Backward Compatibility

The `_user` operator reads from `context.user`. As long as `mapUserToLowdefy` produces the same shape, existing apps using `_user.email`, `_user.name`, `_user.roles` continue to work unchanged.

---

## 8. Plugin System Changes

### 8.1 Auth Plugin Types

Currently, Lowdefy has these auth plugin types:
- `auth/adapters` — database adapters (e.g., MongoDBAdapter)
- `auth/providers` — OAuth providers (e.g., GoogleProvider)
- `auth/callbacks` — lifecycle callbacks
- `auth/events` — event handlers

With BetterAuth, the plugin model simplifies:

| Old Plugin Type | New Plugin Type | Notes |
|-----------------|-----------------|-------|
| `auth/adapters` | **Removed** | BetterAuth manages its own adapter via `database` config |
| `auth/providers` | `auth/providers` | Simplified — maps to BetterAuth social providers |
| `auth/callbacks` | `auth/hooks` | Maps to BetterAuth's hook system |
| `auth/events` | `auth/hooks` | Merged with callbacks into hooks |
| (new) | `auth/plugins` | BetterAuth plugins (organization, jwt, etc.) |

### 8.2 Provider Plugin Migration

NextAuth providers are complex objects with authorization URLs, token endpoints, profile mappings, etc. BetterAuth social providers are simpler — just `clientId` and `clientSecret` for standard providers.

```javascript
// Before (NextAuth provider plugin):
import GoogleProvider from 'next-auth/providers/google';
export default {
  id: 'GoogleProvider',
  type: 'auth/provider',
  factory: ({ properties }) => GoogleProvider({
    clientId: properties.clientId,
    clientSecret: properties.clientSecret,
  }),
};

// After (BetterAuth — no plugin needed for standard providers):
// Standard providers (google, github, apple, discord, etc.) are built into BetterAuth.
// The config just passes clientId/clientSecret directly.
// Custom OAuth providers use BetterAuth's genericOAuth plugin.
```

### 8.3 Custom OAuth Providers

For providers not built into BetterAuth, use the `genericOAuth` plugin:

```yaml
auth:
  providers:
    - id: custom-provider
      type: genericOAuth
      properties:
        clientId:
          _secret: CUSTOM_CLIENT_ID
        clientSecret:
          _secret: CUSTOM_CLIENT_SECRET
        discoveryUrl: https://provider.example.com/.well-known/openid-configuration
        scopes:
          - openid
          - email
          - profile
```

---

## 9. Database Considerations

### 9.1 MongoDB Collections

BetterAuth auto-creates collections at runtime. No explicit migrations needed.

**Core collections:**
- `user` — user identity (email, name, image, emailVerified, createdAt, updatedAt)
- `session` — active sessions (userId, token, expiresAt, ipAddress, userAgent)
- `account` — linked OAuth accounts (userId, providerId, accountId, accessToken, refreshToken)
- `verification` — email verification tokens

**Plugin collections (added as plugins are enabled):**
- `organization` — organizations/teams
- `member` — user-organization membership with roles
- `invitation` — pending org invitations
- `oauth_client` — registered OAuth clients (OAuth Provider plugin)
- `oauth_consent` — user consent records
- `device_code` — pending device authorization codes (Device Auth plugin)

### 9.2 Required Indexes

Create at server startup (idempotent `createIndex` calls):

```javascript
async function ensureAuthIndexes(db) {
  await db.collection('user').createIndex({ email: 1 }, { unique: true });
  await db.collection('session').createIndex({ userId: 1 });
  await db.collection('session').createIndex({ token: 1 }, { unique: true });
  await db.collection('session').createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }  // TTL auto-cleanup
  );
  await db.collection('account').createIndex({ userId: 1 });
  await db.collection('account').createIndex(
    { providerId: 1, accountId: 1 },
    { unique: true }
  );
  await db.collection('verification').createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }  // TTL auto-cleanup
  );
}
```

### 9.3 Migration from NextAuth Collections

If existing Lowdefy apps use NextAuth with MongoDB, their collections need migration:

| NextAuth Collection | BetterAuth Collection | Migration |
|--------------------|-----------------------|-----------|
| `users` | `user` | Rename + field mapping (id format may differ) |
| `sessions` | `session` | Rename + field mapping |
| `accounts` | `account` | Rename + field mapping (provider fields differ) |
| `verification_tokens` | `verification` | Rename + field mapping |

A migration script should be provided as part of the upgrade guide. The build system should detect NextAuth collections and warn the developer to run migration.

---

## 10. CLI Authentication (Phase 2)

### 10.1 Device Code Flow

The CLI uses OAuth 2.0 Device Authorization Grant (RFC 8628) via BetterAuth's Device Authorization plugin.

```
CLI                          Auth Server                    Browser
 │                               │                            │
 │  POST /api/auth/device/code   │                            │
 │  ─────────────────────────►   │                            │
 │  { device_code, user_code,    │                            │
 │    verification_uri }         │                            │
 │  ◄─────────────────────────   │                            │
 │                               │                            │
 │  Display: "Go to URL,         │                            │
 │   enter code ABCD-1234"       │                            │
 │                               │                            │
 │                               │   GET /device?code=ABCD    │
 │                               │  ◄─────────────────────────│
 │                               │   Login + approve          │
 │                               │  ─────────────────────────►│
 │                               │                            │
 │  POST /api/auth/device/token  │                            │
 │  (polling every 5s)           │                            │
 │  ─────────────────────────►   │                            │
 │  { access_token,              │                            │
 │    refresh_token }            │                            │
 │  ◄─────────────────────────   │                            │
 │                               │                            │
 │  Store in                     │                            │
 │  ~/.lowdefy/credentials.json  │                            │
```

### 10.2 CLI Commands

```
lowdefy login     # Initiates device code flow
lowdefy logout    # Clears stored credentials
lowdefy whoami    # Shows current authenticated user
```

### 10.3 Credential Storage

```json
// ~/.lowdefy/credentials.json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresAt": "2026-03-21T00:00:00Z",
  "user": {
    "id": "abc123",
    "email": "dev@example.com",
    "name": "Developer"
  }
}
```

File permissions: `0600` (owner read/write only).

---

## 11. Managed Auth — OAuth Provider (Phase 3–4)

### 11.1 "Sign in with Lowdefy"

Using BetterAuth's OAuth 2.1 Provider plugin, the central Lowdefy auth server becomes an OAuth/OIDC provider. When a developer enables managed auth on their app:

1. An OAuth client is auto-registered for the app
2. The app gets pre-built sign-in/sign-up Lowdefy blocks
3. End-users authenticate against `auth.lowdefy.com`
4. The app receives tokens with user identity, roles, and scopes

### 11.2 OAuth Client Auto-Registration

```javascript
// When developer enables managed auth on their app:
const client = await authInstance.api.adminCreateOAuthClient({
  body: {
    client_name: appName,
    redirect_uris: [`https://${appDomain}/api/auth/callback/lowdefy`],
    skip_consent: true,        // Trusted first-party client
    enable_end_session: true,  // Allow logout
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    scope: 'openid profile email',
  },
});
// Store client_id and client_secret for the app
```

### 11.3 OIDC Discovery

The auth server exposes standard OIDC discovery:

```
GET https://auth.lowdefy.com/.well-known/openid-configuration
{
  "issuer": "https://auth.lowdefy.com",
  "authorization_endpoint": "https://auth.lowdefy.com/api/auth/authorize",
  "token_endpoint": "https://auth.lowdefy.com/api/auth/token",
  "userinfo_endpoint": "https://auth.lowdefy.com/api/auth/userinfo",
  "jwks_uri": "https://auth.lowdefy.com/api/auth/jwks",
  ...
}
```

### 11.4 Multi-Tenant User Isolation

Each managed app maps to a BetterAuth Organization. Users are scoped per organization via the `member` collection:

```javascript
// User signs up for "My Business App" → auto-joined to that app's org
await authInstance.api.addMember({
  organizationId: appOrgId,
  userId: newUser.id,
  role: 'viewer',  // Default role from app config
});
```

User queries are always scoped: `db.member.find({ organizationId: appOrgId })` — a user in App A cannot see users in App B.

---

## 12. Security Considerations

### 12.1 Session Security

| Property | Implementation |
|----------|---------------|
| Cookie flags | `httpOnly: true`, `secure: true` (prod), `sameSite: 'lax'` |
| Session token | Cryptographically random, stored in DB with TTL |
| CSRF protection | BetterAuth includes CSRF protection by default |
| Rate limiting | Built-in rate limiting plugin, configurable per endpoint |

### 12.2 API Key Strategy Integration

The existing API auth strategies plan (`api-auth-strategies`) defined API key and JWT strategies for endpoint auth. With BetterAuth, these strategies integrate cleanly:

- **API keys**: Same implementation as the strategies plan — `resolveAuthentication` checks headers before session. No BetterAuth involvement.
- **JWT verification**: Can use BetterAuth's JWT plugin for token signing/verification, or the standalone strategy from the strategies plan.
- **Session auth**: Replaces NextAuth session with BetterAuth session. `createAuthorize` stays the same.

The strategies plan's `resolveAuthentication` → `createApiContext` → `createAuthorize` flow remains unchanged. Only the session resolution changes.

### 12.3 Referential Integrity

MongoDB doesn't enforce foreign keys. Mitigations:

1. **TTL indexes** on `session` and `verification` — auto-cleanup of expired records
2. **BetterAuth cascading deletes** — when a user is deleted, BetterAuth removes related sessions/accounts
3. **Nightly orphan cleanup** — cron job removes orphaned records (sessions, accounts, members referencing deleted users)

```javascript
// Orphan cleanup job
async function cleanupOrphans(db) {
  const validUserIds = await db.collection('user').distinct('_id');
  await db.collection('session').deleteMany({ userId: { $nin: validUserIds } });
  await db.collection('account').deleteMany({ userId: { $nin: validUserIds } });
  await db.collection('member').deleteMany({ userId: { $nin: validUserIds } });
}
```

---

## 13. Migration Strategy

### 13.1 Phased Migration Approach

**Phase 1** introduces BetterAuth alongside NextAuth — both can be configured. The build system detects which auth library is configured and loads the appropriate handler.

```yaml
# Phase 1: NextAuth (still works)
auth:
  providers:
    - id: google
      type: GoogleProvider          # NextAuth provider type
      properties: { ... }
  adapter:
    type: MongoDBAdapter            # NextAuth adapter

# Phase 1: BetterAuth (new)
auth:
  providers:
    - id: google
      type: google                  # BetterAuth provider type (lowercase)
      properties: { ... }
  database:                         # BetterAuth uses database, not adapter
    uri: mongodb://...
```

The build system detects `auth.adapter` (NextAuth) vs `auth.database` (BetterAuth) and sets `auth.engine: 'nextauth' | 'betterauth'` in the build artifact.

**Phase 2**: NextAuth is deprecated. Build warns when NextAuth config is detected.

**Phase 3**: NextAuth support removed. Only BetterAuth config accepted.

### 13.2 Breaking Changes

| Change | Impact | Mitigation |
|--------|--------|------------|
| Provider type names change | `GoogleProvider` → `google` | Build-time mapping for Phase 1 |
| Adapter config removed | `auth.adapter` no longer used | `auth.database.uri` replaces it |
| Callback types change | NextAuth callbacks → BetterAuth hooks | New plugin types, deprecation warnings |
| Session shape may differ | `session.user` fields | `mapUserToLowdefy` ensures consistency |
| Auth API routes | `/api/auth/[...nextauth]` → `/api/auth/[...all]` | Same base path, different handler |
| MongoDB collection names | `users` → `user`, `sessions` → `session` | Migration script provided |

### 13.3 Version Strategy

- **Lowdefy v4.x**: NextAuth only (current)
- **Lowdefy v5.0**: BetterAuth default, NextAuth deprecated but supported
- **Lowdefy v6.0**: BetterAuth only, NextAuth removed

---

## 14. Implementation Phases

### Phase 1: Foundation — BetterAuth Core (2–3 weeks)

**Goal**: Replace NextAuth with BetterAuth for self-hosted apps. Zero functional regression.

1. Create `@lowdefy/auth-betterauth` package
2. Implement `createBetterAuthConfig.js` — maps YAML config to BetterAuth config
3. Implement `createBetterAuthInstance.js` — singleton BetterAuth instance
4. Implement `createMongoDBAdapter.js` — MongoDB adapter with index creation
5. Implement `createProviders.js` — social provider mapping
6. Implement `createHooks.js` — callback/event mapping
7. Implement `getSession.js` — session resolution
8. Implement `handleAuthRequest.js` — route handler
9. Implement `mapUserToLowdefy.js` — user object mapping
10. Update `packages/servers/server` — replace NextAuth route handler, update `apiWrapper.js`
11. Update `packages/servers/server-dev` — same changes
12. Update `packages/build/src/build/buildAuth/` — new config schema validation
13. Update `packages/client` — replace `next-auth/react` with BetterAuth client
14. Write migration guide for existing apps
15. Write tests for all new modules

**Files created:**
- `packages/auth-betterauth/` (entire package)

**Files modified:**
- `packages/servers/server/pages/api/auth/[...nextauth].js` → `[...all].js`
- `packages/servers/server/lib/server/apiWrapper.js`
- `packages/servers/server/lib/server/auth/getServerSession.js`
- `packages/servers/server/lib/server/auth/getAuthOptions.js`
- `packages/api/src/context/createApiContext.js`
- `packages/build/src/build/buildAuth/buildAuth.js`
- `packages/build/src/build/buildAuth/buildAuthSchema.js` (new schema)
- `packages/client/src/auth/` (auth context/hooks)
- `package.json` files (dependency changes)

**Files removed:**
- `packages/api/src/routes/auth/getNextAuthConfig.js`
- `packages/api/src/routes/auth/createAdapter.js`
- `packages/api/src/routes/auth/createProviders.js`
- `packages/api/src/routes/auth/callbacks/` (directory)
- `packages/api/src/routes/auth/events/` (directory)

### Phase 2: CLI Authentication (1 week)

**Goal**: `lowdefy login/logout/whoami` using device code flow.

1. Add Device Authorization plugin to BetterAuth config
2. Build `/device` verification page (Lowdefy portal or standalone)
3. Implement `lowdefy login` — device code request, polling, credential storage
4. Implement `lowdefy logout` — clear stored credentials
5. Implement `lowdefy whoami` — display current user
6. Secure credential storage (`~/.lowdefy/credentials.json`, mode `0600`)
7. Token refresh logic for expired access tokens

**Files created:**
- `packages/cli/src/commands/login.js`
- `packages/cli/src/commands/logout.js`
- `packages/cli/src/commands/whoami.js`
- `packages/cli/src/auth/deviceCodeFlow.js`
- `packages/cli/src/auth/credentialStore.js`
- `packages/cli/src/auth/tokenRefresh.js`

**Files modified:**
- `packages/cli/src/index.js` (register new commands)
- `packages/auth-betterauth/src/createPlugins.js` (add device auth plugin)

### Phase 3: OAuth Provider — Managed Auth Foundation (2–3 weeks)

**Goal**: Lowdefy auth server becomes an OAuth/OIDC provider.

1. Add OAuth 2.1 Provider plugin to BetterAuth config
2. Add JWT plugin for token signing
3. Set up JWKS endpoint and OIDC discovery
4. Build consent page (skippable for first-party apps)
5. Implement OAuth client auto-registration when developer enables app auth
6. Build the `auth.plan: managed` config path in the build system
7. Build pre-built auth blocks (SignIn, SignUp, ForgotPassword)

**Files created:**
- `packages/auth-betterauth/src/plugins/oauthProviderPlugin.js`
- `packages/plugins/blocks/blocks-auth/` (auth UI blocks)
- Portal pages for consent flow

**Files modified:**
- `packages/auth-betterauth/src/createPlugins.js`
- `packages/build/src/build/buildAuth/` (managed mode validation)

### Phase 4: Managed Auth Product (2–3 weeks)

**Goal**: "$20/month for 1,000 users" managed auth product.

1. Multi-tenant user isolation via Organization plugin
2. User management dashboard (list, invite, disable, role management)
3. Usage metering (MAU counting per app/organization)
4. Billing integration (Stripe)
5. "Enable Auth" flow in Lowdefy portal
6. Nightly orphan cleanup job
7. Documentation and onboarding

### Phase 5: Enterprise Features (Ongoing)

1. Enterprise SSO via `@better-auth/sso` (SAML + OIDC)
2. MFA via BetterAuth's two-factor plugin
3. Audit logging
4. SCIM provisioning
5. Custom branding for login pages
6. MCP agent authentication via OAuth 2.1

---

## 15. Testing Strategy

### 15.1 Unit Tests

Each module in `@lowdefy/auth-betterauth` gets unit tests:

- `createBetterAuthConfig.test.js` — config mapping correctness
- `createProviders.test.js` — provider config → BetterAuth format
- `createHooks.test.js` — callback/event mapping
- `mapUserToLowdefy.test.js` — user shape mapping
- `getSession.test.js` — session resolution

### 15.2 Integration Tests

- Full auth flow: sign up → sign in → session → sign out
- Social OAuth flow with mocked providers
- Role-based authorization with BetterAuth sessions
- API key + BetterAuth session coexistence
- Device code flow (CLI auth)

### 15.3 Migration Tests

- NextAuth → BetterAuth config migration
- MongoDB collection migration
- User session continuity after migration
- Backward compatibility of `_user` operator

---

## 16. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| BetterAuth API changes (pre-1.0?) | Medium | High | Pin exact version, review changelogs before upgrading |
| NextAuth → BetterAuth user session loss | High | Medium | Migration script, clear upgrade docs, session TTL means natural rollover |
| Custom callback/event plugins break | Medium | Medium | Provide mapping layer, deprecation period |
| MongoDB adapter performance at scale | Low | Medium | Experimental joins enabled, proper indexes, TTL cleanup |
| Device code flow security (CLI) | Low | High | Short code expiry, rate limiting, HTTPS only |
| BetterAuth incompatibility with Next.js Pages Router | Low | High | Test early in Phase 1; BetterAuth supports Pages Router via `toNextJsHandler` |

---

## 17. Open Questions

1. **Auth package location**: New standalone package (`packages/auth-betterauth/`) or replace code in `packages/api/src/routes/auth/`? Recommendation: standalone package for cleaner separation and potential reuse.

2. **Plugin system for auth hooks**: Should Lowdefy's plugin system wrap BetterAuth hooks, or should developers write BetterAuth hooks directly in their Lowdefy config? The current system wraps NextAuth callbacks — should we continue that pattern?

3. **Managed mode database isolation**: Should managed auth apps share a single MongoDB database (with organization-scoped queries) or get separate databases? Single DB is simpler; separate DBs are more isolated.

4. **NextAuth deprecation timeline**: How long do we support both? One major version (v5 supports both, v6 drops NextAuth) or immediate cutover?

5. **BetterAuth version pinning**: BetterAuth is evolving rapidly. Should we vendor the dependency or pin to a specific version with controlled upgrades?

6. **Existing `@lowdefy/plugin-next-auth`**: This community/first-party plugin provides NextAuth integration. Does it get replaced by `@lowdefy/auth-betterauth`, or do we maintain both during the transition?
