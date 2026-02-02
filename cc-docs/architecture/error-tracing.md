# Error Tracing System

Config-aware error tracing that maps runtime and build-time errors back to their source YAML configuration files.

> **IMPORTANT: Collect Errors, Don't Throw Immediately**
>
> Build-time validation errors MUST be collected using `collectConfigError()` instead of throwing `ConfigError` directly. This allows the build to continue and report ALL errors at once, rather than stopping at the first error.
>
> ```javascript
> // WRONG - stops build at first error
> throw new ConfigError({ message: '...', configKey, context });
>
> // CORRECT - collects error, build continues
> import collectConfigError from '../utils/collectConfigError.js';
> collectConfigError({ message: '...', configKey, context });
> ```
>
> When using `collectConfigError`, return early from the current function to avoid continuing with invalid data. The error will be reported with all other errors at the build checkpoint.

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

`packages/utils/helpers/src/resolveConfigLocation.js` resolves a `~k` value to human-readable location:

```javascript
import { resolveConfigLocation } from '@lowdefy/helpers';

const location = resolveConfigLocation({
  configKey: 'abc123',
  keyMap: context.keyMap,
  refMap: context.refMap,
  configDirectory: '/Users/dev/myapp',
});
// Returns:
// {
//   source: 'pages/home.yaml:15',           // file:line
//   config: 'pages.0.blocks.0',             // config path
//   link: '/Users/dev/myapp/pages/home.yaml:15'  // clickable VSCode link
// }
```

### Error Class Hierarchy

Lowdefy uses a unified error system in `@lowdefy/errors` package:

```
@lowdefy/errors/
├── LowdefyError.js     # Internal Lowdefy bugs
├── PluginError.js      # Plugin failures (operators, actions, blocks, requests)
├── ServiceError.js     # External service failures (network, timeout, 5xx)
├── ConfigError.js      # Config validation errors
└── ConfigWarning.js    # Warnings (dev) / Errors (prod)
```

| Error Class      | Purpose                                          | Thrown By                      | Caught At                        | Prefix             |
| ---------------- | ------------------------------------------------ | ------------------------------ | -------------------------------- | ------------------ |
| `LowdefyError`   | Internal Lowdefy bugs, unexpected conditions     | Anywhere inside Lowdefy        | Top-level (build/server/client)  | `[Lowdefy Error]`  |
| `PluginError`    | Plugin code failures (operators, actions, etc.)  | Plugin interface layer         | Request handlers, parsers        | `[Plugin Error]`   |
| `ServiceError`   | External service failures (network, timeout)     | Plugin interface layer         | Request handlers                 | `[Service Error]`  |
| `ConfigError`    | Config validation errors (invalid YAML, schema)  | Build validation               | Build orchestrator               | `[Config Error]`   |
| `ConfigWarning`  | Config inconsistencies (warning in dev only)     | Build validation               | Build orchestrator               | `[Config Warning]` |

**Key principle:** Plugins throw errors without knowing about config keys. The interface layer catches all errors and adds `configKey` for location resolution - this helps developers trace any error back to its config source. ConfigError supports a simple string form (`new ConfigError('message')`) for plugin convenience.

### Property Extraction from Wrapped Errors

When wrapping an error via `new ConfigError({ error })` or `new PluginError({ error })`, both classes extract properties from the wrapped error as fallbacks:

| Property | ConfigError | PluginError | ServiceError |
|----------|-------------|-------------|--------------|
| `configKey` | `params.configKey ?? error?.configKey` | `error?.configKey ?? params.configKey` | `params.configKey` |
| `received` | `params.received ?? error?.received` | `params.received ?? error?.received` | N/A |
| `message` | `params.message ?? error?.message` | `params.message ?? error?.message` | `params.message` |

This means wrapping a plain error that already carries `received` or `configKey` preserves those properties automatically:

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
│  ├─ Wraps unexpected errors as: LowdefyError                                │
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
│  ├─ Throws: ConfigError (with configKey for location)                       │
│  └─ Uses: ConfigWarning (warn in dev, error in prod)                        │
│                                                                             │
│  Layer 4: PLUGIN CODE (operators, actions, blocks, connections)             │
│  ├─ Throws: Plain Error('simple message')                                   │
│  └─ No knowledge of Lowdefy error classes                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Build-Time Error Formatting

Build-time errors use classes from `@lowdefy/errors/build` which extend the base classes:

| Class            | Purpose                              | Location                                   |
| ---------------- | ------------------------------------ | ------------------------------------------ |
| `ConfigMessage`  | Base formatter (shared logic)        | `packages/utils/errors/src/build/`         |
| `ConfigError`    | Build errors (extends base class)    | `packages/utils/errors/src/build/`         |
| `ConfigWarning`  | Build warnings (non-fatal)           | `packages/utils/errors/src/build/`         |

**Architecture:** Build-time `ConfigError` and `ConfigWarning` use `ConfigMessage.format()` for synchronous location resolution via `keyMap` and `refMap`.

**Import pattern:**
```javascript
import { ConfigError, ConfigWarning } from '@lowdefy/errors/build';
```

**Usage (build-time - via logger methods):**

```javascript
import { ConfigError } from '@lowdefy/errors/build';

// For fatal errors that stop the build
throw new ConfigError({
  message: `Block type "Buton" not found.`,
  configKey: block['~k'],
  context,
});

// For warnings that don't stop the build
context.logger.configWarning({
  message: `_state references "userName" but no block with id "userName" exists.`,
  configKey: obj['~k'],
});

// Warning that becomes error in prod builds
context.logger.configWarning({
  message: 'Deprecated feature used.',
  configKey: obj['~k'],
  prodError: true,
});
```

**Output format:**

```
pages/home.yaml:15
[Config Error] Block type "Buton" not found. Did you mean "Button"?
```

### Client-Side Error Handling

Client-side uses the base `ConfigError` from `@lowdefy/errors` (via `@lowdefy/helpers`):

```javascript
import { ConfigError } from '@lowdefy/errors/client';
import { PluginError, ServiceError } from '@lowdefy/errors/server';

// ConfigError - serialize and send to server for location resolution
const error = new ConfigError({ message: 'Invalid operator', configKey });
// error.serialize() → POST /api/client-error → resolves source:line
console.error(error.print()); // "[ConfigError] Invalid operator"

// PluginError wraps plugin failures
const pluginError = new PluginError({
  error: originalError,
  pluginType: 'operator',
  pluginName: '_if',
  received: params,
  location: 'blocks.0.properties.visible',
  configKey,
});

// ServiceError for network failures
if (ServiceError.isServiceError(error)) {
  const serviceError = new ServiceError({
    error,
    service: 'connectionId',
    configKey,
  });
  console.error(serviceError.print());
}
```

### Plugin Interface Examples

**Operators (in parser):**

```javascript
try {
  return operator({ params });
} catch (error) {
  // ConfigError - add configKey for location resolution
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
    location: operatorLocation,
    configKey,
  });
}
```

**Requests (in callRequestResolver):**

```javascript
try {
  return await requestResolver({ ... });
} catch (error) {
  // Add configKey to any error for location tracing
  if (!error.configKey) {
    error.configKey = requestConfig['~k'];
  }
  // ConfigError - re-throw (already has configKey)
  if (error instanceof ConfigError) {
    throw error;
  }
  // ServiceError - wrap with service name and configKey
  if (ServiceError.isServiceError(error)) {
    throw new ServiceError({
      error,
      service: connectionId,
      configKey: requestConfig['~k'],
    });
  }
  // Plain errors get wrapped in PluginError
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
import extractOperatorKey from '../../utils/extractOperatorKey.js';

// Handles both string and object forms
extractOperatorKey({ operatorValue: 'user.name' }); // 'user'
extractOperatorKey({ operatorValue: 'items[0].value' }); // 'items'
extractOperatorKey({ operatorValue: { key: 'user.name' } }); // 'user'
extractOperatorKey({ operatorValue: { path: 'data[0]' } }); // 'data'
extractOperatorKey({ operatorValue: null }); // null
```

Used by:

- `validateStateReferences.js` - extracts blockId from `_state` references
- `validatePayloadReferences.js` - extracts payload key from `_payload` references
- `validateStepReferences.js` - extracts step ID from `_step` references

## Build-Time Validations

The build pipeline validates references and provides helpful error messages:

### Connection Validation (`buildConnections.js`)

Validates connection IDs exist when referenced by requests:

```
[Config Error] Request "getData" at page "home" references non-existent connection "mongoDB".
Did you mean "MongoDB"?
```

### Type Validation (`buildTypes.js`)

Validates block, operator, request, and action types with suggestions:

```
[Config Error] Block type "Buton" not found. Did you mean "Button"?
```

### Reference Validations

| Validator                          | Validates                              | Example Warning                                                          |
| ---------------------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| `validateStateReferences`          | `_state` references blockIds           | `_state references "userName" but no block with id "userName" exists`    |
| `validateServerStateReferences`    | `_state` not used in request properties | `_state is not available in request properties`                         |
| `validatePayloadReferences`        | `_payload` references payload keys     | `_payload references "query" but key not in request payload definition`  |
| `validateStepReferences`           | `_step` references step IDs            | `_step references "step1" but no step with id "step1" exists in routine` |
| `validateLinkReferences`           | `Link` action references pageIds       | `Link action references page "homePage" but page does not exist`         |
| `validateRequestReferences`        | `Request` action references requestIds | `Request "getData" not defined on page "home"`                           |

#### Deduplication Between State Validators

`validateStateReferences` and `validateServerStateReferences` have overlapping scope — both can encounter `_state` inside `request.properties`. To avoid duplicate warnings:

- `validateServerStateReferences` uses `traverseConfig` to walk `request.properties`, find the first `_state` object, and report its exact `~k` (config key pointing to the correct YAML line).
- `validateStateReferences` pre-collects all `~k` values inside `request.properties` subtrees and **skips** those objects when collecting `_state` refs. This means `_state` inside request properties only triggers the "not available in request properties" warning, not a misleading "undefined state reference" warning.

**Implementation:** `packages/build/src/build/buildPages/validateStateReferences.js` and `packages/build/src/build/buildPages/validateServerStateReferences.js`

#### Skip Condition Handling

Request and Link actions have **different validation behaviors** for skip conditions because of their scope differences:

| Action Type | Skip Behavior | Rationale |
|-------------|---------------|-----------|
| **Request** | Skips validation for `skip: true` OR `skip: { operator }` | Requests are page-scoped and may not be defined in all contexts |
| **Link** | Skips validation ONLY for `skip: true` | Pages are app-scoped and must exist regardless of conditional navigation |

**`validateRequestReferences` - Lenient**

Validation is skipped when `skip` is:
- `skip: true` (explicitly disabled)
- `skip: { operator }` (any operator object, e.g., `{ _eq: [...] }`)

**Rationale:** In multi-app monorepos, requests may only be defined in certain app contexts. Validating conditional requests would create false positives.

**Example:** Multi-app monorepo where some requests only exist in specific apps:

```yaml
events:
  onClick:
    - id: fetch_companies
      type: Request
      skip:
        _eq:
          - _ref: { path: app_config.yaml, key: app_name }
          - prp-support
      params: contact_companies_search  # Only exists in non-support apps
```

In this case, `contact_companies_search` may not be defined on the current page (because it's only used in non-support apps), but validation is skipped because the action has a conditional `skip` operator.

**Implementation:** `packages/build/src/build/buildPages/validateRequestReferences.js:26-28`

```javascript
// Skip validation if action has skip condition (true or operator object)
if (action.skip === true || type.isObject(action.skip)) {
  return;
}
```

**`validateLinkReferences` - Strict**

Validation is skipped ONLY when:
- `skip: true` (explicitly disabled)

Validation runs normally for:
- `skip: { operator }` (operator objects - page must exist)
- `skip: false` (explicitly enabled)
- `skip: undefined` (property not set)
- No `skip` property

**Rationale:** Pages are defined at the app level and must exist in the app regardless of whether the Link is conditionally executed. A conditional skip only controls navigation timing, not page existence.

**Example:** Conditional navigation to admin page:

```yaml
events:
  onClick:
    - id: go_to_admin
      type: Link
      skip:
        _not:
          _state: user.isAdmin
      params: admin_dashboard  # Page MUST exist even if user isn't admin
```

The `admin_dashboard` page must be defined in the app. The skip condition only controls whether the navigation happens at runtime, not whether the page exists.

**Implementation:** `packages/build/src/build/buildPages/validateLinkReferences.js:23-27`

```javascript
// Only skip validation if skip is explicitly true
// Pages must exist in app even if Link is conditional
if (action.skip === true) {
  return;
}
```

### Suppressing Build Validation with ~ignoreBuildChecks

The `~ignoreBuildChecks` property allows developers to suppress specific or all build-time validation errors and warnings. Suppression cascades down to all descendant config objects.

**Syntax:**

```yaml
# Suppress all checks for this object and descendants
~ignoreBuildChecks: true

# Suppress only specific check types
~ignoreBuildChecks:
  - state-refs
  - types
```

**Available Check Slugs:**

| Slug             | Description                                                     |
|------------------|------------------------------------------------------------------|
| `state-refs`     | Undefined `_state` reference warnings                            |
| `payload-refs`   | Undefined `_payload` reference warnings                          |
| `step-refs`      | Undefined `_step` reference warnings                             |
| `link-refs`      | Invalid Link action page reference warnings                      |
| `request-refs`   | Invalid Request action reference warnings                        |
| `connection-refs`| Nonexistent connection ID references                             |
| `types`          | All type validation (blocks, operators, actions, requests, connections) |
| `schema`         | JSON schema validation errors                                    |

**Use Cases:**
- Dynamic config patterns where references only exist at runtime
- Work-in-progress config during development
- Conditional features that may not be valid in all contexts
- Plugin development with custom types not yet registered

**Behavior:**
- Suppression is **silent** by default - no log output when errors are suppressed
- With `--log-level debug`, suppressions are logged for debugging
- **Cascades to descendants** - setting on a page suppresses all child blocks
- Only affects **build-time** validation - runtime errors still occur normally
- Works on all config objects: blocks, operators, requests, connections, actions

**Example 1:** State reference from dynamic registration

```yaml
blocks:
  - id: my_block
    type: CustomBlock
    properties:
      onClick:
        _state: dynamicState  # Created by methods.registerEvent at runtime
        ~ignoreBuildChecks: true  # Suppress all build-time checks
```

**Example 2:** Suppress only state references for an entire page

```yaml
pages:
  - id: dynamic-page
    type: Box
    ~ignoreBuildChecks:
      - state-refs  # Only suppress state reference warnings
    blocks:
      - id: block1
        type: TextInput
        properties:
          value:
            _state: dynamicField  # No warning (inherited from page)
```

**Example 3:** Suppress type validation for custom plugin blocks

```yaml
blocks:
  - id: custom_block
    type: MyCustomBlock  # Custom type not in types registry
    ~ignoreBuildChecks:
      - types
    properties:
      title: Hello
```

**Implementation:**

The suppression check happens lazily when an error/warning is about to be logged. It walks up the parent chain (`~k_parent`) looking for `~ignoreBuildChecks` settings:

```javascript
// packages/utils/node-utils/src/ConfigMessage.js
static shouldSuppress({ configKey, keyMap, checkSlug, verbose }) {
  if (!configKey || !keyMap) return false;

  let currentKey = configKey;
  while (currentKey) {
    const entry = keyMap[currentKey];
    if (!entry) break;

    const ignoredChecks = entry['~ignoreBuildChecks'];
    if (ignoredChecks === true) return true;  // Suppress all
    if (Array.isArray(ignoredChecks) && checkSlug && ignoredChecks.includes(checkSlug)) {
      return true;  // Suppress specific check
    }

    currentKey = entry['~k_parent'];
  }
  return false;
}
```

**Migration:** The old `~ignoreBuildCheck` property is no longer supported. Using it will throw a migration error explaining the rename to `~ignoreBuildChecks`.

### Circular Reference Detection (`recursiveBuild.js`)

Detects circular `_ref` imports using Set-based cycle detection:

```
[Config Error] Circular reference detected.
File "components/header.yaml" references itself through:
  components/header.yaml -> components/shared.yaml -> components/header.yaml
```

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

### Client Error Logging

Client errors use the `ConfigError` class from `@lowdefy/errors/client` for error handling with async location resolution via the `/api/client-error` endpoint.

#### createLogError Factory

Located at `packages/client/src/createLogError.js`, creates the `logError` function:

```javascript
function createLogError(lowdefy) {
  const loggedErrors = new Set();

  return async function logError(error) {
    // Deduplicate by message + configKey
    const errorKey = `${error.message}:${error.configKey || ''}`;
    if (loggedErrors.has(errorKey)) return;
    loggedErrors.add(errorKey);

    // Errors with serialize() - send to server for location resolution
    if (error.serialize) {
      const response = await fetch('/api/client-error', {
        method: 'POST',
        body: JSON.stringify(error.serialize()),
      });
      const { source } = await response.json();
      if (source) console.info(source);  // "pages/home.yaml:15"
      console.error(error.print());       // "[ConfigError] message. Received: ..."
      return;
    }

    // Plain errors with configKey - wrap in ConfigError for serialization
    // ConfigError constructor extracts received/configKey from wrapped error
    if (error.configKey) {
      const configError = new ConfigError({ error });
      await logError(configError);
      return;
    }

    // Other errors - log locally
    console.error(error.print ? error.print() : `[${error.name}] ${error.message}`);
  };
}
```

**Key behaviors:**
- **Deduplication**: Same error logged only once per session
- **Location resolution**: Errors with `serialize()` are sent to server for `configKey → source:line` resolution
- **Property forwarding**: Wrapping in `new ConfigError({ error })` preserves `received` and `configKey` from the original error
- **Graceful degradation**: Logs without location if server unreachable

#### Plugin/Core Boundary

Plugins throw plain errors without knowing about `configKey`. The core wraps them:

```javascript
// WebParser.parse() - packages/operators/src/webParser.js
try {
  return operator({ params, ... });
} catch (e) {
  if (e instanceof ConfigError) {
    if (!e.configKey) e.configKey = configKey;
    errors.push(e);
    return null;
  }
  errors.push(new PluginError({
    error: e,
    pluginType: 'operator',
    pluginName: op,
    received: { [key]: params },
    location: operatorLocation,
    configKey,
  }));
  return null;
}
```

This maintains separation of concerns:
- **Plugins**: Throw descriptive errors about what went wrong
- **Core**: Attaches `configKey`, `received`, and location context

## Sentry Integration

Lowdefy includes built-in Sentry error tracking that captures both client and server errors with config location context.

### Configuration

Sentry is enabled by setting the `SENTRY_DSN` environment variable. Configuration options are defined in `lowdefy.yaml`:

```yaml
logger:
  sentry:
    client: true # Enable client-side capture
    server: true # Enable server-side capture
    tracesSampleRate: 0.1 # Performance trace sample rate
    replaysOnErrorSampleRate: 0.1 # Session replay on error
    userFields: ['id', '_id'] # User context fields (no PII by default)
```

### Files

| File                                                              | Purpose                                      |
| ----------------------------------------------------------------- | -------------------------------------------- |
| `packages/build/src/build/buildLogger.js`                         | Processes logger config with defaults        |
| `packages/build/src/build/writeLogger.js`                         | Writes `logger.json` build artifact          |
| `packages/servers/server/lib/server/sentry/initSentry.js`         | Server-side Sentry initialization            |
| `packages/servers/server/lib/client/sentry/initSentryClient.js`   | Client-side Sentry initialization            |
| `packages/servers/server/lib/server/sentry/captureSentryError.js` | Captures errors with Lowdefy context         |
| `packages/servers/server/lib/server/sentry/setSentryUser.js`      | Sets user context for authenticated sessions |
| `packages/servers/server/sentry.server.config.js`                 | @sentry/nextjs server config entry           |
| `packages/servers/server/sentry.client.config.js`                 | @sentry/nextjs client config entry           |
| `packages/servers/server/sentry.edge.config.js`                   | @sentry/nextjs edge config entry             |

### Error Context

When capturing errors to Sentry, the following Lowdefy-specific context is included:

- **Tags:** `pageId`, `blockId`, `isServiceError`
- **Extra:** `configLocation` (resolved from keyMap/refMap), `configKey`

This enables filtering Sentry issues by page or block, and clicking through to the exact YAML source location.

### Graceful Degradation

All Sentry functions are no-ops when `SENTRY_DSN` is not set:

- `initSentryServer()` returns early if no DSN
- `initSentryClient()` returns early if no DSN
- `captureSentryError()` returns early if no DSN
- `setSentryUser()` returns early if no DSN

This ensures no runtime errors when Sentry is not configured.

## Config Traversal

`packages/build/src/utils/traverseConfig.js` provides depth-first traversal for validation:

```javascript
import extractOperatorKey from '../../utils/extractOperatorKey.js';
import traverseConfig from '../../utils/traverseConfig.js';

const stateRefs = new Map();
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

### Error Collection (Multi-Error Reporting)

Instead of stopping on the first error, the build system collects all errors and reports them at once.

**How it works:**

1. `createContext` initializes `context.errors = []` array
2. `tryBuildStep` wraps each build phase to catch errors without stopping:
   ```javascript
   function tryBuildStep(stepFn, stepName, { components, context }) {
     try {
       return stepFn({ components, context });
     } catch (error) {
       context.errors.push(error.message);
       context.logger.error(error.message);
     }
   }
   ```
3. `collectConfigError` utility collects errors instead of throwing:
   ```javascript
   function collectConfigError({ message, configKey, context }) {
     const errorMessage = ConfigError.format({ message, configKey, context });
     if (!errorMessage) return; // Suppressed
     if (!context.errors) {
       throw new Error(errorMessage); // Fallback for tests
     }
     context.errors.push(errorMessage);
     context.logger.error(errorMessage);
   }
   ```
4. After all build steps, check if errors were collected:
   ```javascript
   if (context.errors.length > 0) {
     context.logger.error(`\nBuild failed with ${context.errors.length} error(s):\n`);
     throw new Error(`Build failed with ${context.errors.length} error(s). See above for details.`);
   }
   ```

**Example output:**

```
✖ [Config Error] Request "fetchData" not defined on page "home".
  pages/home.yaml:22 at root.pages[0:home:PageHeaderMenu].blocks[0]...
  /Users/dev/app/pages/home.yaml:22

✖ [Config Error] Request "loadProducts" references non-existent connection "wrongDb".
  pages/products.yaml:10 at root.pages[1:products:PageHeaderMenu].requests[0]...
  /Users/dev/app/pages/products.yaml:10

✖ [Config Error] Block type "InvalidBlockType" not defined.
  pages/about.yaml:21 at root.pages[2:about:PageHeaderMenu].blocks[1]...
  /Users/dev/app/pages/about.yaml:21

Build failed with 3 error(s):
```

**Files:**

- `packages/build/src/utils/collectConfigError.js` - Error collector
- `packages/build/src/utils/tryBuildStep.js` - Build step wrapper
- `packages/build/src/index.js` - Main build orchestration
- `packages/build/src/createContext.js` - Context with errors array

## Decision Trace

### Why Collect All Errors Before Stopping?

**Problem:** Build stopped on first error, requiring multiple build attempts to fix all issues.

**Decision:** Collect all build errors in `context.errors[]` and report them at once.

**Implementation:**

- Wrap each build step in `tryBuildStep()` to catch errors
- Add `collectConfigError()` utility for inline error collection
- Only stop build after all validation phases complete

**Trade-off:**

- Pro: Developers see all errors at once, fix faster
- Pro: Works in both dev and prod builds
- Con: Build continues even with errors, may cause cascading issues
- Mitigation: Stop before write phase, only validation continues

**Test impact:** Tests that check `context.errors` array don't exist, so `collectConfigError` throws immediately if no array present (backward compatible).

### Why Track Line Numbers?

**Problem:** Original implementation only tracked file paths, not line numbers. For large files, this wasn't precise enough.

**Decision:** Add `~l` property during YAML parsing to track line numbers.

**Trade-off:** Slight increase in build artifact size, but significantly better DX.

### Why Use Classes for Config Errors/Warnings?

**Problem:** `formatConfigError()` and `formatConfigWarning()` were nearly identical functions. Also, throwing `new Error(formatConfigError(...))` was awkward.

**Decision:** Use classes in `@lowdefy/node-utils`:
- `ConfigMessage` - Base class with shared `format()` logic
- `ConfigError` - Extends Error, can be thrown directly
- `ConfigWarning` - Static `format()` method with `prodError` flag

**Trade-off:** More structured but:

- `throw new ConfigError({...})` is cleaner than `throw new Error(formatConfigError({...}))`
- `prodError` flag centralizes dev/prod warning behavior
- Logger convenience methods (`context.logger.configWarning()`) hide implementation details
- Tests centralized in class test files

### Why Extract extractOperatorKey?

**Problem:** Three validators (`validateStateReferences`, `validatePayloadReferences`, `validateStepReferences`) had identical 12-line blocks to extract the top-level key from operator values like `_state`, `_payload`, `_step`.

**Decision:** Extract to `extractOperatorKey.js` utility that handles:

- String values: `'user.name'` → `'user'`
- Object with `key`: `{ key: 'user.name' }` → `'user'`
- Object with `path`: `{ path: 'data[0]' }` → `'data'`
- Invalid values: `null`, `undefined`, `123` → `null`

**Trade-off:** One more file, but:

- Edge case tests (null, arrays, empty objects) centralized in one test file
- Consistent behavior across all operator validators
- Future operator validators can reuse the utility

### Why Warn Instead of Error for Reference Validations?

**Problem:** Should undefined `_state` references fail the build?

**Decision:** Warn in dev mode, throw in production. Some references may be dynamically created.

**Trade-off:** More permissive in dev (faster iteration) but catches issues before production.

### Why Separate Client and Build ConfigError Classes?

**Problem:** Both client and build need ConfigError, but with different capabilities.

**Decision:** Two separate implementations:
- `@lowdefy/helpers` - Client-side, async location resolution via HTTP
- `@lowdefy/node-utils` - Build-time, sync resolution with direct keyMap/refMap access

**Rationale:**
- Client cannot access keyMap/refMap directly (server-side only)
- Client needs non-blocking resolution (can't freeze UI)
- Build has synchronous access to all artifacts
- Different timeout/fallback requirements

### Why Plugin/Core Boundary for configKey?

**Problem:** Should plugins know about `configKey` and throw ConfigError directly?

**Decision:** Plugins throw errors without `configKey`. The interface layer adds `configKey` to ALL error types before re-throwing.

**Rationale:**
- Plugins are user-facing, should have simple error interface
- `configKey` is an internal implementation detail
- Core already tracks `~k` during operator evaluation
- Keeps plugin API stable even if error tracking changes

### Why Add configKey to ALL Errors (Including ServiceError)?

**Problem:** Initially, ServiceError passed through unchanged because it represents infrastructure issues, not config problems. However, even service errors originate from a specific config location (e.g., a request that made a database call).

**Decision:** Add `configKey` to ALL error types at the interface layer:
- `ConfigError`: Add `configKey` if not present, then re-throw
- `ServiceError`: Create `new ServiceError({ error, service, configKey })`
- Plain `Error`: Wrap in `new PluginError({ error, ..., configKey })`

**Rationale:**
- Even infrastructure errors are triggered by specific config - developers want to know which request/connection caused the issue
- Consistent error handling - all errors can be traced back to config
- The service may be fine; the config might have wrong connection string
- Adding location to ServiceError helps distinguish "MongoDB is down" from "this specific request to MongoDB failed"

**Implementation:** ServiceError constructor accepts `configKey`:
```javascript
new ServiceError({
  error,
  service: connectionId,
  configKey: requestConfig['~k'],
});
```

### Why ConfigError String Overload?

**Problem:** Plugins throwing ConfigError had to use object form: `throw new ConfigError({ message: 'msg' })`. This was verbose for simple error messages.

**Decision:** Support both string and object forms:
```javascript
// Simple string form (for plugins)
throw new ConfigError('Property must be a string.');

// Object form (when you have additional context)
throw new ConfigError({ message: 'Property must be a string.', configKey });
```

**Rationale:**
- Plugins should have a simple API - they shouldn't need to know about configKey
- String form is concise and readable
- Interface layer adds configKey anyway, so plugins don't need to provide it
- Object form still available for cases where additional metadata is needed

**Implementation:** Constructor checks parameter type:
```javascript
constructor(messageOrParams) {
  const isString = typeof messageOrParams === 'string';
  const message = isString ? messageOrParams : messageOrParams.message;
  // ...
}
```

## Related

### Build Utilities

- `packages/build/src/utils/extractOperatorKey.js` - Extracts top-level key from operator values
- `packages/build/src/utils/traverseConfig.js` - Config traversal utility
- `packages/build/src/utils/findSimilarString.js` - "Did you mean?" suggestions

### Build Core

- `packages/build/src/index.js` - Main build orchestration with error collection
- `packages/build/src/createContext.js` - Build context with errors array and logger methods
- `packages/build/src/build/buildRefs/recursiveBuild.js:95-110` - Multi-file ref handling

### Helpers

- `packages/utils/helpers/src/resolveConfigLocation.js` - Location resolver
- `packages/utils/helpers/src/ConfigError.js` - Client-side ConfigError class

### Errors Package

- `packages/utils/errors/src/ConfigError.js` - Base ConfigError class
- `packages/utils/errors/src/ConfigWarning.js` - Base ConfigWarning class
- `packages/utils/errors/src/PluginError.js` - Plugin failure wrapper
- `packages/utils/errors/src/ServiceError.js` - Service/network failure wrapper
- `packages/utils/errors/src/build/ConfigError.js` - Build-time ConfigError (sync resolution)
- `packages/utils/errors/src/build/ConfigWarning.js` - Build-time warning with prodError
- `packages/utils/errors/src/build/ConfigMessage.js` - Base message formatter
- `packages/utils/errors/src/client/ConfigError.js` - Client-side ConfigError (async resolution)

### Client

- `packages/client/src/createLogError.js` - Error logging with deduplication
- `packages/operators/src/webParser.js` - Wraps operator errors with ConfigError

### Sentry Integration

- `packages/servers/server/lib/server/sentry/` - Sentry server utilities
- `packages/servers/server/lib/client/sentry/` - Sentry client utilities

### Issues & PRs

- Issue #1940 - Original feature request (config-aware error tracing)
- PR #1944 - Implementation
- Issue #1945 - Sentry integration
