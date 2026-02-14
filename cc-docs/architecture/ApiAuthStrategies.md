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
- Keys should be at least 32 characters (validated at build time)
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
This follows the existing `getNextAuthConfig` pattern:

```javascript
// New: getAuthStrategies() — resolves _secret operators in strategy configs
// Called once at startup, cached thereafter (same pattern as getNextAuthConfig)

import { ServerParser } from '@lowdefy/operators';
import { _secret } from '@lowdefy/operators-js/operators/server';

const resolvedStrategies = [];
let initialized = false;

function getAuthStrategies({ authJson, secrets }) {
  if (initialized) return resolvedStrategies;

  const operatorsParser = new ServerParser({
    operators: { _secret },
    payload: {},
    secrets,
    user: {},
  });

  const { output: strategies } = operatorsParser.parse({
    input: authJson.strategies ?? [],
    location: 'auth.strategies',
  });

  resolvedStrategies.push(...strategies);
  initialized = true;
  return resolvedStrategies;
}
```

This ensures:
- Secrets resolved once, not per-request
- Same `_secret` pattern used everywhere
- Consistent with `getNextAuthConfig` approach

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

Move user resolution out (it's now done by `resolveAuthentication` before this runs):

```javascript
// CURRENT:
function createApiContext(context) {
  context.state = {};
  context.steps = {};
  context.user = context?.session?.user;         // User from session
  context.authorize = createAuthorize(context);
  context.readConfigFile = createReadConfigFile(context);
}

// NEW:
function createApiContext(context) {
  context.state = {};
  context.steps = {};
  // context.user is already set by resolveAuthentication()
  context.authorize = createAuthorize(context);
  context.readConfigFile = createReadConfigFile(context);
}
```

**7.2.4 Modify `createAuthorize.js`**

Change from closing over `session` to reading `context.user` at call time (see section 6.5).

**7.2.5 Modify `apiWrapper.js` in both server and server-dev**

Add strategy resolution and pass resolved strategies to context:

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

      // Resolve strategies (cached after first call)
      context.authStrategies = getAuthStrategies({ authJson, secrets });

      if (!req.url.startsWith('/api/auth')) {
        context.session = await getServerSession(context);
        setSentryUser({ user: context.session?.user, sentryConfig });

        // NEW: Resolve authentication (session or strategy)
        resolveAuthentication(context);
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

### 8.1 Authentication Errors

New error class: `AuthenticationError` in `@lowdefy/errors`

When no authentication method succeeds for a protected endpoint:
- Returns HTTP 401
- Generic message: `"Authentication required."`
- No details about which strategies were tried

### 8.2 Authorization Errors

When authenticated but wrong roles:
- Protected endpoints without strategies: "does not exist" (existing behavior, info-leak prevention)
- When strategies are defined globally: could return 403 for clearer external API UX

Note: The current info-leak prevention (returning "not found" instead of "forbidden") is
a deliberate security choice. We keep this as default and consider adding an opt-in
`auth.api.verboseErrors: true` flag for external API use cases.

### 8.3 Strategy Resolution Errors

Strategy-specific errors (invalid JWT, expired token) are logged at debug level and
the strategy simply returns `{ authenticated: false }`. The next strategy is tried.
Only when ALL strategies fail does the authentication error surface.

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
- **Minimum key length**: Validated at build time (minimum 16 characters recommended)
- **Header extraction**: Support `Authorization: Bearer <key>` and `X-API-Key: <key>`
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
| `@lowdefy/api` | `resolveAuthentication`, modified `createAuthorize`, `createApiContext`, strategy resolvers, `getAuthStrategies` |
| `@lowdefy/build` | `lowdefySchema.js` (add strategies), `buildAuthStrategies.js` (new), `buildAuth.js` (call new step) |
| `@lowdefy/server` | `apiWrapper.js` (add strategy resolution + pass strategies to context) |
| `@lowdefy/server-dev` | Same as server |
| `@lowdefy/errors` | `AuthenticationError` class |

**NOT changed**: `buildApiAuth.js`, `buildPageAuth.js`, `getApiRoles.js`,
`getProtectedApi.js`, `authorizeApiEndpoint.js`, `authorizeRequest.js`,
`callEndpoint.js`, `callRequest.js`, endpoint/page schemas.

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
6. Create `resolveAuthentication.js`
7. Create `resolveApiKeyStrategy.js` (with constant-time comparison)
8. Create `resolveJwtStrategy.js` (with `jsonwebtoken`)
9. Create `getAuthStrategies.js` (startup-time `_secret` resolution)
10. Modify `createAuthorize.js` (read `context.user` instead of closing over session)
11. Modify `createApiContext.js` (remove user-from-session assignment)
12. Modify `apiWrapper.js` in server and server-dev (add resolveAuthentication call)
13. Tests for each strategy resolver and resolveAuthentication

### Step 3: Endpoint Handler Improvements
14. Support external request body format (plain JSON payload)
15. Support configurable HTTP methods on endpoints
16. Add `AuthenticationError` to `@lowdefy/errors`
17. Proper HTTP status codes (401, 403) in error handler
18. Tests for endpoint handler changes

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

5. **Verbose auth errors**: Should there be an opt-in `auth.api.verboseErrors` flag that
   returns 401/403 instead of "not found"? Useful for external API developers but
   reduces security through obscurity.

6. **Audit logging**: Should auth events (strategy used, key matched, JWT issuer) be
   logged at info level for audit trails?
