# Audit Logging Framework — Critical Review

## Reviewer Context

This review comes from the perspective of someone who has shipped logging infrastructure in production Node.js systems, dealt with the real-world fallout of audit log gaps during SOC 2 audits, and watched config-driven frameworks struggle to retrofit observability after the fact. The plan is solid in its fundamentals. The critique below focuses on where it will break under real usage and where the config design creates unnecessary friction for end users.

---

## CRITICAL: The Plan Has No Concept of a User Session Journey

This is the single biggest gap. The plan captures individual events — a request here, an auth there — but provides **no mechanism to reconstruct what a user actually did during a session**. Every event is an island.

### The Problem

Consider an HR admin who logs in, views the employee list, opens an employee profile, edits their salary, and logs out. The plan would produce 5+ independent audit events, each with `userId` and `rid` (request ID). But:

- **`rid` is per-HTTP-request.** It's generated fresh in `apiWrapper.js` for every API call. There's no way to correlate "these 8 requests were part of the same user session."
- **There's no `sessionId`.** The existing `logRequest.js` even has a `TODO: Implement session id` comment (line 31). The plan inherits this gap.
- **There's no page navigation tracking.** The `serverSidePropsWrapper` is not an interception point in the plan. Page loads (SSR) are completely invisible to audit logging.
- **There's no `sequenceNumber` or ordering guarantee.** With fire-and-forget async writes, events can arrive at the storage backend out of order. Reconstructing a timeline requires sorting by timestamp, which has millisecond collisions under load.

### The Fix: Add `sessionId` and `journey` Event Category

The audit event schema needs three additions:

```json
{
  "sessionId": "a1b2c3d4...",
  "sequence": 47,
  "journey": {
    "pageId": "employee-profile",
    "previousPageId": "employee-list",
    "blockId": "save_button",
    "eventName": "onClick",
    "actionId": "save_employee"
  }
}
```

**`sessionId`**: Lowdefy already generates a `session.hashed_id` — a SHA-256 hash of the user identifier (see `createSessionCallback.js:97-102`). This is deterministic per user identity and serves as a session correlation key. However, it's a user-level hash, not a per-login-session ID. For true journey tracing, a per-login-session ID is needed. NextAuth's JWT token has a `jti` (JWT ID) when a database adapter is configured. Without an adapter (the default in Lowdefy), a session ID would need to be generated — either by adding a `jti` to the JWT callback or by generating a UUID on first sign-in and storing it in the token. This is the single most important field for journey tracing — it ties every event from the same login session together.

**`sequence`**: A per-session monotonically increasing counter. Cheap to implement (atomic counter per session in memory). Eliminates timestamp-ordering ambiguity.

**`journey`**: A new event category that captures the navigation and interaction context the client already knows about. The client sends `blockId`, `pageId`, and `actionId` in request payloads (visible in `[requestId].js` line 26: `const { actionId, blockId, payload } = req.body`). The `actionId` is ALREADY being sent from the client but the plan completely ignores it.

Add `journey` as a sixth event category:

```yaml
audit:
  events:
    - auth
    - request
    - journey    # Page views, navigation, user interactions
```

When `journey` is enabled at `severity: low`, the framework also audits:
- **Page views** via `serverSidePropsWrapper` (SSR interception point — currently missing from the plan)
- **Navigation context** from `referer` headers
- The `actionId` and `eventName` that triggered each request (already available in the request body)

This transforms the audit log from "what happened" to "what the user's experience looked like" — which is what makes journey tracing possible.

---

## Schema Design: Problems for End Users

### 1. `events` as Required Array Is the Wrong Default

The plan requires:
```yaml
audit:
  connectionId: audit_db
  events:            # Required, must list at least one
    - auth
    - request
```

**Problem**: A developer adding audit logging for the first time has to know what the categories mean and make a choice immediately. The most common setup is "log everything important." Making them enumerate categories is busywork that adds friction without value.

**Fix**: Make `events` optional, defaulting to all categories. Add an `events.exclude` pattern instead:

```yaml
# Simplest possible setup — logs everything at medium severity
audit:
  connectionId: audit_db

# Or explicitly exclude what you don't want
audit:
  connectionId: audit_db
  events:
    exclude:
      - journey    # Don't need page views
```

This inverts the model: opt-out instead of opt-in. Every new event category added in future framework versions automatically starts being captured. The current opt-in model means framework upgrades silently add new event types that existing apps never log.

### 2. `severity` as a Single Global Threshold Is Too Coarse

The plan has one `severity` value that applies everywhere:

```yaml
audit:
  severity: medium   # All categories filtered at this level
```

**Problem**: In practice, you want different granularity per category. You want `severity: low` for auth (capture every session event) but `severity: high` for requests (only capture failures). A single threshold forces an all-or-nothing choice.

**Fix**: Allow per-category severity:

```yaml
audit:
  connectionId: audit_db
  severity: medium          # Default for all categories
  events:
    auth:
      severity: low         # Capture everything for auth
    request: true           # Uses default severity (medium)
    endpoint:
      severity: high        # Only failures
    journey:
      severity: low         # Full journey tracing
```

This also solves the `events` design problem above — the events block becomes a map instead of an array, where `true` means "use defaults" and an object allows per-category overrides. Much more expressive.

### 3. `exclude`/`include` Mutual Exclusivity Is Unnecessary Complexity

The plan forbids combining `exclude` and `include`:

```yaml
# This throws a ConfigError
audit:
  exclude:
    requests: [fetch-dropdown]
  include:
    requests: [update-user]
```

**Problem**: This is a false constraint. The real-world use case is: "Log all requests EXCEPT these noisy ones, but within endpoints, ONLY log these specific ones." Exclude and include apply to different resource types naturally.

**Fix**: Remove the mutual exclusivity constraint. If both are specified for the same resource type, `include` wins (it's the more restrictive filter). For different resource types, they're independent:

```yaml
audit:
  exclude:
    requests:              # Exclude specific requests
      - fetch-dropdown
      - fetch-autocomplete
  include:
    endpoints:             # Only include specific endpoints
      - create-order
      - process-payment
```

### 4. `mask` by Field Name Is Brittle and Incomplete

The plan masks by field name:
```yaml
mask:
  - password
  - ssn
```

**Problem 1**: Field names aren't globally unique. A field named `password` in connection properties (the database password) and `password` in a user-submitted form payload are completely different things with different sensitivity levels. The plan masks both indiscriminately.

**Problem 2**: Developers will forget to add fields. New sensitive fields added to the app won't be masked until someone remembers to update the audit config.

**Problem 3**: The masking runs on every audit event via `serializer.copy()` + recursive traversal. For high-traffic apps, this is a per-request deep clone + tree walk. Expensive.

**Fix**: Two changes:

First, add path-based masking alongside field-name masking:
```yaml
mask:
  fields:                      # Match any field with this name (existing behavior)
    - password
    - ssn
  paths:                       # Match specific dotted paths
    - initiator.ip             # Mask IP for GDPR
    - metadata.payload.card    # Mask specific nested field
```

Second, never include connection properties in audit events. The plan's `applyMask` implies connection properties might appear in metadata. They shouldn't. Connection properties contain database URIs, API keys, auth tokens. The audit event should capture `connectionId` and `connectionType` but never the resolved connection properties. This is a design-level fix, not a masking fix.

### 5. `requestType` Leaks Implementation Details to App Authors

```yaml
audit:
  requestType: MongoDBInsertOne   # User has to know this
```

**Problem**: An app author configuring audit logging shouldn't need to know the internal request type name for their connection. They know they're using MongoDB. They shouldn't need to know the framework calls it `MongoDBInsertOne` internally.

**Fix**: Remove `requestType` from the top-level config. The auto-detection should just work. If it doesn't work for a connection type, that's a framework bug, not a user config problem. Move `requestType` to an `advanced` block for the rare edge case:

```yaml
audit:
  connectionId: audit_db
  advanced:
    requestType: MongoDBInsertOne   # Override auto-detection (rarely needed)
```

---

## Revised Config Schema (Proposed)

Incorporating all the above:

```yaml
# Minimal — logs all events at medium severity
audit:
  connectionId: audit_db

# Full — with journey tracing and per-category control
audit:
  connectionId: audit_db

  # Per-category configuration (default: all enabled at default severity)
  # Use true for defaults, object for overrides, false to disable
  events:
    auth:
      severity: low            # Every auth event, including sessions
    request: true              # Default severity
    endpoint:
      severity: high           # Only failures
    authorization: true
    error: true
    journey:                   # NEW: user journey tracing
      severity: low            # Full navigation + interaction capture

  # Default severity for categories that don't specify their own
  severity: medium

  # Sensitive field handling
  mask:
    fields:
      - password
      - ssn
      - creditCard
    paths:
      - initiator.ip           # GDPR: mask IP addresses

  # Additional fields on every event
  fields:
    appName: HR Portal
    environment:
      _build.env: NODE_ENV

  # Per-resource filtering
  exclude:
    requests:
      - fetch_department_list
      - fetch_autocomplete

  # Advanced options (rarely needed)
  advanced:
    requestType: MongoDBInsertOne    # Override auto-detection
    batch:
      enabled: true
      size: 100
      interval: 5000
```

### Revised JSON Schema

```javascript
audit: {
  type: 'object',
  additionalProperties: false,
  errorMessage: { type: 'App "audit" should be an object.' },
  required: ['connectionId'],
  properties: {
    '~ignoreBuildChecks': { /* standard */ },
    '~r': {},
    '~l': {},
    connectionId: {
      type: 'string',
      errorMessage: { type: 'App "audit.connectionId" should be a string.' },
    },
    severity: {
      type: 'string',
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      errorMessage: {
        type: 'App "audit.severity" should be "low", "medium", or "high".',
      },
    },
    events: {
      type: 'object',
      additionalProperties: false,
      errorMessage: { type: 'App "audit.events" should be an object.' },
      properties: {
        auth: { $ref: '#/definitions/auditEventCategory' },
        request: { $ref: '#/definitions/auditEventCategory' },
        endpoint: { $ref: '#/definitions/auditEventCategory' },
        authorization: { $ref: '#/definitions/auditEventCategory' },
        error: { $ref: '#/definitions/auditEventCategory' },
        journey: { $ref: '#/definitions/auditEventCategory' },
      },
    },
    mask: {
      type: 'object',
      additionalProperties: false,
      properties: {
        fields: {
          type: 'array',
          items: { type: 'string' },
          errorMessage: { type: 'App "audit.mask.fields" should be an array of strings.' },
        },
        paths: {
          type: 'array',
          items: { type: 'string' },
          errorMessage: { type: 'App "audit.mask.paths" should be an array of strings.' },
        },
      },
    },
    fields: {
      type: 'object',
      errorMessage: { type: 'App "audit.fields" should be an object.' },
    },
    exclude: {
      type: 'object',
      additionalProperties: false,
      properties: {
        pages: { type: 'array', items: { type: 'string' } },
        requests: { type: 'array', items: { type: 'string' } },
        endpoints: { type: 'array', items: { type: 'string' } },
      },
    },
    include: {
      type: 'object',
      additionalProperties: false,
      properties: {
        pages: { type: 'array', items: { type: 'string' } },
        requests: { type: 'array', items: { type: 'string' } },
        endpoints: { type: 'array', items: { type: 'string' } },
      },
    },
    advanced: {
      type: 'object',
      additionalProperties: false,
      properties: {
        requestType: {
          type: 'string',
          errorMessage: { type: 'App "audit.advanced.requestType" should be a string.' },
        },
        batch: {
          type: 'object',
          additionalProperties: false,
          properties: {
            enabled: { type: 'boolean' },
            size: { type: 'integer', minimum: 1 },
            interval: { type: 'integer', minimum: 100 },
          },
        },
      },
    },
  },
}
```

With the shared definition:

```javascript
auditEventCategory: {
  oneOf: [
    { type: 'boolean' },    // true = enabled with defaults, false = disabled
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        severity: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
        },
      },
    },
  ],
}
```

---

## Architecture Issues

### 6. `serverSidePropsWrapper` Is a Missing Interception Point

The plan lists 5 interception points but omits `serverSidePropsWrapper.js`. This is where page loads (SSR) happen. Without it:

- No audit event when a user navigates to a page
- No way to know which pages a user visited
- Journey tracing is incomplete — you see "user made a request on employee-profile page" but never "user navigated to employee-profile page"

**Fix**: Add `serverSidePropsWrapper` as interception point #6. It should emit a `journey.page_view` event with:
```json
{
  "eventType": "journey.page_view",
  "category": "journey",
  "severity": "low",
  "target": {
    "type": "page",
    "id": "employee-profile"
  },
  "metadata": {
    "referer": "/employee-list",
    "resolvedUrl": "/employee-profile/123"
  }
}
```

This requires adding the audit logger to `serverSidePropsWrapper` context, which the plan currently leaves unchanged. The wrapper already has `logRequest` — adding the audit logger follows the same pattern.

### 7. Fire-and-Forget Has a Silent Data Loss Problem

The plan says:
> Audit write failures are logged as warnings but never crash the request.

This is correct in principle but has a practical problem: if the audit database connection is misconfigured (wrong URI, wrong collection name, auth failure), **every single audit event silently fails**. The operational logger fills with `audit_write_failed` warnings, but there's no mechanism to escalate this.

In practice: a deployment goes out with a typo in `AUDIT_MONGODB_URI`. The app works fine. Nobody notices the warning logs for days. When the SOC 2 auditor asks for the last 30 days of audit data, there's nothing.

**Fix**: Add a startup connectivity check. When the audit logger is created in `apiWrapper.js`, it performs a single test write to the audit connection. If this fails, log an error (not warning) and optionally prevent server startup:

```yaml
audit:
  connectionId: audit_db
  advanced:
    failOnStartup: true    # Default: false. If true, server won't start if audit DB is unreachable
```

Even without `failOnStartup`, the startup check surfaces misconfigurations immediately in the server logs instead of silently failing for days.

Additionally, implement a circuit breaker pattern: after N consecutive write failures, escalate from `warn` to `error` level in operational logs and optionally stop attempting writes (to avoid flooding a dead database with retries).

### 8. `createAuditLogger` at Module Level Creates a Timing Problem

The plan creates the audit logger at module level:

```javascript
import auditConfig from '../build/audit.js';
const auditLogger = createAuditLogger({ auditConfig, connections, secrets });
```

**Problem**: Module-level execution happens during `require`/`import` resolution. The `connections` object is also a module-level import. But `createAuditLogger` needs to resolve `_secret` operators in the connection properties (e.g., `AUDIT_MONGODB_URI`). The `ServerParser` used for operator resolution may not be available at module load time — `getNextAuthConfig` solves this by deferring to first call.

**Fix**: Use the same lazy initialization pattern as `getNextAuthConfig`:

```javascript
let auditLogger;
function getAuditLogger(context) {
  if (auditLogger) return auditLogger;
  auditLogger = createAuditLogger({
    auditConfig,
    connections: context.connections,
    secrets: context.secrets,
  });
  return auditLogger;
}
```

This defers initialization to the first request, when the full context is available.

### 9. The Plan Writes Audit Events Through the Connection Plugin System — But How Exactly?

The plan says "calls the connection's write request type" but doesn't show the actual mechanism. The existing `callRequest` pipeline is heavy:

1. Load request config from build artifact
2. Load connection config from build artifact
3. Evaluate operators in both
4. Validate schemas
5. Execute

The audit writer can't use this pipeline — there's no build artifact for audit requests. The audit "request" is synthetic. The plan needs to specify whether it:

**(a)** Calls the connection plugin function directly (bypassing the request pipeline), or
**(b)** Creates a synthetic request config and runs it through the pipeline

Option (a) is correct but the plan doesn't state it. The audit writer should resolve the connection, get the plugin function, and call it directly:

```javascript
async function writeAuditEvent({ auditConfig, connectionPlugin, connectionProperties, event }) {
  // Call the plugin function directly — no request pipeline
  await connectionPlugin.requests[auditConfig.requestType]({
    connection: connectionProperties,
    request: { doc: event },  // Payload shape for MongoDBInsertOne
  });
}
```

This avoids schema validation, auth checks, and all the other request pipeline overhead that makes no sense for internal audit writes.

**However**, there's a subtlety the plan misses entirely: connection properties contain operators like `{ _secret: 'AUDIT_MONGODB_URI' }`. The normal request pipeline resolves these via `evaluateOperators` (see `evaluateOperators.js:18-21`). The audit writer needs its own operator evaluation for the audit connection — but only once, at initialization time (the connection URI doesn't change between requests). This is the same pattern `getNextAuthConfig.js` uses: parse the config through `ServerParser` once at startup, cache the resolved properties, and reuse them for every audit write. The plan's `createAuditLogger` factory is the right place for this, but it needs to be explicit about evaluating `_secret` operators in the audit connection config.

### 10. `extractInitiator` Missing Session ID

```javascript
function extractInitiator(context) {
  const user = context.user ?? context.session?.user ?? {};
  return {
    userId: user.id ?? user.sub,
    sub: user.sub,
    roles: user.roles,
    ip: context.headers?.['x-forwarded-for'] ?? ...,
    userAgent: context.headers?.['user-agent'],
  };
}
```

**Missing**: `sessionId`. Lowdefy currently generates `session.hashed_id` (a SHA-256 hash of the user identifier in `createSessionCallback.js:97-102`), but this is per-user-identity, not per-login-session. For journey tracing, we need a per-login-session ID. Two options:

- **If a database adapter is configured**: NextAuth provides a session record with an ID. Access it via `token.sessionId` in the JWT callback.
- **If using default JWT sessions (no adapter)**: Generate a UUID in the JWT callback on first sign-in (`if (!token.auditSessionId) token.auditSessionId = uuid()`) and carry it through subsequent token refreshes.

Either way, the session callback should copy this to `session.user.auditSessionId` so it's available in the API context.

**Also missing**: `email`. The session callback already copies all OIDC claims including `email` to `session.user` (see `createSessionCallback.js:57-80`). For audit purposes, knowing the user's email is often more useful than their internal ID.

```javascript
function extractInitiator(context) {
  const user = context.user ?? context.session?.user ?? {};
  return {
    userId: user.id ?? user.sub,
    sub: user.sub,
    email: user.email,
    roles: user.roles,
    sessionId: user.auditSessionId ?? context.session?.hashed_id,
    ip: context.headers?.['x-forwarded-for']
      ?? context.headers?.['x-real-ip']
      ?? context.headers?.['cf-connecting-ip'],
    userAgent: context.headers?.['user-agent'],
  };
}
```

---

## User Journey Tracing: What It Should Look Like

With the `journey` category and `sessionId` in place, here's what a reconstructed user journey looks like when querying the audit log:

```
Session: sess_abc123 | User: admin@company.com | 2026-02-15 10:28–10:45

10:28:00  auth.login_success        provider=google
10:28:01  journey.page_view          page=dashboard
10:28:15  journey.page_view          page=employee-list
10:28:16  request.execute            request=fetch_employees  connection=app_db
10:30:42  journey.page_view          page=employee-profile    referer=/employee-list
10:30:43  request.execute            request=fetch_employee   connection=app_db
10:32:10  request.execute            request=update_salary    connection=app_db
                                     block=save_button  event=onClick  action=save_employee
10:32:11  request.execute            request=fetch_employee   connection=app_db  (re-fetch after save)
10:45:00  auth.logout
```

This requires:
1. `sessionId` on every event (ties events to a login session)
2. `journey.page_view` events from `serverSidePropsWrapper` (page navigation)
3. `journey` metadata on request events: `blockId`, `eventName`, `actionId` (interaction context — all already sent by the client)
4. `sequence` numbers for ordering (or at minimum, high-resolution timestamps)

The `actionId` is particularly important. Tracing the data flow reveals a gap in the current codebase that the audit plan inherits:

1. **Client side** (`Requests.js:98`): The engine sends `actionId` in the fetch body.
2. **Route handler** (`[requestId].js:26`): `const { actionId, blockId, payload } = req.body;` — extracted.
3. **Route handler** (`[requestId].js:27`): `context.logger.info({ event: 'call_request', pageId, requestId, blockId, actionId });` — logged operationally.
4. **Route handler** (`[requestId].js:28`): `await callRequest(context, { blockId, pageId, payload, requestId });` — **`actionId` is NOT passed to `callRequest`**.

The `actionId` is available at the route handler level but gets dropped before reaching `callRequest`. The audit plan adds its interception inside `callRequest`, so it never sees `actionId`. The fix is to pass `actionId` through to `callRequest` (a one-line change in the route handler) and include it in the audit event's `journey` block. Same issue exists in the dev server's equivalent route handler.

The plan's audit call in `callRequest.js` only uses `blockId`:

```javascript
metadata: { requestType: requestConfig.type, blockId: context.blockId }
```

With the fix, the audit event gets the full interaction chain: which block was clicked (`blockId`), which event fired (`eventName` — currently not sent from client at all), and which action triggered the request (`actionId`).

---

## Revised Audit Event Schema

```json
{
  "id": "evt_01HrJWpYyWqpQCxLB3SZhgoB",
  "timestamp": "2026-02-15T10:32:10.847Z",
  "sequence": 47,
  "eventType": "request.execute",
  "category": "request",
  "severity": "medium",

  "initiator": {
    "userId": "user_123",
    "sub": "google-oauth2|abc",
    "email": "admin@company.com",
    "roles": ["hr-admin"],
    "sessionId": "sess_abc123",
    "ip": "192.168.1.10",
    "userAgent": "Mozilla/5.0..."
  },

  "target": {
    "type": "request",
    "id": "update_salary",
    "connectionId": "app_db",
    "connectionType": "MongoDBCollection",
    "pageId": "employee-profile"
  },

  "action": "execute",
  "outcome": "success",

  "journey": {
    "blockId": "save_button",
    "eventName": "onClick",
    "actionId": "save_employee"
  },

  "metadata": {
    "requestType": "MongoDBUpdateOne",
    "duration": 42
  },

  "rid": "req_xyz789",
  "appFields": {
    "appName": "HR Portal",
    "environment": "production"
  }
}
```

Key changes from the original:
- Added `sequence` for ordering
- Added `sessionId` and `email` to initiator
- Added top-level `journey` block with `blockId`, `eventName`, `actionId`
- Moved `blockId` from `metadata` to `journey` (it's interaction context, not request metadata)

---

## Minor Issues

### 11. The `batch` Design Has a Data Loss Window

The plan's batching buffer is in-memory with a `SIGTERM` flush handler. In a serverless environment (Vercel, AWS Lambda), there is no `SIGTERM`. The process just dies. The buffer is lost.

**Fix**: Document that batching is incompatible with serverless. For serverless, individual writes are the only safe option. Add a build-time warning if `batch.enabled: true` and the deployment target is detected as serverless.

### 12. The `fields` Config Supports Operators But the Plan Doesn't Evaluate Them

The plan shows:
```yaml
fields:
  environment:
    _build.env: ENVIRONMENT
```

And `buildAudit` calls `countOperators` on `audit.fields`. But `_build.env` is a build-time operator — it should be resolved during the build, not at runtime. The plan doesn't show where `audit.fields` operators get evaluated. Are they evaluated once at build time (correct for `_build.env`) or at runtime (needed for `_secret`)?

**Fix**: Clarify that `audit.fields` is evaluated at build time. Runtime operators like `_secret` should not be used in `audit.fields` — they belong in the connection config. Add a build-time validation that rejects server-only operators in `audit.fields`.

### 13. Auto-Detection Table Lists `Knex` and `Elasticsearch` Without Verification

The plan lists auto-detection for `Knex` → `KnexRaw` and `Elasticsearch` → `ElasticsearchIndex`. These connection types may not exist in the current Lowdefy plugin ecosystem, or their request type names may be different.

**Fix**: Only list connection types that are verified to exist. Start with MongoDB and AxiosHttp (the two most common). Add others when they're tested.

### 14. `applyMask` Does a Full Deep Clone via `serializer.copy`

Every audit event gets deep-cloned before masking. For events with no masked fields (which is most events when `mask` is empty), this is wasted work.

The plan already has `if (maskFields.length === 0) return obj;` — but in the revised schema with path-based masking, the check needs to account for both `fields` and `paths` being empty.

---

## Summary of Recommendations

| # | Issue | Severity | Category |
|---|-------|----------|----------|
| 1 | No session journey tracing (no `sessionId`, no page views, no `actionId`) | **Critical** | Missing feature |
| 2 | `events` as required array creates friction | High | Config UX |
| 3 | Single global `severity` threshold is too coarse | High | Config UX |
| 4 | `exclude`/`include` mutual exclusivity is unnecessary | Medium | Config UX |
| 5 | `mask` by field name is brittle, should add path-based masking | Medium | Config UX |
| 6 | `requestType` leaks internals, should be in `advanced` | Low | Config UX |
| 7 | `serverSidePropsWrapper` is a missing interception point | **Critical** | Architecture |
| 8 | Fire-and-forget has silent data loss problem, needs startup check | High | Architecture |
| 9 | Module-level audit logger creation has timing problem | High | Architecture |
| 10 | Write mechanism through connections is underspecified | High | Architecture |
| 11 | `extractInitiator` missing `sessionId` and `email` | High | Schema |
| 12 | Batching incompatible with serverless (undocumented) | Medium | Architecture |
| 13 | `audit.fields` operator evaluation timing is unclear | Medium | Build |
| 14 | Auto-detection table lists unverified connection types | Low | Documentation |
| 15 | `applyMask` deep clone overhead on every event | Low | Performance |

### What the Plan Gets Right

- **Reusing connections** instead of a separate storage layer — exactly right
- **No-op pattern** when audit is disabled — zero overhead, clean design
- **Server-side only** — correct for tamper resistance
- **CADF-inspired initiator/target/action/outcome** — good schema foundation
- **Build-time validation** of connectionId — catches misconfig early
- **Fire-and-forget principle** — correct, just needs a startup safety net
- **Separation from operational logger** — important conceptual boundary

### What Needs to Change Before Implementation

1. Add `sessionId` to every event and `journey` as a first-class category
2. Restructure `events` config from required array to optional map with per-category severity
3. Add `serverSidePropsWrapper` as an interception point
4. Add startup connectivity check for the audit connection
5. Specify the direct plugin call write mechanism (bypassing request pipeline)
6. Move `requestType` and `batch` under `advanced`
7. Add path-based masking alongside field-name masking
