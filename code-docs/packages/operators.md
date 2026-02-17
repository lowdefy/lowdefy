# @lowdefy/operators

Framework for parsing and evaluating Lowdefy operators. Provides parsers for build-time, server-side, and client-side operator evaluation.

## Purpose

This package provides:
- `BuildParser` - Evaluates operators at build time
- `ServerParser` - Evaluates operators on the server (requests)
- `WebParser` - Evaluates operators in the browser (UI reactivity)
- Helper functions for operator implementation

## Key Exports

```javascript
import {
  BuildParser,
  ServerParser,
  WebParser,
  getFromArray,
  getFromObject,
  runClass,
  runInstance,
} from '@lowdefy/operators';
```

## What Are Operators?

Operators are functions prefixed with `_` that make configuration dynamic:

```yaml
# Static
title: Welcome

# Dynamic with operator
title:
  _if:
    test:
      _eq:
        - _state: user.role
        - admin
    then: Admin Dashboard
    else: User Dashboard
```

## Parser Types

### BuildParser

Used by `@lowdefy/build` for build-time evaluation:

```javascript
const parser = new BuildParser({
  operators: buildOperators,
  payload: {
    env,           // Environment variables
    variables,     // Build-time variables from _var
    refDef,        // Current _ref definition being processed
    path,          // Current file path
  },
  jsMap,           // Map of JavaScript functions
});

const result = parser.parse({
  input: configObject,
  location: 'lowdefy.yaml',
});
```

**Build-time operators:**
- `_ref` - Include other files
- `_var` - Build variables
- `_build.env` - Environment at build time
- `_dump_yaml` / `_dump_json` - Serialize to string

### ServerParser

Used by `@lowdefy/api` for server-side evaluation:

```javascript
const parser = new ServerParser({
  operators: serverOperators,
  payload: {
    secrets,       // Application secrets
    user,          // Current authenticated user
    payload,       // Request payload from client
    urlQuery,      // URL query parameters
    pageId,        // Current page ID
    requestId,     // Current request ID
    global,        // Global state
    input,         // Page input data
    lowdefyGlobal, // Lowdefy app configuration
    apiResponses,  // Previous request responses
  },
});

const result = parser.parse({
  input: requestProperties,
  location: 'request:getUsers',
});
```

**Server-only operators:**
- `_secret` - Access secrets (never sent to client)
- `_user` - Current user session
- `_payload` - Request payload from action

### WebParser

Used by `@lowdefy/engine` for client-side evaluation:

```javascript
const parser = new WebParser({
  operators: webOperators,
  payload: {
    state,         // Page state object
    urlQuery,      // URL query parameters
    input,         // Navigation input data
    global,        // Global state (cross-page)
    requests,      // Request responses cache
    event,         // Current event object
    eventLog,      // Array of previous events
    user,          // Authenticated user
    actions,       // Actions context for _actions_log
    lowdefyGlobal, // Lowdefy app configuration
    blockId,       // Current block ID
    pageId,        // Current page ID
  },
});

const result = parser.parse({
  input: blockProperties,
  location: 'block:submitButton',
});
```

**Client operators:**
- `_state` - Page state values
- `_url_query` - URL parameters
- `_input` - Navigation input
- `_global` - Global state
- `_request` - Request responses
- `_event` - Current event data
- `_args` - Function arguments
- `_user` - Authenticated user info (client-safe fields only)

## Operator Syntax

Operators can be written in two forms:

### Object Form (Standard)

```yaml
value:
  _sum:
    - 1
    - 2
    - 3
```

### Shorthand (for getters)

```yaml
value:
  _state: fieldName

# Equivalent to:
value:
  _state:
    key: fieldName
```

## Helper Functions

### getFromObject

Safely get nested values:

```javascript
import { getFromObject } from '@lowdefy/operators';

const value = getFromObject(object, 'path.to.value');
```

### getFromArray

Get from array of objects by key:

```javascript
import { getFromArray } from '@lowdefy/operators';

const item = getFromArray(array, 'id', 'item-123');
```

### runClass / runInstance

Execute operator classes:

```javascript
// For class-based operators
const result = runClass(OperatorClass, {
  params,
  location,
  ...context
});

// For instance-based operators
const result = runInstance(operatorInstance, {
  params,
  location,
  ...context
});
```

## Operator Implementation Pattern

Operators from plugins follow this pattern:

```javascript
// _sum operator
function _sum({ params, location }) {
  if (!Array.isArray(params)) {
    throw new Error(`_sum at ${location} requires array`);
  }
  return params.reduce((acc, val) => acc + val, 0);
}

// _if operator
function _if({ params, location }) {
  const { test, then, else: elseVal } = params;
  return test ? then : elseVal;
}
```

## Parsing Flow

```
Input Object (with operators)
         │
         ▼
┌─────────────────────┐
│  Recursive Traverse │
│  (find _ prefixes)  │
└──────────┬──────────┘
         │
         ▼
┌─────────────────────┐
│  Identify Operator  │
│  (lookup in map)    │
└──────────┬──────────┘
         │
         ▼
┌─────────────────────┐
│  Parse Nested       │
│  (operators in      │
│   params first)     │
└──────────┬──────────┘
         │
         ▼
┌─────────────────────┐
│  Execute Operator   │
│  (with context)     │
└──────────┬──────────┘
         │
         ▼
     Result Value
```

## Design Decisions

### Why Three Parsers?

Different contexts have different:
- Available operators (`_secret` only on server)
- Payload data (state only on client)
- Security requirements

### Why Underscore Prefix?

The `_` prefix:
- Clear visual distinction from data
- Won't conflict with user keys
- Easy to parse (just check first char)
- Convention from other systems (MongoDB, etc.)

### Why Evaluate Recursively?

Operators can contain operators:

```yaml
title:
  _if:
    test:
      _gt:                    # Evaluated first
        - _state: count       # Evaluated first
        - 10
    then: Many items
    else: Few items
```

Inner operators evaluate first, then outer.

### Why Not Just JavaScript?

Operators in YAML provide:
- Portable configuration (no code execution)
- Safe evaluation (sandboxed)
- Declarative intent (easier to reason about)
- Build-time analysis (optimize/validate)

## Security Considerations

### Server-Only Operators

Some operators must never run on the client:
- `_secret` - Would expose secrets
- `_user.password` - Sensitive data

The parsers enforce this by only including safe operators.

### Sandboxed Evaluation

Operators cannot:
- Access arbitrary JavaScript
- Make network requests
- Access filesystem
- Modify global state

The `_js` operator (from `@lowdefy/operators-js`) is the controlled escape hatch.

## Integration Points

- **@lowdefy/build**: Uses BuildParser
- **@lowdefy/api**: Uses ServerParser
- **@lowdefy/engine**: Uses WebParser
- **Operator plugins**: Provide operator implementations
- **@lowdefy/helpers**: Utility functions

## Error Handling

Operators throw simple, descriptive errors. Parsers format them with received value and location:

```javascript
// In operator - throw simple error
throw new Error('_sum requires array of numbers.');

// Parser formats to:
// "_sum requires array of numbers. Received: {...} at block:total."
```

The parsers (WebParser, ServerParser, BuildParser) catch operator errors and format them with:
- Received value as JSON
- Location in config
