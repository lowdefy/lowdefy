# Key Takeaways per File

What each file does today, how the audit logging plan affects it, and what to watch for.

---

## Build-Time Files

### `packages/build/src/lowdefySchema.js`

**What it does**: AJV schema that validates the entire `lowdefy.yaml` config. Uses `additionalProperties: false` on the root object, so any new top-level key must be explicitly added to `properties`.

**Plan impact**: Add `audit` property to root schema with nested validation for `connectionId`, `events`, `severity`, `mask`, `fields`, `exclude`, `include`, `batch`.

**Key takeaway**: The schema is strict — `additionalProperties: false` means any typo in audit config (e.g., `conectionId`) will produce a clear validation error. Follow the exact pattern used by `logger` for the new `audit` property. The `events` array uses `enum` to restrict valid category names.

---

### `packages/build/src/index.js`

**What it does**: Orchestrates the 31-step build pipeline. Steps are grouped: load/parse, validate, transform, write.

**Plan impact**: Add `buildAudit` between `buildConnections` and `buildApi` (must run after connections are built so `connectionIds` set is populated). Add `writeAudit` in the write phase.

**Key takeaway**: `buildAudit` must run AFTER `buildConnections` because it validates that `audit.connectionId` references a defined connection. The `context.connectionIds` set is populated by `buildConnections`. Running before would miss the validation.

---

### `packages/build/src/build/buildLogger.js`

**What it does**: Sets defaults for `components.logger`. If `sentry` is explicitly configured, merges with defaults.

**Plan impact**: NONE directly, but `buildAudit.js` follows the same pattern: set `components.audit = {}` if not configured, apply defaults otherwise.

**Key takeaway**: This is the closest pattern to follow for `buildAudit.js`. Same structure: check `type.isNone()`, set defaults, merge. The logger build step is simple because it just sets defaults — audit build adds validation (connection existence check).

---

### `packages/build/src/build/writeLogger.js`

**What it does**: Writes `logger.json` build artifact.

**Plan impact**: `writeAudit.js` follows the exact same pattern — one-liner that writes `audit.json`.

**Key takeaway**: Build artifacts default to `{}` when not configured. This means runtime code can always import `audit.json` without existence checks.

---

### `packages/build/src/build/buildConnections.js`

**What it does**: Validates connections, tracks IDs in `context.connectionIds`, counts operator usage.

**Plan impact**: NONE. But this is a dependency — `buildAudit` reads `context.connectionIds` to validate the audit connection exists.

**Key takeaway**: `context.connectionIds` is a `Set()`. The check in `buildAudit` is `context.connectionIds.has(components.audit.connectionId)`.

---

## Runtime: Server Files

### `packages/servers/server/lib/server/apiWrapper.js`

**What it does**: Wraps all API route handlers. Creates context with `rid`, logger, session, auth options. Calls `createApiContext()`, `logRequest()`, then the handler. Catches errors via `logError()`.

**Plan impact**: Import `auditConfig` from `../build/audit.js`. Create `auditLogger` once at module level via `createAuditLogger()`. Add `audit: auditLogger` to the context object.

**Key takeaway**: The audit logger is created ONCE at module level (not per request). It's a stateless object with methods like `logRequest()`, `logEndpoint()`. When audit is not configured, it's a no-op object — zero per-request overhead.

The `try/catch` block around the handler (lines 70-73) is where error audit events are emitted (via `logError.js` which has access to `context.audit`).

---

### `packages/servers/server-dev/lib/server/apiWrapper.js`

**What it does**: Same as production apiWrapper but for dev server.

**Plan impact**: Same changes as production apiWrapper. The dev server should also generate audit events for testing purposes.

**Key takeaway**: Both apiWrapper files must stay in sync. Consider extracting shared audit setup logic if the duplication becomes maintenance burden.

---

### `packages/servers/server/lib/server/log/logRequest.js`

**What it does**: Logs every API request with user, URL, method, headers.

**Plan impact**: NONE directly. This is operational logging, not audit logging. Both coexist.

**Key takeaway**: `logRequest` fires for EVERY request. Audit logging is selective (filtered by category, severity, exclude/include). Don't conflate the two — they serve different purposes.

---

### `packages/servers/server/lib/server/log/logError.js`

**What it does**: Classifies errors (ServiceError, PluginError, ConfigError, LowdefyError), resolves config location, logs structured error info, sends to Sentry.

**Plan impact**: Add `context.audit.logError()` call after error classification. The error type, message, user context, and request context are already available at this point.

**Key takeaway**: `logError` is async (it resolves config location for ConfigErrors). The audit call should also be async but fire-and-forget. Don't `await` the audit write — the error response to the client should not wait for audit.

The error classification switch (lines 22-36) maps error classes to string types. The audit event uses these same types: `error.config`, `error.service`, `error.plugin`, `error.lowdefy`.

---

### `packages/servers/server/lib/server/log/createLogger.js`

**What it does**: Creates Pino logger with request ID (`rid`).

**Plan impact**: NONE. Operational logger is separate from audit logger.

---

## Runtime: API Layer

### `packages/api/src/routes/request/callRequest.js`

**What it does**: Full request execution pipeline: load config → authorize → evaluate operators → validate schemas → execute → return response.

**Plan impact**: Add `context.audit.logRequest()` call after successful execution (line 78, before the return). The audit event captures request ID, connection ID, page ID, block ID, duration.

**Key takeaway**: The audit call goes AFTER `callRequestResolver` but BEFORE the return. If `callRequestResolver` throws, the error flows to `logError.js` which handles audit logging for errors. The success case is handled here.

Duration measurement: wrap the `callRequestResolver` call with `Date.now()` before and after. This is minimal overhead.

---

### `packages/api/src/routes/request/authorizeRequest.js`

**What it does**: Calls `context.authorize(requestConfig)`. On failure, throws ConfigError with "does not exist" message.

**Plan impact**: Add `context.audit.logAuthz()` call BEFORE throwing the error. The audit event captures the denied access attempt.

**Key takeaway**: The error message deliberately says "does not exist" instead of "access denied" to prevent information leakage. The audit event records the real reason (`authz.denied`) — this is visible only in the audit log, not to the user.

---

### `packages/api/src/routes/request/callRequestResolver.js`

**What it does**: Executes the actual database/API call. Wraps errors with configKey, classifies as ConfigError/ServiceError/PluginError.

**Plan impact**: NONE. Errors from here propagate to `logError.js` where audit is handled.

**Key takeaway**: Don't add audit logging here. The error classification and context enrichment happens in this file, but the audit event should be emitted at the outer layer (logError.js) where the full context is available. Adding audit here would create duplicate events for errors.

---

### `packages/api/src/routes/endpoints/callEndpoint.js`

**What it does**: Orchestrates endpoint execution: get config → authorize → run routine → return response.

**Plan impact**: Add `context.audit.logEndpoint()` call after routine completes (line 47). The event captures success/failure, endpoint ID, status.

**Key takeaway**: The `success` variable (line 47) already determines whether the endpoint succeeded. Use this for the audit event's `outcome` field. The response includes `error` for failed routines — audit events for endpoint failures should not include the full error response (it may contain sensitive data).

---

### `packages/api/src/routes/endpoints/authorizeApiEndpoint.js`

**What it does**: Same pattern as `authorizeRequest.js`. Calls `context.authorize(endpointConfig)`.

**Plan impact**: Add `context.audit.logAuthz()` call before throwing error, same as `authorizeRequest.js`.

---

### `packages/api/src/context/createApiContext.js`

**What it does**: Sets `context.state = {}`, `context.user = session.user`, creates `authorize` and `readConfigFile`.

**Plan impact**: NONE. The audit logger is added to context in `apiWrapper.js`, not here.

**Key takeaway**: `context.user` is set from session here. The audit `extractInitiator()` reads `context.user` — so it picks up the right user whether from session or future strategy auth.

---

### `packages/api/src/routes/auth/getNextAuthConfig.js`

**What it does**: Initializes NextAuth config. Creates adapter, callbacks, events, providers. Caches result.

**Plan impact**: Add audit event callbacks to NextAuth's `events` object: `signIn`, `signOut`. These fire when NextAuth processes auth events.

**Key takeaway**: This function runs ONCE at startup and caches. The audit logger must be passed in (or available via closure) at creation time. Since `apiWrapper.js` creates the audit logger at module level before `getAuthOptions` is called, the audit logger is available.

The existing `events` in NextAuth config comes from auth plugins (`components.auth.events`). The audit events should be added alongside (not replacing) any user-configured auth events. Use array composition, not overwrite.

---

## Utility Files

### `packages/utils/helpers/src/serializer.js`

**What it does**: Deep clone with type preservation (`~d`, `~e`, `~r`, `~k` markers).

**Plan impact**: Used by `applyMask.js` to deep-clone events before masking. Used by `writeAuditEvent.js` to serialize events.

**Key takeaway**: `serializer.copy()` is the standard way to deep-clone in Lowdefy. Use it instead of `JSON.parse(JSON.stringify())` to preserve Date objects in audit events.

---

### `packages/utils/errors/`

**What it does**: Error class hierarchy (ConfigError, PluginError, ServiceError, etc.).

**Plan impact**: `buildAudit.js` throws `ConfigError` for invalid audit config (missing connection, conflicting exclude/include).

**Key takeaway**: Follow the existing pattern: `throw new ConfigError({ message, configKey: components.audit['~k'], context })`. The `configKey` enables error location resolution to the `audit:` block in the YAML.

---

## Summary: Change Impact

| Scope | Files | Risk |
|-------|-------|------|
| **New files** | 9 files in `packages/api/src/audit/` and `packages/build/src/build/` | Low — isolated, no existing code affected |
| **Schema change** | 1 file (`lowdefySchema.js`) | Low — additive, no breaking changes |
| **Build pipeline** | 1 file (`index.js`) | Low — two new steps added in sequence |
| **Server wrapper** | 2 files (`apiWrapper.js` x2) | Medium — core request path, but change is minimal (add object to context) |
| **Request/endpoint handlers** | 4 files | Medium — adding audit calls after existing logic |
| **Error handler** | 1 file (`logError.js`) | Low — adding audit call alongside existing Sentry call |
| **Auth config** | 1 file (`getNextAuthConfig.js`) | Medium — modifying cached NextAuth config |
