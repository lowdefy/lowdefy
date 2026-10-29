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
├── shouldSuppressBuildCheck.js     # ~ignoreBuildChecks walker
├── resolveKeyEntry.js              # One key map entry → { path, refId, ... }
├── createKeyPathResolver.js        # Memoised resolver for whole-map scans
└── readKeyEntryFields.js           # Internal: one entry's own fields, either shape
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
├── ServiceError           # External service failures (network, timeout, 5xx, 429)
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
| `checkGroup`     | string  | Group slug, e.g. `plugin-checks` for plugin rules  |
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
  typeName: '_if',
  received: params,
  location: 'blockId.events.onClick',
  configKey: obj['~k'],
});
```

**Properties:**

| Property         | Type    | Description                                 |
| ---------------- | ------- | ------------------------------------------- |
| `name`           | string  | `'PluginError'`                             |
| `isLowdefyError` | boolean | `true`                                      |
| `typeName`       | string  | e.g. `'_if'`, `'SetState'`, `'MongoDBFind'` |
| `_message`       | string  | Raw unformatted message (for serialization) |
| `received`       | any     | The input that caused the error             |
| `location`       | string  | Config path like `blockId.events.onClick`   |
| `configKey`      | string  | `~k` value for location resolution          |

**Message formatting:** Constructor formats the message with location suffix:
`"message at location."`. The `_message` property preserves the raw input for serialization (avoids double-formatting on deserialize via `Object.create`). Original error preserved via `cause`.

**Subclasses:** `OperatorError`, `ActionError`, `RequestError`, and `BlockError` extend `PluginError` and follow the same `(message, options)` signature, setting the appropriate `name`.

**Stack trace:** Suppressed in CLI display — `received` and `location` are more useful.

#### ServiceError

External service failures (network issues, timeouts, 5xx responses, rate limits). Follows TC39 `(message, options)` constructor pattern.

```javascript
throw new ServiceError('Connection to MongoDB failed.', {
  cause: networkError,
  service: 'MongoDB',
  configKey: requestConfig['~k'],
});
```

**Properties:**

| Property         | Type    | Description                                                                                                                     |
| ---------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `name`           | string  | `'ServiceError'`                                                                                                                |
| `isLowdefyError` | boolean | `true`                                                                                                                          |
| `service`        | string  | Service name (connection ID)                                                                                                    |
| `_message`       | string  | Raw unformatted message                                                                                                         |
| `code`           | string  | Error code (ECONNREFUSED, etc.)                                                                                                 |
| `statusCode`     | number  | HTTP status code                                                                                                                |
| `retryAfter`     | string  | Retry-After a throttling service sent (seconds or an HTTP date), else `null`. Read from the cause chain; kept in the server log |
| `configKey`      | string  | `~k` value for location resolution                                                                                              |

**Message enhancement:** Constructor enhances messages based on error codes:

- `ECONNREFUSED` → `"Connection refused. The service may be down. {message}"`
- `ENOTFOUND` → `"DNS lookup failed. {message}"`
- `ETIMEDOUT` → `"Connection timed out. {message}"`
- HTTP 429 → `"Rate limited by the service (429 Too Many Requests). Retry after {retryAfter}. {message}"`
- HTTP 5xx → `"Server returned error {statusCode}. {message}"`

**Static helpers:**

- `ServiceError.isServiceError(error)` is the one classification every connection goes through (callRequestResolver, websocket resolvers, auth email, JWKS fetches). True for: network error codes (`ECONNREFUSED`, `ETIMEDOUT`, ...); a `TimeoutError` (a call cancelled by `AbortSignal.timeout`, the AI SDK's `timeout`, or the server's request timeout); HTTP 5xx and **429** read from `statusCode`, `status`, `response.status`, `$metadata.httpStatusCode` (AWS SDK v3) or a numeric `code` (SendGrid, @google-cloud); an AWS SDK throttling exception (`$retryable.throttling`, some answer 400); and service-sounding messages (`network`, `timeout`, `too many requests`, ...). It follows a retrying client's `lastError` (the AI SDK's `RetryError`) and the `cause` chain. A caller-cancelled `AbortError` is not a service error.
- `ServiceError.readRetryAfter(error)` reads a Retry-After header from `responseHeaders` (AI SDK), `response.headers` (axios, SendGrid), `headers` (Stripe) or `$response.headers` (AWS), plain object or fetch `Headers`, along `lastError` and `cause`.

429 is a service error by design: throttling is an external condition that passes with time, not a config fault, so it is not a `RequestError`.

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
  const segments = [name];
  if (error.prodError === true) segments.push('fails in prod');
  if (error.checkSlug) segments.push(error.checkSlug);
  let msg = `[${segments.join(' · ')}] ${error.message}`;

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

The name segment carries `fails in prod` for a prod-gated warning and the `checkSlug` when there is one: `[ConfigWarning · fails in prod · state-refs] message`. The slug is what `~ignoreBuildChecks` takes to silence the check.

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

## Key Map Readers

`keyMap.json` holds one entry per keyed config object or array (see `addKeys` in `packages/build/src/build/addKeys.js`). Entries come in two shapes, and the readers accept both, entry by entry:

| Shape | Fields                                                      | Path                                               | Ref                                                                                         |
| ----- | ----------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Full  | `{ key, '~k_parent', '~r'?, '~l'?, '~ignoreBuildChecks'? }` | `key`, the full path from the root                 | `~r`, the entry's own; absent means no ref                                                  |
| Short | `{ s, p, r?, l?, i? }`                                      | the parent's path joined with `s`, its own segment | `r` where it differs from the parent's resolved ref, else inherited; `r: null` means no ref |

`addKeys` writes the short shape. Both shapes are read because the map that a reader gets may come from another Lowdefy version: journeys scope builds with the app's own builder and reads the result with the CLI's `@lowdefy/errors`, and cached scope builds under `.lowdefy/scope/builds/` keep the shape they were built in. The full-shape branch can go once no supported version writes it.

Nothing outside `@lowdefy/errors` reads entry fields; it goes through one of these:

- **`resolveKeyEntry({ keyMap, configKey })`** resolves one entry to `{ path, refId, line, parentId, ignoreBuildChecks }`, or `null` when `configKey` is missing or not in the map. A short entry walks its parent chain, joining segments and taking the nearest `r`; the walk ends at a parent id not in the map (addKeys gives each tree root a parent id it never writes), at a full-shape ancestor (which carries its whole path and ref), or where a corrupt map cycles. `line`, `parentId` and `ignoreBuildChecks` are the entry's own. Used by `resolveConfigLocation` and `createPageRegistry`.
- **`createKeyPathResolver({ keyMap })`** returns a function of a key id that gives the same result, memoising every entry it resolves, so a scan over the whole map reads and resolves each entry once. Used by `findConfig` (dev server find-config tool) and `collectSharedIds` (config mutants).

`shouldSuppressBuildCheck` needs only each ancestor's parent id and ignore value, so it reads those through the internal `readKeyEntryFields` without resolving paths.

## shouldSuppressBuildCheck

Walks up the keyMap parent chain looking for `~ignoreBuildChecks` settings.

```javascript
import { shouldSuppressBuildCheck } from '@lowdefy/errors';

if (shouldSuppressBuildCheck(error, context.keyMap)) {
  return; // Suppressed
}
```

**Signature:** `shouldSuppressBuildCheck(error, keyMap)` — takes the error object (reads `configKey`, `checkSlug` and `checkGroup`) and the keyMap.

**Walk logic:** Starting from `error.configKey`, walks up the parent chain (`~k_parent` or `p`, max 100 depth). At each entry, checks its ignore value (`~ignoreBuildChecks` or `i`):

- `true` → suppress all checks
- `['state-refs', 'types', ...]` → suppress if `error.checkSlug` or `error.checkGroup` is in the array

Plugin rule errors carry the rule id as `checkSlug` and `PLUGIN_CHECKS_SLUG` (`plugin-checks`) as `checkGroup`, so a node can silence one rule or all of them. `VALID_CHECK_SLUGS` lists only the built-in slugs and is never mutated; `addKeys` accepts any kebab-case slug and records the ones that are not built-in on `context.pluginCheckSlugRefs` for the plugin rules runner.

## Serialization

Errors are serialized by the `~e` marker in `@lowdefy/helpers/serializer`:

```javascript
// Replacer: Error → { '~e': { message, name, stack, ...enumerableProps } }
// Reviver: { '~e': data } → Object.create(ErrorClass.prototype) + assign props
```

The reviver uses a `lowdefyErrorTypes` map with direct imports to reconstruct the correct class without calling constructors (avoids re-formatting messages).

**Recursive cause serialization:** `extractErrorProps` recursively serializes Error objects found in the `cause` property, so the full cause chain is preserved across serialization boundaries. The CLI logger walks the `error.cause` chain, displaying `Caused by:` lines with indentation (limited to 3 levels to guard against circular references).

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
| `src/resolveKeyEntry.js`             | One key map entry, either shape → path, ref   |
| `src/createKeyPathResolver.js`       | Memoised key map reader for whole-map scans   |

## See Also

- [Error Tracing](../architecture/error-tracing.md) — Complete error flow across build/server/browser
- [Logger](./logger.md) — How errors are displayed
- [Helpers](./helpers.md) — Serializer `~e` handling and `extractErrorProps`
- [Build](../packages/build.md) — Build context, handleError/handleWarning wiring
