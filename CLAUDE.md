# Lowdefy Project Guide for Claude Code

Lowdefy is a config-driven web framework built on Next.js. Apps are defined in YAML with **Blocks** (React components), **Operators** (logic functions like `_if`, `_get`), **Actions** (event handlers), and **Connections/Requests** (database/API integrations).

## Documentation Navigation

| Location                  | Purpose                                                     | Audience                              |
| ------------------------- | ----------------------------------------------------------- | ------------------------------------- |
| **CLAUDE.md** (this file) | Coding standards, patterns, helpers                         | Claude Code when editing code         |
| **cc-docs/**              | Internal architecture, design decisions, package deep-dives | Claude Code for understanding how/why |
| **packages/docs/**        | User-facing docs (Lowdefy app)                              | End users learning Lowdefy            |

**cc-docs/** structure: `Overview.md`, `Philosophy.md`, `packages/`, `plugins/`, `architecture/`

**Claude Code Commands:** `/l-docs-init`, `/l-docs-package`, `/l-docs-plugin`, `/l-docs-architecture`, `/l-docs-update`, `/l-review-extract`, `/l-generate-tests`

## Repository Structure

```
packages/
├── api/              # Server-side API handling
├── build/            # App build pipeline
├── cli/              # Command-line interface
├── client/           # Client-side React components
├── engine/           # Core state and event engine
├── operators/        # Operator parsing system
├── plugins/
│   ├── actions/      # Action plugins (@lowdefy/actions-*)
│   ├── blocks/       # UI components (@lowdefy/blocks-*)
│   ├── connections/  # DB/API connectors (@lowdefy/connection-*)
│   └── operators/    # Operator plugins (@lowdefy/operators-*)
├── servers/
│   ├── server/       # Production server (@lowdefy/server)
│   └── server-dev/   # Development server (@lowdefy/server-dev)
└── utils/            # Shared utilities (@lowdefy/helpers, etc.)
```

## Server Architecture

| Package               | Purpose     | Entry Point       | Key Feature                             |
| --------------------- | ----------- | ----------------- | --------------------------------------- |
| `@lowdefy/server`     | Production  | `next start`      | Minimal, no watching                    |
| `@lowdefy/server-dev` | Development | `manager/run.mjs` | File watching, hot reload, auto-rebuild |

**server-dev manager** orchestrates: initial build → file watchers → server process → SSE-based hot reload. See `cc-docs/architecture/` for details.

## Code Principles

### CRITICAL: Fix at the Source, Not the Symptom

**A guard clause is a code smell. Ask "why" before "how"**

1. **Ask: "Why is this happening here?"**
2. **Trace backwards** to find where the problem originated
3. **Fix at the source**

Example: If `connection.id.toLowerCase()` crashes because `id` is undefined, the fix is NOT `if (!connection.id) return`. The fix is ensuring invalid connections don't reach this code - e.g., schema validation should stop the build before processing invalid data.

**The urge to add a guard clause is a red flag that you're treating symptoms, not causes. The WHY needs to be understood before adding.**

### Build Does the Work, Runtime Stays Simple

Build validates, sets defaults, and always writes all artifacts (even as `{}`). Runtime should never need try/catch on imports, existence checks, or fallback defaults for build artifacts.

### Core Philosophy

Clarity over brevity. Explicit code over clever code.

### Simplification Balance

When refactoring or simplifying code:

- **Preserve functionality** - never change what code does, only how it does it
- **Eliminate redundancy** - remove unused code, duplicate logic, and unnecessary abstractions
- **Keep helpful abstractions** - don't remove abstractions that improve organization or testability
- **Single responsibility** - don't combine too many concerns into one function
- **Consider debuggability** - code should be easy to debug and extend; avoid dense one-liners

### Key Patterns

**One function per file** - Each file should export a single function, with the filename matching the function name:

```
buildConnections.js  → export default buildConnections
createCounter.js     → export default createCounter
validateBlock.js     → export default validateBlock
```

**Single object parameter with destructuring:**

```javascript
function buildConnections({ components, context }) {
  /* ... */
}
function createReadConfigFile({ directories }) {
  return async function readConfigFile(filename) {
    /* ... */
  };
}
```

**Safe iteration with nullish coalescing:**

```javascript
(components.pages ?? []).forEach((page) => {});
Object.keys(block.areas ?? {}).forEach((area) => {});
```

Prefer `??` over `||` - it only falls back on `null`/`undefined`, not falsy values like `0` or `''`.

**Build functions mutate and return `components`:**

```javascript
function buildX({ components, context }) {
  // transform components...
  return components;
}
```

**Function declarations** for top-level/exported functions. Arrow functions for callbacks only.

**No nested ternaries** - use `if/else` or `switch` instead of `a ? x : b ? y : z`.

**Early returns and guard clauses** to reduce nesting.

**Minimize try/catch** - prefer validation. Use try/catch only for external operations (DB, API).

### Validation Pattern

Validate inputs at function start using `type` helpers. Include received value in errors:

```javascript
if (type.isUndefined(connection.id)) {
  throw new Error('Connection id missing.');
}
if (!type.isString(connection.id)) {
  throw new Error(`Connection id is not a string. Received ${JSON.stringify(connection.id)}.`);
}
```

Use `createCheckDuplicateId` utility: `createCheckDuplicateId({ message: 'Duplicate connectionId "{{ id }}".' })`

**Comments**: Only comment **why**, not what. Code should be self-documenting.

## Code Style

- **ES Modules** with `.js` extension in all imports
- **Prettier**: 100 char width, single quotes, 2-space tabs, ES5 trailing commas
- **ESLint**: `no-nested-ternary: warn`, `no-console: warn`
- **Import order**: External packages → `@lowdefy/*` packages → Local imports (with `.js`)

### Required License Header

Modified files should always have the Apache license header with the end date set to the current year.

```javascript
/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
```

## Plugin Patterns

### Blocks

> **Block testing is currently disabled. Do not create tests for blocks.**

Structure: `blocks/{BlockName}/` with `{BlockName}.js`, `schema.json`, `examples.yaml`, optional `style.less`

```javascript
import { blockDefaultProps } from '@lowdefy/block-utils';
function MyBlock({ blockId, methods, properties }) {
  return <div id={blockId}>{properties.title}</div>;
}
MyBlock.defaultProps = blockDefaultProps;
MyBlock.meta = { category: 'display', icons: [], styles: [] };
export default MyBlock;
```

### Connections/Requests

```javascript
async function MongoDBFindOne({ request, connection }) {
  const { collection, client } = await getCollection({ connection });
  try {
    return await collection.findOne(request.query);
  } finally {
    await client.close();
  }
}
MongoDBFindOne.schema = schema;
MongoDBFindOne.meta = { checkRead: true, checkWrite: false };
export default MongoDBFindOne;
```

### Operators

Located in `operators/shared/` (everywhere), `operators/client/`, `operators/server/`, or `operators/build/`.

Operators throw simple error messages. The parsers (WebParser, ServerParser, BuildParser) catch errors and wrap them with `received` value and location:

```javascript
function _myOperator({ params }) {
  if (typeof params !== 'object') {
    // Simple error - parser adds params as received value and location
    throw new Error('_myOperator requires an object.');
  }
  return result;
}
export default _myOperator;
```

### Actions

Actions throw simple errors. The engine's action interface layer (Actions.js) catches and wraps them in `PluginError` with the `received` value. For expected user-facing errors (validation, intentional throws), throw `UserError` instead — it logs to the browser console only and is never sent to the server terminal:

```javascript
function MyAction({ methods: { setState }, params }) {
  if (!params.value) {
    // Simple error - interface layer adds params as received value
    throw new Error('MyAction requires "value" property.');
  }
  setState(params);
}
export default MyAction;
```

```javascript
import { UserError } from '@lowdefy/errors';

function MyThrowAction({ params }) {
  // UserError - logs to browser console only, never to terminal
  throw new UserError(params.message, {
    blockId: params.blockId,
    metaData: params.metaData,
    pageId: params.pageId,
  });
}
export default MyThrowAction;
```

### Connections/Requests

Connections throw simple errors. The request interface layer catches and wraps them in `RequestError`:

```javascript
async function MongoDBFindOne({ request, connection }) {
  if (!request.collection) {
    // Simple error - interface layer adds request as received value
    throw new Error('MongoDBFindOne requires "collection" property.');
  }
  // ... execute query
}
```

## Error Handling

### Error Class Hierarchy

Lowdefy uses a unified error system in `@lowdefy/errors`:

```javascript
import {
  ActionError,
  BlockError,
  ConfigError,
  OperatorError,
  RequestError,
  ServiceError,
  UserError,
} from '@lowdefy/errors';
```

| Class                  | Purpose                                                     | Catch Layer                      |
| ---------------------- | ----------------------------------------------------------- | -------------------------------- |
| `LowdefyInternalError` | Internal Lowdefy bugs                                       | Top-level in build/server/client |
| `PluginError`          | Base class for plugin failures (not used directly)          | Plugin interface layer           |
| `OperatorError`        | Operator failures (`_if`, `_get`, etc.)                     | Operator parsers                 |
| `ActionError`          | Action failures (`SetState`, `Request`, etc.)               | Action runner (engine)           |
| `RequestError`         | Request/connection failures (`MongoDBFind`, etc.)           | Request handler (API)            |
| `BlockError`           | Block rendering failures                                    | ErrorBoundary (client)           |
| `ServiceError`         | External service failures (network, timeout, 5xx)           | Request/connection layer         |
| `ConfigError`          | YAML config validation errors                               | Build validation, runtime        |
| `ConfigWarning`        | Config inconsistencies (warning in dev, error in prod)      | Build validation                 |
| `UserError`            | Expected user interaction (validation, throws), client-only | Browser console only             |

**Key principle:** Plugins throw errors without knowing about config keys. The interface layer catches errors and adds `configKey` for location resolution to ALL error types - this helps developers trace any error back to its config source.

### Build-Time Errors (in `packages/build/`)

Use `ConfigError` from `@lowdefy/errors` for errors with config location:

```javascript
import { ConfigError } from '@lowdefy/errors';

// Fatal error - stops build
throw new ConfigError({
  message: 'Block type "Buton" not found.',
  configKey: block['~k'],
  context,
});

// Warning - logs but continues build
context.logger.configWarning({
  message: '_state references undefined blockId.',
  configKey: obj['~k'],
});

// Warning that becomes error in prod builds
context.logger.configWarning({
  message: 'Deprecated feature used.',
  configKey: obj['~k'],
  prodError: true,
});
```

### Plugin Interface Layer and Error Propagation

**How errors flow from plugins:**

```
Plugin code throws Error (no configKey - plugin doesn't know about ~k)
        ↓
Interface layer catches
        ↓
Add configKey to ANY error (for location tracing)
        ↓
Then handle by type:
  - ConfigError  → re-throw (for location resolution)
  - ServiceError → wrap with new ServiceError({ error, service, configKey })
  - Plain Error  → wrap in typed error (OperatorError, ActionError, etc.)
        ↓
Error bubbles to top-level handler
        ↓
logError() resolves configKey → file:line using keyMap/refMap
```

**Plugin code throws simple errors:**

```javascript
// In plugin code (operator, action, request) - throw simple error
function _myOperator({ params }) {
  if (typeof params !== 'object') {
    throw new Error('_myOperator requires an object.');
  }
}
```

**Plugin code throws ConfigError without configKey:**

Plugins should NOT know about `configKey` - they just report what's wrong. The interface layer adds location context. ConfigError supports a simple string form for plugin convenience:

```javascript
// In plugin code (operator, action, request, block)
// Plugin throws simple ConfigError - no configKey needed
import { ConfigError } from '@lowdefy/errors';

function _myOperator({ params }) {
  if (typeof params.value !== 'string') {
    // Simple string form - interface layer adds configKey
    throw new ConfigError('_myOperator "value" must be a string.');
  }
  return params.value.toUpperCase();
}

async function MongoDBFind({ request }) {
  if (!request.collection) {
    throw new ConfigError('MongoDBFind requires "collection" property.');
  }
  // ... execute query
}
```

**Interface layer adds configKey to ALL errors:**

```javascript
import { ConfigError, OperatorError, ServiceError } from '@lowdefy/errors';

// In operator parser - add configKey to ANY error, then handle by type
try {
  return operator({ params, ...context });
} catch (e) {
  // Add configKey to any error for location tracing
  if (!e.configKey) {
    e.configKey = obj['~k'];
  }

  if (e instanceof ConfigError) {
    throw e;
  }

  if (ServiceError.isServiceError(e)) {
    throw new ServiceError({
      error: e,
      service: connectionId,
      configKey: obj['~k'],
    });
  }

  // Plain errors get wrapped in typed error with context
  throw new OperatorError({
    error: e,
    typeName: '_if',
    received: params,
    location: 'blockId.events.onClick',
    configKey: obj['~k'],
  });
}
```

**Why this pattern:**

- **Plugins stay simple** - they don't need to know about `~k` keys or config tracking
- **ALL errors get configKey first** - one place for the assignment, cleaner code
- **ConfigError string form** - plugins can throw `new ConfigError('message')` for simplicity
- **Plain Error becomes typed error** (OperatorError, ActionError, etc.) - adds received value and location for debugging

### Service Errors

Use `ServiceError` for external service failures. The constructor accepts `configKey` to help trace which config triggered the service call:

```javascript
import { ServiceError } from '@lowdefy/errors';

// Check if error is service-related (network issues, timeouts, 5xx)
if (ServiceError.isServiceError(error)) {
  throw new ServiceError({
    error,
    service: 'MongoDB',
    configKey: requestConfig['~k'],
  });
}
```

### Client-Side Errors

Client code uses `ConfigError` from `@lowdefy/errors`. When wrapping a plain error, `received` and `configKey` are extracted from the wrapped error automatically:

```javascript
import { ConfigError } from '@lowdefy/errors';

// Wrap error - received and configKey extracted from wrapped error
const configError = new ConfigError({ error: e });
// configError.received = e.received (if present)
// configError.configKey = e.configKey (if present)
```

See `cc-docs/architecture/error-tracing.md` for the complete error system.

## Testing

- Test files: `{name}.test.js` co-located with source
- Run: `pnpm test` or `pnpm -r --filter=@lowdefy/helpers test`
- **Do not create tests for blocks** (currently disabled)

**Test naming:** Use descriptive names that explain the scenario and expected outcome:

```javascript
// Good: Describes what is being tested and the condition
test('buildConnections throws when connection id is missing', () => {});
test('buildConnections returns empty array when no connections defined', () => {});
test('_get returns default value when path does not exist', () => {});

// Avoid: Vague or implementation-focused names
test('buildConnections no connections', () => {}); // What happens with no connections?
test('test error', () => {}); // What error? What scenario?
```

**Dynamic imports for ES module mocking:**

```javascript
jest.unstable_mockModule('@lowdefy/node-utils', () => ({ readFile: jest.fn() }));
test('name', async () => {
  const { default: fn } = await import('./fn.js');
});
```

## Commits

[Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`

PRs target `develop` branch.

## @lowdefy/helpers Usage

**These utilities are core to the codebase. Use them consistently instead of native alternatives.**

### CRITICAL: `type.isNone()` for Null/Undefined Checks

**`type.isNone()` checks BOTH null AND undefined** - critical in config-driven systems.

```javascript
import { type } from '@lowdefy/helpers';

// ALWAYS use type.isNone()
if (type.isNone(value)) return defaultValue;

// BAD: if (value === null || value === undefined), if (value == null), if (!value)
```

**Common patterns:**

```javascript
this.events = type.isNone(events) ? {} : events; // Setting defaults
if (type.isNone(block.type)) throw new Error('...'); // Validation
if (!type.isNone(areas)) this.Areas = new Areas({ areas }); // Conditional execution
if (type.isNone(components.api)) return; // Early return
```

**Other type checks:** `type.isObject()` (plain objects only), `type.isArray()`, `type.isString()`, `type.isUndefined()`, `type.isBoolean()`, `type.isInt()`

### Deep Property Access/Setting

```javascript
import { get, set } from '@lowdefy/helpers';
const eventName = get(rename, 'events.onClick', { default: 'onClick' }); // Always use { default }
set(state, 'user.profile.name', newName); // Creates intermediate objects
```

### Serializer - Deep Cloning and Type Preservation

**Use `serializer.copy` for deep cloning** to prevent mutation:

```javascript
import { serializer } from '@lowdefy/helpers';
this.areas = serializer.copy(areas || []);
```

**Why it matters:** JSON.stringify/parse loses types. Serializer preserves them with markers:

| Marker | Type      | Purpose                            |
| ------ | --------- | ---------------------------------- |
| `~d`   | Date      | Preserves Date objects             |
| `~e`   | Error     | Preserves Error objects            |
| `~r`   | Reference | Build-time file reference tracking |
| `~k`   | Key       | Build-time key tracking            |
| `~arr` | Array     | Preserves `~k`/`~r`/`~l` on arrays |

**Custom revivers/replacers** for special types (e.g., MongoDB ObjectId):

```javascript
function replacer(_, value) {
  if (type.isObject(value)) {
    Object.keys(value).forEach((k) => {
      if (value[k] instanceof ObjectId) value[k] = { _oid: value[k].toHexString() };
    });
  }
  return value;
}
function reviver(_, value) {
  return type.isObject(value) && value._oid ? ObjectId.createFromHexString(value._oid) : value;
}
serializer.copy(obj, { replacer }); // or { reviver }
```

Critical for: MongoDB ObjectId preservation, Date handling across client/server, build-time `_ref` resolution.

### Object Merging

```javascript
import { mergeObjects } from '@lowdefy/helpers';
const config = mergeObjects([connection, request]); // Later objects override earlier
```

### Other Utilities

```javascript
import { unset, swap, applyArrayIndices } from '@lowdefy/helpers';
unset(obj, 'path.to.remove');
swap(array, fromIndex, toIndex);
applyArrayIndices(path, indices);
```

## @lowdefy/block-utils

```javascript
import { blockDefaultProps, renderHtml } from '@lowdefy/block-utils';
MyBlock.defaultProps = blockDefaultProps; // Required for all blocks
renderHtml({ html: properties.content, methods }); // Safe HTML rendering
```
