# Audit Logging Architecture

How config-driven audit logging is wired into the request lifecycle, and how
events flow from interception points through filtering, batching, and dispatch.

## Overview

Lowdefy's audit logger captures *who did what, when, and to what* — distinct
from `@lowdefy/logger`, which handles operational/diagnostic logging. Audit
events follow a CADF-shaped JSON schema (initiator/target/action/outcome) and
are written through the existing connection plugin system, so they reuse the
same operator evaluation, schema validation, and connection infrastructure as
app data.

The system has two design invariants:

1. **Zero overhead when disabled.** A no-op logger is returned when `audit` is
   not configured. None of the interception points construct an event payload
   in that case.
2. **Audit failures must never break user requests.** Default mode is
   fire-and-forget; failures log a warning. Strict mode (`audit.strict: true`)
   propagates failures as `ServiceError`.

## Configuration Structure

### In lowdefy.yaml

```yaml
audit:
  transport: connection             # connection | stdout
  connectionId: audit_db
  requestType: MongoDBInsertMany    # or AwsS3PutObject
  events: [auth, request, endpoint, authorization, error]
  severity: medium                  # low | medium | high
  strict: false
  mask: [password, ssn]
  capture:
    request: { payload: true, response: false }
    endpoint: { payload: true, response: true }
  fields:
    appName: My App
    environment:
      _secret: ENVIRONMENT
  sampling:
    request: 0.1                    # log 10% of request events
    auth: 1.0
  rateLimit:
    perSecond: 1000
  exclude:
    requests: [fetch_dropdown]
    pages: [public-landing]
  batch:
    enabled: true
    size: 100
    interval: 5000
```

## Build-Time Processing

### Build Step

**File:** `packages/build/src/build/buildAudit/buildAudit.js`

```javascript
function buildAudit({ components, context }) {
  validateAuditConfig({ components, context });

  if (type.isNone(components.audit)) return components;

  // Set defaults for severity, strict, mask, fields, capture, transport, batch
  // Set components.audit.configured (true if transport==stdout OR connectionId present)

  return components;
}
```

Inserted after `buildApi` so `exclude`/`include` references can be validated
against built endpoint and request IDs.

### Validation

**File:** `packages/build/src/build/buildAudit/validateAuditConfig.js`

`validateAuditConfig` performs four levels of validation:

1. **JSON schema** via `lowdefySchema.properties.audit` (ajv).
2. **Transport rules**: when `transport: connection`, both `connectionId` and
   `requestType` are required.
3. **Connection compatibility**: the connection's type must be one of
   `MongoDBCollection` (paired with `MongoDBInsertMany`) or `AwsS3Bucket`
   (paired with `AwsS3PutObject`). The build collects a `ConfigError` for
   unsupported types or mismatched pairings.
4. **Reference resolution**: every id in `exclude`/`include` must reference a
   built page, request, or endpoint id. `exclude` and `include` are mutually
   exclusive.

### Write Artifact

**File:** `packages/build/src/build/writeAudit.js`

Single file `audit.json`, mirroring `writeAuth.js`. Loaded at runtime by all
three server packages (`server`, `server-dev`, `server-e2e`) via
`lib/build/audit.js`.

## Interception Points

The audit logger is invoked from five points in the existing request
lifecycle. No new middleware is added — each point already has access to
`context`, which carries `context.audit` after `apiWrapper` injects it.

| # | File | Event |
|---|------|-------|
| 1 | `packages/api/src/routes/request/callRequest.js` | `request.execute` |
| 2 | `packages/api/src/routes/request/authorizeRequest.js` | `authz.denied` |
| 3 | `packages/api/src/routes/endpoints/callEndpoint.js` | `endpoint.execute` / `endpoint.fail` |
| 4 | `packages/api/src/routes/endpoints/authorizeApiEndpoint.js` | `authz.denied` |
| 5 | `packages/servers/server/lib/server/log/createHandleError.js` | `error.<type>` |

For NextAuth events (`signIn`, `signOut`), the audit logger is wired through
`getAuthOptions` → `getNextAuthConfig` → `createEvents`. This is necessary
because NextAuth callbacks fire outside the apiWrapper context. See the
"Auth Events" section below.

Each call site builds a CADF event payload and passes it to
`context.audit.log(event)`. The hook payload includes `rid: context.rid` so the
shared logger captures the correct per-request id.

## Runtime Architecture

### Logger Lifecycle

**File:** `packages/api/src/audit/createAuditLogger.js`

`createAuditLogger` returns one of:

- A **no-op logger** (`{ enabled: false, log: () => {} }`) when:
  - `auditConfig` is undefined or missing connection details (and not stdout)
  - The context is flagged `__audit: true` (recursion guard during dispatch)
- An **enabled logger** with `{ enabled, transport, log, flush, stop }`

The factory is **cached by auditConfig identity** in a `WeakMap`, so all
requests share a single logger instance with a single batch queue and rate
limiter. The first call's context becomes the "base context" for dispatch
(connections, secrets, operators, jsMap, readConfigFile — all module-level
imports anyway).

### Pipeline

```
                          context.audit.log(event)
                                    |
                                    v
                       shouldAuditEvent(category, severity)
                                    |
                                    v
                       shouldSampleEvent(rate per category)
                                    |
                                    v
                          rateLimiter.check()  →  drop if exceeded
                                    |
                                    v
                          buildAuditEvent (CADF shape)
                                    |
                                    v
                          applyMask (metadata, initiator)
                                    |
                                    v
                +-----------+-------+-------+--------------+
                |           |               |              |
            strict mode  batch.enabled    setImmediate  recursion guard
                |           |               |              |
                v           v               v              v
          dispatchSingle  queue.enqueue  dispatchSingle   no-op
                            |
                            v (size or interval threshold)
                          flushBatch
                            |
                            v
                       dispatchAuditEvent
                            |
                +-----------+-----------+
                |                       |
           transport=stdout    transport=connection
                |                       |
                v                       v
         logger.info(event)    getConnection → getRequestResolver
                               → ServerParser (eval connection props)
                               → resolver({ connection, request, ... })
```

### Dispatch Path

**File:** `packages/api/src/audit/dispatchAuditEvent.js`

The dispatch reuses the existing connection plumbing. It does NOT go through
`callRequest` — that would re-enter authorization, schema validation, and
recursive auditing. Instead:

1. `context.readConfigFile('connections/<id>.json')` loads the audit
   connection config (cached via fileCache).
2. `connections[connectionConfig.type]` resolves the connection plugin.
3. `connection.requests[auditConfig.requestType]` resolves the request handler.
4. A fresh `ServerParser` evaluates the connection's `properties` (with
   `_secret` support, no state/user/payload — those don't apply to audit).
5. The resolver is invoked with the synthesized request properties.

### Recursion Guard

The dispatch context is forked with `__audit: true`:

```javascript
const dispatchContext = { ...baseContext, __audit: true };
```

If anything in the dispatch path tries to log via `context.audit`, the
WeakMap-cached logger sees `__audit: true` on the context and returns the
no-op logger. This prevents an audit write from triggering its own audit
event (which would loop forever on errors).

### Per-Transport Request Properties

**File:** `packages/api/src/audit/buildRequestProperties.js`

The dispatcher needs different request shapes per transport:

| Transport | Single event | Batched events |
|-----------|--------------|----------------|
| `MongoDBInsertMany` | `{ docs: [event] }` | `{ docs: [event1, event2, ...] }` |
| `AwsS3PutObject` | `{ key: 'audit/<date>/<id>.json', body: JSON, contentType }` | `{ key: 'audit/<date>/<first-id>-<last-id>.ndjson', body: NDJSON, contentType }` |
| `stdout` | (n/a — bypasses request properties) | (each event written individually) |

## Filtering, Sampling, and Rate Limiting

### Category Filter

**File:** `packages/api/src/audit/shouldAuditEvent.js`

Combines four checks:

1. `event.category` is in `auditConfig.events`.
2. `event.severity` >= `auditConfig.severity` threshold (low=10, medium=20, high=30).
3. `event.target` does not match any entry in `auditConfig.exclude`.
4. If `auditConfig.include` is set, `event.target` must match an entry.

### Sampling

**File:** `packages/api/src/audit/shouldSampleEvent.js`

Per-category probability between 0 and 1. Uses `Math.random() < rate`. Categories
not listed default to 1.0 (log all). Sampling runs after `shouldAuditEvent` so
filters take precedence.

### Rate Limiter

**File:** `packages/api/src/audit/createRateLimiter.js`

Sliding 1-second window with a counter. When the counter reaches `perSecond`,
new events are dropped and a counter increments. A summary warning is logged
through the operational logger once per minute (60s) with the dropped count.

```javascript
function check() {
  const ts = now();
  if (ts - windowStart >= 1000) { windowStart = ts; countInWindow = 0; }
  reportIfDue();                     // log dropped count if 60s elapsed
  if (countInWindow >= perSecond) { dropped += 1; return false; }
  countInWindow += 1;
  return true;
}
```

## Field Masking

**File:** `packages/api/src/audit/applyMask.js`

A recursive deep-mask that replaces values matching a deny set:

- **User-supplied list**: exact key name match (e.g. `ssn`, `creditCard`).
- **Built-in heuristics**: case-insensitive regex on key names (`password`,
  `token`, `secret`, `authorization`, `apikey`).
- **String length cap**: 10,000 chars to prevent log bloat.
- **Circular references**: replaced with `'[Circular]'`.

Masked values become `'***MASKED***'`. Mask is applied to `event.metadata` and
`event.initiator` after `buildAuditEvent` constructs the canonical event.

## Batching

**File:** `packages/api/src/audit/createAuditQueue.js`

In-memory queue with size and interval triggers. Returns
`{ enqueue, flush, stop, pending }`.

- **Size flush**: when `buffer.length >= size`, flush is triggered immediately.
- **Interval flush**: a `setTimeout(interval)` fires when an event is enqueued
  if no timer is already scheduled. The timer is `unref()`ed so it doesn't keep
  the process alive.
- **Stop flush**: `await stop()` flushes pending events and rejects subsequent
  `enqueue` calls.

The logger registers `process.on('SIGTERM' | 'SIGINT' | 'beforeExit')` exactly
once per process. On any of these signals, all live queues call `stop()` so
in-flight events are not lost.

Strict mode (`audit.strict: true`) bypasses the queue entirely and dispatches
each event immediately.

## App-Level Fields

**File:** `packages/api/src/audit/createAuditLogger.js` → `resolveAppFields`

`audit.fields` may contain operators like `_secret`. They're evaluated **once**
at logger creation using a `ServerParser` with secrets/operators/jsMap from the
base context. The resolved object is closed over and merged into every audit
event's `appFields`.

This avoids re-evaluating operators on every audit event (cheap, but
unnecessary), and ensures NextAuth event handlers (which lack a per-request
parser) still get the resolved values.

## Auth Events

**Files:**

- `packages/servers/server/lib/server/auth/getAuthOptions.js`
- `packages/api/src/routes/auth/getNextAuthConfig.js`
- `packages/api/src/routes/auth/events/createEvents.js`
- `packages/api/src/routes/auth/events/createSignInEvent.js`
- `packages/api/src/routes/auth/events/createSignOutEvent.js`

NextAuth callbacks run inside the auth route handler, which doesn't expose
the apiWrapper's context. The audit logger is created inside `getAuthOptions`
with a synthetic `baseContext` (using module-level imports), then passed
through `getNextAuthConfig` → `createEvents` → individual event creators.

Inside each event creator (`signIn`, `signOut`), the audit logger emits a
matching event. The `initiator` is constructed from the NextAuth `user` /
`token` arguments since there is no request `headers` available.

`createUser`, `linkAccount`, `updateUser`, and `session` accept the audit
parameter but do not emit events in Phase 1 — `session` would generate one
event per JWT refresh and is too noisy for default audit.

## File Layout

```
packages/api/src/audit/
├── createAuditLogger.js       # factory, no-op fallback, WeakMap cache
├── createAuditQueue.js        # in-memory queue with size+interval flush
├── createRateLimiter.js       # 1-second sliding window with dropped-count reporting
├── dispatchAuditEvent.js      # transport-aware dispatch (stdout / connection)
├── buildAuditEvent.js         # CADF event construction
├── buildRequestProperties.js  # per-transport request shape (single + batch)
├── extractInitiator.js        # who from context.user / headers
├── applyMask.js               # deep mask with heuristics + length cap
├── shouldAuditEvent.js        # category + severity + exclude/include filter
├── shouldSampleEvent.js       # per-category probabilistic filter
└── severityLevels.js          # constants and threshold check

packages/build/src/build/buildAudit/
├── buildAudit.js              # build step: defaults + configured flag
└── validateAuditConfig.js     # JSON schema + transport + pairing + references

packages/build/src/build/
└── writeAudit.js              # writes audit.json artifact

packages/plugins/plugins/plugin-aws/src/connections/AwsS3Bucket/
└── AwsS3PutObject/            # new server-side write request type for S3
```

## Decisions and Trade-offs

### Why reuse connection plugins instead of a custom storage abstraction?

Lowdefy already has battle-tested connections with schema validation, operator
evaluation, secret handling, and a wide range of plugins. A separate audit
storage abstraction would duplicate all of this. By using `connectionId`,
audit logging gets MongoDB and S3 today, and any future connection write type
for free (after extending the supported pairings list).

### Why server-side only?

Client-side events can be tampered with — a user can disable JavaScript,
modify payloads, or replay events. Server-side capture at the API layer
ensures every auditable action is recorded by code the user cannot modify.

### Why fire-and-forget by default?

Audit logging should never degrade application availability. If the audit
database is slow or temporarily unavailable, user requests still complete.
For strict compliance, `audit.strict: true` couples request success to
audit success.

### Why a single shared logger, not per-request?

Batching requires a shared queue across all requests. The cached singleton
captures the first request's context as the "base context" for dispatch,
which is fine because the dispatch only depends on module-level imports
(`connections`, `operators`, `secrets`, `jsMap`) plus a stateless
`readConfigFile`. Per-request data (user, headers, rid) is passed through
the event payload at every hook call site.

### Why not per-event-type filtering in Phase 1?

Configuring `events: [auth, request]` is simpler than listing every event
type. Categories provide sensible grouping. If you care about auth events,
you usually care about all of them. Per-event-type filtering can be added
later via `exclude`/`include` extensions if real demand emerges.
