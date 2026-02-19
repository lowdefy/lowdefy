# Operator System Architecture

How operators are evaluated in Lowdefy.

## Overview

Operators are the expression system in Lowdefy that:

- Transform data at build-time and runtime
- Access context (state, requests, user, etc.)
- Perform computations and transformations
- Enable dynamic configuration

## Parser Types

### BuildParser

**File:** `packages/operators/src/buildParser.js`

**Context:** Build-time operator evaluation
**Runtime:** Node.js

```javascript
new BuildParser({
  env, // process.env
  payload, // Build payload
  secrets, // Application secrets
  user, // Build-time user
  operators, // Operator registry
  verbose, // Logging flag
});
```

**Available Data:**

- `env` - Environment variables
- `payload` - Build payload
- `secrets` - Application secrets

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
  verbose, // Logging flag
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

All parsers use the same JSON reviver pattern:

```javascript
parse({ args, input, location, operatorPrefix = '_' }) {
  // Serialize with custom reviver
  const result = serializer.copy(input, {
    reviver: (key, value) => {
      // Identify operator objects (single key starting with prefix)
      if (isOperator(value)) {
        const [op, method] = splitOperator(key);

        // Execute operator function
        return this.operators[op]({
          args,
          location,
          methodName: method,
          params: value[key],
          // ... context data
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

**Files:** `packages/build/src/build/buildRefs/`

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

**Processing:**

1. `makeRefDefinition()` - Create ref definition
2. `getRefContent()` - Load file content
3. `parseRefContent()` - Parse YAML/JSON/Nunjucks
4. `getRefsFromFile()` - Find nested refs
5. `recursiveBuild()` - Process depth-first (max 10,000)
6. `populateRefs()` - Replace placeholders
7. `runTransformer()` - Apply transformers
8. `evaluateBuildOperators()` - Evaluate `_build.*`

### \_var Operator

**File:** `packages/build/src/build/buildRefs/populateRefs.js`

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

### \_build.\* Operators

**File:** `packages/build/src/build/buildRefs/evaluateBuildOperators.js`

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
- Errors logged if `verbose: true`
- Non-fatal: parsing continues

## Metadata Handling

### Build Parser

- Preserves `~r` (reference ID) to track source files
- Used for error reporting with file locations

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
| BuildParser        | `packages/operators/src/buildParser.js`          |
| WebParser          | `packages/operators/src/webParser.js`            |
| ServerParser       | `packages/operators/src/serverParser.js`         |
| getFromObject      | `packages/operators/src/getFromObject.js`        |
| runInstance        | `packages/operators/src/runInstance.js`          |
| runClass           | `packages/operators/src/runClass.js`             |
| Build Operators    | `packages/build/src/build/buildRefs/`            |
| JS Operators       | `packages/plugins/operators/operators-js/`       |
| MQL Operators      | `packages/plugins/operators/operators-mql/`      |
| Nunjucks Operators | `packages/plugins/operators/operators-nunjucks/` |

## Architectural Patterns

1. **Context-Specific Parsers**: Different parsers for build/client/server
2. **JSON Reviver Pattern**: Recursive operator detection and evaluation
3. **Location Tracking**: Full path for error reporting
4. **Error Collection**: Non-throwing, accumulates errors
5. **Array Index Support**: Dynamic path resolution in lists
6. **Method Chaining**: `_array.filter`, `_string.concat` syntax
7. **Default Values**: Fallback support via object params
8. **Type Validation**: Meta definitions validate input types
