# Lowdefy Project Guide for Claude Code

Lowdefy is a config-driven web framework built on Next.js. Apps are defined in YAML with **Blocks** (React components), **Operators** (logic functions like `_if`, `_get`), **Actions** (event handlers), and **Connections/Requests** (database/API integrations).

## Documentation Navigation

| Location | Purpose | Audience |
|----------|---------|----------|
| **CLAUDE.md** (this file) | Coding standards, patterns, helpers | Claude Code when editing code |
| **cc-docs/** | Internal architecture, design decisions, package deep-dives | Claude Code for understanding how/why |
| **packages/docs/** | User-facing docs (Lowdefy app) | End users learning Lowdefy |

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

| Package | Purpose | Entry Point | Key Feature |
|---------|---------|-------------|-------------|
| `@lowdefy/server` | Production | `next start` | Minimal, no watching |
| `@lowdefy/server-dev` | Development | `manager/run.mjs` | File watching, hot reload, auto-rebuild |

**server-dev manager** orchestrates: initial build → file watchers → server process → SSE-based hot reload. See `cc-docs/architecture/` for details.

## Code Principles

**Core Philosophy**: Clarity over brevity. Explicit code over clever code.

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
function buildConnections({ components, context }) { /* ... */ }
function createReadConfigFile({ directories }) { return async function readConfigFile(filename) { /* ... */ }; }
```

**Safe iteration with defaults:**
```javascript
(components.pages || []).forEach((page) => { });
Object.keys(block.areas || {}).forEach((area) => { });
```

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

```javascript
/*
  Copyright 2020-2024 Lowdefy, Inc

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
function MyBlock({ blockId, methods, properties }) { return <div id={blockId}>{properties.title}</div>; }
MyBlock.defaultProps = blockDefaultProps;
MyBlock.meta = { category: 'display', icons: [], styles: [] };
export default MyBlock;
```

### Connections/Requests

```javascript
async function MongoDBFindOne({ request, connection }) {
  const { collection, client } = await getCollection({ connection });
  try { return await collection.findOne(request.query); }
  finally { await client.close(); }
}
MongoDBFindOne.schema = schema;
MongoDBFindOne.meta = { checkRead: true, checkWrite: false };
export default MongoDBFindOne;
```

### Operators

Located in `operators/shared/` (everywhere), `operators/client/`, `operators/server/`, or `operators/build/`.

```javascript
function _myOperator({ location, params }) {
  if (typeof params !== 'object') {
    throw new Error(`Operator Error: _myOperator requires object. Received: ${JSON.stringify(params)} at ${location}.`);
  }
  return result;
}
export default _myOperator;
```

### Actions

```javascript
function SetState({ methods: { setState }, params }) { setState(params); }
export default SetState;
```

## Error Handling

Include location and received value in error messages:
```javascript
throw new Error(`Operator Error: _if requires boolean test. Received: ${JSON.stringify(params)} at ${location}.`);
```

## Testing

- Test files: `{name}.test.js` co-located with source
- Run: `pnpm test` or `pnpm -r --filter=@lowdefy/helpers test`
- **Do not create tests for blocks** (currently disabled)
- Use descriptive test names: `test('buildConnections no connections', () => { });`

**Dynamic imports for ES module mocking:**
```javascript
jest.unstable_mockModule('@lowdefy/node-utils', () => ({ readFile: jest.fn() }));
test('name', async () => { const { default: fn } = await import('./fn.js'); });
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
this.events = type.isNone(events) ? {} : events;           // Setting defaults
if (type.isNone(block.type)) throw new Error('...');       // Validation
if (!type.isNone(areas)) this.Areas = new Areas({ areas }); // Conditional execution
if (type.isNone(components.api)) return;                   // Early return
```

**Other type checks:** `type.isObject()` (plain objects only), `type.isArray()`, `type.isString()`, `type.isUndefined()`, `type.isBoolean()`, `type.isInt()`

### Deep Property Access/Setting

```javascript
import { get, set } from '@lowdefy/helpers';
const eventName = get(rename, 'events.onClick', { default: 'onClick' });  // Always use { default }
set(state, 'user.profile.name', newName);  // Creates intermediate objects
```

### Serializer - Deep Cloning and Type Preservation

**Use `serializer.copy` for deep cloning** to prevent mutation:

```javascript
import { serializer } from '@lowdefy/helpers';
this.areas = serializer.copy(areas || []);
```

**Why it matters:** JSON.stringify/parse loses types. Serializer preserves them with markers:

| Marker | Type | Purpose |
|--------|------|---------|
| `~d` | Date | Preserves Date objects |
| `~e` | Error | Preserves Error objects |
| `~r` | Reference | Build-time file reference tracking |
| `~k` | Key | Build-time key tracking |

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
  return (type.isObject(value) && value._oid) ? ObjectId.createFromHexString(value._oid) : value;
}
serializer.copy(obj, { replacer }); // or { reviver }
```

Critical for: MongoDB ObjectId preservation, Date handling across client/server, build-time `_ref` resolution.

### Object Merging

```javascript
import { mergeObjects } from '@lowdefy/helpers';
const config = mergeObjects([connection, request]);  // Later objects override earlier
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
MyBlock.defaultProps = blockDefaultProps;  // Required for all blocks
renderHtml({ html: properties.content, methods });  // Safe HTML rendering
```
