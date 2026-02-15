# API Auth Strategies - Design Plan

## 1. Problem Statement

Lowdefy API endpoints (defined under `api:` in lowdefy.yaml) currently only support one authentication mechanism: NextAuth sessions (cookie-based browser auth). This means:

- External services cannot call Lowdefy endpoints (no cookies)
- Machine-to-machine communication is not possible
- Webhook receivers must be fully public (no verification)
- Partner integrations require workarounds
- There is no way to issue API keys for programmatic access

**Goal**: Make it possible to use Lowdefy API endpoints as **public** or **authenticated** endpoints with multiple auth strategies, while maintaining **secure by default** behavior.

---

## 2. Current Architecture

### 2.1 How Auth Works Today

**Build time** (`packages/build/src/build/buildAuth/`):

1. `validateAuthConfig` validates the `auth:` config and initializes defaults
2. `buildApiAuth` iterates over all endpoints and computes `endpoint.auth` from **global** config:
   - Reads `auth.api.protected`, `auth.api.public`, `auth.api.roles`
   - Sets `endpoint.auth = { public: true }` or `{ public: false, roles?: [...] }`
   - Auth metadata is baked into the build artifacts (`build/api/{endpointId}.json`)
3. `buildPageAuth` does the exact same thing for pages using `auth.pages`

**Crucially: endpoints NEVER have inline `auth` config in YAML.** The `auth` field on
endpoints is always computed at build time from the global `auth.api` config. This is the
same pattern as pages — all auth config lives centrally under `auth:`.

**The `auth.api` and `auth.pages` schemas are identical:**

```yaml
auth:
  pages:                        # Pages auth config
    protected: true             #   or: [page-a, page-b] or omit
    public:                     #   or: [page-x, page-y] or true
      - login-page
    roles:                      #   role → [pageId, pageId]
      admin:
        - admin-dashboard

  api:                          # API auth config — SAME shape
    protected: true             #   or: [ep-a, ep-b] or omit
    public:                     #   or: [ep-x, ep-y] or true
      - health-check
    roles:                      #   role → [endpointId, endpointId]
      admin:
        - admin-api
```

**Runtime** (`packages/api/`, `packages/servers/server/`):

1. `apiWrapper` (server middleware):
   - Creates request context with `rid`, `config`, `connections`, `operators`, `secrets`
   - Calls `getServerSession()` → NextAuth's `getServerSession(req, res, authOptions)`
   - If auth is configured and session exists → `context.session = { user: {...} }`
   - Calls `createApiContext()` → sets `context.user = session?.user`, `context.authorize`
2. `createAuthorize({ session })` creates a closure:
   - `authenticated = !!session`
   - `roles = session?.user?.roles ?? []`
   - Returns `authorize(config)` function that checks `config.auth.public` and `config.auth.roles`
3. `callEndpoint` → `authorizeApiEndpoint` → calls `authorize(endpointConfig)`
4. On failure: throws "does not exist" error (hides 403 as 404 to prevent info leaks)

### 2.2 Key Files

| File | Role |
|------|------|
| `packages/build/src/build/buildAuth/buildApiAuth.js` | Computes `endpoint.auth` from global config |
| `packages/build/src/build/buildAuth/getProtectedApi.js` | Resolves which endpoints are protected |
| `packages/build/src/build/buildAuth/getApiRoles.js` | Inverts role→endpoints map to endpoint→roles |
| `packages/build/src/build/buildAuth/validateAuthConfig.js` | Validates auth config structure |
| `packages/build/src/build/buildAuth/validateMutualExclusivity.js` | Validates protected/public aren't both set |
| `packages/build/src/lowdefySchema.js` | AJV schema — `auth.api` and `auth.pages` are identical shapes |
| `packages/api/src/context/createAuthorize.js` | Core authorization: checks `public` + `roles` |
| `packages/api/src/context/createApiContext.js` | Sets `context.user` from session |
| `packages/api/src/routes/endpoints/callEndpoint.js` | Endpoint handler entry point |
| `packages/api/src/routes/endpoints/authorizeApiEndpoint.js` | Calls authorize, throws "not found" on failure |
| `packages/servers/server/lib/server/apiWrapper.js` | Server middleware — session resolution |
| `packages/servers/server/lib/server/auth/getServerSession.js` | NextAuth session lookup |
| `packages/servers/server/pages/api/endpoints/[endpointId].js` | Next.js API route |
| `packages/api/src/routes/auth/getNextAuthConfig.js` | NextAuth config + `_secret` resolution |

### 2.3 Current Limitations

1. **Single auth mechanism**: Only NextAuth session cookies
2. **No API key support**: No way to authenticate via headers
3. **No JWT verification**: Can't validate tokens from external identity providers
4. **POST only**: Endpoint handler rejects non-POST requests
5. **Internal body format**: Expects `{ blockId, payload, pageId }` — external callers don't know about blocks

---

## 3. Design Goals & Principles

### 3.1 Core Design Principle: Auth Config Lives in One Place

**All auth configuration stays under `auth:` — nothing on endpoints themselves.**

This is the existing pattern for both pages and API endpoints. The `auth.pages` and
`auth.api` objects control access via `protected`, `public`, and `roles`. Endpoints
never define their own auth. We preserve this.

Strategies are a new way to **get roles** — alongside NextAuth sessions. Roles are
the universal access control mechanism. How you get those roles (session, API key, JWT)
is separate from whether you have them.

### 3.2 Design Goals

1. **Secure by default**: If auth is configured, endpoints are protected unless explicitly made public
2. **Config-driven**: Auth strategies defined in YAML under `auth:`, consistent with Lowdefy patterns
3. **Backwards compatible**: Existing apps work without any changes
4. **Multiple strategies**: Support session, API keys, JWT, and public access
5. **Role-based scoping**: Strategies grant roles, roles control endpoint access — same pattern as pages
6. **No per-endpoint auth config**: All auth lives under `auth:` — endpoints are scoped via roles
7. **Simple to use**: Common cases require minimal config
8. **Extensible**: Architecture supports adding new strategies later

---

## 4. Proposed Config Design

### 4.1 Overview: Strategies Grant Roles, Roles Scope Endpoints

```
┌──────────────────────────┐     ┌──────────────────────────┐
│  HOW do you authenticate │     │  WHAT can you access      │
│  (auth.strategies)       │     │  (auth.api.roles)         │
│                          │     │                           │
│  session → user.roles    │ ──→ │  admin: [admin-api]       │
│  apiKey  → strategy roles│ ──→ │  partner: [webhook, data] │
│  jwt     → claim roles   │ ──→ │  service: [sync, batch]   │
└──────────────────────────┘     └──────────────────────────┘
```

Strategies define **how** to authenticate and **what roles** they grant.
`auth.api.roles` defines **which endpoints** each role can access.
This is the same pattern as pages — the only new piece is `auth.strategies`.

### 4.2 Full Config Example

```yaml
auth:
  # Existing NextAuth config (unchanged)
  providers:
    - id: google
      type: GoogleProvider
      properties:
        clientId:
          _secret: GOOGLE_CLIENT_ID
        clientSecret:
          _secret: GOOGLE_CLIENT_SECRET

  # NEW: Authentication strategies for API access
  # Strategies define how to authenticate and what roles they grant.
  strategies:
    - id: partner-key
      type: apiKey
      properties:
        keys:
          - _secret: PARTNER_KEY_ACME
          - _secret: PARTNER_KEY_GLOBEX
      roles:
        - partner

    - id: internal-key
      type: apiKey
      properties:
        keys:
          - _secret: INTERNAL_SERVICE_KEY
      roles:
        - internal-service

    - id: admin-key
      type: apiKey
      properties:
        keys:
          - _secret: ADMIN_API_KEY
      roles:
        - admin
        - internal-service

    - id: external-jwt
      type: jwt
      properties:
        secret:
          _secret: JWT_SIGNING_SECRET
        issuer: https://auth.example.com
        audience: my-lowdefy-api
        algorithms:
          - HS256
        # Map JWT claims to user fields
        userFields:
          sub: sub
          email: email
          roles: roles       # Roles from JWT claims
      roles:
        - api-user           # Additional static roles granted to ALL JWT users

  # Existing page auth (unchanged)
  pages:
    protected: true
    roles:
      admin:
        - admin-dashboard
        - admin-settings

  # Existing API auth — SAME schema, strategies just feed into roles
  api:
    protected: true           # All endpoints require auth by default
    public:
      - health-check          # Explicitly public
    roles:
      partner:                # partner-key strategy grants this role
        - partner-webhook
        - partner-data-export
      internal-service:       # internal-key and admin-key grant this role
        - sync-endpoint
        - batch-process
      admin:                  # admin-key grants this role (session users can too)
        - admin-api
        - sync-endpoint
      api-user:               # external-jwt grants this role
        - user-data-export
```

### 4.3 How Config Maps to Access

| Endpoint | Who can access | Why |
|----------|---------------|-----|
| `health-check` | Anyone | Listed in `auth.api.public` |
| `partner-webhook` | `partner-key` holders | Strategy grants `partner` role → endpoint scoped to `partner` |
| `partner-data-export` | `partner-key` holders | Same |
| `sync-endpoint` | `internal-key` OR `admin-key` holders, OR session users with `admin`/`internal-service` role | Both `internal-service` and `admin` roles map to this endpoint |
| `batch-process` | `internal-key` OR `admin-key` holders | `internal-service` role |
| `admin-api` | `admin-key` holders OR session users with `admin` role | `admin` role |
| `user-data-export` | Any valid JWT bearer | `external-jwt` grants `api-user` role |
| (any unlisted endpoint) | Any authenticated user (session OR any strategy) | `auth.api.protected: true` — auth required, but no specific role |

### 4.4 Config Schema: `auth.api` is Unchanged

The `auth.api` schema (`protected`, `public`, `roles`) does not change at all.
Strategies are a sibling of `api` and `pages` under `auth:`, not nested inside them.

```
auth:
  providers: [...]        # Existing — NextAuth providers
  strategies: [...]       # NEW — API auth strategies
  pages:                  # Existing — page access control
    protected/public/roles
  api:                    # Existing — endpoint access control (UNCHANGED)
    protected/public/roles
```

### 4.5 Multiple Keys/Secrets Per Role

The user can list multiple API keys and/or JWT secrets under different strategies
that grant the same role:

```yaml
auth:
  strategies:
    # Multiple keys, one role
    - id: partner-keys
      type: apiKey
      properties:
        keys:
          - _secret: PARTNER_KEY_ACME       # Acme Corp's key
          - _secret: PARTNER_KEY_GLOBEX     # Globex Corp's key
          - _secret: PARTNER_KEY_INITECH    # Initech's key
      roles:
        - partner

    # Different strategy type, same role
    - id: partner-jwt
      type: jwt
      properties:
        secret:
          _secret: PARTNER_JWT_SECRET
      roles:
        - partner

  api:
    roles:
      partner:
        - partner-webhook
        - partner-data-export
```

Now partners can authenticate with EITHER an API key OR a JWT — both grant the
`partner` role which gives access to the same endpoints.

To give different keys different access levels, use separate strategies with
different roles:

```yaml
auth:
  strategies:
    - id: partner-read-key
      type: apiKey
      properties:
        keys:
          - _secret: PARTNER_READ_KEY
      roles:
        - partner-read

    - id: partner-write-key
      type: apiKey
      properties:
        keys:
          - _secret: PARTNER_WRITE_KEY
      roles:
        - partner-read
        - partner-write

  api:
    roles:
      partner-read:
        - partner-data-export
      partner-write:
        - partner-data-import
        - partner-data-export
```

### 4.6 Why Roles Are the Only Scoping Mechanism

**Option A: Roles only (this design)**
```yaml
auth:
  strategies:
    - id: my-key
      type: apiKey
      properties:
        keys: [{_secret: KEY}]
      roles: [partner]
  api:
    roles:
      partner: [webhook, export]
```

**Option B: Per-endpoint strategy lists (v1 design, rejected)**
```yaml
api:
  - id: webhook
    auth:
      strategies: [my-key]      # Auth config on endpoint — breaks pattern
```

| Criteria | Roles only (A) | Per-endpoint strategies (B) |
|----------|---------------|---------------------------|
| Auth config in one place | All under `auth:` | Split between `auth:` and `api:` |
| Consistent with pages | Identical pattern | Pages don't have this |
| Schema changes to `api:` | None | New `auth` field on endpoints |
| `buildApiAuth` changes | Minimal | Significant — must handle inline auth |
| Mental model | Same as today, just new auth methods | New concept to learn |
| Flexibility | Full — different roles = different access | Full — but more complex config |
| DRY | Roles reused across session + strategies | Strategy lists repeated per endpoint |

**Decision**: Roles only (Option A). All auth config under `auth:`. Same mental model
as pages. No schema changes to endpoints. Strategies are just a new way to obtain roles.

---

## 5. Authentication Strategies (Detailed)

### 5.1 Strategy: `session` (Built-in, Always Available)

The existing NextAuth session. Not defined in `strategies` — it's implicit. When
`auth.providers` are configured and a user logs in via the browser, their session
provides `user.roles` which are checked against `auth.api.roles` and `auth.pages.roles`.

**No changes needed.** Session auth continues to work exactly as before.

The only change is conceptual: when strategies are defined, "authenticated" means
"has a session OR matched a strategy". For `auth.api.protected: true` (no specific roles),
any valid authentication method grants access. This is backwards compatible because without
strategies, session is still the only auth method.

### 5.2 Strategy: `apiKey`

Validates a pre-shared key from request headers and grants configured roles.

**Config:**
```yaml
auth:
  strategies:
    - id: my-api-key
      type: apiKey
      properties:
        # Where to read the key from (optional)
        headerName: X-API-Key     # Default: checks both X-API-Key and Authorization: Bearer
        # List of valid keys — multiple keys for rotation or multi-tenant
        keys:
          - _secret: API_KEY_1
          - _secret: API_KEY_2
      # Roles granted when authenticated with this strategy
      roles:
        - api-user
        - partner
```

**How it works:**
1. Read key from `X-API-Key` header or `Authorization: Bearer <key>` header
2. Compare against each key in `keys[]` using constant-time comparison
3. If match → authenticated, user gets roles from strategy's `roles` array
4. If no match → strategy fails, try next strategy

**User identity for API key auth:**
```javascript
context.user = {
  sub: `apiKey:${strategyId}`,    // e.g., "apiKey:my-api-key"
  type: 'apiKey',
  strategyId: 'my-api-key',
  roles: ['api-user', 'partner'], // from strategy config
};
```

**Pros:**
- Simple to set up and use
- Works for server-to-server, webhooks, CLI tools
- Keys stored as env vars via `_secret` (secure)
- Low overhead (no crypto verification)
- Multiple keys per strategy for key rotation

**Cons:**
- Keys are shared secrets — must be transmitted securely (HTTPS only)
- No expiration (must rotate manually)
- No per-request identity (all keys share the same roles)
- Leaked key = access until rotated

**Security considerations:**
- Constant-time comparison via `crypto.timingSafeEqual` to prevent timing attacks
- Keys should be at least 32 characters (validated at server startup after `_secret`
  resolution — cannot validate at build time since keys are `_secret` references)
- HTTPS required (keys sent in plaintext headers)
- Rate limiting recommended (future enhancement)

### 5.3 Strategy: `jwt`

Validates a JSON Web Token from the Authorization header and extracts roles from claims.

**Config:**
```yaml
auth:
  strategies:
    # Option A: HMAC (shared secret)
    - id: hmac-jwt
      type: jwt
      properties:
        secret:
          _secret: JWT_SECRET
        algorithms:
          - HS256
        issuer: https://my-service.com       # Optional: validate iss claim
        audience: my-lowdefy-api             # Optional: validate aud claim
        # Map JWT claims to user fields
        userFields:
          sub: sub
          email: email
          roles: roles                        # Extract roles from JWT claims
          name: name
      roles:
        - api-user                            # Additional static roles (merged with claim roles)

    # Option B: RSA/EC (JWKS endpoint)
    - id: rsa-jwt
      type: jwt
      properties:
        jwksUri: https://auth.example.com/.well-known/jwks.json
        algorithms:
          - RS256
        issuer: https://auth.example.com
        audience: my-lowdefy-api
        userFields:
          sub: sub
          email: email
          roles: realm_access.roles           # Nested paths supported (e.g., Keycloak)
      roles: []                               # No static roles — all from JWT claims
```

**How it works:**
1. Read token from `Authorization: Bearer <token>` header
2. Decode header to determine algorithm
3. Verify signature:
   - HMAC: using `secret`
   - RSA/EC: using key from `jwksUri` (cached)
4. Validate standard claims: `exp`, `iat`, `nbf`, `iss`, `aud`
5. Extract user fields from payload using `userFields` mapping
6. Merge static `roles` from strategy config with `roles` from JWT claims
7. If valid → authenticated with merged identity

**Role resolution for JWT:**
```javascript
// Static roles from strategy config
const staticRoles = strategy.roles ?? [];
// Dynamic roles from JWT claims (via userFields mapping)
const claimRoles = get(jwtPayload, strategy.properties.userFields.roles) ?? [];
// Merge — user gets both
context.user = {
  sub: jwtPayload.sub,
  email: jwtPayload.email,
  type: 'jwt',
  strategyId: 'hmac-jwt',
  roles: [...new Set([...staticRoles, ...claimRoles])],
};
```

**User field mapping uses `get()` from `@lowdefy/helpers`** to support nested paths:
```yaml
userFields:
  sub: sub                       # payload.sub → user.sub
  email: email                   # payload.email → user.email
  roles: realm_access.roles      # payload.realm_access.roles → user.roles (Keycloak)
  name: preferred_username       # payload.preferred_username → user.name
```

**Pros:**
- Industry standard (RFC 7519)
- Self-contained — no database lookup needed
- Per-request claims (different users get different roles)
- Works with external identity providers (Auth0, Keycloak, Cognito, etc.)
- Asymmetric keys (JWKS) don't require sharing secrets
- Supports expiration and claims validation

**Cons:**
- More complex setup than API keys
- Token revocation requires additional infrastructure
- JWKS URI introduces external dependency (mitigated by caching)
- Clock skew can cause validation failures

**Security considerations:**
- Algorithm MUST be validated against `algorithms` config (prevent `alg: none` attacks)
- JWKS responses cached with TTL (default: 1 hour)
- Token expiration (`exp`) enforced
- `iss` and `aud` validation prevents token reuse across services
- Clock tolerance configurable (default: 30 seconds)

### 5.4 Public Access

No new concept needed. Public endpoints are already supported via `auth.api.public`:

```yaml
auth:
  api:
    protected: true
    public:
      - health-check
      - webhook-no-auth
```

Public endpoints skip all authentication — no session, no API key, no JWT needed.
`context.user` is `null`. This is unchanged from today.

---

## 6. Architecture Design

### 6.1 Separation of Authentication and Authorization

The current `createAuthorize` conflates authentication (is there a session?) with
authorization (does the user have the right roles?). The new design separates them:

```
┌─────────────────────────┐     ┌─────────────────────────┐
│     AUTHENTICATION      │     │     AUTHORIZATION       │
│                         │     │                         │
│  Resolve identity from  │     │  Check access based on  │
│  request. Set user +    │ ──→ │  identity. Same as      │
│  roles on context.      │     │  today: public? roles?  │
│                         │     │                         │
│  Session (existing)     │     │  createAuthorize()      │
│  API Key (new)          │     │  → authorize(config)    │
│  JWT (new)              │     │  (unchanged logic)      │
└─────────────────────────┘     └─────────────────────────┘
```

**Authentication** (new step): Resolves identity from the request.
- Try session first (existing behavior)
- If no session and strategies are configured, try each strategy
- First strategy that matches sets `context.user` with roles
- If nothing matches → `context.user = null` (unauthenticated)

**Authorization** (existing, unchanged): Checks access based on identity.
- `authorize(config)` checks `config.auth.public` and `config.auth.roles`
- Reads `context.user.roles` — doesn't care where roles came from
- Returns boolean

### 6.2 Runtime Flow

```
HTTP Request → /api/endpoints/[endpointId]
  │
  ▼
apiWrapper
  ├─ Creates context (existing)
  ├─ Resolves NextAuth session (existing)
  ├─ NEW: resolveAuthentication(context)
  │  ├─ If session exists → context.user = session.user (existing behavior)
  │  ├─ If no session AND strategies configured:
  │  │  ├─ For each strategy in context.authStrategies:
  │  │  │  ├─ apiKey → check headers against keys
  │  │  │  ├─ jwt → verify token, extract claims
  │  │  │  └─ If match → set context.user with strategy roles, break
  │  │  └─ No match → context.user = null (unauthenticated)
  │  └─ If no session AND no strategies → context.user = null
  ├─ createApiContext() (existing — but context.user already set)
  ├─ logRequest() (existing)
  │
  ▼
callEndpoint()
  ├─ getEndpointConfig() (existing)
  ├─ authorizeApiEndpoint() (existing — checks endpoint.auth vs context.user)
  │  └─ authorize(endpointConfig)
  │     ├─ auth.public === true → allowed
  │     ├─ auth.public === false, no roles → authenticated required
  │     └─ auth.public === false, roles → role match required
  ├─ runRoutine() (existing)
  └─ Return response
```

**Key insight**: `authorizeApiEndpoint`, `authorize`, `buildApiAuth` — none of these
change. The only new runtime step is `resolveAuthentication` which runs in `apiWrapper`
BEFORE `createApiContext`. It sets `context.user` which the existing authorize flow reads.

### 6.3 Build-Time Flow

```
lowdefy.yaml
  │
  ▼
buildAuth()
  ├─ validateAuthConfig() (extended: validate strategies)
  ├─ NEW: buildAuthStrategies()
  │  └─ Validate strategy configs, check duplicate IDs
  ├─ buildApiAuth() (UNCHANGED — reads auth.api.protected/public/roles)
  ├─ buildPageAuth() (UNCHANGED)
  └─ buildAuthPlugins() (UNCHANGED)
  │
  ▼
Build artifacts:
  ├─ auth.json (extended: includes strategies[])
  └─ api/{endpointId}.json (UNCHANGED — still has auth.public/roles from buildApiAuth)
```

`buildApiAuth` does NOT change — it still reads from `auth.api.protected/public/roles`
and writes `endpoint.auth = { public, roles }`. Strategies don't affect the endpoint
build output at all. They're stored in `auth.json` and resolved at server startup.

### 6.4 Strategy Resolution at Server Startup

Strategy configs contain `_secret` references resolved at server startup (not per-request).

**Important**: `getNextAuthConfig` already parses the ENTIRE `authJson` through
`ServerParser` (including strategies). Creating a second `ServerParser` to parse
strategies separately would duplicate the work. Instead, extract resolved strategies
from the already-parsed `authConfig` inside `getNextAuthConfig`:

```javascript
// In getNextAuthConfig.js — extract strategies from already-parsed config
function getNextAuthConfig({ authJson, logger, plugins, secrets }) {
  if (initialized) return nextAuthConfig;

  const operatorsParser = new ServerParser({
    operators: { _secret },
    payload: {},
    secrets,
    user: {},
  });

  // This already resolves ALL _secret operators in the entire authJson,
  // including strategies[].properties.keys and strategies[].properties.secret
  const { output: authConfig, errors: operatorErrors } = operatorsParser.parse({
    input: authJson,
    location: 'auth',
  });

  if (operatorErrors.length > 0) {
    throw operatorErrors[0];
  }

  // Existing NextAuth config creation (unchanged)
  nextAuthConfig.adapter = createAdapter({ authConfig, logger, plugins });
  nextAuthConfig.callbacks = createCallbacks({ authConfig, logger, plugins });
  nextAuthConfig.events = createEvents({ authConfig, logger, plugins });
  nextAuthConfig.logger = createLogger({ logger });
  nextAuthConfig.providers = createProviders({ authConfig, logger, plugins });
  nextAuthConfig.debug = authConfig.debug ?? logger?.isLevelEnabled('debug') === true;
  nextAuthConfig.pages = authConfig.authPages;
  nextAuthConfig.session = authConfig.session;
  nextAuthConfig.theme = authConfig.theme;
  nextAuthConfig.cookies = authConfig?.advanced?.cookies;
  nextAuthConfig.originalRedirectCallback = nextAuthConfig.callbacks.redirect;

  // NEW: Extract resolved strategies (secrets already resolved above)
  nextAuthConfig.strategies = authConfig.strategies ?? [];

  // Validate resolved key lengths (can only do this after _secret resolution)
  for (const strategy of nextAuthConfig.strategies) {
    if (strategy.type === 'apiKey') {
      for (const key of strategy.properties?.keys ?? []) {
        if (typeof key === 'string' && key.length < 32) {
          logger.warn({
            event: 'warn_api_key_short',
            strategyId: strategy.id,
            message: `API key for strategy "${strategy.id}" is shorter than 32 characters.`,
          });
        }
      }
    }
  }

  initialized = true;
  return nextAuthConfig;
}
```

**No separate `getAuthStrategies` function needed.** The `apiWrapper` reads strategies
from `getNextAuthConfig` (which is already called via `getAuthOptions`):

```javascript
// In apiWrapper.js
context.authOptions = getAuthOptions(context);
// Strategies are available from the already-initialized auth config:
context.authStrategies = context.authOptions.strategies ?? [];
```

This ensures:
- Secrets resolved once by a single `ServerParser` (no duplicate parsing)
- Consistent with existing `getNextAuthConfig` pattern
- Key length validation happens after `_secret` resolution (at startup, not build time)
- Cached after first call (existing `initialized` flag)

### 6.5 How `createAuthorize` Changes

The existing `createAuthorize` closes over `session` at creation time. It needs a
minimal change to read from `context.user` instead (which is now set by
`resolveAuthentication` before `createApiContext` runs):

```javascript
// CURRENT (closes over session at creation time):
function createAuthorize({ session }) {
  const authenticated = !!session;
  const roles = session?.user?.roles ?? [];
  function authorize(config) {
    const { auth } = config;
    if (auth.public === true) return true;
    if (auth.public === false) {
      if (auth.roles) {
        return authenticated && auth.roles.some((role) => roles.includes(role));
      }
      return authenticated;
    }
    throw new ConfigError({ ... });
  }
  return authorize;
}

// NEW (reads from context — user set by resolveAuthentication):
function createAuthorize(context) {
  function authorize(config) {
    const { auth } = config;
    if (auth.public === true) return true;
    if (auth.public === false) {
      const authenticated = !type.isNone(context.user);
      const roles = context.user?.roles ?? [];
      if (auth.roles) {
        return authenticated && auth.roles.some((role) => roles.includes(role));
      }
      return authenticated;
    }
    throw new ConfigError({ ... });
  }
  return authorize;
}
```

**Why this works**: `context.user` is set BEFORE `createApiContext` (which calls
`createAuthorize`) runs. For session auth, `context.user = session.user` (same as
before). For strategy auth, `context.user = { roles, sub, ... }` from the matched
strategy. The authorize function doesn't care where the user came from.

---

## 7. Implementation Plan

### Phase 1: Core Infrastructure

**7.1.1 Add `auth.strategies` schema to `lowdefySchema.js`**

Add a new `strategies` property to `authConfig`:

```javascript
strategies: {
  type: 'array',
  items: {
    type: 'object',
    required: ['id', 'type'],
    additionalProperties: false,
    properties: {
      id: {
        type: 'string',
        errorMessage: { type: 'Auth strategy "id" should be a string.' },
      },
      type: {
        type: 'string',
        enum: ['apiKey', 'jwt'],
        errorMessage: { type: 'Auth strategy "type" should be "apiKey" or "jwt".' },
      },
      properties: {
        type: 'object',
      },
      roles: {
        type: 'array',
        items: { type: 'string' },
        errorMessage: { type: 'Auth strategy "roles" should be an array of strings.' },
      },
    },
  },
},
```

**No changes to `auth.api` or `auth.pages` schemas.**

**7.1.2 Add `buildAuthStrategies.js`**

New file: `packages/build/src/build/buildAuth/buildAuthStrategies.js`

Validates strategy configs at build time:
- Each strategy has unique `id`
- `id` is not the reserved word `session`
- `type` is one of `apiKey`, `jwt`
- `apiKey` strategies have a `properties.keys` array
- `jwt` strategies have `properties.secret` or `properties.jwksUri` (not both)
- `roles` is present and is an array of strings

**7.1.3 Modify `buildAuth.js` to include strategy building**

```javascript
function buildAuth({ components, context }) {
  const configured = !type.isNone(components.auth);
  validateAuthConfig({ components, context });
  components.auth.configured = configured;
  buildAuthStrategies({ components, context }); // NEW
  buildApiAuth({ components, context });        // UNCHANGED
  buildPageAuth({ components, context });       // UNCHANGED
  buildAuthPlugins({ components, context });    // UNCHANGED
  return components;
}
```

**7.1.4 Include strategies in `auth.json` build output**

The strategy configs (with `_secret` references intact — secrets are NOT resolved at
build time) are serialized into `auth.json` alongside existing auth config.

### Phase 2: Authentication Resolution

**7.2.1 Create `resolveAuthentication.js`**

New file: `packages/api/src/context/resolveAuthentication.js`

```javascript
function resolveAuthentication(context) {
  // Session takes priority — if user has a browser session, use it
  if (context.session) {
    context.user = context.session.user;
    return;
  }

  // Try each configured strategy
  const strategies = context.authStrategies ?? [];
  for (const strategy of strategies) {
    const result = resolveStrategy(context, strategy);
    if (result.authenticated) {
      context.user = result.user;
      context.authStrategy = strategy.id;
      return;
    }
  }

  // No auth — user is null (authorize will reject if endpoint is protected)
  context.user = null;
}
```

**7.2.2 Create strategy resolvers**

New files:
- `packages/api/src/context/strategies/resolveApiKeyStrategy.js`
- `packages/api/src/context/strategies/resolveJwtStrategy.js`

```javascript
// resolveApiKeyStrategy.js
import crypto from 'crypto';

function resolveApiKeyStrategy(context, strategy) {
  const { headers } = context;
  const { properties, roles } = strategy;

  // Extract key from headers
  const headerName = properties.headerName ?? 'X-API-Key';
  let key = headers?.[headerName.toLowerCase()];
  if (!key) {
    const authHeader = headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      key = authHeader.slice(7);
    }
  }
  if (!key) return { authenticated: false };

  // Constant-time comparison against each configured key
  const keyBuffer = Buffer.from(key);
  for (const configuredKey of properties.keys) {
    const configuredBuffer = Buffer.from(configuredKey);
    if (keyBuffer.length === configuredBuffer.length
        && crypto.timingSafeEqual(keyBuffer, configuredBuffer)) {
      return {
        authenticated: true,
        user: {
          sub: `apiKey:${strategy.id}`,
          type: 'apiKey',
          strategyId: strategy.id,
          roles: roles ?? [],
        },
      };
    }
  }

  return { authenticated: false };
}
```

```javascript
// resolveJwtStrategy.js
import jwt from 'jsonwebtoken';
import { get } from '@lowdefy/helpers';

function resolveJwtStrategy(context, strategy) {
  const { headers } = context;
  const { properties, roles: staticRoles } = strategy;

  // Extract token from Authorization: Bearer header
  const authHeader = headers?.authorization;
  if (!authHeader?.startsWith('Bearer ')) return { authenticated: false };
  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, properties.secret, {
      algorithms: properties.algorithms,
      issuer: properties.issuer,
      audience: properties.audience,
      clockTolerance: properties.clockTolerance ?? 30,
    });

    // Map claims to user fields
    const user = { type: 'jwt', strategyId: strategy.id };
    const userFields = properties.userFields ?? {};
    for (const [userField, claimPath] of Object.entries(userFields)) {
      if (userField !== 'roles') {
        user[userField] = get(payload, claimPath);
      }
    }

    // Merge static roles from strategy config with dynamic roles from JWT claims
    const claimRoles = userFields.roles ? (get(payload, userFields.roles) ?? []) : [];
    user.roles = [...new Set([...(staticRoles ?? []), ...claimRoles])];

    return { authenticated: true, user };
  } catch (error) {
    context.logger.debug({ event: 'debug_jwt_verification_failed', error: error.message });
    return { authenticated: false };
  }
}
```

**7.2.3 Modify `createApiContext.js`**

Change user assignment to a conditional — `resolveAuthentication` sets `context.user`
before this runs in `apiWrapper`, but `serverSidePropsWrapper` does NOT call
`resolveAuthentication` (pages are session-only). The conditional preserves both paths:

```javascript
// CURRENT:
function createApiContext(context) {
  context.state = {};
  context.steps = {};
  context.user = context?.session?.user;         // Always overwrites — breaks strategies
  context.authorize = createAuthorize(context);
  context.readConfigFile = createReadConfigFile(context);
}

// NEW:
import { type } from '@lowdefy/helpers';

function createApiContext(context) {
  context.state = {};
  context.steps = {};
  // Only fall back to session user if resolveAuthentication hasn't already set user.
  // apiWrapper: resolveAuthentication sets context.user → this is a no-op.
  // serverSidePropsWrapper: no resolveAuthentication → falls back to session.user.
  if (type.isNone(context.user)) {
    context.user = context?.session?.user;
  }
  context.authorize = createAuthorize(context);
  context.readConfigFile = createReadConfigFile(context);
}
```

**Why conditional instead of removing the line**: `serverSidePropsWrapper` (page SSR)
also calls `createApiContext` but does NOT call `resolveAuthentication`. Removing the
line entirely would break page auth. The conditional handles both callers correctly.

**7.2.4 Modify `createAuthorize.js`**

Change from closing over `session` to reading `context.user` at call time (see section 6.5).

**7.2.5 Modify `apiWrapper.js` in both server and server-dev**

Add strategy resolution and pass resolved strategies to context. Note: `setSentryUser`
is moved AFTER `resolveAuthentication` so that strategy-authenticated users (API key,
JWT) are tracked in Sentry:

```javascript
function apiWrapper(handler) {
  return async function wrappedHandler(req, res) {
    const context = {
      rid: uuid(),
      buildDirectory: path.join(process.cwd(), 'build'),
      config,
      connections,
      fileCache,
      headers: req?.headers,
      jsMap,
      logger: console,
      operators,
      req,
      res,
      secrets,
    };
    try {
      context.logger = createLogger({ rid: context.rid });
      context.authOptions = getAuthOptions(context);

      if (!req.url.startsWith('/api/auth')) {
        context.session = await getServerSession(context);

        // NEW: Resolve authentication (session or strategy)
        resolveAuthentication(context);

        // Set Sentry user AFTER resolveAuthentication so strategy users are tracked.
        // Uses context.user (set by resolveAuthentication) instead of session.user.
        setSentryUser({ user: context.user, sentryConfig: loggerConfig.sentry });
      }

      createApiContext(context);
      logRequest({ context });
      const response = await handler({ context, req, res });
      return response;
    } catch (error) {
      await logError({ error, context });
      if (error instanceof AuthenticationError) {
        res.status(401).json({ name: error.name, message: error.message });
      } else {
        res.status(500).json({ name: error.name, message: error.message });
      }
    }
  };
}
```

**`serverSidePropsWrapper` is intentionally unchanged.** It serves page SSR only, which
is always session-based. It does NOT call `resolveAuthentication`. The conditional in
`createApiContext` (section 7.2.3) ensures `context.user` falls back to `session.user`
for this path.

**Both `server` and `server-dev` `apiWrapper.js` need the same changes.** The dev server
version has additional `loadDynamicJsMap` logic but the auth flow is identical.

### Phase 3: Endpoint Handler Improvements

**7.3.1 Support external request format**

Currently the endpoint handler expects `{ blockId, payload, pageId }`. External callers
should be able to send a plain JSON body as the payload.

```javascript
async function handler({ context, req, res }) {
  const { endpointId } = req.query;

  // Detect external vs internal requests
  const isInternalRequest = req.body?.blockId !== undefined;

  let blockId, payload, pageId;
  if (isInternalRequest) {
    ({ blockId, payload, pageId } = req.body);
  } else {
    blockId = undefined;
    payload = req.body;
    pageId = undefined;
  }

  context.logger.info({ event: 'call_api_endpoint', blockId, endpointId, pageId });
  const response = await callEndpoint(context, { blockId, endpointId, pageId, payload });
  res.status(200).json(response);
}
```

**7.3.2 Support configurable HTTP methods**

Add optional `methods` to endpoint config (at the endpoint level, not under auth):

```yaml
api:
  - id: get-status
    methods:
      - GET
      - POST
    routine: [...]
```

Default: `['POST']` (backwards compatible). The handler checks the method before processing.

**7.3.3 Proper HTTP status codes for auth failures**

Currently auth failures return "does not exist" (existing info-leak prevention).
When strategies are configured (indicating external API use), proper HTTP codes improve
the developer experience. The `apiWrapper` error handler should check error type:

```javascript
catch (error) {
  await logError({ error, context });
  if (error.name === 'AuthenticationError') {
    res.status(401).json({ name: error.name, message: error.message });
  } else if (error.name === 'AuthorizationError') {
    res.status(403).json({ name: error.name, message: error.message });
  } else {
    res.status(500).json({ name: error.name, message: error.message });
  }
}
```

### Phase 4: Testing

- Unit tests for `resolveApiKeyStrategy` (valid key, invalid key, missing header, timing safety)
- Unit tests for `resolveJwtStrategy` (valid token, expired, wrong algorithm, JWKS, claim mapping)
- Unit tests for `resolveAuthentication` (session priority, strategy fallthrough, no auth)
- Unit tests for modified `createAuthorize` (works with strategy-resolved users)
- Unit tests for `buildAuthStrategies` (validation, duplicate IDs, reserved `session`)
- Integration tests for full endpoint flow with different auth methods
- Backwards compatibility tests (existing configs, no strategies defined)

---

## 8. Error Handling

### 8.1 `AuthenticationError` Class

New error class in `@lowdefy/errors`. Follows the existing error hierarchy pattern
(sibling to `ConfigError`, `PluginError`, `ServiceError`):

```javascript
// packages/utils/errors/src/AuthenticationError.js
class AuthenticationError extends Error {
  constructor(message) {
    super(message ?? 'Authentication required.');
    this.name = 'AuthenticationError';
  }
}
```

**Why a new class instead of reusing ConfigError**: `ConfigError` signals a YAML config
problem. `AuthenticationError` signals a request-level auth failure — the config is
correct, the caller just isn't authenticated. Different semantics require different
error types. The `apiWrapper` catch block checks `instanceof AuthenticationError`
to return 401 instead of 500.

**Exports**: Add to the server subpath only (`@lowdefy/errors/server`). This error is
never thrown at build time or on the client:

```javascript
// packages/utils/errors/src/server/index.js
export { AuthenticationError } from '../AuthenticationError.js';
```

Also export from the main entry point (`@lowdefy/errors`) for convenience.

### 8.2 Where `AuthenticationError` Is Thrown

The error is thrown in `resolveAuthentication` — NOT in `authorizeApiEndpoint`:

```javascript
// resolveAuthentication.js
function resolveAuthentication(context) {
  // Session takes priority
  if (context.session) {
    context.user = context.session.user;
    return;
  }

  // Try each strategy
  const strategies = context.authStrategies ?? [];
  for (const strategy of strategies) {
    const result = resolveStrategy(context, strategy);
    if (result.authenticated) {
      context.user = result.user;
      context.authStrategy = strategy.id;
      return;
    }
  }

  // No auth succeeded — set user to null.
  // Do NOT throw here. The authorize step will check if the endpoint
  // requires auth and throw appropriately.
  context.user = null;
}
```

Wait — if we don't throw in `resolveAuthentication`, where does the 401 come from?

**The 401 is thrown by a modified `authorizeApiEndpoint`:**

```javascript
// authorizeApiEndpoint.js
import { AuthenticationError } from '@lowdefy/errors/server';
import { ConfigError } from '@lowdefy/errors/server';

function authorizeApiEndpoint({ authorize, user, logger }, { endpointConfig }) {
  if (!authorize(endpointConfig)) {
    logger.debug({
      event: 'debug_api_authorize',
      authorized: false,
      auth_config: endpointConfig.auth,
    });

    // Distinguish unauthenticated (no user at all) from unauthorized (wrong roles).
    // unauthenticated → 401 (caught by apiWrapper)
    // unauthorized → existing "does not exist" behavior (500 → hides info)
    if (type.isNone(user)) {
      throw new AuthenticationError('Authentication required.');
    }

    // User is authenticated but lacks roles → existing "does not exist" pattern.
    // This preserves the current info-leak prevention behavior.
    throw new ConfigError({
      message: `API Endpoint "${endpointConfig.endpointId}" does not exist.`,
    });
  }
  logger.debug({
    event: 'debug_api_authorize',
    authorized: true,
    auth_config: endpointConfig.auth,
  });
}
```

**Why this approach works:**

| Caller | Auth state | Endpoint | Error | HTTP status |
|--------|-----------|----------|-------|-------------|
| No session, no API key, no JWT | `user = null` | Protected | `AuthenticationError` | 401 |
| Valid API key | `user = { roles: ['partner'] }` | Requires `admin` role | `ConfigError` "does not exist" | 500 |
| Valid session | `user = { roles: ['viewer'] }` | Requires `admin` role | `ConfigError` "does not exist" | 500 |
| Any authenticated user | `user = { ... }` | Public | Passes | 200 |
| No auth | `user = null` | Public | Passes (public skips auth check) | 200 |

**Key insight**: The 401 only fires when `user` is completely null (no auth at all) AND
the endpoint is not public. Authenticated users with wrong roles get the existing "does
not exist" (500) behavior — no info leak about what roles are required.

### 8.3 Error Handling in `apiWrapper`

The catch block checks for `AuthenticationError` to return proper HTTP status:

```javascript
catch (error) {
  await logError({ error, context });
  if (error instanceof AuthenticationError) {
    res.status(401).json({ name: error.name, message: error.message });
  } else {
    res.status(500).json({ name: error.name, message: error.message });
  }
}
```

**No 403 status code.** The existing "does not exist" pattern deliberately hides
authorization failures. Returning 403 would leak information about endpoint existence
and role requirements. The only new HTTP status is 401 for completely unauthenticated
requests — this reveals nothing about the endpoint's auth configuration.

### 8.4 Strategy Resolution Errors

Strategy-specific errors (invalid JWT, expired token) are logged at debug level and
the strategy simply returns `{ authenticated: false }`. The next strategy is tried.
Only when ALL strategies fail AND the endpoint is protected does the 401 surface.

### 8.5 `authorizeRequest` (Page Requests)

`authorizeRequest` gets the same change as `authorizeApiEndpoint` — check `user` is
null before throwing `AuthenticationError`. In practice, page requests always come from
browsers with sessions, so the 401 path is unlikely. But it's correct to handle it
consistently.

---

## 9. Security Considerations

### 9.1 Secure by Default

- Endpoints are protected by default when auth is configured (`auth.api.protected: true`)
- `auth.api.public: [...]` must explicitly list public endpoints
- API keys must be stored as environment variables (via `_secret`)
- JWT secrets must be stored as environment variables (via `_secret`)
- No default keys or secrets are provided

### 9.2 Session Priority

Session auth (NextAuth) always takes priority over strategy auth. If a browser user
has a session AND sends an API key header, the session is used. This prevents
privilege escalation where a lower-privilege session user sends a higher-privilege
API key.

### 9.3 API Key Security

- **Constant-time comparison**: `crypto.timingSafeEqual` prevents timing attacks
- **Minimum key length**: Validated at **server startup** (not build time) after `_secret`
  resolution. At build time, keys are `_secret` references — the actual values are only
  available as environment variables at runtime. `getAuthStrategies` logs a warning if
  any resolved key is shorter than 32 characters. This is a warning, not a fatal error,
  to avoid blocking startup in development environments.
- **Header extraction**: Support `X-API-Key: <key>` header. `Authorization: Bearer <key>`
  is also supported but `X-API-Key` is preferred when JWT strategies are also configured
  (avoids ambiguity — see section 15.5).
- **No key logging**: Keys must never appear in logs (only strategy ID)
- **HTTPS required**: Document that API keys should only be sent over HTTPS

### 9.4 JWT Security

- **Algorithm validation**: Only configured algorithms allowed (prevent `alg: none`)
- **Clock tolerance**: Configurable clock skew (default: 30 seconds)
- **Expiration enforcement**: Reject expired tokens
- **Issuer/audience validation**: Optional but strongly recommended
- **JWKS caching**: Cache responses with TTL (default: 1 hour)

### 9.5 Information Leak Prevention

- Auth failures return generic messages (no strategy details)
- Invalid endpoints return "does not exist" (existing behavior)
- Detailed auth failure reasons logged at debug level only

### 9.6 Rate Limiting (Future)

Not in scope for initial implementation. The strategy architecture supports adding
per-strategy rate limiting later without config changes.

---

## 10. Alternatives Considered

### 10.1 Per-Endpoint Auth Config (v1 Design)

**Approach**: Add `auth.strategies: [strategy-id]` on each endpoint definition.

```yaml
api:
  - id: webhook
    auth:
      strategies: [my-key]    # Auth config on the endpoint
```

**Pros**: Explicit about which strategies apply to which endpoints.
**Cons**: Breaks the pattern of all auth config under `auth:`. Inconsistent with pages.
Requires schema changes to endpoints. Splits auth concerns across two locations.

**Decision**: Rejected. Roles-only scoping via `auth.api.roles` is simpler, consistent
with pages, and keeps all auth config centralized.

### 10.2 Middleware-Based Auth (Next.js Middleware)

**Approach**: Use Next.js middleware (`middleware.js`) for auth.

**Pros**: Standard Next.js pattern.
**Cons**: Can't access build config (Edge runtime), can't use `_secret`, coupling to Next.js.

**Decision**: Rejected. Config-driven approach works better at the API handler level.

### 10.3 Plugin-Based Strategies

**Approach**: Auth strategies as Lowdefy plugins.

**Pros**: Infinitely extensible.
**Cons**: Over-engineered for 2 strategy types. Complex plugin interface.

**Decision**: Deferred. Start with built-in. Architecture supports plugins later.

### 10.4 Inline Strategy Definitions

**Approach**: Define strategy config per-endpoint rather than globally.

**Pros**: Self-contained.
**Cons**: Violates DRY, scatters secrets, inconsistent with Lowdefy patterns.

**Decision**: Rejected. Global named strategies are cleaner.

---

## 11. Dependencies

### 11.1 New Package Dependencies

| Package | Purpose | Strategy | Notes |
|---------|---------|----------|-------|
| `jsonwebtoken` | JWT verification | jwt | Already transitive dependency via `next-auth` |
| `jwks-rsa` | JWKS URI fetching/caching | jwt (optional) | Only needed for RSA/EC with JWKS endpoint |

### 11.2 Affected Packages

| Package | Changes |
|---------|---------|
| `@lowdefy/api` | `resolveAuthentication` (new), `resolveApiKeyStrategy` (new), `resolveJwtStrategy` (new), modified `createAuthorize`, `createApiContext`, `authorizeApiEndpoint`, `authorizeRequest` |
| `@lowdefy/api` (auth) | Modified `getNextAuthConfig` (extract strategies from parsed config) |
| `@lowdefy/build` | `lowdefySchema.js` (add strategies), `buildAuthStrategies.js` (new), `buildAuth.js` (call new step) |
| `@lowdefy/server` | `apiWrapper.js` (add resolveAuthentication + AuthenticationError handling) |
| `@lowdefy/server-dev` | Same as server |
| `@lowdefy/errors` | `AuthenticationError` class (new) |

**NOT changed**: `buildApiAuth.js`, `buildPageAuth.js`, `getApiRoles.js`,
`getProtectedApi.js`, `callEndpoint.js`, `callRequest.js`, `serverSidePropsWrapper.js`,
endpoint/page schemas.

**Changed minimally**: `authorizeApiEndpoint.js`, `authorizeRequest.js` (add
`AuthenticationError` throw for unauthenticated users — see section 8.2).

---

## 12. Migration & Backwards Compatibility

### 12.1 Zero Breaking Changes

1. **No `auth.strategies` defined**: Everything works exactly as before
2. **`auth.api.protected/public/roles`**: Completely unchanged
3. **Session auth**: Still the default, still takes priority
4. **Endpoint schema**: No changes — endpoints never had inline auth
5. **Page auth**: Completely unchanged
6. **`callRequest` (page requests)**: Unchanged — page requests are session-based

### 12.2 Incremental Adoption

```
Step 1: Existing app works as-is
Step 2: Add auth.strategies with one API key strategy
Step 3: Add a role for the strategy to auth.api.roles
Step 4: Done — endpoints scoped by role now accept API keys
```

No migration tool needed. No config changes required for existing apps.

---

## 13. Implementation Order

### Step 1: Build-Time Foundation
1. Add `strategies` to `authConfig` in `lowdefySchema.js`
2. Create `buildAuthStrategies.js` (validation + duplicate checking)
3. Modify `buildAuth.js` to call `buildAuthStrategies`
4. Ensure strategies are included in `auth.json` build output
5. Tests for build-time validation

### Step 2: Runtime Authentication Resolution
6. Add `AuthenticationError` to `@lowdefy/errors` (needed by steps below)
7. Modify `getNextAuthConfig.js` (extract strategies from parsed config — no separate parser)
8. Create `resolveAuthentication.js`
9. Create `resolveApiKeyStrategy.js` (with constant-time comparison)
10. Create `resolveJwtStrategy.js` (with `jsonwebtoken`)
11. Modify `createAuthorize.js` (read `context.user` instead of closing over session)
12. Modify `createApiContext.js` (conditional user assignment — preserve `serverSidePropsWrapper`)
13. Modify `authorizeApiEndpoint.js` (throw `AuthenticationError` when `user` is null)
14. Modify `authorizeRequest.js` (same `AuthenticationError` change)
15. Modify `apiWrapper.js` in server and server-dev:
    - Add `resolveAuthentication` call after session resolution
    - Move `setSentryUser` after `resolveAuthentication` (uses `context.user`)
    - Add `AuthenticationError` → 401 in catch block
16. Tests for each strategy resolver, resolveAuthentication, and modified authorize

### Step 3: Endpoint Handler Improvements
17. Support external request body format (plain JSON payload)
18. Support configurable HTTP methods on endpoints
19. Tests for endpoint handler changes

### Step 4: Testing & Documentation
19. Integration tests (full request flow with different auth methods)
20. Backwards compatibility tests
21. Update cc-docs
22. Update user-facing docs

---

## 14. Open Questions

1. **CORS**: Should CORS configuration be part of this feature or a separate initiative?
   External browser-based API clients need CORS, but server-to-server doesn't.

2. **Rate limiting**: Should basic rate limiting be included? Important for public and
   API key endpoints but adds complexity.

3. **Endpoint response format**: External callers might want different response shapes
   than the internal format (`{ error, response, status, success }`). Should the response
   format be configurable?

4. **JWKS support**: Should JWKS (asymmetric key endpoint) be in the initial release or
   deferred? HMAC (shared secret) covers most use cases.

5. **Audit logging**: Should auth events (strategy used, key matched, JWT issuer) be
   logged at info level for audit trails?

---

## 15. Review Findings — Addressed

These findings from the critical review (`review.md`) are now addressed
in the plan sections above. This section documents the rationale for each resolution.

### 15.1 BUG-1: `createApiContext` overwrites strategy-resolved user (FIXED)

**Problem**: `createApiContext` line 23 does `context.user = context?.session?.user`,
overwriting whatever `resolveAuthentication` set. For strategy users, `session` is
null, so `context.user` becomes `undefined`.

**Resolution**: Changed to conditional assignment (section 7.2.3):
```javascript
if (type.isNone(context.user)) {
  context.user = context?.session?.user;
}
```
This preserves the `apiWrapper` path (resolveAuthentication sets user first) AND the
`serverSidePropsWrapper` path (no resolveAuthentication → falls back to session).

### 15.2 BUG-2: Sentry user tracking skipped for strategy users (FIXED)

**Problem**: `setSentryUser` called before `resolveAuthentication` in `apiWrapper`.
API key/JWT users never tracked in Sentry.

**Resolution**: Moved `setSentryUser` after `resolveAuthentication` (section 7.2.5).
Uses `context.user` (set by resolveAuthentication) instead of `context.session?.user`.

### 15.3 BUG-3: Build-time key length validation is impossible (FIXED)

**Problem**: Section 9.3 claimed keys validated at build time. But keys are `_secret`
references at build time — actual values only available at runtime.

**Resolution**: Key length validation moved to server startup inside `getNextAuthConfig`
after `_secret` resolution (sections 6.4, 9.3). Logs a warning for keys shorter than
32 characters. Does not block startup.

### 15.4 GAP-1: `serverSidePropsWrapper` not addressed (ADDRESSED)

**Problem**: `serverSidePropsWrapper` also calls `createApiContext` but plan only
modified `apiWrapper`.

**Resolution**: `serverSidePropsWrapper` is intentionally unchanged. It serves page SSR
only (always session-based, never strategy auth). The conditional assignment in
`createApiContext` (section 7.2.3) ensures it falls back to `session.user` when
`resolveAuthentication` hasn't run. Explicitly documented in section 7.2.5.

### 15.5 GAP-2: `callRequest` also uses `context.authorize` (ADDRESSED)

**Problem**: Page-level requests go through `callRequest` → `authorizeRequest` →
`context.authorize`. The `createAuthorize` change affects these too.

**Resolution**: This works correctly. Page requests come from browsers with sessions, so
`context.user = session.user` — same as today. Strategy auth also works for page requests
if an API key user calls `/api/request/...` with the right roles. This is intentional
and correct — `authorizeRequest` gets the same `AuthenticationError` change as
`authorizeApiEndpoint` (section 8.5). No regression.

### 15.6 GAP-3: Strategies without providers (API-key-only auth) (CONFIRMED VALID)

**Problem**: What if someone configures only strategies (no NextAuth providers)?

```yaml
auth:
  strategies:
    - id: my-key
      type: apiKey
      properties:
        keys: [{ _secret: KEY }]
      roles: [api-user]
  api:
    protected: true
    roles:
      api-user: [my-endpoint]
```

**Resolution**: This is a valid and supported configuration. The flow:

1. **Build time**: `auth.configured = true` (auth config is not `isNone`). `buildApiAuth`
   runs normally — computes `endpoint.auth` from `auth.api.roles`.
2. **Server startup**: `getNextAuthConfig` runs. Creates empty `providers: []`,
   `callbacks: {}`, etc. Extracts strategies from parsed config. No errors.
3. **Request time**: `getServerSession` calls NextAuth's `getServerSession` with no
   providers → returns null session. `resolveAuthentication` then tries strategies →
   API key matches → `context.user` set with roles → `authorize` passes.
4. **NEXTAUTH_SECRET**: `validateAuthConfig` only requires `NEXTAUTH_SECRET` when
   `providers.length > 0`. Strategies-only configs don't need it.

This path needs explicit integration testing but is architecturally sound.

### 15.7 GAP-4: `_user` operator shape differs for strategy users (DOCUMENTED)

**Problem**: Session users have OIDC claims (`name`, `email`, `picture`). Strategy users
have `{ sub, type, strategyId, roles }`. Routines using `_user.email` get `undefined`
for API key callers.

**Resolution**: This is by design — different auth methods provide different identity
information. Document the user object shape per strategy type:

| Auth method | `_user` shape |
|------------|--------------|
| Session (NextAuth) | `{ sub, name, email, picture, roles, ... }` (OIDC claims) |
| API Key | `{ sub: 'apiKey:{id}', type: 'apiKey', strategyId, roles }` |
| JWT | `{ sub, type: 'jwt', strategyId, roles, ...userFields }` (claim-mapped) |

Recommend checking `_user.type` in routines that need to handle multiple auth methods:
```yaml
# In a routine
- id: check-user-type
  type: Condition
  properties:
    if:
      _eq:
        - _user: type
        - apiKey
```

### 15.8 GAP-5: Strategy ordering and `Authorization: Bearer` ambiguity (ADDRESSED)

**Problem**: Both `apiKey` and `jwt` strategies can read from `Authorization: Bearer`.
First match wins, but a JWT strategy would try to parse an API key as a JWT (and fail).

**Resolution**:
1. **Default behavior**: `apiKey` checks `X-API-Key` header first, then falls back to
   `Authorization: Bearer`. When a custom `headerName` is set, ONLY that header is checked.
2. **Recommendation**: When both `apiKey` and `jwt` strategies are configured, use
   `X-API-Key` for API keys (or set a custom `headerName`). API key strategies should
   be listed BEFORE JWT strategies in the YAML array — they fail fast (simple string
   comparison) while JWT verification is more expensive.
3. **Strategy ordering**: YAML array order = resolution priority. Document this clearly.

### 15.9 GAP-6: Double-parsing of `authJson` secrets (FIXED)

**Problem**: `getNextAuthConfig` already parses entire `authJson` through `ServerParser`.
A separate `getAuthStrategies` function would create a second `ServerParser` — duplicate work.

**Resolution**: Eliminated the separate `getAuthStrategies` function. Instead, extract
strategies from the already-parsed `authConfig` inside `getNextAuthConfig` (section 6.4):
```javascript
nextAuthConfig.strategies = authConfig.strategies ?? [];
```
Strategies are accessed via `context.authOptions.strategies` in `apiWrapper`. Single
`ServerParser` instance, no duplication.

### 15.10 CONCERN-3: AuthenticationError vs "does not exist" (RESOLVED)

**Problem**: The plan introduced `AuthenticationError` (401) but existing code returns
"does not exist" (hides auth failures). These patterns conflicted.

**Resolution**: Both patterns coexist cleanly (section 8.2):
- **Unauthenticated** (`user === null` on protected endpoint) → `AuthenticationError` → 401
- **Unauthorized** (user exists but wrong roles) → existing `ConfigError` "does not exist" → 500

The 401 reveals nothing about endpoint auth configuration — it just says "you need to
authenticate." The "does not exist" pattern is preserved for wrong-roles cases, maintaining
existing info-leak prevention. No `verboseErrors` flag needed.
