# @lowdefy/errors

Error classes and location resolution utilities for the Lowdefy framework. Single flat entry point — all imports from `@lowdefy/errors`.

## Overview

This package provides:

- Error class hierarchy for categorizing failures
- `errorToDisplayString` — the ONE function for formatting errors for display
- Location resolution — mapping `configKey` to `file:line` source locations
- Build check suppression — `~ignoreBuildChecks` support

## Package Structure

```
@lowdefy/errors/src/
├── index.js                        # Single flat entry point
├── LowdefyInternalError.js                 # Internal Lowdefy bugs
├── ConfigError.js                  # Config validation errors
├── ConfigWarning.js                # Warnings (extends ConfigError)
├── BuildError.js                   # Summary error after build fails
├── PluginError.js                  # Plugin failures
├── ServiceError.js                 # External service failures
├── UserError.js                    # Expected user interaction (client-only)
├── errorToDisplayString.js         # ONE display formatter
├── resolveConfigLocation.js        # configKey → { source, config }
├── resolveErrorLocation.js         # Unified resolver (configKey or filePath)
├── loadAndResolveErrorLocation.js  # Async: reads keyMap/refMap at runtime
└── shouldSuppressBuildCheck.js     # ~ignoreBuildChecks walker
```

**Single entry point:** `import { ConfigError, errorToDisplayString, ... } from '@lowdefy/errors'`

No `/client`, `/server`, or `/build` subpaths. All exports are flat.

## Error Class Hierarchy

```
Error
├── LowdefyInternalError          # Internal Lowdefy bugs
│   └── isLowdefyError: true
├── ConfigError            # Config validation errors
│   └── isLowdefyError: true
│   └── ConfigWarning      # Warnings (dev) / Errors (prod)
│       └── prodError flag
├── BuildError             # Summary "Build failed with N error(s)"
│   └── isLowdefyError: true
├── PluginError            # Plugin failures (operators, actions, blocks, requests)
│   └── isLowdefyError: true
├── ServiceError           # External service failures (network, timeout, 5xx)
│   └── isLowdefyError: true
└── UserError              # Expected user interaction (client-only)
    └── isLowdefyError: true
```

### isLowdefyError Marker

All Lowdefy error classes set `this.isLowdefyError = true`. Use this marker instead of `instanceof` — it works across serialization boundaries where `instanceof` breaks (e.g., pino JSON → `Object.create` reconstruction):

```javascript
if (error.isLowdefyError) { ... }
```

The marker survives `extractErrorProps` → pino JSON → `reconstructError` because it's an enumerable property. Display layers (CLI logger, browser logger) use it to decide formatting and stack trace display.

### Error Classes

#### LowdefyInternalError

Internal Lowdefy bugs or unexpected conditions.

```javascript
class LowdefyInternalError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = 'LowdefyInternalError';
    this.isLowdefyError = true;
    this.configKey = null;
  }
}
```

**Stack trace:** Always logged — represents internal bugs where the stack is essential for debugging.

#### ConfigError

Config validation errors. Follows TC39 `(message, options)` constructor pattern.

```javascript
// String-only form (for plugins — interface layer adds configKey)
throw new ConfigError('Property must be a string.');

// Full form (when you have config context)
throw new ConfigError('Block type "Buton" not found.', {
  configKey: block['~k'],
  checkSlug: 'types',
});

// Wrapping a cause error
throw new ConfigError('Operator evaluation failed.', {
  cause: originalError,
  configKey: obj['~k'],
});
```

**Properties:**

| Property         | Type    | Description                                        |
| ---------------- | ------- | -------------------------------------------------- |
| `name`           | string  | `'ConfigError'`                                    |
| `isLowdefyError` | boolean | `true`                                             |
| `configKey`      | string  | `~k` value for location resolution                 |
| `checkSlug`      | string  | For `~ignoreBuildChecks` matching                  |
| `received`       | any     | Debug value (extracted from cause)                 |
| `filePath`       | string  | For pre-addKeys errors (YAML parse, operator eval) |
| `lineNumber`     | number  | For pre-addKeys errors                             |
| `source`         | string  | Set by handleError/handleWarning: `file:line`      |
| `config`         | string  | Set by handleError/handleWarning: config path      |

**Property extraction from cause:** `new ConfigError(undefined, { cause: err })` extracts `configKey` and `received` from the cause error as fallbacks. The original error is preserved via the standard `cause` property.

**Stack trace:** Suppressed in CLI display — source location (from `configKey`) is more useful.

#### ConfigWarning

Extends ConfigError. Warnings in dev mode, errors in prod mode. Follows TC39 `(message, options)` constructor pattern.

```javascript
const warning = new ConfigWarning(
  '_state references "userName" but no block with id "userName" exists.',
  {
    configKey: obj['~k'],
    checkSlug: 'state-refs',
    prodError: true,
  }
);
```

**Properties:** Same as ConfigError, plus:

| Property    | Type    | Description                             |
| ----------- | ------- | --------------------------------------- |
| `prodError` | boolean | If `true`, becomes error in prod builds |

**Behavior (via `handleWarning`):**

- Checks `shouldSuppressBuildCheck` → skip if suppressed
- If `prodError && stage === 'prod'` → collected as error
- Otherwise → logged as warning with deduplication

#### BuildError

Summary error thrown after all build errors have been logged.

```javascript
class BuildError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BuildError';
    this.isLowdefyError = true;
  }
}
```

Used by `logCollectedErrors`: after iterating `context.errors` and calling `handleError` for each, throws `new BuildError('Build failed with N error(s).')`. This error never carries a `configKey` — it's the summary, not the detail.

**Stack trace:** Suppressed in CLI display.

#### PluginError

Wraps errors from plugin code (operators, actions, blocks, requests). Follows TC39 `(message, options)` constructor pattern. Subclassed by `OperatorError`, `ActionError`, `RequestError`, and `BlockError`.

```javascript
throw new PluginError('_if requires a boolean condition.', {
  cause: originalError,
  pluginType: 'operator',
  pluginName: '_if',
  received: params,
  location: 'blockId.events.onClick',
  configKey: obj['~k'],
});
```

**Properties:**

| Property         | Type    | Description                                      |
| ---------------- | ------- | ------------------------------------------------ |
| `name`           | string  | `'PluginError'`                                  |
| `isLowdefyError` | boolean | `true`                                           |
| `pluginType`     | string  | `'operator'`, `'action'`, `'request'`, `'block'` |
| `pluginName`     | string  | e.g. `'_if'`, `'SetState'`, `'MongoDBFind'`      |
| `rawMessage`     | string  | Raw unformatted message (for serialization)      |
| `received`       | any     | The input that caused the error                  |
| `location`       | string  | Config path like `blockId.events.onClick`        |
| `configKey`      | string  | `~k` value for location resolution               |

**Message formatting:** Constructor formats the message with location suffix:
`"message at location."`. The `rawMessage` property preserves the raw input for serialization (avoids double-formatting on deserialize via `Object.create`). Original error preserved via `cause`.

**Subclasses:** `OperatorError`, `ActionError`, `RequestError`, and `BlockError` extend `PluginError` and follow the same `(message, options)` signature, setting appropriate `pluginType` and `name`.

**Stack trace:** Suppressed in CLI display — `received` and `location` are more useful.

#### ServiceError

External service failures (network issues, timeouts, 5xx responses). Follows TC39 `(message, options)` constructor pattern.

```javascript
throw new ServiceError('Connection to MongoDB failed.', {
  cause: networkError,
  service: 'MongoDB',
  configKey: requestConfig['~k'],
});
```

**Properties:**

| Property         | Type    | Description                        |
| ---------------- | ------- | ---------------------------------- |
| `name`           | string  | `'ServiceError'`                   |
| `isLowdefyError` | boolean | `true`                             |
| `service`        | string  | Service name (connection ID)       |
| `rawMessage`     | string  | Raw unformatted message            |
| `code`           | string  | Error code (ECONNREFUSED, etc.)    |
| `statusCode`     | number  | HTTP status code                   |
| `configKey`      | string  | `~k` value for location resolution |

**Message enhancement:** Constructor enhances messages based on error codes:

- `ECONNREFUSED` → `"Connection refused. The service may be down. {message}"`
- `ENOTFOUND` → `"DNS lookup failed. {message}"`
- `ETIMEDOUT` → `"Connection timed out. {message}"`
- HTTP 5xx → `"Server returned error {statusCode}. {message}"`

**Static helper:** `ServiceError.isServiceError(error)` checks error codes and HTTP 5xx.

**Stack trace:** Suppressed in CLI display — service/code context is more useful.

#### UserError

Expected user-facing errors (validation failures, intentional throws). Client-only — never sent to the server terminal.

```javascript
throw new UserError('Form validation failed.', {
  blockId: 'submit_button',
  metaData: { field: 'email' },
  pageId: 'contact',
});
```

**Properties:**

| Property         | Type    | Description                    |
| ---------------- | ------- | ------------------------------ |
| `name`           | string  | `'UserError'`                  |
| `isLowdefyError` | boolean | `true`                         |
| `blockId`        | string  | Block that triggered the error |
| `metaData`       | any     | Additional context             |
| `pageId`         | string  | Page where error occurred      |

**Routing:** In `Actions.js`, `UserError` is detected by name and logged to browser console only. Other errors go through `handleError` → server terminal.

## errorToDisplayString

The ONE function that formats any error for display.

```javascript
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

Works on ANY error — Lowdefy errors, plain JS errors, deserialized error-like objects from pino JSON.

**Where it's used:** Only in the display layer — CLI logger and browser logger. Error handlers use `logger.error(error)` and let the display layer decide formatting.

## Location Resolution

Three functions handle different resolution contexts:

### resolveConfigLocation (sync, post-addKeys)

Standard resolution: `configKey` → keyMap → refMap → `{ source, config }`.

```javascript
import { resolveConfigLocation } from '@lowdefy/errors';

const location = resolveConfigLocation({
  configKey: error.configKey,
  keyMap: context.keyMap,
  refMap: context.refMap,
  configDirectory: context.directories.config,
});
// { source: '/app/pages/home.yaml:15', config: 'pages.0.blocks.0' }
```

### resolveErrorLocation (sync, unified)

Handles two resolution paths and mutates the error object:

1. **configKey path:** delegates to `resolveConfigLocation`
2. **filePath + lineNumber path:** direct `path.resolve` join (for pre-addKeys errors)

```javascript
import { resolveErrorLocation } from '@lowdefy/errors';

resolveErrorLocation(error, {
  keyMap: context.keyMap,
  refMap: context.refMap,
  configDirectory: context.directories.config,
});
// error.source = '/app/pages/home.yaml:15'
// error.config = 'pages.0.blocks.0'
```

Used by build-time `handleError` and `handleWarning`.

### loadAndResolveErrorLocation (async, runtime)

Reads keyMap/refMap from build artifacts at runtime, then resolves.

```javascript
import { loadAndResolveErrorLocation } from '@lowdefy/errors';

const location = await loadAndResolveErrorLocation({
  error,
  readConfigFile: context.readConfigFile,
  configDirectory: context.configDirectory,
});
// { source: '/app/pages/home.yaml:15', config: 'pages.0.blocks.0' }
```

Used by server-side `logClientError` to resolve client-reported errors.

## shouldSuppressBuildCheck

Walks up the keyMap parent chain looking for `~ignoreBuildChecks` settings.

```javascript
import { shouldSuppressBuildCheck } from '@lowdefy/errors';

if (shouldSuppressBuildCheck(error, context.keyMap)) {
  return; // Suppressed
}
```

**Signature:** `shouldSuppressBuildCheck(error, keyMap)` — takes the error object (reads `configKey` and `checkSlug`) and the keyMap.

**Walk logic:** Starting from `error.configKey`, walks up `~k_parent` entries (max 100 depth). At each entry, checks `~ignoreBuildChecks`:

- `true` → suppress all checks
- `['state-refs', 'types', ...]` → suppress if `error.checkSlug` is in the array

## Serialization

Errors are serialized by the `~e` marker in `@lowdefy/helpers/serializer`:

```javascript
// Replacer: Error → { '~e': { message, name, stack, ...enumerableProps } }
// Reviver: { '~e': data } → Object.create(ErrorClass.prototype) + assign props
```

The reviver uses a `lowdefyErrorTypes` map with direct imports to reconstruct the correct class without calling constructors (avoids re-formatting messages).

**Recursive cause serialization:** `extractErrorProps` recursively serializes Error objects found in the `cause` property, so the full cause chain is preserved across serialization boundaries. The CLI logger walks the `error.cause` chain, displaying `Caused by:` lines with indentation for each level.

See [helpers.md](./helpers.md) for serializer details.

## Key Files

| File                                 | Purpose                                       |
| ------------------------------------ | --------------------------------------------- |
| `src/index.js`                       | Single flat entry point, all exports          |
| `src/errorToDisplayString.js`        | Display formatter                             |
| `src/resolveConfigLocation.js`       | configKey → { source, config }                |
| `src/resolveErrorLocation.js`        | Unified sync resolver (mutates error)         |
| `src/loadAndResolveErrorLocation.js` | Async resolver (reads build artifacts)        |
| `src/shouldSuppressBuildCheck.js`    | ~ignoreBuildChecks walker + VALID_CHECK_SLUGS |

## See Also

- [Error Tracing](../architecture/error-tracing.md) — Complete error flow across build/server/browser
- [Logger](./logger.md) — How errors are displayed
- [Helpers](./helpers.md) — Serializer `~e` handling and `extractErrorProps`
- [Build](../packages/build.md) — Build context, handleError/handleWarning wiring
