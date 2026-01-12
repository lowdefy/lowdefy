# Error Tracing System

Config-aware error tracing that maps runtime and build-time errors back to their source YAML configuration files.

## Context

When Lowdefy throws errors (client, server, or build), developers need to trace them back to the specific location in their YAML configuration. This system uses build artifacts (`keyMap.json` and `refMap.json`) to resolve error locations with file paths and line numbers.

## Key Components

### Build-Time Tracking

The build pipeline tracks the origin of every config value:

| Artifact | Purpose | Contents |
|----------|---------|----------|
| `keyMap.json` | Maps internal keys to config locations | `{ "abc123": { key: "pages.0.blocks.0", "~r": "ref1", "~l": 15 } }` |
| `refMap.json` | Maps ref IDs to source files | `{ "ref1": { path: "pages/home.yaml" } }` |

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
  configDirectory: '/Users/dev/myapp'
});
// Returns:
// {
//   source: 'pages/home.yaml:15',           // file:line
//   config: 'pages.0.blocks.0',             // config path
//   link: '/Users/dev/myapp/pages/home.yaml:15'  // clickable VSCode link
// }
```

### Error Formatting Utilities

Two utilities format error messages with location info:

| Utility | Purpose | Prefix |
|---------|---------|--------|
| `formatConfigError` | Build errors (fatal) | `[Config Error]` |
| `formatConfigWarning` | Build warnings (non-fatal) | `[Config Warning]` |

Location: `packages/build/src/utils/`

**Usage:**
```javascript
import formatConfigError from '../../utils/formatConfigError.js';
import formatConfigWarning from '../../utils/formatConfigWarning.js';

// For fatal errors that stop the build
throw new Error(formatConfigError({
  message: `Block type "Buton" not found.`,
  configKey: block['~k'],
  context
}));

// For warnings that don't stop the build
context.logger.warn(formatConfigWarning({
  message: `_state references "userName" but no block with id "userName" exists.`,
  configKey: obj['~k'],
  context
}));
```

**Output format:**
```
[Config Error] Block type "Buton" not found. Did you mean "Button"?
  pages/home.yaml:15 at pages.0.blocks.0.type
  /Users/dev/myapp/pages/home.yaml:15
```

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

| Validator | Validates | Example Warning |
|-----------|-----------|-----------------|
| `validateStateReferences` | `_state` references blockIds | `_state references "userName" but no block with id "userName" exists` |
| `validatePayloadReferences` | `_payload` references payload keys | `_payload references "query" but key not in request payload definition` |
| `validateStepReferences` | `_step` references step IDs | `_step references "step1" but no step with id "step1" exists in routine` |
| `validateLinkReferences` | `Link` action references pageIds | `Link action references page "homePage" but page does not exist` |
| `validateRequestReferences` | `Request` action references requestIds | `Request "getData" not defined on page "home"` |

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

## Config Traversal

`packages/build/src/utils/traverseConfig.js` provides depth-first traversal for validation:

```javascript
import traverseConfig from '../../utils/traverseConfig.js';

const stateRefs = new Map();
traverseConfig({
  config: page,
  visitor: (obj) => {
    if (obj._state !== undefined) {
      stateRefs.set(extractKey(obj._state), obj['~k']);
    }
  },
});
```

## Decision Trace

### Why Track Line Numbers?

**Problem:** Original implementation only tracked file paths, not line numbers. For large files, this wasn't precise enough.

**Decision:** Add `~l` property during YAML parsing to track line numbers.

**Trade-off:** Slight increase in build artifact size, but significantly better DX.

### Why Separate Error/Warning Formatters?

**Problem:** Initially used inline `formatWarning` in each validator, causing duplication.

**Decision:** Extract to `formatConfigWarning.js` utility (mirrors `formatConfigError.js`).

**Trade-off:** Additional file, but eliminates 60+ lines of duplication across 3 validators.

### Why Warn Instead of Error for Reference Validations?

**Problem:** Should undefined `_state` references fail the build?

**Decision:** Warn in dev mode, throw in production. Some references may be dynamically created.

**Trade-off:** More permissive in dev (faster iteration) but catches issues before production.

## Related

- `packages/build/src/utils/formatConfigError.js` - Fatal error formatter
- `packages/build/src/utils/formatConfigWarning.js` - Warning formatter
- `packages/build/src/utils/traverseConfig.js` - Config traversal utility
- `packages/build/src/utils/findSimilarString.js` - "Did you mean?" suggestions
- `packages/utils/helpers/src/resolveConfigLocation.js` - Location resolver
- Issue #1940 - Original feature request
- PR #1944 - Implementation
