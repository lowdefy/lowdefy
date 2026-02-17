# Error Tracing System

Config-aware error tracing that maps runtime and build-time errors back to their source YAML configuration files.

> **IMPORTANT: Collect Errors, Don't Throw Immediately**
>
> Build-time validation errors MUST be collected using `collectExceptions()` instead of throwing `ConfigError` directly. This allows the build to continue and report ALL errors at once, rather than stopping at the first error.
>
> ```javascript
> // WRONG - stops build at first error
> throw new ConfigError({ message: '...', configKey });
>
> // CORRECT - collects error, build continues
> import collectExceptions from '../utils/collectExceptions.js';
> collectExceptions(context, new ConfigError({ message: '...', configKey }));
> ```
>
> When collecting errors, return early from the current function to avoid continuing with invalid data. The error will be reported with all other errors at the build checkpoint.

## Context

When Lowdefy throws errors (client, server, or build), developers need to trace them back to the specific location in their YAML configuration. This system uses build artifacts (`keyMap.json` and `refMap.json`) to resolve error locations with file paths and line numbers.

## Key Components

### Build-Time Tracking

The build pipeline tracks the origin of every config value:

| Artifact      | Purpose                                | Contents                                                            |
| ------------- | -------------------------------------- | ------------------------------------------------------------------- |
| `keyMap.json` | Maps internal keys to config locations | `{ "abc123": { key: "pages.0.blocks.0", "~r": "ref1", "~l": 15 } }` |
| `refMap.json` | Maps ref IDs to source files           | `{ "ref1": { path: "pages/home.yaml" } }`                           |

**Property markers added during build:**

- `~k` (configKey): Unique key identifying the config location
- `~l` (line): Line number in the source file
- `~r` (ref): Reference ID linking to the source file

### Location Resolution

Three functions handle different resolution contexts (all in `@lowdefy/errors`):

| Function                      | Context            | Signature                                                                 |
| ----------------------------- | ------------------ | ------------------------------------------------------------------------- |
| `resolveConfigLocation`       | Sync, post-addKeys | `({ configKey, keyMap, refMap, configDirectory })` → `{ source, config }` |
| `resolveErrorLocation`        | Sync, unified      | `(error, { keyMap, refMap, configDirectory })` — mutates error            |
| `loadAndResolveErrorLocation` | Async, runtime     | `({ error, readConfigFile, configDirectory })` → `{ source, config }`     |

```javascript
import { resolveConfigLocation } from '@lowdefy/errors';

const location = resolveConfigLocation({
  configKey: 'abc123',
  keyMap: context.keyMap,
  refMap: context.refMap,
  configDirectory: '/Users/dev/myapp',
});
// Returns:
// {
//   source: '/Users/dev/myapp/pages/home.yaml:15',  // absolute path:line
//   config: 'pages.0.blocks.0',                      // config path
// }
```

### Error Class Hierarchy

All error classes in `@lowdefy/errors` with single flat entry point:

| Error Class     | Purpose                     | Thrown By                 | Stack in CLI      |
| --------------- | --------------------------- | ------------------------- | ----------------- |
| `LowdefyError`  | Internal Lowdefy bugs       | Anywhere inside Lowdefy   | Yes (bugs)        |
| `ConfigError`   | Config validation errors    | Build validation          | No (use source)   |
| `ConfigWarning` | Config inconsistencies      | Build validation          | No (use source)   |
| `BuildError`    | Summary after errors logged | `logCollectedErrors`      | No (summary)      |
| `PluginError`   | Plugin code failures        | Plugin interface layer    | No (use received) |
| `ServiceError`  | External service failures   | Plugin interface layer    | No (use service)  |
| `UserError`     | Expected user interaction   | Actions (Validate, Throw) | No (client-only)  |

**Key markers:** All classes set `isLowdefyError = true` — survives serialization, replaces `instanceof` checks.

**Key principle:** Plugins throw errors without knowing about config keys. The interface layer catches all errors and adds `configKey` for location resolution.

### Property Extraction from Wrapped Errors

When wrapping an error via `new ConfigError({ error })` or `new PluginError({ error })`, both classes extract properties from the wrapped error as fallbacks:

| Property    | ConfigError                            | PluginError                            | ServiceError       |
| ----------- | -------------------------------------- | -------------------------------------- | ------------------ |
| `configKey` | `params.configKey ?? error?.configKey` | `error?.configKey ?? params.configKey` | `params.configKey` |
| `received`  | `params.received ?? error?.received`   | `params.received ?? error?.received`   | N/A                |
| `message`   | `params.message ?? error?.message`     | `params.message ?? error?.message`     | `params.message`   |

```javascript
// Plain error with received (e.g., from operator parser)
const err = new Error('bad input');
err.received = { _if: [true, 'a', 'b'] };
err.configKey = 'abc123';

// Wrapping preserves both properties
const configError = new ConfigError({ error: err });
configError.received; // { _if: [true, 'a', 'b'] }
configError.configKey; // 'abc123'
```

### Error Catch Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ERROR CATCH LAYERS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Layer 1: TOP LEVEL (build/server/client entry points)                      │
│  ├─ Catches: Everything that bubbles up                                     │
│  ├─ Calls: context.handleError(error) — resolves location, logs, Sentry     │
│  └─ Re-throws: ConfigError, PluginError, ServiceError (already formatted)   │
│                                                                             │
│  Layer 2: PLUGIN INTERFACE (parsers, action runner, request handler)        │
│  ├─ Catches: All errors from plugin code                                    │
│  ├─ Adds configKey to ALL errors for location tracing                       │
│  ├─ ConfigError: adds configKey if not present, re-throws                   │
│  ├─ ServiceError: creates new ServiceError({ error, service, configKey })   │
│  └─ Plain Error: wraps in PluginError (adds received, location, configKey)  │
│                                                                             │
│  Layer 3: BUILD VALIDATION (schema, refs, type checking)                    │
│  ├─ Errors: collectExceptions(context, new ConfigError({ ... }))            │
│  └─ Warnings: context.handleWarning(new ConfigWarning({ ... }))             │
│                                                                             │
│  Layer 4: PLUGIN CODE (operators, actions, blocks, connections)             │
│  ├─ Throws: Plain Error('simple message')                                   │
│  └─ No knowledge of Lowdefy error classes                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## handleError and handleWarning

Error handling is separate from logging. `handleError` and `handleWarning` are explicit functions — not hidden behind logger methods.

### handleError

| Environment | Access                          | Async | Created By                            |
| ----------- | ------------------------------- | ----- | ------------------------------------- |
| **Build**   | `context.handleError`           | Sync  | `createBuildHandleError({ context })` |
| **Server**  | `context.handleError`           | Async | `createHandleError({ ... })`          |
| **Browser** | `lowdefy._internal.handleError` | Async | `createHandleError(lowdefy)`          |
| **CLI**     | `errorHandler` (imported)       | Async | Direct function                       |

**Build handleError** (`packages/build/src/utils/createBuildHandleError.js`):

```javascript
function handleError(error) {
  try {
    resolveErrorLocation(error, {
      keyMap: context.keyMap,
      refMap: context.refMap,
      configDirectory: context.directories?.config,
    });
    context.logger.error(error); // Just logger.error(error) — display layer formats
  } catch {
    try {
      context.logger.error(error);
    } catch {
      console.error(error);
    }
  }
}
```

Three-layer safety net: resolve + log → log without resolve → console.error.

**Server handleError** (`packages/servers/*/lib/server/createHandleError.js`):

Per-request, async. Reads keyMap/refMap from build artifacts, resolves location, logs with request metadata (user, URL, headers), captures to Sentry.

**Browser handleError** (`packages/client/src/createHandleError.js`):

Deduplicates by `message:configKey`. Serializes error via `serializer.serialize()` (uses `~e` marker), sends to `/api/client-error`, receives resolved `source` back, displays via shared browser logger.

### handleWarning

Build-only. Created by `createHandleWarning({ context })`.

```javascript
function handleWarning(warning) {
  // 1. Check suppression
  if (shouldSuppressBuildCheck(warning, context.keyMap)) return;

  // 2. Escalate in prod if marked prodError
  if (warning.prodError && context.stage === 'prod') {
    collectExceptions(context, warning); // ConfigWarning extends ConfigError
    return;
  }

  // 3. Resolve location
  resolveErrorLocation(warning, { keyMap, refMap, configDirectory });

  // 4. Dedup by source location
  const dedupKey = warning.source ?? warning.message;
  if (context.seenSourceLines?.has(dedupKey)) return;
  context.seenSourceLines?.add(dedupKey);

  // 5. Log
  context.logger.warn(warning);
}
```

**Usage:**

```javascript
context.handleWarning(
  new ConfigWarning({
    message: '_state references "userName" but no block with id "userName" exists.',
    configKey: obj['~k'],
    checkSlug: 'state-refs',
    prodError: true,
  })
);
```

## Build-Time Error Handling

### Error Formatting and Collection

Build-time errors use classes from `@lowdefy/errors`:

```javascript
import { ConfigError, ConfigWarning } from '@lowdefy/errors';

// Fatal error — collected, build continues until checkpoint
collectExceptions(
  context,
  new ConfigError({
    message: `Block type "Buton" not found.`,
    configKey: block['~k'],
    checkSlug: 'types',
  })
);

// Warning — suppression, dedup, location resolution
context.handleWarning(
  new ConfigWarning({
    message: `_state references "userName" but no block with id "userName" exists.`,
    configKey: obj['~k'],
    checkSlug: 'state-refs',
    prodError: true,
  })
);
```

**Output format:**

```
/Users/dev/myapp/pages/home.yaml:15
[ConfigError] Block type "Buton" not found. Did you mean "Button"?
```

### Error Collection (Multi-Error Reporting)

Instead of stopping on the first error, the build system collects all errors and reports them at once.

**How it works:**

1. `createContext` initializes `context.errors = []` array
2. `collectExceptions(context, error)` checks suppression via `shouldSuppressBuildCheck`, then pushes to `context.errors`
3. `tryBuildStep` wraps each build phase to catch errors without stopping — also checks suppression
4. After all validation phases, `logCollectedErrors` iterates `context.errors`, calls `context.handleError(error)` for each (resolves location, logs), then throws `new BuildError('Build failed with N error(s).')`

**Example output:**

```
/Users/dev/app/pages/home.yaml:22
[ConfigError] Request "fetchData" not defined on page "home".

/Users/dev/app/pages/products.yaml:10
[ConfigError] Request "loadProducts" references non-existent connection "wrongDb".

Build failed with 2 error(s).
```

### Plugin Interface Examples

**Operators (in parser):**

```javascript
try {
  return operator({ params });
} catch (error) {
  // ConfigError — add configKey for location resolution
  if (error instanceof ConfigError) {
    if (!error.configKey) {
      error.configKey = configKey;
    }
    throw error;
  }
  // Plain errors get wrapped in PluginError
  throw new PluginError({
    error,
    pluginType: 'operator',
    pluginName: '_if',
    received: params,
    configKey,
  });
}
```

**Requests (in callRequestResolver):**

```javascript
try {
  return await requestResolver({ ... });
} catch (error) {
  if (!error.configKey) error.configKey = requestConfig['~k'];

  if (error instanceof ConfigError) throw error;

  if (ServiceError.isServiceError(error)) {
    throw new ServiceError({
      error,
      service: connectionId,
      configKey: requestConfig['~k'],
    });
  }

  throw new PluginError({
    error,
    pluginType: 'request',
    pluginName: requestType,
    received: requestProperties,
    configKey: requestConfig['~k'],
  });
}
```

### Operator Key Extraction

`extractOperatorKey.js` extracts top-level keys from operator references. Used by validators to identify referenced IDs.

```javascript
extractOperatorKey({ operatorValue: 'user.name' }); // 'user'
extractOperatorKey({ operatorValue: { key: 'user.name' } }); // 'user'
extractOperatorKey({ operatorValue: null }); // null
```

Used by: `validateStateReferences`, `validatePayloadReferences`, `validateStepReferences`

## Build-Time Validations

The build pipeline validates references and provides helpful error messages:

### Connection Validation (`buildConnections.js`)

```
[ConfigError] Request "getData" at page "home" references non-existent connection "mongoDB".
Did you mean "MongoDB"?
```

### Type Validation (`buildTypes.js`)

```
[ConfigError] Block type "Buton" not found. Did you mean "Button"?
```

### Reference Validations

| Validator                       | Validates                               | Example Warning                                                          |
| ------------------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| `validateStateReferences`       | `_state` references blockIds            | `_state references "userName" but no block with id "userName" exists`    |
| `validateServerStateReferences` | `_state` not used in request properties | `_state is not available in request properties`                          |
| `validatePayloadReferences`     | `_payload` references payload keys      | `_payload references "query" but key not in request payload definition`  |
| `validateStepReferences`        | `_step` references step IDs             | `_step references "step1" but no step with id "step1" exists in routine` |
| `validateLinkReferences`        | `Link` action references pageIds        | `Link action references page "homePage" but page does not exist`         |
| `validateRequestReferences`     | `Request` action references requestIds  | `Request "getData" not defined on page "home"`                           |

#### Deduplication Between State Validators

`validateStateReferences` and `validateServerStateReferences` have overlapping scope — both can encounter `_state` inside `request.properties`. To avoid duplicate warnings:

- `validateServerStateReferences` uses `traverseConfig` to walk `request.properties`, find the first `_state` object, and report its exact `~k`
- `validateStateReferences` pre-collects all `~k` values inside `request.properties` subtrees and **skips** those objects

#### Skip Condition Handling

| Action Type | Skip Behavior                                             | Rationale                                                             |
| ----------- | --------------------------------------------------------- | --------------------------------------------------------------------- |
| **Request** | Skips validation for `skip: true` OR `skip: { operator }` | Requests are page-scoped, may not be defined in all contexts          |
| **Link**    | Skips validation ONLY for `skip: true`                    | Pages are app-scoped, must exist regardless of conditional navigation |

### Suppressing Build Validation with ~ignoreBuildChecks

The `~ignoreBuildChecks` property allows developers to suppress specific or all build-time validation errors and warnings. Suppression cascades down to all descendant config objects.

```yaml
# Suppress all checks for this object and descendants
~ignoreBuildChecks: true

# Suppress only specific check types
~ignoreBuildChecks:
  - state-refs
  - types
```

**Available Check Slugs:**

| Slug              | Description                                 |
| ----------------- | ------------------------------------------- |
| `state-refs`      | Undefined `_state` reference warnings       |
| `payload-refs`    | Undefined `_payload` reference warnings     |
| `step-refs`       | Undefined `_step` reference warnings        |
| `link-refs`       | Invalid Link action page reference warnings |
| `request-refs`    | Invalid Request action reference warnings   |
| `connection-refs` | Nonexistent connection ID references        |
| `types`           | All type validation                         |
| `schema`          | JSON schema validation errors               |

**Implementation:** `shouldSuppressBuildCheck(error, keyMap)` walks up the `~k_parent` chain looking for `~ignoreBuildChecks` settings.

### Circular Reference Detection (`recursiveBuild.js`)

```
[ConfigError] Circular reference detected.
File "components/header.yaml" references itself through:
  components/header.yaml -> components/shared.yaml -> components/header.yaml
```

## Client-Side Error Handling

### Browser handleError

Located at `packages/client/src/createHandleError.js`. Single mechanism for all browser error handling:

```javascript
function createHandleError(lowdefy) {
  const loggedErrors = new Set();
  const logger = lowdefy._internal.logger;

  return async function handleError(error) {
    // Deduplicate
    const errorKey = `${error.message}:${error.configKey || ''}`;
    if (loggedErrors.has(errorKey)) return;
    loggedErrors.add(errorKey);

    // Known Lowdefy errors → send to server for location resolution
    if (error.configKey || ['ConfigError', 'PluginError', 'ServiceError', 'LowdefyError'].includes(error.name)) {
      const serialized = serializer.serialize(error);  // ~e marker
      if (serialized?.['~e']) delete serialized['~e'].received;  // Don't send received to server
      const response = await fetch(`${lowdefy?.basePath ?? ''}/api/client-error`, { ... });
      if (response.ok) {
        const { source } = await response.json();
        if (source) error.source = source;
      }
      logger.error(error);
      return;
    }

    logger.error(error);  // Other errors — just log locally
  };
}
```

**Key behaviors:**

- **Deduplication:** Same error logged only once per session
- **Serialization:** Uses `serializer.serialize()` with `~e` marker (not manual field picking)
- **Received excluded:** Removed from payload before sending (can be large)
- **Source resolution:** Server resolves `configKey` → `source`, returns it to client
- **Display:** Browser logger formats Lowdefy errors with `errorToDisplayString`

#### UserError — Client-Only, Console-Only

`UserError` represents expected user-facing errors (validation failures, intentional throws). It is **never sent to the server terminal** — it only logs to the browser console.

```
UserError     → logger.error() in browser only, NEVER sent to server terminal
PluginError   → handleError() → POST /api/client-error → server terminal
ConfigError   → handleError() → POST /api/client-error → server terminal
ServiceError  → handleError() → POST /api/client-error → server terminal
```

In `Actions.js`, `UserError` is detected by name and routed to the browser logger only.

#### Server-Side Client Error Logging

`logClientError` (`packages/api/src/routes/log/logClientError.js`) processes client-reported errors:

1. Deserializes error via `serializer.deserialize()` — restores correct error class
2. Calls `loadAndResolveErrorLocation()` — reads keyMap/refMap from build artifacts
3. Sets `error.source` and `error.config`
4. Logs via `logger.error(error)`
5. Returns `{ source }` to client for browser display

## Runtime Error Tracing

### API Control Structures

Control structures include endpoint context in errors:

```javascript
throw new Error(`Invalid :for in endpoint "${endpointId}" - :in must evaluate to an array.`);
```

Control structures use `~k` for operator evaluation location:

```javascript
const array = evaluateOperators({
  input: control[':in'],
  items,
  location: control['~k'] ?? ':for',
});
```

## Sentry Integration

Lowdefy includes built-in Sentry error tracking that captures both client and server errors with config location context.

### Configuration

Sentry is enabled by setting the `SENTRY_DSN` environment variable. Configuration in `lowdefy.yaml`:

```yaml
logger:
  sentry:
    client: true
    server: true
    tracesSampleRate: 0.1
    replaysOnErrorSampleRate: 0.1
    userFields: ['id', '_id']
```

### Error Context

When capturing errors to Sentry, the following context is included:

- **Tags:** `pageId`, `blockId`, `isServiceError`
- **Extra:** `configLocation` (resolved from keyMap/refMap), `configKey`

### Graceful Degradation

All Sentry functions are no-ops when `SENTRY_DSN` is not set.

## Error Serialization

### Helpers Serializer (~e Marker)

The `@lowdefy/helpers` serializer handles error serialization via the `~e` marker:

- **Replacer:** `extractErrorProps(error)` captures `message`, `name`, `stack`, `cause` (non-enumerable) + all enumerable properties → wraps as `{ '~e': props }`
- **Reviver:** `Object.create(ErrorClass.prototype)` + property assignment — reconstructs correct Lowdefy class without calling constructors

```javascript
// Round-trip preserves class and all properties
const serialized = serializer.serialize(pluginError);
// { '~e': { name: 'PluginError', message: '...', pluginType: 'operator', ... } }
const restored = serializer.deserialize(serialized);
// restored instanceof PluginError → false (Object.create, not constructor)
// restored.isLowdefyError → true
// restored.name → 'PluginError'
```

### Pino Error Serialization

Pino uses `extractErrorProps` directly (no `~e` wrapper) as the `err` serializer. The line handler reconstructs errors using the same `lowdefyErrorTypes` map and `Object.create + assign` pattern.

### Transport (Browser → Server)

Browser `handleError` uses `serializer.serialize()` for the POST body. The server uses `serializer.deserialize()` to restore the error class. This is different from pino serialization — it uses the `~e` wrapper.

## Config Traversal

`packages/build/src/utils/traverseConfig.js` provides depth-first traversal for validation:

```javascript
traverseConfig({
  config: page,
  visitor: (obj) => {
    if (obj._state !== undefined) {
      const topLevelKey = extractOperatorKey({ operatorValue: obj._state });
      if (topLevelKey && !stateRefs.has(topLevelKey)) {
        stateRefs.set(topLevelKey, obj['~k']);
      }
    }
  },
});
```

## Related Files

### Error Classes and Utilities

- `packages/utils/errors/src/` — All error classes and resolution functions

### Build Integration

- `packages/build/src/createContext.js` — Wires `context.handleError` and `context.handleWarning`
- `packages/build/src/utils/createBuildHandleError.js` — Build error handler
- `packages/build/src/utils/createHandleWarning.js` — Build warning handler
- `packages/build/src/utils/collectExceptions.js` — Error collector with suppression
- `packages/build/src/utils/tryBuildStep.js` — Build step wrapper with suppression
- `packages/build/src/utils/logCollectedErrors.js` — Logs all errors, throws BuildError

### Client Integration

- `packages/client/src/createHandleError.js` — Browser error handler
- `packages/client/src/initLowdefyContext.js` — Wires `lowdefy._internal.handleError`

### Server Integration

- `packages/servers/server/lib/server/createHandleError.js` — Server error handler
- `packages/servers/server-dev/lib/server/createHandleError.js` — Dev server error handler
- `packages/api/src/routes/log/logClientError.js` — Client error endpoint

### Sentry Integration

- `packages/servers/server/lib/server/sentry/` — Server-side Sentry utilities
- `packages/servers/server/lib/client/sentry/` — Client-side Sentry utilities

### Issues & PRs

- Issue #1940 — Original feature request (config-aware error tracing)
- Issue #2022 — Logging & error formatting refactor
