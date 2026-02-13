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
2. `buildApiAuth` iterates over all endpoints and sets `endpoint.auth`:
   - Reads `auth.api.protected`, `auth.api.public`, `auth.api.roles`
   - Sets `endpoint.auth = { public: true }` or `{ public: false, roles?: [...] }`
   - Auth metadata is baked into the build artifacts (`build/api/{endpointId}.json`)
3. `buildPageAuth` does the same for pages

**Runtime** (`packages/api/`, `packages/servers/server/`):

1. `apiWrapper` (server middleware):
   - Creates request context with `rid`, `config`, `connections`, `operators`, `secrets`
   - Calls `getServerSession()` → NextAuth's `getServerSession(req, res, authOptions)`
   - If auth is configured and session exists → `context.session = { user: {...} }`
   - Calls `createApiContext()` → sets `context.user`, `context.authorize`
2. `createAuthorize({ session })` creates a closure:
   - `authenticated = !!session`
   - `roles = session?.user?.roles ?? []`
   - Returns `authorize(config)` function that checks `config.auth.public` and `config.auth.roles`
3. `callEndpoint` → `authorizeApiEndpoint` → calls `authorize(endpointConfig)`
4. On failure: throws "does not exist" error (hides 403 as 404 to prevent info leaks)

### 2.2 Key Files

| File | Role |
|------|------|
| `packages/build/src/build/buildAuth/buildApiAuth.js` | Sets `endpoint.auth` at build time |
| `packages/build/src/build/buildAuth/validateAuthConfig.js` | Validates auth config structure |
| `packages/build/src/lowdefySchema.js` | AJV schema for auth config |
| `packages/api/src/context/createAuthorize.js` | Core authorization logic |
| `packages/api/src/context/createApiContext.js` | Attaches auth to context |
| `packages/api/src/routes/endpoints/callEndpoint.js` | Endpoint handler entry point |
| `packages/api/src/routes/endpoints/authorizeApiEndpoint.js` | Endpoint authorization gate |
| `packages/servers/server/lib/server/apiWrapper.js` | Server middleware (session resolution) |
| `packages/servers/server/lib/server/auth/getServerSession.js` | NextAuth session lookup |
| `packages/servers/server/pages/api/endpoints/[endpointId].js` | Next.js API route for endpoints |
| `packages/api/src/routes/auth/getNextAuthConfig.js` | NextAuth config + `_secret` resolution |

### 2.3 Current Limitations

1. **Single auth mechanism**: Only NextAuth session cookies
2. **No per-endpoint auth config**: Auth is set globally via `auth.api.protected/public/roles`
3. **POST only**: Endpoint handler rejects non-POST requests
4. **Internal body format**: Expects `{ blockId, payload, pageId }` — external callers don't know/care about blocks
5. **No API key support**: No way to authenticate via headers
6. **No JWT verification**: Can't validate tokens from external identity providers

---

## 3. Design Goals

1. **Secure by default**: If auth is configured, endpoints are protected unless explicitly made public
2. **Config-driven**: Auth strategies defined in YAML, consistent with Lowdefy patterns
3. **Backwards compatible**: Existing apps work without changes
4. **Multiple strategies**: Support session, API keys, JWT, and public access
5. **Per-endpoint control**: Each endpoint can specify which strategies it accepts
6. **Role-based authorization**: Role checks work across all auth strategies
7. **Simple to use**: Common cases (public endpoint, API key) should be ~3 lines of config
8. **Extensible**: Architecture supports adding new strategies later

---

## 4. Proposed Config Design

### 4.1 Named Auth Strategies (Global Definition)

Auth strategies are defined globally under `auth.strategies` and referenced by ID on endpoints.
This follows the Lowdefy pattern of defining reusable resources once (like `connections`).

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

  # NEW: Named authentication strategies for API endpoints
  strategies:
    - id: internal-api-key
      type: apiKey
      properties:
        keys:
          - _secret: INTERNAL_API_KEY
        # Identity assigned to requests authenticated with this strategy
        user:
          sub: internal-service
          roles:
            - api-internal

    - id: partner-api-key
      type: apiKey
      properties:
        keys:
          - _secret: PARTNER_KEY_ACME
          - _secret: PARTNER_KEY_GLOBEX
        user:
          sub: partner
          roles:
            - api-partner

    - id: service-jwt
      type: jwt
      properties:
        # Option A: Shared secret (HMAC)
        secret:
          _secret: JWT_SIGNING_SECRET
        # Option B: JWKS endpoint (RSA/EC) — one or the other
        # jwksUri: https://auth.example.com/.well-known/jwks.json
        issuer: https://auth.example.com
        audience: my-lowdefy-api
        algorithms:
          - RS256
        # Map JWT claims to user fields
        userFields:
          sub: sub
          email: email
          roles: roles

  # Existing page/api config (unchanged)
  pages:
    protected: true
  api:
    protected: true
```

### 4.2 Per-Endpoint Auth Configuration

Endpoints reference strategies by ID. The special built-in strategy `session` refers to
the existing NextAuth session auth (always available when auth is configured).

```yaml
api:
  # Public endpoint — no auth required
  - id: health-check
    auth:
      public: true
    routine:
      - id: return-ok
        type: Return
        params:
          status: ok

  # Protected by session only (current behavior, default)
  - id: user-dashboard-data
    # No auth block → inherits from auth.api config → session auth
    routine:
      - id: fetch-data
        type: MongoDBFind
        connectionId: app-db
        properties:
          collection: dashboards

  # Protected by API key
  - id: webhook-receiver
    auth:
      strategies:
        - internal-api-key
    routine:
      - id: process-webhook
        type: MongoDBInsertOne
        connectionId: app-db
        properties:
          doc:
            _payload: true

  # Protected by multiple strategies (first match wins)
  - id: data-export
    auth:
      strategies:
        - session         # Browser users with session
        - partner-api-key # Partner services with API key
        - service-jwt     # Services with JWT
      roles:
        - admin
        - api-partner
    routine:
      - id: export-data
        type: MongoDBFind
        connectionId: app-db
        properties:
          collection: exports

  # JWT-only endpoint
  - id: microservice-sync
    auth:
      strategies:
        - service-jwt
    routine:
      - id: sync-data
        type: AxiosHttp
        connectionId: upstream-api
        properties:
          url: /api/sync
```

### 4.3 Config Resolution Rules (Secure by Default)

Priority order for how `endpoint.auth` is determined at build time:

1. **Endpoint has explicit `auth` block** → use it directly
2. **Endpoint has no `auth` block** → apply global `auth.api` config (existing behavior)
3. **No `auth.api` config and no endpoint `auth`** → `public: true` (existing behavior: if no auth configured at all, everything is public)

When `auth.providers` are configured (auth is active):
- **Default behavior**: endpoints without explicit `auth` are protected by session (existing behavior via `auth.api.protected: true`)
- `auth.public: true` → explicitly makes an endpoint public
- `auth.strategies: [...]` → explicitly sets which strategies are accepted
- Strategies and roles can be combined

When `auth.providers` are NOT configured (no auth):
- All endpoints are public (existing behavior, no change)

### 4.4 Why Named Strategies (vs Inline)

**Option A: Named strategies (recommended)**
```yaml
auth:
  strategies:
    - id: my-key
      type: apiKey
      properties:
        keys: [{ _secret: KEY }]
api:
  - id: ep1
    auth:
      strategies: [my-key]
  - id: ep2
    auth:
      strategies: [my-key]
```

**Option B: Inline strategies**
```yaml
api:
  - id: ep1
    auth:
      strategies:
        - type: apiKey
          properties:
            keys: [{ _secret: KEY }]
  - id: ep2
    auth:
      strategies:
        - type: apiKey
          properties:
            keys: [{ _secret: KEY }]
```

| Criteria | Named (A) | Inline (B) |
|----------|-----------|------------|
| DRY principle | Strategies defined once | Repeated per endpoint |
| Consistency with Lowdefy | Matches `connections` pattern | Novel pattern |
| Readability | Endpoint config stays clean | Endpoint config bloated |
| Secret management | Secrets in one place | Secrets scattered |
| Maintenance | Change strategy in one place | Change in every endpoint |
| Simplicity for single use | Slightly more config | Slightly less config |

**Decision**: Named strategies (Option A). Consistent with how `connections` are defined
globally and referenced by ID. Avoids secret duplication. Better for maintainability.

---

## 5. Authentication Strategies (Detailed)

### 5.1 Strategy: `session` (Built-in)

Uses the existing NextAuth session. No configuration needed — it is always available when
`auth.providers` are configured. Referenced by the special ID `session`.

**How it works**:
1. `apiWrapper` already calls `getServerSession()` on every request
2. If session exists → user is authenticated
3. `context.user = session.user` (existing behavior)

**Config**: No definition needed. Just reference `session` in `strategies` array.

```yaml
api:
  - id: browser-only-endpoint
    auth:
      strategies:
        - session
```

**Pros**: Zero config, backwards compatible, already works.
**Cons**: Only works for browser clients with cookies.

### 5.2 Strategy: `apiKey`

Validates a pre-shared key from request headers.

**Config**:
```yaml
auth:
  strategies:
    - id: my-api-key
      type: apiKey
      properties:
        # Where to read the key from (optional, defaults shown)
        headerName: X-API-Key  # Also checks Authorization: Bearer <key>
        # List of valid keys
        keys:
          - _secret: API_KEY_1
          - _secret: API_KEY_2
        # Identity assigned to authenticated requests (optional)
        user:
          sub: api-client
          roles:
            - api-user
```

**How it works**:
1. Read key from `X-API-Key` header or `Authorization: Bearer <key>` header
2. Compare against configured keys using constant-time comparison
3. If match → authenticated with the configured `user` identity
4. If no match → strategy fails, try next strategy

**Key resolution flow**:
```
Request headers
  → Extract key from headerName or Authorization: Bearer
  → Compare with each key in keys[] (constant-time)
  → Match found → return { authenticated: true, user: strategy.properties.user }
  → No match → return { authenticated: false }
```

**Pros**:
- Simple to set up and use
- Works for server-to-server, webhooks, CLI tools
- Keys stored as env vars via `_secret` (secure)
- Low overhead (no crypto verification)

**Cons**:
- Keys are shared secrets — must be transmitted securely (HTTPS only)
- No expiration (must rotate manually)
- No per-request claims (static identity)
- Must be kept secret — leaked key = full access until rotated

**Security considerations**:
- Keys MUST be compared using constant-time comparison to prevent timing attacks
- Keys should be at least 32 bytes of entropy
- HTTPS is required (keys sent in headers)
- Rate limiting recommended (future enhancement)

### 5.3 Strategy: `jwt`

Validates a JSON Web Token from the Authorization header.

**Config**:
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
        issuer: https://my-service.com    # Optional: validate iss claim
        audience: my-lowdefy-api          # Optional: validate aud claim
        userFields:                        # Map JWT claims to user object
          sub: sub
          email: email
          roles: roles
          name: name

    # Option B: RSA/EC (public key or JWKS)
    - id: rsa-jwt
      type: jwt
      properties:
        jwksUri: https://auth.example.com/.well-known/jwks.json
        # OR
        # publicKey:
        #   _secret: JWT_PUBLIC_KEY
        algorithms:
          - RS256
        issuer: https://auth.example.com
        audience: my-lowdefy-api
        userFields:
          sub: sub
          email: email
          roles: custom:roles
```

**How it works**:
1. Read token from `Authorization: Bearer <token>` header
2. Decode header to determine algorithm
3. Verify signature:
   - HMAC: using `secret`
   - RSA/EC: using `publicKey` or fetching from `jwksUri`
4. Validate standard claims: `exp`, `iat`, `nbf`, `iss`, `aud`
5. Extract user fields from payload using `userFields` mapping
6. If valid → authenticated with mapped user identity

**User field mapping**:
```yaml
userFields:
  sub: sub                    # JWT payload.sub → user.sub
  email: email                # JWT payload.email → user.email
  roles: realm_access.roles   # JWT payload.realm_access.roles → user.roles (supports nested paths)
  name: preferred_username    # JWT payload.preferred_username → user.name
```

This uses `get()` from `@lowdefy/helpers` to support nested paths, consistent with
the existing `auth.userFields` pattern for NextAuth.

**Pros**:
- Industry standard (RFC 7519)
- Self-contained — no database lookup needed
- Supports expiration and claims validation
- Works with external identity providers (Auth0, Keycloak, Cognito, etc.)
- Per-request claims (roles, scopes, etc.)
- Asymmetric keys (JWKS) don't require sharing secrets

**Cons**:
- More complex setup than API keys
- Token revocation requires additional infrastructure
- JWKS URI introduces external dependency (mitigated by caching)
- Clock skew can cause validation failures
- Larger request overhead (tokens can be 1-2KB)

**Security considerations**:
- Algorithm MUST be validated (prevent `alg: none` attacks)
- JWKS responses should be cached with TTL
- Token expiration (`exp`) must be enforced
- `iss` and `aud` validation prevents token reuse across services

### 5.4 Strategy: `public`

No authentication required. This is equivalent to `auth.public: true` on the endpoint,
but expressed as a strategy for consistency.

**Config**: No definition needed. Use `auth.public: true` on the endpoint.

```yaml
api:
  - id: open-endpoint
    auth:
      public: true
    routine: [...]
```

Note: `public` is NOT a named strategy — it's a flag on the endpoint's `auth` block.
This keeps the existing API surface unchanged. An endpoint is either public or it
requires one or more authentication strategies.

---

## 6. Architecture Design

### 6.1 Separation of Authentication and Authorization

The current `createAuthorize` conflates authentication (is there a session?) with
authorization (does the user have the right roles?). The new design separates these:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  AUTHENTICATION │     │  IDENTITY         │     │  AUTHORIZATION  │
│                 │     │  RESOLUTION       │     │                 │
│  Which strategy │ ──→ │  Who is the user? │ ──→ │  Can they do    │
│  matched?       │     │  Set context.user │     │  this action?   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

**Authentication** (new): Resolves identity from the request.
- Input: HTTP request (headers, cookies)
- Output: `{ authenticated: boolean, user: object | null, strategyId: string }`
- Tries each configured strategy in order, returns first match.

**Authorization** (existing, extended): Checks access based on identity.
- Input: `{ authenticated, user, config }`
- Output: `boolean`
- Checks `public`, `roles`, etc.

### 6.2 Runtime Flow (New)

```
HTTP Request → /api/endpoints/[endpointId]
  │
  ▼
apiWrapper (unchanged except: passes strategy configs to context)
  ├─ Creates context
  ├─ Resolves NextAuth session (existing)
  ├─ Adds strategyConfigs to context (from auth.json)
  ├─ Calls createApiContext()
  │
  ▼
callEndpoint()
  ├─ Gets endpoint config (existing)
  │
  ├─ NEW: resolveAuthentication(context, endpointConfig)
  │  ├─ If endpoint.auth.public === true → skip auth, user = null
  │  ├─ If endpoint.auth.strategies exists:
  │  │  ├─ For each strategyId in strategies[]:
  │  │  │  ├─ "session" → check context.session
  │  │  │  ├─ apiKey strategy → check headers against keys
  │  │  │  ├─ jwt strategy → verify token, extract claims
  │  │  │  └─ If match → set context.user, break
  │  │  └─ No match → throw 401/404
  │  ├─ If no strategies (legacy) → use session (existing behavior)
  │  └─ Sets context.user from resolved identity
  │
  ├─ authorizeApiEndpoint() (existing, works with updated context.user)
  │  └─ Checks roles against context.user.roles
  │
  ▼
runRoutine() (unchanged)
```

### 6.3 Build-Time Flow (Modified)

```
lowdefy.yaml
  │
  ▼
buildAuth()
  ├─ validateAuthConfig() (extended: validate strategies)
  ├─ NEW: buildAuthStrategies() → validate and process strategy configs
  ├─ buildApiAuth() (modified: respect per-endpoint auth blocks)
  ├─ buildPageAuth() (unchanged)
  └─ buildAuthPlugins() (unchanged)
  │
  ▼
Build artifacts:
  ├─ auth.json (extended: includes strategies[])
  └─ api/{endpointId}.json (extended: auth may include strategies)
```

### 6.4 Strategy Resolution at Startup

Strategy configs contain `_secret` references that need to be resolved at server startup
(not per-request). This follows the existing pattern in `getNextAuthConfig`:

```javascript
// New: getAuthStrategies() — similar to getNextAuthConfig()
// Called once at startup, cached thereafter

function getAuthStrategies({ authJson, secrets }) {
  // Parse _secret operators in strategy configs
  const operatorsParser = new ServerParser({
    operators: { _secret },
    secrets,
  });

  const { output: strategies } = operatorsParser.parse({
    input: authJson.strategies ?? [],
    location: 'auth.strategies',
  });

  return strategies; // Keys/secrets are now resolved plain values
}
```

This ensures:
- Secrets are resolved once, not per-request
- Same `_secret` pattern used everywhere
- Consistent with `getNextAuthConfig` approach

---

## 7. Implementation Plan

### Phase 1: Core Infrastructure (Auth Strategy Resolution)

**7.1.1 Add strategy resolution to `@lowdefy/api`**

New files:
- `packages/api/src/context/resolveAuthentication.js` — Main resolver
- `packages/api/src/context/strategies/resolveSessionStrategy.js` — Session strategy
- `packages/api/src/context/strategies/resolveApiKeyStrategy.js` — API key strategy
- `packages/api/src/context/strategies/resolveJwtStrategy.js` — JWT strategy
- `packages/api/src/context/strategies/index.js` — Strategy registry

```javascript
// resolveAuthentication.js
function resolveAuthentication(context, { endpointConfig }) {
  const { auth } = endpointConfig;

  // Public endpoint — no auth needed
  if (auth.public === true) {
    context.user = null;
    return;
  }

  // If strategies are defined, try each in order
  if (auth.strategies) {
    for (const strategyId of auth.strategies) {
      const result = resolveStrategy(context, { strategyId });
      if (result.authenticated) {
        context.user = result.user;
        context.authStrategy = strategyId;
        return;
      }
    }
    // No strategy matched
    throw new AuthenticationError('Authentication required.');
  }

  // Legacy behavior: check session (backwards compatible)
  if (!context.session) {
    throw new AuthenticationError('Authentication required.');
  }
  context.user = context.session.user;
}
```

**7.1.2 Modify `createAuthorize` for strategy-resolved users**

The existing `createAuthorize` creates the authorize function once from the session.
With strategies, the user may change per-endpoint (resolved by `resolveAuthentication`
before `authorize` is called). The authorize function should read from `context.user`
rather than closing over `session` at creation time.

```javascript
// CURRENT (closes over session at creation time):
function createAuthorize({ session }) {
  const authenticated = !!session;
  const roles = session?.user?.roles ?? [];
  function authorize(config) { ... }
  return authorize;
}

// NEW (reads from context at call time):
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

This is a minimal, backwards-compatible change. The authorize function now reads
`context.user` which is set by `resolveAuthentication` (or by the existing
`createApiContext` for legacy endpoints).

**7.1.3 Modify `callEndpoint` to resolve auth before authorization**

```javascript
// CURRENT:
async function callEndpoint(context, { blockId, endpointId, pageId, payload }) {
  const endpointConfig = await getEndpointConfig(context, { endpointId });
  authorizeApiEndpoint(context, { endpointConfig });
  // ... run routine
}

// NEW:
async function callEndpoint(context, { blockId, endpointId, pageId, payload }) {
  const endpointConfig = await getEndpointConfig(context, { endpointId });
  resolveAuthentication(context, { endpointConfig });  // NEW: resolve identity first
  authorizeApiEndpoint(context, { endpointConfig });   // Then authorize
  // ... run routine
}
```

**7.1.4 Modify `apiWrapper` to pass strategy configs**

```javascript
// In apiWrapper, after creating context:
context.authStrategies = getAuthStrategies({ authJson, secrets });
```

### Phase 2: Build-Time Config Processing

**7.2.1 Extend `lowdefySchema.js` with strategy definitions**

Add to `definitions`:
```javascript
authStrategy: {
  type: 'object',
  required: ['id', 'type'],
  properties: {
    id: { type: 'string' },
    type: { type: 'string', enum: ['apiKey', 'jwt'] },
    properties: { type: 'object' },
  },
},
```

Add `strategies` to `authConfig.properties`:
```javascript
strategies: {
  type: 'array',
  items: { $ref: '#/definitions/authStrategy' },
},
```

Add `strategies` to endpoint auth config (alongside existing `public` and `roles`).

**7.2.2 Add `buildAuthStrategies.js`**

Validates strategy configs:
- Each strategy has unique `id`
- `type` is one of `apiKey`, `jwt`
- `apiKey` strategies have `keys` array
- `jwt` strategies have `secret` or `jwksUri`
- Strategy IDs don't collide with built-in `session`

**7.2.3 Modify `buildApiAuth.js`**

Respect per-endpoint `auth` blocks:
```javascript
// CURRENT: Always overwrites endpoint.auth from global config
endpoint.auth = { public: true/false, roles: [...] };

// NEW: Only set from global config if endpoint doesn't have explicit auth
if (type.isNone(endpoint.auth)) {
  // Existing logic: apply global auth.api config
  endpoint.auth = { public: ..., roles: ... };
} else {
  // Endpoint has explicit auth — validate it
  validateEndpointAuth(endpoint.auth, { strategies: components.auth.strategies });
}
```

Validate per-endpoint auth:
- `strategies` references valid strategy IDs (or `session`)
- `roles` is valid array of strings
- `public` and `strategies` are mutually exclusive

**7.2.4 Include strategies in `auth.json` build output**

The strategy configs (with `_secret` references intact) are serialized into `auth.json`
alongside existing auth config. Secrets are resolved at server startup, not build time.

### Phase 3: Endpoint HTTP Access Improvements

**7.3.1 Support external request format**

Currently the endpoint handler expects `{ blockId, payload, pageId }` in the POST body.
External callers should be able to send a plain JSON body as the payload.

Modified endpoint handler:
```javascript
async function handler({ context, req, res }) {
  const { endpointId } = req.query;

  // Detect external vs internal requests
  const isInternalRequest = req.body?.blockId !== undefined;

  let blockId, payload, pageId;
  if (isInternalRequest) {
    // Existing internal format
    ({ blockId, payload, pageId } = req.body);
  } else {
    // External format: entire body is the payload
    blockId = undefined;
    payload = req.body;
    pageId = undefined;
  }

  const response = await callEndpoint(context, { blockId, endpointId, pageId, payload });
  res.status(200).json(response);
}
```

**7.3.2 Support GET requests for endpoints**

Add optional `methods` config to endpoints:

```yaml
api:
  - id: get-status
    methods:
      - GET
      - POST
    auth:
      public: true
    routine: [...]
```

Modified handler:
```javascript
async function handler({ context, req, res }) {
  const { endpointId } = req.query;
  const endpointConfig = await getEndpointConfig(context, { endpointId });

  // Validate HTTP method
  const allowedMethods = endpointConfig.methods ?? ['POST'];
  if (!allowedMethods.includes(req.method)) {
    res.setHeader('Allow', allowedMethods.join(', '));
    res.status(405).json({ message: `Method ${req.method} not allowed.` });
    return;
  }

  // For GET: payload from query params; for POST: payload from body
  const payload = req.method === 'GET' ? req.query : req.body;
  // ...
}
```

**Default**: POST only (backwards compatible).

**7.3.3 CORS support (optional, per-endpoint)**

```yaml
api:
  - id: partner-api
    cors:
      origins:
        - https://partner.example.com
      methods:
        - GET
        - POST
      headers:
        - X-API-Key
        - Content-Type
    auth:
      strategies: [partner-key]
    routine: [...]
```

This could be implemented as headers set in the endpoint handler before the response.
Could also be a global `auth.cors` config for all endpoints.

### Phase 4: Testing

- Unit tests for each strategy resolver
- Unit tests for `resolveAuthentication` with various configs
- Unit tests for modified `createAuthorize`
- Unit tests for modified `buildApiAuth` (per-endpoint auth)
- Unit tests for strategy validation at build time
- Integration tests for endpoint handler with different auth methods
- Tests for backwards compatibility (existing configs still work)

---

## 8. Error Handling

### 8.1 Authentication Errors

When authentication fails, the response should follow existing patterns:

**For endpoints with strategies** (external callers expect clear errors):
```json
{
  "name": "AuthenticationError",
  "message": "Authentication required.",
  "status": 401
}
```

**For endpoints without strategies** (legacy, internal):
```json
{
  "name": "ConfigError",
  "message": "API Endpoint \"xyz\" does not exist."
}
```
(Existing info-leak prevention behavior)

### 8.2 New Error Class

Add `AuthenticationError` to `@lowdefy/errors`:
- HTTP status: 401
- Used when no strategy matches
- Includes `WWW-Authenticate` header hint

### 8.3 Authorization Errors (Existing)

When authorization fails (user authenticated but wrong roles):
- Internal endpoints: "does not exist" (existing behavior)
- External endpoints with strategies: 403 Forbidden

The distinction between internal/external is based on whether the endpoint has
explicit `strategies` configured. Endpoints with strategies are considered
"external-facing" and get proper HTTP status codes.

---

## 9. Security Considerations

### 9.1 Secure by Default

- Endpoints are protected by default when auth is configured
- `public: true` must be explicitly set for public access
- API keys must be stored as environment variables (via `_secret`)
- JWT secrets must be stored as environment variables (via `_secret`)
- No default API keys or JWT secrets are provided

### 9.2 API Key Security

- **Constant-time comparison**: Use `crypto.timingSafeEqual` to compare keys
- **Minimum key length**: Validate keys are at least 16 characters at build time
- **Header extraction**: Support `Authorization: Bearer <key>` and `X-API-Key: <key>`
- **No key logging**: Keys must never appear in logs
- **HTTPS required**: Document that API keys should only be sent over HTTPS

### 9.3 JWT Security

- **Algorithm validation**: Only allow configured algorithms (prevent `alg: none` attack)
- **Clock tolerance**: Allow configurable clock skew (default: 30 seconds)
- **Expiration enforcement**: Reject expired tokens
- **Issuer/audience validation**: Optional but recommended
- **JWKS caching**: Cache JWKS responses with TTL (default: 1 hour)
- **Key rotation**: JWKS supports automatic key rotation

### 9.4 Information Leak Prevention

- Endpoints with `strategies` (external-facing): return 401/403 with generic messages
- Endpoints without `strategies` (internal): continue returning "does not exist" (existing behavior)
- Never include strategy details in error responses
- Log detailed auth failures at debug level only

### 9.5 Rate Limiting (Future)

Not in scope for initial implementation, but the architecture supports adding rate
limiting per-strategy later:

```yaml
auth:
  strategies:
    - id: my-key
      type: apiKey
      properties:
        rateLimit:
          windowMs: 60000
          maxRequests: 100
```

---

## 10. Alternatives Considered

### 10.1 Middleware-Based Auth (Next.js Middleware)

**Approach**: Use Next.js middleware (`middleware.js`) to handle auth before API routes.

**Pros**: Standard Next.js pattern, runs before handler.
**Cons**: Can't access build config (middleware runs in Edge runtime), can't use
`_secret` operator, harder to make config-driven, coupling to Next.js.

**Decision**: Rejected. Lowdefy's config-driven approach works better at the API handler level.

### 10.2 Plugin-Based Strategies

**Approach**: Auth strategies as Lowdefy plugins (like connections).

```yaml
plugins:
  - name: '@lowdefy/auth-strategy-apikey'
    version: 1.0.0
```

**Pros**: Infinitely extensible, users can write custom strategies.
**Cons**: Over-engineered for 3 strategies, complex plugin interface, longer to implement.

**Decision**: Deferred. Start with built-in strategies. The architecture allows adding
plugin support later if there's demand. The strategy resolver can be extended to look up
plugins alongside built-in strategies.

### 10.3 Inline Strategy Definitions Per-Endpoint

**Approach**: Define strategy config directly on each endpoint rather than referencing global definitions.

**Pros**: Self-contained endpoints, no cross-referencing.
**Cons**: Violates DRY, scatters secrets, inconsistent with Lowdefy patterns.

**Decision**: Rejected. Named global strategies are cleaner.

### 10.4 Express-style Middleware Chain

**Approach**: Allow defining middleware chains per-endpoint.

```yaml
api:
  - id: my-endpoint
    middleware:
      - type: apiKeyAuth
        properties: ...
      - type: rateLimit
        properties: ...
```

**Pros**: Very flexible, supports rate limiting and other concerns.
**Cons**: Complex, not config-driven friendly, hard to validate at build time.

**Decision**: Rejected for now. Auth strategies are a specific concern and don't need
a general middleware system. Can be revisited if more per-endpoint middleware is needed.

### 10.5 Separate External API System

**Approach**: Create a completely separate system for external APIs, independent of the
existing endpoint system.

**Pros**: Clean separation, no backwards compatibility concerns.
**Cons**: Code duplication, two systems to maintain, confusing for users.

**Decision**: Rejected. Extending the existing endpoint system is simpler and more consistent.

---

## 11. Dependencies

### 11.1 New Package Dependencies

| Package | Purpose | Strategy |
|---------|---------|----------|
| `jsonwebtoken` | JWT verification (HMAC, RSA) | jwt |
| `jwks-rsa` | JWKS URI fetching and caching | jwt (optional) |

Both are well-maintained, widely used packages. `jsonwebtoken` is already a transitive
dependency via `next-auth`.

### 11.2 Affected Packages

| Package | Changes |
|---------|---------|
| `@lowdefy/api` | Strategy resolution, modified authorize, auth errors |
| `@lowdefy/build` | Schema changes, strategy validation, per-endpoint auth |
| `@lowdefy/server` | Pass strategies to context, endpoint handler changes |
| `@lowdefy/server-dev` | Same as server |
| `@lowdefy/errors` | New AuthenticationError class |

---

## 12. Migration & Backwards Compatibility

### 12.1 Zero Breaking Changes

The design is fully backwards compatible:

1. **No `auth.strategies` defined**: Everything works exactly as before
2. **No per-endpoint `auth` blocks**: Global `auth.api` config applies (existing behavior)
3. **Existing `auth.api.protected/public/roles`**: Continue to work unchanged
4. **Session auth**: Always available as built-in strategy, default for legacy endpoints
5. **`callRequest` (page requests)**: Unchanged — page requests are always session-based

### 12.2 Incremental Adoption

Users can adopt strategies incrementally:

1. Start with existing auth setup (NextAuth)
2. Add one strategy: `auth.strategies: [{ id: my-key, type: apiKey, ... }]`
3. Apply to one endpoint: `auth.strategies: [my-key]`
4. Expand to more endpoints as needed

No migration tool needed. No config changes required for existing apps.

---

## 13. Implementation Order

### Step 1: Foundation
1. Add `AuthenticationError` to `@lowdefy/errors`
2. Add strategy schema to `lowdefySchema.js`
3. Add `buildAuthStrategies.js` (validation)
4. Modify `buildApiAuth.js` to respect per-endpoint auth blocks
5. Include strategies in `auth.json` output

### Step 2: Runtime Resolution
6. Create `resolveAuthentication.js` and strategy resolvers
7. Modify `createAuthorize.js` to read from `context.user` (not closed session)
8. Add strategy config loading in server (alongside `getNextAuthConfig`)
9. Modify `callEndpoint` to call `resolveAuthentication` before `authorizeApiEndpoint`
10. Modify `apiWrapper` to pass strategy configs into context

### Step 3: API Key Strategy
11. Implement `resolveApiKeyStrategy.js`
12. Add constant-time key comparison
13. Tests for API key auth

### Step 4: JWT Strategy
14. Implement `resolveJwtStrategy.js`
15. Add JWT verification with `jsonwebtoken`
16. Add JWKS support with `jwks-rsa`
17. Implement claim-to-user field mapping
18. Tests for JWT auth

### Step 5: Endpoint Handler Improvements
19. Support external request body format (plain JSON payload)
20. Support configurable HTTP methods
21. Proper HTTP status codes for auth errors (401, 403, 405)
22. CORS support (optional)

### Step 6: Testing & Documentation
23. Integration tests
24. Backwards compatibility tests
25. Update user-facing docs
26. Update cc-docs

---

## 14. Open Questions

1. **Per-key identity vs shared identity for API keys**: Should each key have its own
   identity, or should all keys for a strategy share one? The plan proposes shared identity
   with per-key identity as a future enhancement.

2. **CORS**: Should CORS be part of this feature or a separate initiative? It's needed
   for browser-based external API access but not for server-to-server.

3. **Rate limiting**: Should basic rate limiting be included? It's important for public
   and API key endpoints but adds complexity.

4. **Request body format for external callers**: The plan proposes auto-detecting internal
   vs external format. An alternative is a separate route prefix (e.g., `/api/v1/...`).

5. **Endpoint response format**: External callers might want different response shapes
   than the internal format (`{ error, response, status, success }`). Should the response
   be customizable?

6. **API key rotation**: Should the system support overlapping keys for zero-downtime
   rotation? The current design supports this via multiple keys per strategy.

7. **Audit logging**: Should auth events (successful auth, failed auth, key used) be
   logged differently from regular request logging?
