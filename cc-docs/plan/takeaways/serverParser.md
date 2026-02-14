# ServerParser — Key Takeaways for MCP Bridge

**File:** `packages/operators/src/serverParser.js`

## What It Does

Evaluates operator expressions (`_state`, `_secret`, `_if`, etc.) in config objects on the server side. Used by `@lowdefy/api` when executing requests.

## Critical Discovery

ServerParser already accepts and passes through `state` (line 20 constructor, line 74 operator call). This means `_state` works server-side out of the box. The PLAN.md claim that `_state` is "the biggest architectural challenge" is wrong.

## What Gets Passed to Operators

```javascript
this.operators[op]({
  args, arrayIndices: [], env, items, jsMap, location,
  methodName, operatorPrefix, operators, params,
  parser: this, payload, runtime: 'node',
  secrets, state, steps, user,
});
```

## Key Differences from WebParser

| Property | ServerParser | WebParser |
|---|---|---|
| `state` | `this.state` (passed in constructor) | `this.context.state` (from page context) |
| `lowdefyGlobal` | **Not available** | `lowdefy.lowdefyGlobal` |
| `input` | **Not available** | `inputs[this.context.id]` |
| `requests` | **Not available** | `this.context.requests` |
| `event` | **Not available** | Passed per-parse |
| `globals` (window/document) | **Not available** | `_internal.globals` |
| `runtime` | `'node'` | `'browser'` |

## MCP Bridge Implication

The bridge does NOT need a custom McpParser. It needs to:
1. Set `context.state` on the API context before calling `callRequest`
2. Register `_global`, `_input`, `_request` operators that read from session state
3. These extra operators can be added to the `operators` object passed to ServerParser

The gap is not `_state` (already works) but `_global`, `_input`, and `_request` which are client-only operators that some request configs may reference server-side via payload.
