# Audit Logging Framework — Design Plan

## Problem Statement

Lowdefy has no first-class audit logging. The existing `@lowdefy/logger` package handles operational/diagnostic logging (request tracing, error formatting, CLI spinners), but there is no mechanism for apps to capture **who did what, when, and to what** — the core question audit logging answers.

Config-driven platforms like Retool and Appsmith treat audit logging as a first-class feature: automatic capture of authentication events, data access, mutations, admin actions, and configuration changes. Lowdefy should do the same.

## Goals

1. **Config-driven**: Enable audit logging via `lowdefy.yaml` — no code required.
2. **Automatic capture**: The framework captures events at well-defined interception points. App authors don't manually emit audit events.
3. **Pluggable storage**: Audit events write to configurable backends via connection plugins. The same connection system Lowdefy already uses for data access becomes the transport for audit events.
4. **Compliance-aware**: Schema follows OWASP Logging Vocabulary and CADF concepts. Supports filtering, severity levels, and field masking out of the box.
5. **Zero performance impact when disabled**: When `audit` is not configured, no overhead is added.

## Non-Goals

- Real-time alerting/monitoring (separate concern, can be added later via connection webhooks).
- Client-side audit logging (audit events must be server-side for tamper resistance).
- Build-time audit logging of config changes (this is a deployment/CI concern, not a runtime concern).
- Immutable storage guarantees (the storage backend determines immutability; Lowdefy provides the events).

---

## Config Design

### Minimal Setup

```yaml
lowdefy: 4.4.0

audit:
  connectionId: audit_db
  events:
    - auth
    - request

connections:
  - id: audit_db
    type: MongoDBCollection
    properties:
      databaseUri:
        _secret: AUDIT_MONGODB_URI
      collection: audit_log
      write: true
```

This is the simplest possible configuration: point to a connection, list which event categories to capture. The framework handles everything else.

### Full Configuration

```yaml
audit:
  # Required: which connection receives audit events
  connectionId: audit_db

  # Which event categories to capture (required, at least one)
  events:
    - auth           # Login, logout, login failure, session events
    - request        # Database/API request execution
    - endpoint       # API endpoint calls
    - authorization  # Access denied events
    - error          # Server-side errors (ConfigError, ServiceError, PluginError)

  # Optional: minimum severity to log (default: medium)
  # low = everything, medium = skip page views, high = security-critical only
  severity: medium

  # Optional: request type for writing audit events (default: auto-detected)
  # The framework calls this request type on the connection to write each event.
  # For MongoDBCollection this would be MongoDBInsertOne (auto-detected).
  # For AxiosHttp this would be AxiosHttp (auto-detected).
  requestType: MongoDBInsertOne

  # Optional: fields to mask in audit event metadata (default: none)
  # Prevents sensitive data from appearing in audit logs.
  # Applies to request payloads and connection properties logged in metadata.
  mask:
    - password
    - ssn
    - creditCard
    - databaseUri

  # Optional: additional fields to include in every audit event
  fields:
    appName: My App
    environment:
      _build.env: ENVIRONMENT

  # Optional: which pages/requests to exclude from audit logging
  # Useful for high-volume, low-value operations
  exclude:
    pages:
      - public-landing
    requests:
      - fetch-dropdown-options
    endpoints:
      - health-check

  # Optional: which pages/requests to include (if set, only these are audited)
  # Cannot be combined with exclude
  include:
    requests:
      - update-user-profile
      - delete-account
```

### Why This Shape

**`connectionId` reuses existing infrastructure.** Audit events write through the same connection system as app data. No new storage abstraction needed. Developers already know how to configure MongoDB, PostgreSQL, HTTP endpoints. Want to send audit events to Datadog? Use `AxiosHttp`. Want a local JSON file? Use a file-based connection (or stdout via a future connection type).

**`events` is an explicit allow-list.** Rather than logging everything and filtering, the developer chooses which categories matter. This prevents surprise storage costs and keeps the config intentional. Categories map to OWASP Logging Vocabulary prefixes.

**`severity` provides a secondary filter.** Within each category, events have inherent severity. `auth.login_fail` is higher severity than `auth.login_success`. The severity filter controls granularity without changing the category list.

**`mask` prevents secrets in audit logs.** OWASP mandates never logging passwords, tokens, or PII. The mask list applies deep field-name matching to any metadata captured in audit events.

**`exclude`/`include` give per-resource control.** Some requests fire hundreds of times per session (dropdown options, autocomplete). These should not generate audit events. The exclude/include lists target specific page/request/endpoint IDs.

---

## Audit Event Schema

Every audit event follows a consistent JSON structure inspired by CADF (initiator/target/action/outcome) and OWASP Logging Vocabulary naming:

```json
{
  "id": "evt_01HrJWpYyWqpQCxLB3SZhgoB",
  "timestamp": "2026-02-15T10:30:00.000Z",
  "eventType": "request.execute",
  "category": "request",
  "severity": "medium",

  "initiator": {
    "userId": "user_123",
    "sub": "google-oauth2|abc",
    "roles": ["editor"],
    "ip": "192.168.1.10",
    "userAgent": "Mozilla/5.0..."
  },

  "target": {
    "type": "request",
    "id": "update_user_profile",
    "connectionId": "app_mongodb",
    "connectionType": "MongoDBCollection",
    "pageId": "user-settings"
  },

  "action": "execute",
  "outcome": "success",

  "metadata": {
    "requestType": "MongoDBUpdateOne",
    "duration": 42,
    "blockId": "save_button"
  },

  "rid": "req_xyz789",
  "appFields": {
    "appName": "My App",
    "environment": "production"
  }
}
```

### Event Types by Category

| Category | Event Type | Severity | When |
|----------|-----------|----------|------|
| **auth** | `auth.login_success` | medium | Successful NextAuth sign-in |
| **auth** | `auth.login_fail` | high | Failed sign-in attempt |
| **auth** | `auth.logout` | medium | User signs out |
| **auth** | `auth.session_created` | low | New session established |
| **auth** | `auth.token_created` | medium | API key / JWT strategy auth succeeds |
| **auth** | `auth.token_fail` | high | API key / JWT strategy auth fails |
| **request** | `request.execute` | medium | Request completes successfully |
| **request** | `request.fail` | high | Request fails (plugin error, service error) |
| **endpoint** | `endpoint.execute` | medium | API endpoint completes |
| **endpoint** | `endpoint.fail` | high | API endpoint fails |
| **authorization** | `authz.denied` | high | User lacks required role |
| **authorization** | `authz.denied_unauthenticated` | high | No session and no valid strategy |
| **error** | `error.config` | high | ConfigError at runtime |
| **error** | `error.service` | high | ServiceError (external service failure) |
| **error** | `error.plugin` | medium | PluginError (operator/action failure) |

### Severity Levels

| Level | Value | Description |
|-------|-------|-------------|
| `low` | 10 | Informational events (sessions, page views) |
| `medium` | 20 | Normal auditable operations (successful requests) |
| `high` | 30 | Security-relevant events (auth failures, access denied, errors) |

Config `severity: medium` means only events with severity >= 20 are logged. Default is `medium`.

---

## Architecture

### Interception Points

Audit events are captured at five points in the existing request lifecycle. No new middleware layer is needed — the framework wraps existing functions.

```
                        apiWrapper.js
                            |
                   createApiContext()
                            |
              +-------------+-------------+
              |                           |
         callRequest()              callEndpoint()
              |                           |
     [AUDIT: request.*]          [AUDIT: endpoint.*]
              |                           |
         (errors caught)            (errors caught)
              |                           |
     [AUDIT: error.*]              [AUDIT: error.*]
              |                           |
        Response sent                Response sent


    getServerSession() / resolveAuthentication()
              |
     [AUDIT: auth.*, authz.*]
```

| # | Interception Point | File | Events Captured |
|---|-------------------|------|-----------------|
| 1 | `apiWrapper.js` — after session resolution | `packages/servers/server/lib/server/apiWrapper.js:58` | `auth.login_success`, `auth.token_created`, `auth.token_fail`, `authz.denied_unauthenticated` |
| 2 | `authorizeRequest.js` / `authorizeApiEndpoint.js` — on denial | `packages/api/src/routes/request/authorizeRequest.js:23` | `authz.denied` |
| 3 | `callRequest.js` — after successful execution | `packages/api/src/routes/request/callRequest.js:78` | `request.execute` |
| 4 | `callEndpoint.js` — after routine completes | `packages/api/src/routes/endpoints/callEndpoint.js:47` | `endpoint.execute`, `endpoint.fail` |
| 5 | `logError.js` — on caught errors | `packages/servers/server/lib/server/log/logError.js:38` | `error.config`, `error.service`, `error.plugin`, `request.fail` |

### Auth Events (NextAuth Callbacks)

Auth login/logout events are captured via NextAuth event callbacks, not the API wrapper. The existing `buildAuth` pipeline already supports `events` plugins. A built-in audit event plugin hooks into NextAuth's `signIn`, `signOut`, and `session` events:

```
NextAuth signIn event  → [AUDIT: auth.login_success / auth.login_fail]
NextAuth signOut event → [AUDIT: auth.logout]
NextAuth session event → [AUDIT: auth.session_created] (if severity: low)
```

This is cleaner than intercepting in `apiWrapper` because NextAuth already has a well-defined event system with all the user/account data.

### Write Path

Audit events are written asynchronously via the existing connection plugin system. The audit logger:

1. Constructs the audit event object
2. Applies `mask` to strip sensitive fields
3. Applies `severity` and `exclude`/`include` filters
4. Calls the connection's write request type with the event as payload

```javascript
// Pseudocode — the audit writer
async function writeAuditEvent(context, event) {
  // Apply filters
  if (event.severity < context.audit.severityThreshold) return;
  if (isExcluded(context.audit, event)) return;

  // Apply field masking
  const masked = applyMask(event, context.audit.mask);

  // Add app-level fields
  masked.appFields = context.audit.fields;

  // Write via connection (fire-and-forget, errors logged but don't crash request)
  try {
    await callAuditWrite(context, masked);
  } catch (err) {
    context.logger.warn({ event: 'audit_write_failed', error: err.message });
  }
}
```

**Fire-and-forget with error logging.** Audit write failures are logged as warnings but never crash the request. The user's request always completes. This follows the principle that observability infrastructure should not affect application availability.

### Connection Auto-Detection

The framework auto-detects the appropriate write request type based on the connection type:

| Connection Type | Auto-Detected Write Request | Payload Shape |
|----------------|---------------------------|---------------|
| `MongoDBCollection` | `MongoDBInsertOne` | `{ doc: auditEvent }` |
| `MongoDBCollection` | `MongoDBInsertMany` (batched) | `{ docs: [events] }` |
| `AxiosHttp` | `AxiosHttp` | `{ method: 'POST', data: auditEvent }` |
| `Knex` | `KnexRaw` | `INSERT INTO audit_log ...` |
| `Elasticsearch` | `ElasticsearchIndex` | `{ index, body: auditEvent }` |

If the auto-detected type is wrong, the developer overrides with `requestType` in the audit config.

### Batching (Optional Enhancement)

For high-traffic apps, individual writes per audit event are inefficient. An optional batching mode collects events and flushes periodically:

```yaml
audit:
  connectionId: audit_db
  events: [auth, request]
  batch:
    enabled: true
    size: 100       # Flush every 100 events
    interval: 5000  # Or every 5 seconds, whichever comes first
```

This uses an in-memory buffer with `setInterval` and size-based flushing. Events are written via `MongoDBInsertMany` (or equivalent batch endpoint). The buffer flushes on process shutdown (`SIGTERM`/`SIGINT` handler).

Batching is a Phase 2 enhancement — Phase 1 writes each event individually.

---

## Build-Time Processing

### Schema Addition

Add `audit` to the root schema in `lowdefySchema.js`:

```javascript
audit: {
  type: 'object',
  additionalProperties: false,
  errorMessage: { type: 'App "audit" should be an object.' },
  properties: {
    '~ignoreBuildChecks': { /* standard */ },
    '~r': {},
    '~l': {},
    connectionId: {
      type: 'string',
      errorMessage: { type: 'App "audit.connectionId" should be a string.' },
    },
    events: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['auth', 'request', 'endpoint', 'authorization', 'error'],
      },
      minItems: 1,
      errorMessage: {
        type: 'App "audit.events" should be an array of event category strings.',
        minItems: 'App "audit.events" should have at least one event category.',
      },
    },
    severity: {
      type: 'string',
      enum: ['low', 'medium', 'high'],
      errorMessage: {
        type: 'App "audit.severity" should be "low", "medium", or "high".',
      },
    },
    requestType: {
      type: 'string',
      errorMessage: { type: 'App "audit.requestType" should be a string.' },
    },
    mask: {
      type: 'array',
      items: { type: 'string' },
      errorMessage: { type: 'App "audit.mask" should be an array of strings.' },
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
  required: ['connectionId', 'events'],
}
```

### Build Step: `buildAudit.js`

New build step between `buildConnections` and `buildPages` in the pipeline:

```javascript
function buildAudit({ components, context }) {
  if (type.isNone(components.audit)) {
    components.audit = {};
    return components;
  }

  // Validate connectionId references a defined connection
  if (!context.connectionIds.has(components.audit.connectionId)) {
    throw new ConfigError({
      message: `Audit connectionId "${components.audit.connectionId}" is not defined in connections.`,
      configKey: components.audit['~k'],
      context,
    });
  }

  // Validate exclude/include mutual exclusivity
  if (!type.isNone(components.audit.exclude) && !type.isNone(components.audit.include)) {
    throw new ConfigError({
      message: 'Audit config cannot have both "exclude" and "include". Use one or the other.',
      configKey: components.audit['~k'],
      context,
    });
  }

  // Set defaults
  if (type.isNone(components.audit.severity)) {
    components.audit.severity = 'medium';
  }
  if (type.isNone(components.audit.mask)) {
    components.audit.mask = [];
  }

  // Count operators in audit.fields for build-time evaluation
  countOperators(components.audit.fields ?? {}, context);

  return components;
}
```

### Write Step: `writeAudit.js`

```javascript
async function writeAudit({ components, context }) {
  await context.writeBuildArtifact(
    'audit.json',
    serializer.serializeToString(components.audit ?? {})
  );
}
```

### Build Pipeline Integration

In `packages/build/src/index.js`, add after `buildConnections`:

```javascript
tryBuildStep(buildConnections, 'buildConnections', { components, context });
tryBuildStep(buildAudit, 'buildAudit', { components, context });  // NEW
tryBuildStep(buildApi, 'buildApi', { components, context });
```

And in the write phase:

```javascript
await writeConnections({ components, context });
await writeAudit({ components, context });  // NEW
await writeApi({ components, context });
```

---

## Runtime Implementation

### Core: `createAuditLogger.js`

New module in `packages/api/src/audit/`:

```
packages/api/src/audit/
├── createAuditLogger.js     # Factory that creates the audit logger
├── writeAuditEvent.js       # Writes a single event via connection
├── applyMask.js             # Deep field masking utility
├── buildAuditEvent.js       # Constructs event object from context
├── resolveRequestType.js    # Auto-detects write request type
└── severityLevels.js        # Severity constants and comparison
```

`createAuditLogger` is called once per server startup (like `getAuthOptions`). It reads `audit.json`, resolves the connection, and returns an object with methods for each event type:

```javascript
function createAuditLogger({ auditConfig, connections, secrets }) {
  if (type.isNone(auditConfig) || type.isNone(auditConfig.connectionId)) {
    // Return no-op logger — zero overhead when audit is disabled
    return {
      logAuth: noop,
      logRequest: noop,
      logEndpoint: noop,
      logAuthz: noop,
      logError: noop,
    };
  }

  const writeEvent = createWriteEvent({ auditConfig, connections, secrets });

  return {
    logAuth(event) { writeEvent({ ...event, category: 'auth' }); },
    logRequest(event) { writeEvent({ ...event, category: 'request' }); },
    logEndpoint(event) { writeEvent({ ...event, category: 'endpoint' }); },
    logAuthz(event) { writeEvent({ ...event, category: 'authorization' }); },
    logError(event) { writeEvent({ ...event, category: 'error' }); },
  };
}
```

### Integration: `apiWrapper.js`

The audit logger is created once and added to every request context:

```javascript
// At module level (once on startup)
import auditConfig from '../build/audit.js';
const auditLogger = createAuditLogger({ auditConfig, connections, secrets });

function apiWrapper(handler) {
  return async function wrappedHandler(req, res) {
    const context = {
      // ... existing fields ...
      audit: auditLogger,
    };
    // ... existing logic ...
  };
}
```

### Integration: `callRequest.js`

After successful request execution (line 78):

```javascript
const response = await callRequestResolver(context, { /* ... */ });

// Audit: request.execute
context.audit.logRequest({
  eventType: 'request.execute',
  severity: 'medium',
  initiator: extractInitiator(context),
  target: {
    type: 'request',
    id: requestConfig.requestId,
    connectionId: connectionConfig.connectionId,
    connectionType: connectionConfig.type,
    pageId: context.pageId,
  },
  action: 'execute',
  outcome: 'success',
  metadata: { requestType: requestConfig.type, blockId: context.blockId },
  rid: context.rid,
});

return { id: requestConfig.id, success: true, type: requestConfig.type, response: serializer.serialize(response) };
```

### Integration: `callEndpoint.js`

After routine completes (line 47):

```javascript
const { error, response, status } = await runRoutine(context, routineContext, { /* ... */ });
const success = !['error', 'reject'].includes(status);

// Audit: endpoint.*
context.audit.logEndpoint({
  eventType: success ? 'endpoint.execute' : 'endpoint.fail',
  severity: success ? 'medium' : 'high',
  initiator: extractInitiator(context),
  target: { type: 'endpoint', id: endpointId, pageId: context.pageId },
  action: 'execute',
  outcome: success ? 'success' : 'failure',
  metadata: { status, blockId: context.blockId },
  rid: context.rid,
});
```

### Integration: `authorizeRequest.js` / `authorizeApiEndpoint.js`

On authorization failure:

```javascript
if (!context.authorize(requestConfig)) {
  context.audit.logAuthz({
    eventType: 'authz.denied',
    severity: 'high',
    initiator: extractInitiator(context),
    target: { type: 'request', id: requestConfig.requestId, pageId: context.pageId },
    action: 'authorize',
    outcome: 'denied',
    rid: context.rid,
  });
  throw new ConfigError(/* existing error */);
}
```

### Integration: `logError.js`

After error classification (existing code, line 38+):

```javascript
// After classifying error type
context.audit.logError({
  eventType: `error.${errorType}`,
  severity: 'high',
  initiator: extractInitiator(context),
  target: { type: context.endpointId ? 'endpoint' : 'request' },
  action: 'error',
  outcome: 'failure',
  metadata: { errorName: error.name, errorMessage: error.message },
  rid: context.rid,
});
```

### Integration: NextAuth Events (Auth Category)

In `getNextAuthConfig.js`, add audit callbacks to NextAuth's event system:

```javascript
// Inside getNextAuthConfig, add events
events: {
  signIn({ user, account, isNewUser }) {
    auditLogger.logAuth({
      eventType: 'auth.login_success',
      severity: 'medium',
      initiator: { userId: user.id, sub: user.sub },
      target: { type: 'auth', id: account?.provider },
      action: 'signIn',
      outcome: 'success',
      metadata: { isNewUser, provider: account?.provider },
    });
  },
  signOut({ token }) {
    auditLogger.logAuth({
      eventType: 'auth.logout',
      severity: 'medium',
      initiator: { userId: token.sub },
      target: { type: 'auth' },
      action: 'signOut',
      outcome: 'success',
    });
  },
}
```

### Helper: `extractInitiator.js`

Extracts the `initiator` block from the request context:

```javascript
function extractInitiator(context) {
  const user = context.user ?? context.session?.user ?? {};
  return {
    userId: user.id ?? user.sub,
    sub: user.sub,
    roles: user.roles,
    ip: context.headers?.['x-forwarded-for']
      ?? context.headers?.['x-real-ip']
      ?? context.headers?.['cf-connecting-ip'],
    userAgent: context.headers?.['user-agent'],
  };
}
```

### Helper: `applyMask.js`

Deep field masking that replaces values of fields matching the mask list:

```javascript
function applyMask(obj, maskFields) {
  if (maskFields.length === 0) return obj;
  const masked = serializer.copy(obj);
  deepMask(masked, new Set(maskFields));
  return masked;
}

function deepMask(obj, maskSet) {
  if (!type.isObject(obj)) return;
  Object.keys(obj).forEach((key) => {
    if (maskSet.has(key)) {
      obj[key] = '***MASKED***';
    } else if (type.isObject(obj[key])) {
      deepMask(obj[key], maskSet);
    } else if (type.isArray(obj[key])) {
      obj[key].forEach((item) => deepMask(item, maskSet));
    }
  });
}
```

---

## Files Changed

### New Files

| File | Purpose |
|------|---------|
| `packages/api/src/audit/createAuditLogger.js` | Factory for audit logger (no-op when disabled) |
| `packages/api/src/audit/writeAuditEvent.js` | Writes audit event via connection |
| `packages/api/src/audit/applyMask.js` | Deep field masking |
| `packages/api/src/audit/buildAuditEvent.js` | Constructs standardized event object |
| `packages/api/src/audit/extractInitiator.js` | Extracts user/IP/UA from context |
| `packages/api/src/audit/resolveRequestType.js` | Auto-detects write request type for connection |
| `packages/api/src/audit/severityLevels.js` | Severity constants and threshold check |
| `packages/build/src/build/buildAudit.js` | Build step: validates audit config |
| `packages/build/src/build/writeAudit.js` | Write step: serializes audit.json |

### Modified Files

| File | Change |
|------|--------|
| `packages/build/src/lowdefySchema.js` | Add `audit` to root schema properties |
| `packages/build/src/index.js` | Add `buildAudit` and `writeAudit` steps |
| `packages/servers/server/lib/server/apiWrapper.js` | Create audit logger, add to context |
| `packages/servers/server-dev/lib/server/apiWrapper.js` | Same as production apiWrapper |
| `packages/api/src/routes/request/callRequest.js` | Add `audit.logRequest()` after execution |
| `packages/api/src/routes/request/authorizeRequest.js` | Add `audit.logAuthz()` on denial |
| `packages/api/src/routes/endpoints/callEndpoint.js` | Add `audit.logEndpoint()` after routine |
| `packages/api/src/routes/endpoints/authorizeApiEndpoint.js` | Add `audit.logAuthz()` on denial |
| `packages/servers/server/lib/server/log/logError.js` | Add `audit.logError()` after classification |
| `packages/api/src/routes/auth/getNextAuthConfig.js` | Add audit events to NextAuth config |

### Unchanged Files

| File | Why |
|------|-----|
| `packages/api/src/context/createApiContext.js` | Audit logger is added to context in apiWrapper, not here |
| `packages/api/src/context/createAuthorize.js` | Authorization logic unchanged |
| `packages/api/src/routes/request/callRequestResolver.js` | Error wrapping unchanged, audit captures in outer layer |
| `packages/engine/src/` | Client-side engine unchanged — audit is server-side only |
| `packages/client/src/` | Client unchanged |
| `packages/build/src/build/buildAuth/` | Auth build pipeline unchanged |
| `packages/build/src/build/buildConnections.js` | Connection build unchanged |

---

## Implementation Phases

### Phase 1: Foundation (Core Framework)

1. **Schema**: Add `audit` to `lowdefySchema.js`
2. **Build**: Create `buildAudit.js` and `writeAudit.js`, integrate into build pipeline
3. **Runtime core**: Create `createAuditLogger.js` with no-op pattern, `writeAuditEvent.js`, `applyMask.js`, `extractInitiator.js`, `severityLevels.js`
4. **apiWrapper integration**: Load audit config, create audit logger, inject into context
5. **Request audit**: Add audit calls to `callRequest.js`
6. **Endpoint audit**: Add audit calls to `callEndpoint.js`
7. **Authorization audit**: Add audit calls to `authorizeRequest.js` and `authorizeApiEndpoint.js`
8. **Error audit**: Add audit calls to `logError.js`

### Phase 2: Auth Events

9. **NextAuth integration**: Add audit event callbacks to `getNextAuthConfig.js`
10. **Strategy auth events**: Integrate with API auth strategies plan (if implemented)

### Phase 3: Enhanced Features

11. **Batching**: In-memory buffer with size/interval flushing
12. **Connection auto-detection**: `resolveRequestType.js` for all supported connection types
13. **Exclude/include filtering**: Per-request and per-endpoint filtering

### Phase 4: Testing & Documentation

14. **Unit tests**: All new modules (`createAuditLogger`, `applyMask`, `buildAudit`, etc.)
15. **Integration tests**: End-to-end audit event capture for each event type
16. **User docs**: `packages/docs/` pages for audit configuration
17. **cc-docs**: Architecture documentation for the audit system

---

## Design Decisions

### Why Reuse Connections Instead of a Custom Storage Layer?

**Considered**: A dedicated `audit.storage` abstraction with `type: mongodb | postgres | file | cloudwatch`.

**Decided**: Reuse existing connection plugins.

**Reasoning**: Lowdefy already has a battle-tested connection system with schema validation, operator evaluation (`_secret` resolution), and a wide range of plugins. Creating a parallel storage abstraction would duplicate all of this. By using `connectionId`, audit logging gets MongoDB, PostgreSQL, HTTP APIs, Elasticsearch, and any future connection type for free. Developers configure audit storage the same way they configure data storage — no new concepts to learn.

**Trade-off**: The connection must support a write operation. Read-only connections (where `write: false`) will cause a build-time error. The auto-detection logic must map connection types to their write request types. For unusual connection types, the developer specifies `requestType` manually.

### Why Server-Side Only?

Client-side audit events can be tampered with. A user could disable JavaScript, modify the audit payload, or replay events. Server-side capture at the API layer ensures every auditable action is recorded by code the user cannot modify.

The client's `eventLog` (in `packages/engine/src/Events.js`) is useful for debugging but not for compliance. Audit events must originate from the server.

### Why Fire-and-Forget?

Audit logging should never degrade application performance. If the audit database is slow or temporarily unavailable, user requests should still complete. Audit write failures are logged as warnings through the operational logger — the ops team can monitor these and fix the audit database without affecting users.

For strict compliance requirements where audit write failure should halt operations, a future `audit.strict: true` option could be added. This is explicitly deferred to avoid over-engineering the initial implementation.

### Why Categories Instead of Individual Event Types?

Configuring `events: [auth, request]` is simpler than listing `events: [auth.login_success, auth.login_fail, auth.logout, request.execute, request.fail]`. Categories provide sensible grouping — if you care about auth events, you care about all of them. The `severity` filter provides secondary granularity within categories.

Individual event type filtering is possible through `exclude`/`include` in Phase 3 if needed.

### Why Not Extend the Existing Logger?

The `@lowdefy/logger` package is for operational logging — diagnostic information for developers and ops teams. Audit logging is fundamentally different:

- **Different audience**: Audit logs are for compliance officers, security teams, and auditors.
- **Different storage**: Operational logs go to stdout/Sentry. Audit logs go to databases with retention policies.
- **Different schema**: Operational logs are free-form text. Audit logs have strict who/what/when/where structure.
- **Different lifecycle**: Operational logs can be deleted after debugging. Audit logs must be retained for years.

Conflating these into one system would force compromises on both. The audit logger is a separate, purpose-built system that happens to use the same connection infrastructure.

---

## Interaction with Planned Features

### API Auth Strategies (Planned)

The audit logging framework is designed to work with the API auth strategies plan. When `resolveAuthentication()` authenticates via API key or JWT:

- **Success**: `auth.token_created` event with strategy ID
- **Failure**: `auth.token_fail` event with strategy ID
- `extractInitiator()` works with both session users and strategy users

No changes to the audit framework are needed when auth strategies are implemented — the interception points already exist.

### MCP Bridge (Planned)

The MCP bridge plan mentions "session event log / audit trail." The audit logging framework provides exactly this. MCP bridge requests that flow through the API layer will automatically generate audit events. MCP-specific event types (e.g., `mcp.tool_call`) can be added as a new category in Phase 3+.

---

## Example: Complete App with Audit Logging

```yaml
lowdefy: 4.4.0
name: HR Portal

audit:
  connectionId: audit_log
  events:
    - auth
    - request
    - authorization
    - error
  severity: low
  mask:
    - password
    - ssn
    - salary
  fields:
    appName: HR Portal
    environment:
      _build.env: NODE_ENV
  exclude:
    requests:
      - fetch_department_list
      - fetch_role_options

connections:
  - id: app_db
    type: MongoDBCollection
    properties:
      databaseUri:
        _secret: MONGODB_URI
      collection: employees
      read: true
      write: true

  - id: audit_log
    type: MongoDBCollection
    properties:
      databaseUri:
        _secret: AUDIT_MONGODB_URI
      collection: audit_events
      write: true

pages:
  - id: employee-list
    type: PageHeaderMenu
    auth:
      public: false
      roles:
        - hr-admin
        - hr-viewer
    requests:
      - id: fetch_employees
        type: MongoDBFind
        connectionId: app_db
        properties:
          query: {}
      - id: fetch_department_list
        type: MongoDBDistinct
        connectionId: app_db
        properties:
          field: department
    # ...blocks...
```

In this setup:
- Every login/logout is audit logged
- Every `fetch_employees` request generates an audit event (who accessed employee data?)
- `fetch_department_list` is excluded (high-volume, low-value dropdown data)
- `salary` and `ssn` fields are masked in any audit metadata
- Authorization denials are captured (someone tried to access HR data without the right role)
- All errors are captured with context for investigation

---

## Open Questions

1. **Should audit events include request payloads?** Payloads can contain sensitive data. The `mask` config helps, but payloads can be large. Options: (a) never include payloads, (b) include by default with masking, (c) add `includePayloads: true` config option.

2. **Should the audit connection be validated at startup?** Currently, connection validation happens during request execution. For audit logging, a startup validation (test write) would catch misconfigured audit connections before any requests are served. This would require a new startup hook.

3. **Should audit events capture request/response duration?** This is useful for performance auditing but adds overhead (wrapping with timing). The current plan includes `duration` in metadata for requests — confirm this is desired.

4. **Should there be a built-in stdout audit provider?** For development/testing, writing audit events to stdout (via the operational logger) would be convenient. This could be a special `connectionId: stdout` value that bypasses the connection system.
