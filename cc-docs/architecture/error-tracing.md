# Error Tracing System

Config-aware error tracing that maps runtime and build-time errors back to their source YAML configuration files.

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

### Error Formatting Utilities

Four utilities format error messages with location info:

| Utility               | Purpose                              | Prefix             |
| --------------------- | ------------------------------------ | ------------------ |
| `formatConfigMessage` | Core formatter (shared logic)        | Custom             |
| `formatConfigError`   | Build errors (fatal)                 | `[Config Error]`   |
| `formatConfigWarning` | Build warnings (non-fatal)           | `[Config Warning]` |
| `collectConfigError`  | Collect errors before stopping build | `[Config Error]`   |
| `tryBuildStep`        | Wrapper to catch build step errors   | N/A                |

Location: `packages/build/src/utils/`

**Architecture:** `formatConfigError` and `formatConfigWarning` are thin wrappers around `formatConfigMessage`:

```javascript
// formatConfigMessage.js - shared core logic
function formatConfigMessage({ prefix, message, configKey, context }) {
  if (!configKey || !context) {
    return `${prefix} ${message}`;
  }
  const location = resolveConfigLocation({ configKey, keyMap, refMap, configDirectory });
  if (!location) {
    return `${prefix} ${message}`;
  }
  return `${prefix} ${message}\n  ${location.source} at ${location.config}\n  ${location.link}`;
}

// formatConfigError.js - 3-line wrapper
function formatConfigError({ message, configKey, context }) {
  return formatConfigMessage({ prefix: '[Config Error]', message, configKey, context });
}

// formatConfigWarning.js - 3-line wrapper
function formatConfigWarning({ message, configKey, context }) {
  return formatConfigMessage({ prefix: '[Config Warning]', message, configKey, context });
}
```

**Usage:**

```javascript
import formatConfigError from '../../utils/formatConfigError.js';
import formatConfigWarning from '../../utils/formatConfigWarning.js';

// For fatal errors that stop the build
throw new Error(
  formatConfigError({
    message: `Block type "Buton" not found.`,
    configKey: block['~k'],
    context,
  })
);

// For warnings that don't stop the build
context.logger.warn(
  formatConfigWarning({
    message: `_state references "userName" but no block with id "userName" exists.`,
    configKey: obj['~k'],
    context,
  })
);
```

**Output format:**

```
[Config Error] Block type "Buton" not found. Did you mean "Button"?
  pages/home.yaml:15 at pages.0.blocks.0.type
  /Users/dev/myapp/pages/home.yaml:15
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

| Validator                   | Validates                              | Example Warning                                                          |
| --------------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| `validateStateReferences`   | `_state` references blockIds           | `_state references "userName" but no block with id "userName" exists`    |
| `validatePayloadReferences` | `_payload` references payload keys     | `_payload references "query" but key not in request payload definition`  |
| `validateStepReferences`    | `_step` references step IDs            | `_step references "step1" but no step with id "step1" exists in routine` |
| `validateLinkReferences`    | `Link` action references pageIds       | `Link action references page "homePage" but page does not exist`         |
| `validateRequestReferences` | `Request` action references requestIds | `Request "getData" not defined on page "home"`                           |

#### Skip Condition Handling

**`validateRequestReferences`** intelligently skips validation for conditionally-executed actions.

**Rule:** Validation is skipped when an action has a `skip` property that is:

- `skip: true` (explicitly skipped)
- `skip: { operator }` (any operator object, e.g., `{ _eq: [...] }`)

**Validation runs normally when:**

- `skip: false` (explicitly enabled)
- `skip: undefined` (property not set)
- No `skip` property present

**Rationale:** When a Request action has a skip condition, the request may only be defined in certain app contexts. Validating these would create false positives.

**Example:** Multi-app monorepo where some requests only exist in specific apps:

```yaml
events:
  onClick:
    - id: fetch_companies
      type: Request
      skip:
        _eq:
          - _ref: { path: app_config.yaml, key: app_name }
          - support
      params: contact_companies_search # Only exists in non-support apps
```

In this case, `contact_companies_search` may not be defined on the current page (because it's only used in other apps), but validation is skipped because the action has a conditional `skip`.

**Implementation:** `packages/build/src/build/buildPages/validateRequestReferences.js:26-28`

```javascript
// Skip validation if action has skip condition (true or operator object)
if (action.skip === true || type.isObject(action.skip)) {
  return;
}
```

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

Client errors are sent to server logs via `logClientError.js`:

- Includes block ID and page context
- Preserves stack trace
- Categorizes error types (operator, action, render)

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
     const errorMessage = formatConfigError({ message, configKey, context });
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

### Why Extract formatConfigMessage?

**Problem:** `formatConfigError.js` and `formatConfigWarning.js` were 100% identical except for the prefix string (`[Config Error]` vs `[Config Warning]`). This violated DRY and made maintenance harder.

**Decision:** Extract shared logic to `formatConfigMessage.js` that accepts a `prefix` parameter. Both formatters become 3-line wrappers.

**Trade-off:** One more file, but:

- Tests for edge cases (null context, missing keyMap) only need to be written once
- Future message types (e.g., `[Config Info]`) trivial to add
- Core formatting logic has single source of truth

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

## Related

### Build Utilities

- `packages/build/src/utils/formatConfigMessage.js` - Core message formatter (shared logic)
- `packages/build/src/utils/formatConfigError.js` - Fatal error formatter wrapper
- `packages/build/src/utils/formatConfigWarning.js` - Warning formatter wrapper
- `packages/build/src/utils/collectConfigError.js` - Error collector for multi-error reporting
- `packages/build/src/utils/tryBuildStep.js` - Build step wrapper to catch errors
- `packages/build/src/utils/extractOperatorKey.js` - Extracts top-level key from operator values
- `packages/build/src/utils/traverseConfig.js` - Config traversal utility
- `packages/build/src/utils/findSimilarString.js` - "Did you mean?" suggestions

### Build Core

- `packages/build/src/index.js` - Main build orchestration with error collection
- `packages/build/src/createContext.js` - Build context with errors array
- `packages/build/src/build/buildRefs/recursiveBuild.js:95-110` - Multi-file ref handling

### Helpers

- `packages/utils/helpers/src/resolveConfigLocation.js` - Location resolver

### Sentry Integration

- `packages/servers/server/lib/server/sentry/` - Sentry server utilities
- `packages/servers/server/lib/client/sentry/` - Sentry client utilities

### Issues & PRs

- Issue #1940 - Original feature request (config-aware error tracing)
- PR #1944 - Implementation
- Issue #1945 - Sentry integration
