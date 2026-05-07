# Operator System Architecture

How operators are evaluated in Lowdefy.

## Overview

Operators are the expression system in Lowdefy that:

- Transform data at build-time and runtime
- Access context (state, requests, user, etc.)
- Perform computations and transformations
- Enable dynamic configuration

## Parser Types

### evaluateOperators (Build-Time)

**File:** `packages/operators/src/evaluateOperators.js`

**Context:** Build-time operator evaluation (replaces old `BuildParser` class)
**Runtime:** Node.js

```javascript
const { output, errors } = evaluateOperators({
  input, // data to walk
  operators, // operator implementations
  operatorPrefix: '_build.', // or '_' for static operators
  env: process.env,
  dynamicIdentifiers, // Set of operators requiring runtime evaluation
  typeNames, // Set of registered type names (for ~dyn type boundaries)
  args, // optional arguments (for _function callbacks)
});
```

**Available Data:**

- `env` - Environment variables
- `operators` - Operator implementations
- `args` - Function arguments (for `_function` callbacks)

### WebParser

**File:** `packages/operators/src/webParser.js`

**Context:** Runtime browser evaluation
**Runtime:** Browser

```javascript
new WebParser({
  context, // Complete browser context
  operators, // Operator registry
});
```

**Available Data:**

- `state` - Page state
- `requests` - API request responses
- `apiResponses` - API endpoint responses
- `user` - Current user
- `inputs` - Block inputs
- `menus` - Navigation menus
- `lowdefyGlobal` - Global config
- `eventLog` - Event history
- `_internal.globals` - Browser globals

### ServerParser

**File:** `packages/operators/src/serverParser.js`

**Context:** Runtime backend evaluation
**Runtime:** Node.js

```javascript
new ServerParser({
  env, // Environment variables
  jsMap, // JavaScript mapping
  operators, // Operator registry
  payload, // Request payload
  secrets, // Application secrets
  state, // Workflow state
  steps, // Previous step results
  user, // Authenticated user
});
```

**Available Data:**

- `env` - Environment variables
- `payload` - Request payload
- `secrets` - Application secrets
- `state` - Workflow state
- `steps` - Previous step results
- `user` - Authenticated user

## Parsing Mechanism

### Build-Time: In-Place Tree Walker

`evaluateOperators` walks the tree in-place with a recursive function (no `serializer.copy` JSON round-trips):

```javascript
function walk(node) {
  // Walk children first (bottom-up)
  for (const key of Object.keys(node)) {
    node[key] = walk(node[key]);
  }

  // Bubble up ~dyn from children (skip for _build.* operators)
  if (hasDynChild(node)) setDynamicMarker(node);

  // Type boundary: reset ~dyn at registered types
  if (typeNames?.has(node.type)) delete node['~dyn'];

  // Detect operator: single non-tilde key starting with operatorPrefix
  const keys = Object.keys(node).filter(k => !k.startsWith('~'));
  if (keys.length !== 1 || !keys[0].startsWith(operatorPrefix)) return node;

  // Dynamic check (skip for _build.* — always evaluate)
  if (operatorPrefix !== '_build.' && hasDynamicMarker(params)) {
    return setDynamicMarker(node);
  }

  return operators[op]({ args, env, methodName, params, parser, ... });
}
```

The `parser` interface passed to operators recurses into `evaluateOperators` itself, enabling `_function`/`_build.array.map` callbacks.

### Runtime: JSON Reviver Pattern

`WebParser` and `ServerParser` use `serializer.copy` with JSON revivers for runtime evaluation:

```javascript
parse({ args, input, location, operatorPrefix = '_' }) {
  const result = serializer.copy(input, {
    reviver: (key, value) => {
      if (isOperator(value)) {
        const [op, method] = splitOperator(key);
        return this.operators[op]({
          args, location, methodName: method, params: value[key],
        });
      }
      return value;
    }
  });
  return { output: result, errors: this.errors };
}
```

## Build-Time Operators

### \_ref Operator

**Files:** `packages/build/src/build/buildRefs/walker.js`

Loads and merges external configuration files:

```yaml
# String form
blocks:
  _ref: blocks/header.yaml

# Object form
blocks:
  _ref:
    path: blocks/header.yaml
    vars:
      title: "My Title"
    key: "blocks[0]"
    resolver: "./customResolver"
    transformer: "./transform"
```

**Processing (via walker's `resolveRef`):**

1. `makeRefDefinition()` - Create ref definition, register in `refMap`
2. Store unresolved vars before resolution mutates them
3. Resolve dynamic path/vars/key via recursive `resolve()` in parent context
4. Circular reference detection via `ctx.refChain`
5. `getRefContent()` → `parseRefContent()` - Load and parse file
6. Create child `WalkContext` via `forRef()` (new vars, refChain copy)
7. `resolve(content, childCtx)` - Walk file content recursively
8. `runTransformer()` - Apply transformer (optional)
9. Extract key (`_ref.key`)
10. `tagRefDeep()` - Tag all result nodes with `~r` provenance

### \_var Operator

**File:** `packages/build/src/build/buildRefs/walker.js` (`resolveVar` function)

Template variable substitution:

```yaml
# In ref definition
_ref:
  path: component.yaml
  vars:
    buttonLabel: "Submit"

# In component.yaml
label:
  _var: buttonLabel

# With default
label:
  _var:
    key: buttonLabel
    default: "Click"
```

### \_module.var Operator

**File:** `packages/build/src/build/buildRefs/walker.js` (`resolveModuleVar`, `resolveEffectiveVar`, `resolveVarDefault` functions)

Module variable substitution, resolved lazily during the full-resolve walker pass:

```yaml
collection:
  _module.var: collection
# Defaults are expressions declared in module.lowdefy.yaml.
# vars:
#   page_title:
#     default:
#       _module.var: label_plural
```

The walker resolves `_module.var` with a three-way branch on the `WalkContext`:

- `moduleEntry` set → lazy resolve via `resolveModuleVar`. Reads the consumer value from `moduleEntry.consumerVars` first; otherwise calls `resolveEffectiveVar` to walk the manifest's raw `default` expression.
- `moduleEntry` null, `moduleRoot` set (Phase 1a local resolve) → preserve the node untouched; the full-resolve pass resolves it.
- Both null (app-level config) → throw `ConfigError`.

Defaults resolve in a fresh `WalkContext` anchored at `module.lowdefy.yaml` so cross-module refs, circular detection, and error messages work correctly. Resolution results cache on `moduleEntry.resolvedVarCache`, shared across all walks of the module and across cross-module ref calls.

### \_module.\* ID Operators

**File:** `packages/build/src/build/buildRefs/walker.js`

The ID operators (`_module.pageId`, `_module.connectionId`, `_module.endpointId`, `_module.id`) resolve during the walker pass, alongside `_module.var`. They are detected **after** child walking (bottom-up) — after `_var` and `_module.var` but before `_build.*`.

Both string form (same-module) and object form (cross-module `{ id, module }`) are supported:

- `_module.pageId: users-list` → `team-users/users-list`
- `_module.pageId: { id: contact-detail, module: contacts }` → `contacts/contact-detail`
- `_module.connectionId: users-db` → `team-users/users-db` (or remapped app connection ID)
- `_module.endpointId: invite-user` → `team-users/invite-user`
- `_module.id: true` → `team-users`
- `_module.id: { module: contacts }` → resolved dependency entry ID

The object form uses `resolveDepTarget()` (`packages/build/src/build/resolveDepTarget.js`) to resolve the abstract dependency name to a concrete module entry via the `moduleDependencies` map on `WalkContext`. Each operator validates that the referenced ID exists in the target module's `exports` declarations.

The `moduleEntry` property on `WalkContext` propagates through `child()` unchanged, and is overridden in `forRef()` for component/menu refs — switching to the source module's context when entering cross-module content.

### \_build.\* Operators

**Evaluated inline by walker** (`packages/build/src/build/buildRefs/walker.js`) via `evaluateOperators` with `operatorPrefix: '_build.'`.

Build-time operators with `_build.` prefix:

```yaml
apiUrl:
  _build.env: API_URL

debug:
  _build.vars: debugEnabled
```

### \_secret Operator

**File:** `packages/plugins/operators/operators-js/src/operators/server/secret.js`

Access secrets (filtered for security):

```javascript
function _secret({ location, params, secrets = {} }) {
  // Filter sensitive keys
  const { OPENID_CLIENT_SECRET, JWT_SECRET, ...rest } = secrets;

  if (params === true || params.all) {
    throw new Error('Getting all secrets is not allowed');
  }

  return getFromObject({ object: rest, params });
}
```

```yaml
connectionString:
  _secret: MONGODB_URI
```

## Runtime Operators - Browser

### \_state

**File:** `packages/plugins/operators/operators-js/src/operators/shared/state.js`

Access page state:

```javascript
function _state({ arrayIndices, location, params, state }) {
  return getFromObject({
    arrayIndices,
    location,
    object: state,
    operator: '_state',
    params,
  });
}
```

```yaml
value:
  _state: user.name

# With default
value:
  _state:
    key: user.name
    default: "Anonymous"
```

### \_request

Access request responses:

```yaml
items:
  _request: getUsers.response

# First response
firstUser:
  _request: getUsers.response[0]
```

### \_user

Access authenticated user:

```yaml
greeting:
  _string:
    - 'Hello, '
    - _user: session.user.name
```

### \_input

Access block inputs:

```yaml
searchValue:
  _input: searchBox.value
```

### \_global

Access global configuration:

```yaml
appName:
  _global: config.appName
```

### \_url_query

Access URL query parameters:

```yaml
# URL: ?page=2&filter=active
currentPage:
  _url_query: page

filterValue:
  _url_query:
    key: filter
    default: 'all'
```

### \_event

Access event data:

```yaml
events:
  onChange:
    - id: log
      type: SetState
      params:
        lastValue:
          _event: value
```

### \_location

Access browser location:

```yaml
currentPath:
  _location: pathname
```

### \_media

Access media query data:

```yaml
isMobile:
  _media: mobile
```

## Runtime Operators - Server

### \_payload

Access request payload:

```yaml
# In connection/request properties
query:
  userId:
    _payload: userId
```

### \_step

Access previous workflow step results:

```yaml
# In API endpoint routines
nextStep:
  data:
    _step: previousStep.result
```

## Operator Implementation Patterns

### Simple Accessor (getFromObject)

```javascript
function _state({ arrayIndices, location, params, state }) {
  return getFromObject({
    arrayIndices,
    location,
    object: state,
    operator: '_state',
    params,
  });
}
```

**getFromObject Parameters:**

- `params: true` → Return all (deep copy)
- `params: string/int` → Key path
- `params: { key, default, all }` → Object form

### Instance Method (runInstance)

```javascript
const meta = {
  concat: { validTypes: ['array'] },
  filter: { namedArgs: ['on', 'callback'], validTypes: ['array', 'object'] },
  slice: { namedArgs: ['on', 'start', 'end'], validTypes: ['array', 'object'] },
};

function _array({ params, location, methodName }) {
  return runInstance({
    location,
    meta,
    methodName,
    operator: '_array',
    params,
    instanceType: 'array',
  });
}
```

```yaml
# Usage
filtered:
  _array.filter:
    on:
      _state: items
    callback:
      _function:
        __gt:
          - __args: 0.price
          - 100
```

### Class Method (runClass)

```javascript
const meta = {
  keys: { singleArg: true, validTypes: ['object'] },
  values: { singleArg: true, validTypes: ['object'] },
  assign: { spreadArgs: 'objects', validTypes: ['object'] },
};

function _object({ params, location, methodName }) {
  return runClass({
    location,
    meta,
    methodName,
    operator: '_object',
    params,
    functions: ObjectFunctions,
  });
}
```

### Logic Operators

```javascript
function _if({ location, params }) {
  if (params.test === true) return params.then;
  if (params.test === false) return params.else;
  throw new Error('_if takes a boolean test');
}
```

```yaml
status:
  _if:
    test:
      _eq:
        - _state: count
        - 0
    then: 'Empty'
    else: 'Has items'
```

## Operator Context by Parser

| Context        | Build | Web | Server |
| -------------- | ----- | --- | ------ |
| `env`          | ✓     |     | ✓      |
| `secrets`      | ✓     |     | ✓      |
| `user`         | ✓     | ✓   | ✓      |
| `state`        |       | ✓   | ✓      |
| `requests`     |       | ✓   |        |
| `event`        |       | ✓   |        |
| `payload`      | ✓     |     | ✓      |
| `apiResponses` |       | ✓   |        |
| `inputs`       |       | ✓   |        |
| `menus`        |       | ✓   |        |
| `steps`        |       |     | ✓      |
| `jsMap`        |       | ✓   | ✓      |

## Error Handling

Parsers collect errors rather than throwing:

```javascript
parse({ input, location }) {
  // ... parsing logic
  try {
    result = operator({ params, ... });
  } catch (error) {
    this.errors.push({ error, location, operator });
    result = null;
  }

  return { output, errors: this.errors };
}
```

- Failed operators return `null`
- Non-fatal: parsing continues

## Metadata Handling

### Build-Time (evaluateOperators)

- Preserves `~r` (reference ID) to track source files — used for error attribution
- Skips objects/arrays with `~r` marker during operator detection (already resolved refs)
- Sets `~dyn` as non-enumerable property for dynamic content tracking

### Web/Server Parser

- Deletes `~k` (metadata key) before operator evaluation
- Prevents metadata leaking into operator context

## Helper Functions

### getFromObject

**File:** `packages/operators/src/getFromObject.js`

```javascript
getFromObject({
  arrayIndices, // For dynamic path resolution
  location, // Error reporting
  object, // Data source
  operator, // Operator name
  params, // Access parameters
});

// Param formats:
// true → return all (deep copy)
// string/int → key path
// { key, default, all } → object form
```

### runInstance

**File:** `packages/operators/src/runInstance.js`

For instance method operators (`_array.filter`):

```javascript
runInstance({
  location,
  meta, // Method definitions
  methodName, // Method to call
  operator, // Operator name
  params, // Parameters
  instanceType, // Expected instance type
});
```

### runClass

**File:** `packages/operators/src/runClass.js`

For class/static method operators:

```javascript
runClass({
  location,
  meta, // Method definitions
  methodName, // Method to call
  operator, // Operator name
  params, // Parameters
  functions, // Function implementations
});
```

## Common Operators

### Comparison

```yaml
_eq: [a, b] # a === b
_ne: [a, b] # a !== b
_gt: [a, b] # a > b
_gte: [a, b] # a >= b
_lt: [a, b] # a < b
_lte: [a, b] # a <= b
```

### Logic

```yaml
_and: [cond1, cond2, ...]
_or: [cond1, cond2, ...]
_not: condition
_if:
  test: condition
  then: valueIfTrue
  else: valueIfFalse
```

### Array

```yaml
_array.concat: [[1, 2], [3, 4]]
_array.filter:
  on: array
  callback: function
_array.map:
  on: array
  callback: function
_array.find:
  on: array
  callback: function
_array.includes:
  on: array
  value: searchValue
```

### String

```yaml
_string.concat: ['Hello', ' ', 'World']
_string.includes:
  on: text
  value: search
_string.split:
  on: text
  delimiter: ','
```

### Object

```yaml
_object.keys: object
_object.values: object
_object.assign: [obj1, obj2]
```

### Type

```yaml
_type: value # Returns type name
_type.isString: value
_type.isNumber: value
_type.isArray: value
_type.isObject: value
_type.isNull: value
_type.isUndefined: value
```

## Key Files

| Component          | File                                             |
| ------------------ | ------------------------------------------------ |
| evaluateOperators  | `packages/operators/src/evaluateOperators.js`    |
| WebParser          | `packages/operators/src/webParser.js`            |
| ServerParser       | `packages/operators/src/serverParser.js`         |
| getFromObject      | `packages/operators/src/getFromObject.js`        |
| runInstance        | `packages/operators/src/runInstance.js`          |
| runClass           | `packages/operators/src/runClass.js`             |
| Walker             | `packages/build/src/build/buildRefs/walker.js`   |
| Build Operators    | `packages/build/src/build/buildRefs/`            |
| JS Operators       | `packages/plugins/operators/operators-js/`       |
| MQL Operators      | `packages/plugins/operators/operators-mql/`      |
| Nunjucks Operators | `packages/plugins/operators/operators-nunjucks/` |

## Dynamic Operator Flags

Operators declare whether they can be safely evaluated at build time or must be deferred to runtime. This is controlled by the `dynamic` flag and enforced by `collectDynamicIdentifiers` and `evaluateOperators`.

**Files:**

- `packages/build/src/build/collectDynamicIdentifiers.js` — Builds the `Set` of dynamic identifiers
- `packages/build/src/build/validateOperatorsDynamic.js` — Validates all operators have the flag
- `packages/build/src/build/buildRefs/evaluateStaticOperators.js` — Runs static evaluation pass

### How It Works

1. **At module load**, `evaluateStaticOperators.js` imports operators from `@lowdefy/operators-js/operators/build` (the `operatorsBuild.js` export). Only operators in this set are subject to build-time static evaluation.
2. `collectDynamicIdentifiers` builds a `Set` of identifiers to skip.
3. During `evaluateOperators`, the walker checks each operator against this set. Matches are marked with `~dyn` and preserved for runtime.

### Operator-Level vs Method-Level

```javascript
// Operator-level: ALL usages are dynamic
_date.dynamic = true;

// Method-level: only specific methods are dynamic
_number.dynamic = false;
_number.meta = meta; // must expose meta for collectDynamicIdentifiers
// where meta contains: toLocaleString: { ..., dynamic: true }
```

`collectDynamicIdentifiers` processes these in order:

1. If `operatorFn.dynamic === true` → adds operator name (e.g. `_date`) and **returns early** (skips method check)
2. If `operatorFn.dynamic === false` and `operatorFn.meta` exists → checks each method for `dynamic: true`, adds qualified names (e.g. `_number.toLocaleString`)

At evaluation time, the check is:

```javascript
dynamicIdentifiers.has(fullIdentifier) || dynamicIdentifiers.has(op);
```

So operator-level `true` catches all usages (with or without method), while method-level only catches specific methods.

### When to Use Each

| Scenario                                  | Flag Level                                        | Example                                              |
| ----------------------------------------- | ------------------------------------------------- | ---------------------------------------------------- |
| All methods need runtime context          | Operator-level `dynamic = true`                   | `_date` (time-dependent), `_intl` (locale-dependent) |
| Most methods are pure, a few need runtime | Method-level `dynamic: true`                      | `_math.random`, `_number.toLocaleString`             |
| All methods are pure transformations      | Operator-level `dynamic = false`, no method flags | `_string`, `_array`, `_json`                         |

### Which Operators Are in the Build Set

Only operators exported from `packages/plugins/operators/operators-js/src/operatorsBuild.js` are subject to static evaluation. Other plugin operators (`_nunjucks`, `_moment`, `_mql`, `_yaml`, etc.) are **not** in this set, so their `dynamic` flag has no effect on build-time behavior.

### Common Reasons for Dynamic

- **Time-dependent**: Result changes with current time (`_date`)
- **Locale-dependent**: Result depends on runtime locale (`_intl`, `_number.toLocaleString`)
- **Random**: Non-deterministic output (`_random`, `_math.random`)
- **State-dependent**: Reads runtime state/context (`_state`, `_regex`, `_type`)
- **Side effects**: Performs observable actions (`_log`)

## Architectural Patterns

1. **Context-Specific Evaluation**: `evaluateOperators` for build-time, `WebParser`/`ServerParser` for runtime
2. **In-Place Walk (Build)**: `evaluateOperators` walks the tree recursively without JSON round-trips
3. **JSON Reviver Pattern (Runtime)**: `WebParser`/`ServerParser` use `serializer.copy` with revivers
4. **~dyn Marker Propagation**: Bubbles up from children to prevent evaluating operators with runtime-dependent params
5. **Type Boundaries**: Objects with registered `type` field reset `~dyn` propagation
6. **\_build.\* Exemption**: Build operators always evaluate regardless of `~dyn` — they work on YAML structure
7. **Error Collection**: Non-throwing, accumulates errors with `~r`/`~l` for file/line attribution
8. **Method Chaining**: `_array.filter`, `_string.concat` syntax
9. **Default Values**: Fallback support via object params
10. **Type Validation**: Meta definitions validate input types
