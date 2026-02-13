# Logging & Error Formatting Refactor Plan

## Problem Statement

The logging and error formatting system was built up incrementally by AI agents, resulting in duplicated logic, dead code, inconsistent patterns, and unnecessary complexity across environments. The goal is to drastically simplify logging while maintaining the DX of "one right way to do things."

---

## Current State: What Exists

### Logger Package (`@lowdefy/logger`, 4 exports)

- **`node`** (`logger/src/node/createNodeLogger.js`): Pino wrapper with 80-line `attachLevelMethods` that adds color sub-methods (`.info.blue()`) and UI options (`{ spin: true }`). Custom error serializer.
- **`dev`** (`logger/src/dev/createDevLogger.js`): Thin wrapper around `createNodeLogger` with sync pino destination defaults.
- **`cli`** (`logger/src/cli/createCliLogger.js`): Ora-based pretty printer. Duplicates the same color sub-method and error detection pattern as the node logger.
- **`browser`** (`logger/src/browser/createBrowserLogger.js`): Console.error/warn/info/debug with formatting. Has duplicate `formatBrowserError` function.

### Three Layers of "Format an Error for Display"

These three functions evolved separately and overlap in confusing ways:

1. **`formatErrorMessage`** (in `@lowdefy/errors/src/formatErrorMessage.js`) - Used by `.print()` methods. Returns `[ErrorName] message. Received: {...}`. This is the "inner" formatter that adds the `[Name]` prefix and appends received values.

2. **`formatUiMessage`** (in `@lowdefy/logger/src/formatUiMessage.js`) - The "outer" formatter used by all loggers. Calls `.print()` if available (which calls `formatErrorMessage`), else falls back to `[Name] message` **without received values**. This inconsistency means errors without `.print()` get a different format than errors with it.

3. **`formatBrowserError`** (in `@lowdefy/logger/src/browser/createBrowserLogger.js`) - Near-exact duplicate of `formatUiMessage`. Exists only because the browser logger was written separately.

**The core problem:** Location is baked into `error.message` at construction time (PluginError constructor), but received is added at display time (by `formatErrorMessage`). There's no good reason for this split - it's an artifact of how things evolved. This inconsistency ripples through the formatting layers.

### Error Classes (`@lowdefy/errors`)

Well-structured hierarchy, but with dead code and constructor side effects that complicate serialization:

- **`LowdefyError`**

  - Constructor side effects: None
  - Dead code: Client override has `.log()` method (fire-and-forget in `_app.js`, duplicates `createLogError`)

- **`ConfigError`**

  - Constructor side effects: None in base. **Build subclass does location resolution, suppression checking, and YAML parse error handling in constructor** — couples error to build context, makes serialization complex.
  - Duplicate paths: `.log()` is used by `_app.js` ErrorBoundary (React rendering errors). `createLogError` handles action/operator errors. Two entry points into the same `/api/client-error` round-trip — unified by `handleError` in Brief 5.

- **`PluginError`**

  - Constructor side effects: **Appends location to message** (`rawMessage` + ` at ${location}.`). Stores `rawMessage` separately to avoid double-format on deserialize.
  - Dead code: None

- **`ServiceError`**

  - Constructor side effects: **Enhances message** (prepends service name, adds context for ECONNREFUSED etc.). Deserializer sets `service` separately to avoid double-prefix.
  - Dead code: None

- **`UserError`**
  - Constructor side effects: None
  - Dead code: None

Each class has its own `.serialize()` / `.deserialize()` / `.print()`. The per-class serializers use a `~err` marker (string value = class name, data as siblings: `{ '~err': 'PluginError', message: '...', ... }`). They exist specifically because constructor side effects make generic serialization impossible — but `Object.create + assign` bypasses constructors entirely, making per-class serializers unnecessary.

### Pino Error Serializer

`defaultErrSerializer` in `createNodeLogger.js` only picks 7 specific fields:

```javascript
const defaultErrSerializer = (err) => ({
  message: err.message,
  name: err.name,
  stack: err.stack,
  source: err.source,
  config: err.config,
  configKey: err.configKey,
  isServiceError: err.isServiceError,
});
```

This is too selective. Other error properties (pluginType, pluginName, location, received, service, code, statusCode) are lost in JSON log output.

### Helpers Serializer (`@lowdefy/helpers/src/serializer.js`)

The `~e` error handling is basic — only preserves `name`, `message`, and `value` (toString). Does not preserve enumerable properties or reconstruct Lowdefy error classes. Meanwhile, each error class has its own `.serialize()` / `.deserialize()` using a separate `~err` marker with a different shape (string value vs object value). Two competing mechanisms:

```javascript
// Current ~e replacer in helpers (line 31-38) — generic, lossy
if (type.isError(newValue)) {
  return { '~e': { name: newValue.name, message: newValue.message, value: newValue.toString() } };
}

// Current ~e reviver in helpers (line 156-159) — always reconstructs plain Error
if (!type.isUndefined(newValue['~e'])) {
  const error = new Error(newValue['~e'].message);
  error.name = newValue['~e'].name;
  return error;
}

// Current ~err in per-class serializers — class-specific, selective fields
// { '~err': 'PluginError', message: '...', rawMessage: '...', location: '...' }
// Note: ~err value is a string (class name), siblings are data.
// Different shape from ~e (where value is an object containing data).
```

### Error Logging Paths (Inconsistent)

- **Server (prod)**

  - How: `logError({ context, error })` in `servers/server/lib/server/log/logError.js`
  - Location resolution: Async via `resolveErrorConfigLocation()` reading keyMap.json/refMap.json from disk each time

- **Server (dev)**

  - How: `logError({ context, error })` in `servers/server-dev/lib/server/log/logError.js`
  - Location resolution: Same async resolution

- **Build**

  - How: `context.logger.error(error)` directly. Logger monkey-patched in `createContext.js`.
  - Location resolution: Already resolved at throw time (ConfigError constructor uses keyMap/refMap synchronously)

- **Browser (actions/blocks)**

  - How: `createLogError(lowdefy)` → sends to `/api/client-error` → server resolves → returns source
  - Location resolution: Async via API round-trip

- **Browser (ErrorBoundary)**

  - How: `error.log(lowdefyRef.current)` in `_app.js` → duplicate path to `/api/client-error`
  - Location resolution: Same, but through error's own `.log()` method

- **CLI**
  - How: `createStdOutLineHandler` parses pino JSON from subprocess → CLI logger displays
  - Location resolution: N/A (already resolved before logging)

### Build Context Logger Wrapping (`packages/build/src/createContext.js`)

The build monkey-patches `logger.warn` and `logger.error`:

- **`logger.warn` wrapper** (lines 72-122): Creates ConfigWarning instances from params, handles deduplication by `source:line`, checks suppression via `~ignoreBuildChecks`, throws ConfigError in prod mode if `prodError: true`.
- **`logger.error` wrapper** (lines 125-148): Currently does almost nothing - just passes through. Copies color sub-methods.

The warn wrapping is useful functionality but creates confusion between `context.logger.warn` (special build behavior) and what you'd expect from a plain logger.

### CLI Subprocess Bridge (`createStdOutLineHandler.js`)

Parses pino JSON from child processes, extracts level/color/spin/succeed/source/err, re-logs through CLI logger. Currently duplicates some error display logic (source in blue) that the CLI logger also does.

---

## Problems Summary

1. **Three formatting functions that overlap**: `formatErrorMessage` (adds prefix + received), `formatUiMessage` (calls `.print()` or falls back without received), `formatBrowserError` (duplicate of `formatUiMessage`). The fallback path in `formatUiMessage` produces different output than the `.print()` path - errors without `.print()` lose the received value.
2. **Location and received added at different stages**: PluginError bakes location into `error.message` at construction. `formatErrorMessage` adds received at display time via `.print()`. No good reason for this split.
3. **Two browser error entry points**: `error.log()` (used by `_app.js` ErrorBoundary for React rendering errors) and `createLogError` (used by Actions.js for action/operator errors) both do the same `/api/client-error` round-trip independently. Two paths into the same system, unified by `handleError` in Brief 5.
4. **Constructor side effects**: PluginError and ServiceError format messages at construction time, requiring `rawMessage` and careful deserialization to avoid double-formatting. Build ConfigError does location resolution, suppression, and YAML handling in its constructor — couples errors to build context. This is why per-class serializers exist and why env-specific subclasses were created.
5. **Selective pino serializer**: `defaultErrSerializer` loses error properties in JSON log output.
6. **Two competing error serializers**: `~e` in helpers (generic, lossy) and per-class `~err` (class-specific, selective). Different markers, different shapes, different purposes. Should be one mechanism.
7. **80-line `attachLevelMethods` wrapper**: Adds color sub-methods and error formatting to pino. The CLI logger then re-implements the same pattern.
8. **Two browser error logging paths**: `createLogError` and `error.log()` both send to `/api/client-error`.
9. **Logger/print distinction in CLI**: `createCliLogger` delegates to `createPrint` (separate Ora wrapper). Unnecessary indirection.
10. **Build logger monkey-patching**: `context.logger.warn` is secretly special — does suppression, location resolution, dedup behind a plain-looking logger call. Easy to confuse with plain logging.
11. **Inconsistent `logError` signatures**: Server uses `logError({ context, error })`, browser uses `logError(error)` with bound context.
12. **`logError` conflated with logger**: The current `logError` does location resolution, structured data collection, Sentry capture, AND logging — but it's called from `context.logger.error`. Error handling is a separate concern from logging and shouldn't live inside a logger method.

---

## Target Architecture

### Core Principle

Each layer does ONE thing. There is ONE right way to do things, and that way is easy.

```
Error classes      →  dumb data carriers. Constructors format message (keeps stack
                      trace consistent). Store raw parts as properties (_message).
                      no .print(), no formatErrorMessage, no env subclasses
                      handlers resolve location, not constructors

errorToDisplayString → ONE function: [Name] + error.message + received
                       replaces .print(), formatErrorMessage, formatUiMessage,
                       formatBrowserError — all four collapse into this

Serializer         →  enhanced ~e in @lowdefy/helpers serializer
                      preserves all props, reconstructs correct class
                      direct imports of Lowdefy error classes (no config)
                      transport uses explicit field picking (not serializer)

Server loggers     →  plain pino, generic error serializer
                      UI hints (color, spin, succeed) as JSON properties

context.logger     →  4 sync methods (error, warn, info, debug)
                      just a logger — pino underneath, zero monkey-patching

handleError        →  separate function, NOT on the logger
                      resolves location, adds structured data, Sentry
                      then logs via pino. Used in catch blocks.

handleWarning      →  build-only: context.handleWarning(params)
                      suppression, location resolution, dedup
                      then logs via pino. Explicit, not hidden in logger.

CLI logger         →  reads pino JSON (via line handler) or direct calls
                      uses errorToDisplayString for errors
                      Ora for interactive, console for CI

Browser logger     →  plain console wrapper (error/warn/info/debug)
                      exists for general non-error logging only

handleError        →  lowdefy.handleError (browser)
(browser)             dedup, server round-trip, errorToDisplayString
                      one path for all browser error handling
```

### Error Classes: Dumb Data Carriers

**Errors carry data, handlers resolve.** This is the industry standard pattern (Go's `errors.Wrap`, Rust's `anyhow`, Sentry's source mapping). Errors store `configKey` and structured properties. Location resolution happens in `handleError` (errors) and `handleWarning` (warnings) — not in constructors.

**No env-specific subclasses.** The `/client` and `/server` entry points are removed — they just re-export base classes. The `/build` entry point stays for build utilities (`ConfigWarning`, `ConfigMessage`, `resolveConfigLocation`) but `build/ConfigError.js` is deleted — build code uses the base `ConfigError` directly. All location resolution moves to handlers.

PluginError and ServiceError constructors continue to format `error.message` at construction time. This keeps stack traces consistent — the first line of the stack always matches `error.message`. The `_message` property stores the raw unformatted input for serialization.

The real wins are removing `.print()`, removing constructor side effects (location resolution, suppression), removing env-specific subclasses, and consolidating to `errorToDisplayString`. The getter approach was considered but rejected because it causes stack trace / message mismatches and makes `error.message` mutable (a subtle source of bugs).

```javascript
// BEFORE: constructor formats message, .print() adds prefix + received
class PluginError extends Error {
  constructor({ error, location, ... }) {
    const rawMessage = error?.message;
    const message = location ? `${rawMessage} at ${location}.` : rawMessage;
    super(message);               // location baked into .message ← this is fine
    this.rawMessage = rawMessage;  // stored separately for serialization
  }
  print() {
    return formatErrorMessage(this);  // adds [Name] prefix + received ← DELETE THIS
  }
}

// AFTER: constructor still formats, but no .print(), no formatErrorMessage
class PluginError extends Error {
  constructor({ message, error, pluginType, pluginName, location, received, configKey }) {
    const rawMessage = message ?? error?.message ?? 'Unknown error';
    const formatted = location ? `${rawMessage} at ${location}.` : rawMessage;
    super(formatted);  // stack trace matches error.message ✓
    this._message = rawMessage;  // raw input for serialization
    this.name = 'PluginError';
    this.pluginType = pluginType;
    this.pluginName = pluginName;
    this.location = location;
    this.received = received !== undefined ? received : error?.received;
    this.configKey = configKey ?? error?.configKey ?? null;
  }
  // No .print() method — errorToDisplayString replaces it
}
```

Same pattern for ServiceError:

```javascript
class ServiceError extends Error {
  constructor({ message, error, service, code, statusCode, configKey }) {
    const rawMessage = message ?? error?.message ?? 'Service error';
    let formatted = ServiceError.enhanceMessage(
      rawMessage,
      code ?? error?.code,
      statusCode ?? error?.statusCode
    );
    if (service) formatted = `${service}: ${formatted}`;
    super(formatted); // stack trace matches error.message ✓
    this._message = rawMessage; // raw input for serialization
    this.name = 'ServiceError';
    this.service = service;
    this.code = code ?? error?.code;
    this.statusCode = statusCode ?? error?.statusCode;
    this.configKey = configKey ?? null;
  }

  static enhanceMessage(message, code, statusCode) {
    if (code === 'ECONNREFUSED') return `Connection refused. The service may be down. ${message}`;
    if (code === 'ENOTFOUND') return `DNS lookup failed. ${message}`;
    if (code === 'ETIMEDOUT') return `Connection timed out. ${message}`;
    if (statusCode >= 500) return `Server returned error ${statusCode}. ${message}`;
    return message;
  }
  // No .print() method — errorToDisplayString replaces it
}
```

Benefits:

- **Stack trace consistency**: `error.stack` first line always matches `error.message`.
- **Immutable message**: `error.message` doesn't change after construction. Safe for dedup keys, comparison, logging.
- **`_message` is a small price**: One extra property on errors that format at construction (PluginError, ServiceError). Other error classes (ConfigError, LowdefyError, UserError) don't need it.
- **No `.print()` method** on any error class. `errorToDisplayString` replaces it.
- **No `formatErrorMessage`** function. Deleted entirely.
- **No constructor side effects**: ConfigError is `{ message, configKey }`. No `context` parameter, no location resolution, no suppression logic in constructors. Errors are simple to create, serialize, and test.
- **No env-specific subclasses**: One ConfigError, one LowdefyError. The `/client` and `/server` entry points become simple re-exports (or are removed). Build utilities stay in `/build` but don't subclass errors.
- **Serialization works**: `extractErrorProps` captures both `message` (formatted) and `_message` (raw). Deserialization via `Object.create + assign` sets `message` as a plain property — no constructor side effects because the constructor is bypassed.

### `errorToDisplayString` — The ONE Formatting Function

Replaces `.print()`, `formatErrorMessage`, `formatUiMessage`, and `formatBrowserError`. All four collapse into this single function:

```javascript
// @lowdefy/errors
function errorToDisplayString(error) {
  if (typeof error === 'string') return error;
  if (error?.message === undefined) return String(error);

  const name = error.name || 'Error';
  let msg = `[${name}] ${error.message}`;

  if (error.received !== undefined) {
    try {
      msg = `${msg} Received: ${JSON.stringify(error.received)}`;
    } catch {
      msg = `${msg} Received: [unserializable]`;
    }
  }
  return msg;
}
```

This works on ANY error — Lowdefy errors, plain JS errors, error-like objects from deserialized pino JSON. The `[Name]` prefix and received value are always added consistently. No special cases, no `.print()` check.

**Why received stays in `errorToDisplayString` (not in `error.message`):** Received values can be large and noisy. `error.message` is used for dedup keys, API responses, comparison strings — it should be the human-readable description. Received is debug information for display only.

### One Generic Error Serializer

Enhance the `@lowdefy/helpers` serializer's existing `~e` handling to preserve all enumerable properties and reconstruct the correct Lowdefy error class. The `~e` marker stays (consistent with `~d`, `~r`, `~k`, `~l` single-char convention). Per-class `.serialize()` / `.deserialize()` / `deserializeError()` are removed — `~e` is the only error serialization mechanism.

```javascript
// Shared extraction logic (used by both helpers serializer and pino serializer)
function extractErrorProps(err) {
  if (!err) return err;
  // message, name, stack, cause are non-enumerable on Error instances —
  // Object.keys alone won't capture them. Must access explicitly.
  const props = { message: err.message, name: err.name, stack: err.stack };
  if (err.cause !== undefined) props.cause = err.cause;
  for (const key of Object.keys(err)) {
    props[key] = err[key];
  }
  return props;
}

// Helpers serializer: ~e replacer (enhanced — preserves all props)
if (type.isError(newValue)) {
  return { '~e': extractErrorProps(newValue) };
}

// Helpers serializer: ~e reviver (enhanced — reconstructs correct class)
if (!type.isUndefined(newValue['~e'])) {
  const data = newValue['~e'];
  const ErrorClass = lowdefyErrorTypes[data.name] || Error;
  const error = Object.create(ErrorClass.prototype);
  for (const [key, value] of Object.entries(data)) {
    error[key] = value;
  }
  return error;
}

// Pino error serializer: same extraction, no ~e wrapper
const pinoErrSerializer = extractErrorProps;
```

The `extractErrorProps` function is shared between both consumers. The helpers serializer wraps with `~e`, pino uses the flat object directly. One extraction function, one way to convert errors to serializable objects.

**The serializer imports Lowdefy error classes directly** — no registration, no config passing, no error type map at call sites:

```javascript
// In @lowdefy/helpers/src/serializer.js
import { ConfigError, LowdefyError, PluginError, ServiceError, UserError } from '@lowdefy/errors';

const lowdefyErrorTypes = { ConfigError, LowdefyError, PluginError, ServiceError, UserError };
```

These are all already exported from the main `@lowdefy/errors` entry point. This is the same approach as the framework-specific `~r`, `~k`, `~l` markers — the serializer already knows about Lowdefy-specific types. Direct imports mean: no global mutable state, no temporal coupling, hard errors if something breaks, testable without mocking registration. Every `serializer.copy()` call automatically gets correct error class reconstruction with zero call-site changes.

**Transport (browser → server) is a separate concern.** The browser `handleError` does NOT use the serializer for transport — it picks specific fields explicitly to keep payloads small (excludes `received`, which can be huge):

```javascript
// Browser handleError — explicit field picking for transport
const { name, message, stack, configKey, source, pluginType, pluginName, location } = error;
await fetch('/api/client-error', {
  body: JSON.stringify({
    name,
    message,
    stack,
    configKey,
    source,
    pluginType,
    pluginName,
    location,
  }),
});
```

**The `/api/client-error` endpoint simplifies.** It no longer calls `deserializeError(data)` to reconstruct a class instance. It receives a flat object with the properties it needs — `configKey` for location resolution, `name`/`message` for logging. It's effectively a specialized `handleError` for client-reported errors:

```javascript
// Server /api/client-error endpoint
async function logClientError(req, res) {
  const { name, message, configKey, source, ... } = req.body;
  // Resolve location from configKey (same as server handleError)
  const errorData = { configKey };
  const { keyMap, refMap } = await loadMaps(buildDir);
  resolveErrorLocation(errorData, { keyMap, refMap });
  // Log as structured data
  pinoLogger.error({ errorName: name, configKey, source: errorData.source }, message);
  // Return source for browser console display
  res.json({ source: errorData.source });
}
```

_(The `errorToDisplayString` function is defined above in the Error Classes section.)_

### Server Logger: Plain Pino

`createNodeLogger` returns a plain pino logger. No `attachLevelMethods`. No color sub-methods. Keeps pino's default `messageKey` (`msg`). All log calls use the standard two-argument form `logger.level(mergeObj, messageString)` — explicit, no magic. UI hints are standard pino merge objects:

```javascript
logger.info({ spin: true }, 'Building pages...');
logger.info({ color: 'blue' }, 'some info');
logger.info({ succeed: true }, 'Build complete');
```

`createDevLogger` sets defaults (sync dest, no pid/hostname) and returns a plain pino logger.

### `context.logger` — Just a Logger

**The contract:** `context.logger` is an object with 4 sync methods: `error`, `warn`, `info`, `debug`. It's just a logger — pino underneath. Zero monkey-patching. No async, no location resolution, no Sentry, no special warn behavior.

```javascript
// Build context
context.logger = pinoLogger; // plain pino — no wrappers

// Server context
context.logger = pinoLogger; // plain pino

// Browser
context.logger = createBrowserLogger(); // console.error/warn/info/debug
```

### `context.handleWarning` — Build-Only Warning Handler

Separate from the logger, just like `handleError`. Creates a ConfigWarning from params, then handles suppression, prodError escalation (collects the ConfigWarning directly — it extends ConfigError), location resolution, dedup, and logging. Callers are explicit about what they're doing — no hidden behavior behind `logger.warn()`.

```javascript
function createHandleWarning({ pinoLogger, context }) {
  return function handleWarning(params) {
    const warning = new ConfigWarning(params);

    // Check suppression (~ignoreBuildChecks)
    if (
      shouldSuppress({
        configKey: warning.configKey,
        keyMap: context.keyMap,
        checkSlug: warning.checkSlug,
      })
    ) {
      return;
    }

    // Escalate in prod if marked prodError — ConfigWarning extends ConfigError, so collect directly
    if (params.prodError && context.stage === 'prod') {
      collectExceptions(context, warning);
      return;
    }

    // Resolve location (configKey → source via keyMap/refMap)
    const location = resolveConfigLocation({ configKey: warning.configKey, context });

    const source = location?.source ?? null;

    // Dedup by source:line
    const dedupKey = source ?? warning.message;
    if (context.seenSourceLines.has(dedupKey)) return;
    context.seenSourceLines.add(dedupKey);

    // Two-argument pino call: merge object + message string.
    // Source display (blue) is handled by the CLI, not here — build just writes JSON.
    pinoLogger.warn({ err: warning, source }, warning.message);
  };
}
```

Usage is explicit:

```javascript
context.handleWarning({
  message: '_state references undefined blockId.',
  configKey,
  prodError: true,
  checkSlug: 'state-refs',
});
```

### `handleError` — Separate from the Logger

`handleError(error)` is an async function that does the full error pipeline: location resolution, per-request structured data, Sentry capture, then logging. It is NOT a logger method. It lives outside the logger, in the error handling layer.

**Lives on `context`** (server/build) or `lowdefy` (browser). Created during context setup, accessed at catch sites via `context.handleError`. No extra parameter passing — `context` is already threaded everywhere.

```javascript
try {
  await callEndpoint(request);
} catch (error) {
  await context.handleError(error);
  res.status(500).json({ name: error.name, message: error.message });
}
```

**Why separate from logger:**

- Logger methods should be sync. `handleError` is async (reads keyMap/refMap, sends to Sentry, browser sends to server).
- Logger just logs. `handleError` does resolution, structured data collection, Sentry capture — then logs.
- Server functions should throw errors, not log them. Only catch points call `context.handleError`.

#### Server `handleError` — Per-Request, Async

Created per-request, closes over request data. Reads keyMap/refMap async (current approach, no event loop blocking). Only called from catch points (`apiWrapper`, `runRoutine`), so `await` is fine.

```javascript
function createHandleError({ pinoLogger, buildDir, sentry, req, user }) {
  return async function handleError(error) {
    // handleError must never throw — it's the last line of defense.
    try {
      const { keyMap, refMap } = await loadMaps(buildDir);
      resolveErrorLocation(error, { keyMap, refMap });

      const structuredData = {
        err: error,
        errorName: error.name,
        isServiceError: error.isServiceError,
        source: error.source,
        configKey: error.configKey,
        ...(user && {
          user: { id: user.id, roles: user.roles, sub: user.sub, session_id: user.session_id },
        }),
        ...(req && { url: req.url, method: req.method, headers: pickRequestHeaders(req) }),
      };

      pinoLogger.error(structuredData, errorToDisplayString(error));
      sentry?.captureException(error);
    } catch {
      // Resolution or Sentry failed — still log the original error via pino
      try {
        pinoLogger.error({ err: error }, error.message);
      } catch {
        console.error(error);
      }
    }
  };
}
```

The async file reads can still use lazy caching (read once, cache for subsequent errors) — but since it's async, there's no event loop blocking concern. The original async approach was fine all along; the problem was putting it inside `context.logger.error` which shouldn't be async.

#### Build `handleError` — Sync

Build already has keyMap/refMap in memory. `handleError` in the build is sync. Used by `logCollectedErrors` to iterate `context.errors` and log each one before throwing. Suppression is NOT handled here — it happens at collection time in `collectExceptions`/`tryBuildStep`, so suppressed errors never enter `context.errors`.

`resolveErrorLocation` handles all three resolution paths from the current `ConfigMessage.js`:

1. `configKey` → keyMap → refMap (standard path)
2. `operatorLocation` → refMap (operator errors)
3. `filePath` + `lineNumber` → raw path join (needs `directories.config`)

```javascript
function createBuildHandleError({ pinoLogger, keyMap, refMap, directories }) {
  return function handleError(error) {
    // handleError must never throw.
    try {
      resolveErrorLocation(error, { keyMap, refMap, configDirectory: directories.config });
      pinoLogger.error({ err: error }, errorToDisplayString(error));
    } catch {
      try {
        pinoLogger.error({ err: error }, error.message);
      } catch {
        console.error(error);
      }
    }
  };
}
```

#### Browser `handleError` — Async, Fire-and-Forget

Sends error to `/api/client-error` for server-side location resolution and terminal logging. The response (with resolved source) updates the console output. Callers can fire-and-forget or await depending on context.

```javascript
function createBrowserHandleError(lowdefy) {
  const handledErrors = new Set();

  return async function handleError(error) {
    const errorKey = `${error.message}:${error.configKey || ''}`;
    if (handledErrors.has(errorKey)) return;
    handledErrors.add(errorKey);

    try {
      // Explicit field picking — keeps payload small (excludes received, etc.)
      const { name, message, stack, configKey, source, pluginType, pluginName, location } = error;
      const response = await fetch(`${lowdefy?.basePath ?? ''}/api/client-error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          message,
          stack,
          configKey,
          source,
          pluginType,
          pluginName,
          location,
        }),
      });
      if (response.ok) {
        const { source: resolvedSource } = await response.json();
        if (resolvedSource) error.source = resolvedSource;
      }
    } catch {
      // Server logging failed — continue with local console
    }

    if (error.source) {
      console.info(error.source);
    }
    console.error(errorToDisplayString(error));
  };
}
```

#### Where `handleError` and `handleWarning` Live

| Function        | Environment    | Accessed via              | Signature                                | Where called                                         |
| --------------- | -------------- | ------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| `handleError`   | **Server**     | `context.handleError`     | `await context.handleError(error)`       | `apiWrapper`, `runRoutine`, `serverSidePropsWrapper` |
| `handleError`   | **Build**      | `context.handleError`     | `context.handleError(error)` (sync)      | `logCollectedErrors`, `buildRefs` catch              |
| `handleError`   | **Browser**    | `lowdefy.handleError`     | `await lowdefy.handleError(error)`       | `createHandleError`, `_app.js` ErrorBoundary         |
| `errorHandler`  | **CLI**        | `errorHandler` (imported) | `await errorHandler({ context, error })` | `runCommand` catch                                   |
| `handleWarning` | **Build only** | `context.handleWarning`   | `context.handleWarning(params)` (sync)   | Build validation call sites                          |

**UserError bypasses `handleError`.** In `Actions.js`, `UserError` is logged to the browser console only (`console.error(errorToDisplayString(error))`), never sent to the server terminal. This is intentional — UserErrors are expected user-facing issues (validation failures, intentional throws), not system errors. The `instanceof UserError` check in `Actions.js` stays; it just uses `errorToDisplayString` instead of `error.print()`.

### CLI Logger

One `createCliLogger` function. No separate `createPrint`. No color sub-methods.

**Input handling logic:**

1. Error/error-like (has `.message`)?
   - Log `error.source` in blue (if present), at the same log level
   - Log `errorToDisplayString(error)` in red (error level) or yellow (warn level)
2. String? → log the string
3. Object with `msg`? → log `msg` (with color/spin/succeed from object)
4. Else → `JSON.stringify(obj, null, 2)`

**Two modes:**

- **Interactive (default):** Ora spinner with timestamps and ANSI colors
- **Basic (CI):** Plain console.log/error/warn

```javascript
function createCliLogger({ logLevel } = {}) {
  const isCI = process.env.CI === 'true' || process.env.CI === '1';

  // Display layer (Ora or console)
  // ... spinner setup for interactive mode ...

  function log(level, input) {
    // Error-like: source in blue, then formatted message
    if (input && typeof input !== 'string' && input.message !== undefined) {
      if (input.source) {
        display(level, input.source, { color: 'blue' });
      }
      display(level, errorToDisplayString(input));
      return;
    }

    // String
    if (typeof input === 'string') {
      display(level, input);
      return;
    }

    // Object with msg (from line handler / pino JSON)
    if (input?.msg) {
      if (input.source) {
        display(level, input.source, { color: 'blue' });
      }
      const text = input.msg;
      display(level, text, { color: input.color, spin: input.spin, succeed: input.succeed });
      return;
    }

    // Fallback: stringify
    display(level, JSON.stringify(input, null, 2));
  }

  return {
    error: (input) => log('error', input),
    warn: (input) => log('warn', input),
    info: (input) => log('info', input),
    debug: (input) => log('debug', input),
  };
}
```

### CLI Line Handler: Pure Protocol Translation

The line handler parses pino JSON and calls the CLI logger. It deserializes errors. No display logic.

```javascript
import { ConfigError, LowdefyError, PluginError, ServiceError, UserError } from '@lowdefy/errors';

const lowdefyErrorTypes = { ConfigError, LowdefyError, PluginError, ServiceError, UserError };

function reconstructError(flatObj) {
  const ErrorClass = lowdefyErrorTypes[flatObj.name] || Error;
  const error = Object.create(ErrorClass.prototype);
  for (const [key, value] of Object.entries(flatObj)) {
    error[key] = value;
  }
  return error;
}

function createStdOutLineHandler({ context }) {
  const logger = context.logger;
  return function stdOutLineHandler(line) {
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      logger.info(line); // Not JSON, log as string
      return;
    }

    const level = pinoLevelToName[parsed.level] ?? 'info';

    // Reconstruct error from flat pino JSON (not ~e wrapped)
    if (parsed.err) {
      logger[level](reconstructError(parsed.err));
      return;
    }

    // Pass structured message to logger (pino default messageKey is 'msg')
    logger[level]({
      msg: parsed.msg,
      source: parsed.source,
      color: parsed.color,
      spin: parsed.spin,
      succeed: parsed.succeed,
    });
  };
}
```

Clean split: line handler does protocol translation (JSON → objects/errors), logger does display.

### Browser Logger

Plain console wrapper. No error formatting — that's `handleError`'s job.

```javascript
function createBrowserLogger() {
  return {
    error: (...args) => console.error(...args),
    warn: (...args) => console.warn(...args),
    info: (...args) => console.info(...args),
    debug: (...args) => console.debug(...args),
  };
}
```

The browser logger exists for general non-error logging (`context.logger.info('loading page')`, `context.logger.debug(...)`). All error handling goes through `lowdefy.handleError` — the logger's `.error()` and `.warn()` are pass-throughs for the rare case someone logs a plain string at those levels.

### Browser Error Handling: One Path

`lowdefy.handleError` is the single mechanism for all browser error handling. Remove `error.log()` and `error.resolve()` from client error classes. The `_app.js` ErrorBoundary and action error handler both use `lowdefy.handleError`.

One path. No `.log()` methods on error classes. No duplicate round-trips. See `handleError` section above for implementation.

---

## Unresolved: Sentry / Log Drains

External services (Sentry, log drains) consume errors differently:

- **Sentry**: Wants the raw Error instance with stack trace. Called in `handleError` after location resolution.
- **Log drains**: Consume pino JSON output. The pino error serializer determines what they see.

These are handled by `handleError`, not by the logger or error classes. The pino serializer (using `extractErrorProps`) ensures log drains get all error properties. Sentry gets the error instance before serialization.

This doesn't need to change architecturally — `handleError` is the right place for Sentry capture. The simplification is that `extractErrorProps` is shared with the pino serializer, so JSON log output and Sentry capture get the same complete error data.

---

## Work Units (Briefs)

### Brief 1: Remove `.print()` and `formatErrorMessage`, Add `errorToDisplayString`, Clean Up Constructors

**Scope:** `packages/utils/errors/src/`, `packages/utils/logger/`

**What:**

- Remove `.print()` method from ALL error classes (LowdefyError, ConfigError, PluginError, ServiceError, UserError).
- Delete `formatErrorMessage.js` entirely.
- Add `errorToDisplayString` function to `@lowdefy/errors` (exported from main entry). This is the ONE function that formats any error for display: `[Name] error.message` + received. Replaces `.print()` at all call sites.
- Delete `formatUiMessage.js` from `@lowdefy/logger`.
- Remove `formatBrowserError` from browser logger.
- Update all imports across all loggers to use `errorToDisplayString` from `@lowdefy/errors`.
- PluginError: Keep constructor formatting (location baked into message). Rename `rawMessage` → `_message` for consistency. Keep structured parts as properties (`location`, `received`, `pluginType`, etc.).
- ServiceError: Keep constructor formatting (service prefix, ECONNREFUSED etc. baked into message). Add `_message` property for the raw input. Keep structured parts as properties (`service`, `code`, `statusCode`).
- ConfigError, LowdefyError, UserError: No constructor changes needed (no formatting side effects). Just remove `.print()`.
- **Delete `build/ConfigError.js`** — the build subclass with location resolution, suppression, and YAML handling in the constructor. Location resolution moves to `handleError` and `handleWarning` (Brief 5). Suppression moves to both `handleError` (for errors) and `handleWarning` (for warnings). prodError escalation moves to `handleWarning`. YAML parse error message formatting stays at the throw site (just string formatting, not a constructor concern). The `build/index.js` re-exports the base `ConfigError`.
- **Simplify `build/ConfigWarning.js`** — make ConfigWarning extend ConfigError. Remove location resolution, suppression, and prodError escalation from constructor. ConfigWarning carries `{ name, message, configKey, checkSlug }`. All behavior moves to `handleWarning` (Brief 5). Extending ConfigError means it works with `errorToDisplayString`, `extractErrorProps`, and the `~e` serializer. prodError escalation just collects the ConfigWarning directly (it IS a ConfigError).
- Update all tests.

**Why:** Errors are dumb data carriers — handlers resolve. Four formatting functions (`formatErrorMessage`, `.print()`, `formatUiMessage`, `formatBrowserError`) collapse into one `errorToDisplayString`. Unblocks Brief 2 (generic serializer). Consistent with how server and browser already work: errors carry `configKey`, handlers resolve location.

**Files:**

- `packages/utils/errors/src/errorToDisplayString.js` (new)
- `packages/utils/errors/src/index.js`
- `packages/utils/errors/src/PluginError.js`
- `packages/utils/errors/src/ServiceError.js`
- `packages/utils/errors/src/LowdefyError.js`
- `packages/utils/errors/src/ConfigError.js`
- `packages/utils/errors/src/UserError.js`
- `packages/utils/errors/src/build/ConfigError.js` (delete — `build/index.js` re-exports base ConfigError)
- `packages/utils/errors/src/build/ConfigWarning.js` (simplify: remove `.print()`, remove location resolution, remove suppression from constructor)
- `packages/utils/errors/src/formatErrorMessage.js` (delete)
- `packages/utils/logger/src/formatUiMessage.js` (delete)
- `packages/utils/logger/src/browser/createBrowserLogger.js`
- `packages/utils/logger/src/cli/createCliLogger.js`
- `packages/utils/logger/src/node/createNodeLogger.js`
- All callers of `error.print()` across the codebase (replace with `errorToDisplayString(error)`)
- Test files for above

**Serialization note:** `extractErrorProps` captures both `message` (formatted, as passed to `super()`) and `_message` (raw input). Deserialization via `Object.create + assign` sets `message` as a plain string property on the instance, which shadows Error.prototype's message. No constructor is called, so no double-formatting.

**Checklist:**

- [x] Create `errorToDisplayString.js` — formats `[Name] message` + received for any error
- [x] Export `errorToDisplayString` from `@lowdefy/errors` main entry
- [x] Remove `.print()` from LowdefyError
- [x] Remove `.print()` from ConfigError
- [x] Remove `.print()` from PluginError
- [x] Remove `.print()` from ServiceError
- [x] Remove `.print()` from UserError
- [x] Delete `formatErrorMessage.js`
- [x] Delete `formatUiMessage.js` from logger
- [x] Remove `formatBrowserError` from browser logger
- [x] PluginError: rename `rawMessage` → `_message`
- [x] ServiceError: add `_message` property
- [x] Delete `build/ConfigError.js`, update `build/index.js` to re-export base ConfigError
- [x] Simplify `build/ConfigWarning.js`: extend ConfigError, remove location resolution/suppression/prodError from constructor
- [x] Replace all `error.print()` call sites with `errorToDisplayString(error)`
- [x] Replace all `formatUiMessage` imports with `errorToDisplayString`
- [x] Update all affected tests
- [x] Run `pnpm --filter=@lowdefy/errors test`
- [x] Run `pnpm --filter=@lowdefy/logger test`

---

### Brief 2: Enhance Helpers Serializer `~e`, Remove Per-Class Serializers

**Scope:** `packages/utils/helpers/src/serializer.js`, `packages/utils/errors/src/*.js`

**What:**

- Add `extractErrorProps` function to helpers (shared by serializer `~e` replacer and pino serializer).
- Enhance `~e` replacer to use `extractErrorProps` (preserves all enumerable properties, not just name/message/value).
- Enhance `~e` reviver to reconstruct correct Lowdefy error class via `Object.create(ErrorClass.prototype)` + property assignment. The serializer imports Lowdefy error classes directly — no registration, no config passing, no error type map at call sites.
- Export `extractErrorProps` from helpers for pino serializer use.
- Remove `.serialize()` and `.deserialize()` from all error classes.
- Remove `deserializeError.js` from errors package.
- Update `/api/client-error` endpoint: no longer calls `deserializeError(data)`. Receives flat object, uses `configKey` for location resolution, logs properties directly. Effectively becomes a specialized `handleError` for client-reported errors.
- Update all tests.

**Why:** One serializer, one way to serialize errors. The `~e` marker is the single mechanism — consistent with `~d`, `~r`, `~k`, `~l`. Removes ~150 lines of per-class serialization code. Every `serializer.copy()` call automatically gets correct class reconstruction with zero call-site changes.

**Files:**

- `packages/utils/helpers/src/serializer.js` (enhance `~e` replacer/reviver, add `extractErrorProps`, add direct imports of Lowdefy error classes)
- `packages/utils/errors/src/ConfigError.js` (remove `.serialize()`, `.deserialize()`)
- `packages/utils/errors/src/LowdefyError.js` (remove `.serialize()`, `.deserialize()`)
- `packages/utils/errors/src/PluginError.js` (remove `.serialize()`, `.deserialize()`)
- `packages/utils/errors/src/ServiceError.js` (remove `.serialize()`, `.deserialize()`)
- `packages/utils/errors/src/deserializeError.js` (delete)
- `packages/utils/errors/src/server/index.js` (remove `deserializeError` re-export)
- `packages/api/src/routes/log/logClientError.js` (simplify: flat object, no class reconstruction)
- All callers of `error.serialize()`, `error.deserialize()`, and `deserializeError()` across the codebase
- Test files for above

**Note on transport:** The browser → server transport path does NOT use the serializer. Browser `handleError` picks specific fields explicitly (excludes `received` etc.) and POSTs a flat object. The server endpoint works with that flat object directly. See target architecture "One Generic Error Serializer" section.

**Consequence to evaluate:** The helpers `serializer.copy()` is used throughout the codebase for deep cloning. Errors appearing in cloned data will now be fully preserved (correct class, all props) instead of becoming generic `Error` instances. This is generally better but needs testing.

**Checklist:**

- [x] Add `extractErrorProps` function to helpers (captures all enumerable props + `message`, `name`, `stack`, `cause`)
- [x] Export `extractErrorProps` from `@lowdefy/helpers`
- [x] Enhance `~e` replacer to use `extractErrorProps`
- [x] Enhance `~e` reviver: `Object.create(ErrorClass.prototype)` + assign, with `lowdefyErrorTypes` map (direct imports including UserError)
- [x] Remove `.serialize()` from ConfigError, LowdefyError, PluginError, ServiceError
- [x] Remove `.deserialize()` from ConfigError, LowdefyError, PluginError, ServiceError
- [x] Delete `deserializeError.js`
- [x] Remove `deserializeError` re-export from `server/index.js`
- [x] Simplify `logClientError.js`: flat object handling, no class reconstruction
- [x] Update all callers of `error.serialize()`, `error.deserialize()`, `deserializeError()`
- [x] Update all affected tests
- [x] Run `pnpm --filter=@lowdefy/helpers test`
- [x] Run `pnpm --filter=@lowdefy/errors test`

---

### Brief 3: Remove Env-Specific Entry Points

**Scope:** `packages/utils/errors/src/client/`, `packages/utils/errors/src/server/`

**What:**

- **Delete `client/ConfigError.js`** and **`client/LowdefyError.js`** — empty subclasses after removing `.resolve()` and `.log()`.
- **Delete `client/index.js`** — no subclasses remain, callers import from `@lowdefy/errors` directly.
- **Delete `server/index.js`** — after removing `deserializeError` (Brief 2), nothing remains. Callers import from `@lowdefy/errors` directly.
- Update all `import from '@lowdefy/errors/client'` and `import from '@lowdefy/errors/server'` to `import from '@lowdefy/errors'`.

**Why:** No env-specific subclasses needed. Errors are dumb data carriers — handlers resolve. The only entry point with real content is `/build` (for build utilities like `ConfigWarning`, `ConfigMessage`, `resolveConfigLocation`).

**Files:**

- `packages/utils/errors/package.json` (remove `./client` and `./server` from `exports`)
- `packages/utils/errors/src/client/ConfigError.js` (delete)
- `packages/utils/errors/src/client/LowdefyError.js` (delete)
- `packages/utils/errors/src/client/index.js` (delete)
- `packages/utils/errors/src/server/index.js` (delete)
- All callers of `@lowdefy/errors/client` and `@lowdefy/errors/server` (update imports)
- Test files for above

**Checklist:**

- [ ] Remove `./client` and `./server` from `package.json` exports
- [ ] Delete `client/ConfigError.js`
- [ ] Delete `client/LowdefyError.js`
- [ ] Delete `client/index.js`
- [ ] Delete `server/index.js`
- [ ] Update all `import from '@lowdefy/errors/client'` → `import from '@lowdefy/errors'`
- [ ] Update all `import from '@lowdefy/errors/server'` → `import from '@lowdefy/errors'`
- [ ] Update all affected tests
- [ ] Run `pnpm --filter=@lowdefy/errors test`

---

### Brief 4: Simplify Node Logger — Plain Pino

**Scope:** `packages/utils/logger/src/node/`

**What:**

- Remove `attachLevelMethods` function entirely (80 lines). No color sub-methods.
- Remove `buildMergeObj` function.
- Replace `defaultErrSerializer` with `extractErrorProps` from helpers.
- Keep pino's default `messageKey` (`msg`). All log calls use the standard two-argument form `logger.level(mergeObj, messageString)` — explicit, no magic.
- `createNodeLogger` returns a plain pino logger. Callers use standard pino API: `logger.info({ color: 'blue' }, 'text')`.
- `createDevLogger` stays as a thin wrapper setting defaults (sync dest, no pid/hostname).
- Update all callers using color sub-methods to use pino merge objects (e.g. `context.logger.info.blue(text)` → `context.logger.info({ color: 'blue' }, text)`).

**Why:** The node logger's job is to produce structured JSON. All the display logic (color sub-methods, error formatting, source logging) belongs in the CLI logger, not in pino.

**Files:**

- `packages/utils/logger/src/node/createNodeLogger.js`
- `packages/utils/logger/src/dev/createDevLogger.js`
- `packages/servers/server-dev/pages/api/request/[pageId]/[requestId].js` (uses `context.logger.info.gray()`)
- All other callers using color sub-methods across the codebase
- Test files for above

**Checklist:**

- [ ] Remove `attachLevelMethods` function (80 lines)
- [ ] Remove `buildMergeObj` function
- [ ] Replace `defaultErrSerializer` with `extractErrorProps` from helpers
- [ ] `createNodeLogger` returns plain pino logger
- [ ] Verify `createDevLogger` still works as thin wrapper
- [ ] Update `[pageId]/[requestId].js`: `context.logger.info.gray()` → `context.logger.info({ color: 'gray' }, ...)`
- [ ] Find and update all other color sub-method call sites
- [ ] Update all affected tests
- [ ] Run `pnpm --filter=@lowdefy/logger test`

---

### Brief 5: Create `handleError` and `handleWarning`, Unify Browser Error Path, Update Call Sites

**Scope:** `packages/build/src/`, `packages/servers/*/`, `packages/api/`, `packages/client/`

**What:**

- **Create `context.handleError`** — a separate async function for the full error pipeline. NOT a logger method. Lives on `context` (server/build) or `lowdefy` (browser). Created during context setup — no extra parameter passing since `context` is already threaded everywhere:
  - Server: `context.handleError = createHandleError({ pinoLogger, buildDir, sentry, req, user })` — per-request, async.
  - Build: `context.handleError = createBuildHandleError({ pinoLogger, keyMap, refMap, directories })` — per-build, sync. Handles all three location resolution paths (configKey, operatorLocation, filePath+lineNumber). Does NOT handle suppression — that stays at collection time in `collectExceptions`/`tryBuildStep`.
  - Browser: `lowdefy.handleError = createBrowserHandleError(lowdefy)` — per-app, async.
- **Create `context.handleWarning`** — build-only. Creates ConfigWarning (extends ConfigError) from params, then handles suppression, prodError escalation (collects the ConfigWarning directly), location resolution, dedup, and logging. Created per-build, lives on `context`. See `handleWarning` pseudocode in target architecture.
  - Build: `context.handleWarning = createHandleWarning({ pinoLogger, context })` — per-build, sync.
- **Create `resolveErrorLocation`** — unified function that handles all three resolution paths from current `ConfigMessage.js`: configKey → keyMap → refMap, operatorLocation → refMap, filePath + lineNumber → raw path join. Signature: `resolveErrorLocation(errorOrData, { keyMap, refMap, configDirectory })`. Mutates first arg, setting `.source`.
- **Unify browser error path:** Update `_app.js` ErrorBoundary in both server and server-dev to use `lowdefy.handleError` instead of `error.log()`. **Wiring note:** `lowdefyRef.current` doesn't have `basePath` at ErrorBoundary level (it's set later by `initLowdefyContext` from `router.basePath`). This is fine — the current `error.log()` already falls back to `''`, giving a relative `/api/client-error` URL. `createBrowserHandleError` uses `lowdefy?.basePath ?? ''` to match. The `handleError` function is created early and attached to `lowdefyRef.current`. Rename `createLogError.js` → `createHandleError.js` (creates `lowdefy.handleError`).
- Update all catch points to `await context.handleError(error)`: `apiWrapper`, `runRoutine`, `serverSidePropsWrapper`, `logCollectedErrors`, `buildRefs` catch, browser `lowdefy.handleError`, `_app.js` ErrorBoundary. Note: `serverSidePropsWrapper` currently calls `logError` fire-and-forget — change to `await`. This is safe because `getServerSideProps` runs before any response is sent; the catch block fully executes before the throw propagates to Next.js.
- Update all `context.logger.warn({ configKey, ... })` calls in build to `context.handleWarning({ ... })`. Plain string warnings stay on `context.logger.warn`.
- Server async file reads stay async — no sync `readFileSync`, no event loop blocking. The async approach was fine all along; the problem was putting it inside a logger method.

**Why:** Clean separation of concerns. Logger is sync, just logs. Error handling is async, does resolution + structured data + Sentry + logging. Warning handling is sync, does suppression + resolution + dedup + logging. Both are explicit — not hidden behind logger methods. Zero function signature changes — `context` is already passed everywhere. One browser error logging path — no duplicate round-trips to `/api/client-error`.

**Files:**

- `packages/build/src/createContext.js` (wire up `context.handleError` and `context.handleWarning`)
- `packages/build/src/utils/logCollectedErrors.js`
- `packages/servers/server/lib/server/log/logError.js` (rename to `handleError.js`)
- `packages/servers/server-dev/lib/server/log/logError.js` (rename to `handleError.js`)
- `packages/servers/server/lib/server/apiWrapper.js`
- `packages/servers/server-dev/lib/server/apiWrapper.js`
- `packages/servers/server/lib/server/serverSidePropsWrapper.js` (calls `logError`)
- `packages/servers/server-dev/pages/api/page/[pageId].js` (calls `logError` in loop)
- `packages/api/src/routes/endpoints/runRoutine.js`
- `packages/client/src/createLogError.js` (rename to `createHandleError.js`)
- `packages/servers/server/pages/_app.js`
- `packages/servers/server-dev/pages/_app.js`
- `packages/cli/src/utils/errorHandler.js` (no rename — this is a top-level catch-all, not the same `handleError` pattern. Just update it to use `errorToDisplayString` and the new logger API.)
- `packages/cli/src/utils/runCommand.js`
- All other callers of `logError()` across the codebase
- All callers of `context.logger.warn({ configKey, ... })` in build (change to `context.handleWarning(...)`)
- `packages/utils/errors/src/build/resolveConfigLocation.js` (used by `handleWarning` for location resolution)
- `packages/utils/errors/src/build/ConfigMessage.js` (used by `handleWarning` for suppression checking)

**Note on `resolveErrorLocation`:** This function absorbs the three resolution strategies from the current `ConfigMessage.js` methods (`resolveOperatorLocation`, `resolveRawLocation`, and the configKey path). Unified signature: `resolveErrorLocation(errorOrData, { keyMap, refMap, configDirectory })`. It mutates the first argument, setting `.source`. The `configDirectory` parameter is only needed by the build (for raw `filePath` + `lineNumber` resolution); server omits it. The function reads `configKey`, `operatorLocation`, `filePath`, and `lineNumber` from the error/data object to determine which resolution path to use (same cascade as current `ConfigMessage.js`).

**Note on ConfigError suppression:** Suppression stays at collection time. Currently `tryBuildStep`/`collectExceptions` check `error.suppressed` — after the refactor, ConfigError no longer sets `.suppressed`. Instead, `collectExceptions`/`tryBuildStep` call `shouldSuppress()` directly and skip suppressed errors before adding them to `context.errors`. This keeps error counts correct — `logCollectedErrors` throws with `context.errors.length`, so suppressed errors must never be collected. `handleWarning` also calls `shouldSuppress` for warnings. `handleError` does NOT check suppression — it just logs whatever it receives.

**Note:** `loadMaps` in the server pseudocode is extracted from the existing `logError` implementations. Not new logic — just pulled out of the current server `logError.js` functions.

**Migration notes:**

- `logError({ context, error })` → `await context.handleError(error)` at the few catch points.
- `context.logger.warn({ message, configKey, ... })` → `context.handleWarning({ message, configKey, ... })` in build validation code.
- `if (error.suppressed) return;` in `tryBuildStep`/`collectExceptions` → replace with `if (shouldSuppress({ configKey: error.configKey, keyMap: context.keyMap, checkSlug: error.checkSlug })) return;` (suppression stays at collection time, but uses `shouldSuppress()` instead of the `.suppressed` property).

**Checklist:**

- [ ] Create `createBuildHandleError` function (sync, resolution + logging, safety wrapper)
- [ ] Create `createHandleWarning` function (suppression, prodError escalation, location resolution, dedup, logging)
- [ ] Create `resolveErrorLocation` function (unified 3-path resolution)
- [ ] Wire `context.handleError` and `context.handleWarning` in `createContext.js`
- [ ] Rename `createLogError.js` → `createHandleError.js` (browser)
- [ ] Create `createBrowserHandleError` with `lowdefy?.basePath ?? ''` fallback
- [ ] Update `_app.js` ErrorBoundary in server: `error.log()` → `lowdefy.handleError(error)`
- [ ] Update `_app.js` ErrorBoundary in server-dev: same
- [ ] Rename server `logError.js` → `handleError.js`
- [ ] Rename server-dev `logError.js` → `handleError.js`
- [ ] Update `apiWrapper.js` (server): `logError` → `context.handleError`
- [ ] Update `apiWrapper.js` (server-dev): same
- [ ] Update `serverSidePropsWrapper.js`: fire-and-forget → `await context.handleError(error)`
- [ ] Update `[pageId].js` (server-dev): `logError` → `context.handleError`
- [ ] Update `runRoutine.js`: `logError` → `context.handleError`
- [ ] Update `logCollectedErrors.js`: iterate `context.errors`, call `context.handleError` for each
- [ ] Update `errorHandler.js` (CLI): use `errorToDisplayString` and new logger API
- [ ] Replace `error.suppressed` checks in `tryBuildStep`/`collectExceptions` with `shouldSuppress()` calls
- [ ] Update all `context.logger.warn({ configKey, ... })` calls → `context.handleWarning({ ... })`
- [ ] Update all affected tests
- [ ] Run `pnpm --filter=@lowdefy/build test`
- [ ] Run `pnpm --filter=@lowdefy/api test`

---

### Brief 6: Simplify `context.logger` — Plain Pino, Zero Monkey-Patching

**Scope:** `packages/build/src/`

**What:**

- `context.logger` becomes a plain pino logger. 4 sync methods. Remove ALL wrappers from `createContext.js` — both the `_lowdefyWrapped` error wrapper and the warn wrapper.
- No monkey-patching. `context.logger.warn` is just pino's `.warn()`.
- Build warning handling (suppression, location resolution, dedup) is now in `context.handleWarning` (Brief 5).

**Why:** `context.logger` should just be a logger — zero surprises. Error handling moves to `context.handleError`, warning handling moves to `context.handleWarning`. Both are explicit, not hidden behind logger methods. Callers that pass `{ configKey, checkSlug, prodError }` use `context.handleWarning` — they know they're doing something special. Callers that just log a string use `context.logger.warn`.

**Files:**

- `packages/build/src/createContext.js` (remove all logger wrappers)

**Checklist:**

- [ ] Remove `_lowdefyWrapped` warn wrapper from `createContext.js`
- [ ] Remove `_lowdefyWrapped` error wrapper from `createContext.js`
- [ ] Remove `_lowdefyContext` reference on logger
- [ ] Remove `seenSourceLines` from context (now in `handleWarning`)
- [ ] Verify `context.logger` is just the plain pino logger passed in
- [ ] Update tests for `createContext.js`
- [ ] Run `pnpm --filter=@lowdefy/build test`

---

### Brief 7: Simplify CLI Logger

**Scope:** `packages/utils/logger/src/cli/`

**What:**

- Merge `createPrint` into `createCliLogger`. Remove `createPrint.js` as separate module. Keep Ora for interactive, console for CI.
- Remove color sub-methods. The API is: `logger.error(input)`, `logger.info(input)`.
- Input handling:
  1. Error/error-like (has `.message`): log source in blue if present, then `errorToDisplayString(error)` in default color for level (red for error, yellow for warn). For LowdefyError and non-Lowdefy errors (i.e. not ConfigError, PluginError, ServiceError, UserError), also log `error.stack` — these represent internal bugs or unexpected failures where the stack trace is critical for debugging. Lowdefy error types use `source`/location instead of stack traces to point to root cause.
  2. String: log string.
  3. Object with `msg`: log `msg`, apply `color`/`spin`/`succeed` from object properties.
  4. Else: `JSON.stringify(input, null, 2)`.
- Keep memoisation in `createCliLogger` (only one Ora spinner should be active per process). The memoisation moves from `createPrint` into `createCliLogger` itself.
- Export from `@lowdefy/logger/cli`.

**Why:** One module, clear input handling logic, no indirection.

**Files:**

- `packages/utils/logger/src/cli/createCliLogger.js`
- `packages/utils/logger/src/cli/createPrint.js` (merge into createCliLogger or delete)
- `packages/utils/logger/src/cli/index.js`
- Test files

**Checklist:**

- [ ] Merge `createPrint` into `createCliLogger`
- [ ] Delete `createPrint.js` (or keep as internal)
- [ ] Remove color sub-methods from CLI logger API
- [ ] Implement input handling: error → string → object with msg → fallback
- [ ] Error path: log `error.source` in blue, then `errorToDisplayString(error)`
- [ ] Error path: log `error.stack` for LowdefyError and non-Lowdefy errors
- [ ] Object path: handle `msg`, `color`, `spin`, `succeed`
- [ ] Keep Ora memoisation (one spinner per process)
- [ ] Update `@lowdefy/logger/cli` exports
- [ ] Update all affected tests
- [ ] Run `pnpm --filter=@lowdefy/logger test`

---

### Brief 8: Simplify CLI Line Handler

**Scope:** `packages/utils/logger/src/cli/createStdOutLineHandler.js`

**What:**

- Pure protocol translation: parse pino JSON, reconstruct errors, pass to logger.
- If `parsed.err`: reconstruct error from flat pino JSON object (see below), call `logger[level](error)`.
- Else: call `logger[level]({ msg: parsed.msg, source, color, spin, succeed })`. Plain message forwarding — no error reconstruction needed.
- No display logic (no source handling, no color application — logger does all of that).
- Error reconstruction from pino JSON: pino's `err` serializer writes flat objects via `extractErrorProps` (not `~e` wrapped). The line handler reconstructs these using the same `lowdefyErrorTypes` map the helpers serializer uses (direct import). `Object.create(ErrorClass.prototype)` + property assignment — same pattern as the `~e` reviver, just without the `~e` wrapper.

**Files:**

- `packages/utils/logger/src/cli/createStdOutLineHandler.js`
- Test files

**Checklist:**

- [ ] Parse pino JSON, extract `level`, `msg`, `err`, `source`, `color`, `spin`, `succeed`
- [ ] If `parsed.err`: reconstruct error via `Object.create + assign` with `lowdefyErrorTypes` map, call `logger[level](error)`
- [ ] Else: forward `{ msg, source, color, spin, succeed }` to `logger[level]`
- [ ] Keep `{ context }` signature (extract `context.logger` internally)
- [ ] Remove all display logic (source handling, color application)
- [ ] Update all affected tests
- [ ] Run `pnpm --filter=@lowdefy/logger test`

---

### Brief 9: Simplify Browser Logger

**Scope:** `packages/utils/logger/src/browser/`

**What:**

- Remove `formatBrowserError` function.
- Remove all error formatting logic from the browser logger — that's `handleError`'s job now.
- Browser logger becomes a plain console wrapper: 4 methods, each a pass-through to `console.error`/`warn`/`info`/`debug`.
- The browser logger exists for general non-error logging. All error handling goes through `lowdefy.handleError`.

**Files:**

- `packages/utils/logger/src/browser/createBrowserLogger.js`
- Test files

**Checklist:**

- [ ] Remove `formatBrowserError` function
- [ ] Remove all error formatting logic
- [ ] Browser logger becomes plain console wrapper: 4 methods pass-through
- [ ] Update all affected tests
- [ ] Run `pnpm --filter=@lowdefy/logger test`

---

## Open Questions

None.

## Resolved Questions

- **~~Helpers serializer `~e` reviver needs error type map.~~** Resolved: the serializer imports Lowdefy error classes directly. No registration, no config, no map passing at call sites.

- **~~Pino JSON deserialization in line handler.~~** Resolved: pino writes flat objects via `extractErrorProps`. The line handler uses a `reconstructError` function with the same direct-import type map and `Object.create + assign` pattern as the `~e` reviver — just without the `~e` wrapper.

- **~~Browser/server wire format for `/api/client-error`.~~** Resolved: browser `handleError` picks specific fields explicitly (excludes `received` etc.), POSTs flat object. Server endpoint uses flat object directly for location resolution and logging — no class reconstruction needed.

- **~~Should client error class overrides (`errors/client/`) be removed entirely?~~** Resolved: yes. No env-specific subclasses needed anywhere. Errors are dumb data carriers, handlers resolve. `/client` and `/server` entry points are removed or simplified to re-exports. `/build` stays for build utilities (`ConfigWarning`, `ConfigMessage`, `resolveConfigLocation`) but not for error subclasses — `build/ConfigError.js` is deleted.
