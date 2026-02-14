# createEvaluateOperators — Key Takeaways for MCP Bridge

**File:** `packages/api/src/context/createEvaluateOperators.js`

## What It Does

Factory function that creates an `evaluateOperators` function bound to the current context. Called by `callRequest` at line 38 and by `callEndpoint`.

## The Code (entire file, it's small)

```javascript
function createEvaluateOperators(context) {
  const { jsMap, operators, payload, secrets, state, steps, user } = context;
  const operatorsParser = new ServerParser({ jsMap, operators, payload, secrets, state, steps, user });
  function evaluateOperators({ input, items, location }) {
    const { output, errors } = operatorsParser.parse({ input, items, location });
    if (errors.length > 0) throw new Error(errors[0]);
    return output;
  }
  return evaluateOperators;
}
```

## What Gets Passed Through

| Context property | Used by |
|---|---|
| `operators` | The operator function map — this is where `_state`, `_secret`, `_if`, etc. live |
| `state` | Passed to ServerParser, available to `_state` operator |
| `payload` | The deserialized request payload from the client |
| `secrets` | Server-side secrets for `_secret` operator |
| `user` | Auth session user for `_user` operator |
| `jsMap` | Custom JS code for `_js` operator |
| `steps` | Endpoint routine steps (for `_steps` operator in API endpoints) |

## MCP Bridge Implication

The `operators` object is the place to inject additional operators for MCP. If the bridge adds `_global`, `_input`, `_request` to `context.operators` before `callRequest` runs, they'll be available during operator evaluation.

```javascript
// In MCP bridge context creation:
context.operators = {
  ...serverOperators,        // existing server operators (includes _state)
  _global: createMcpGlobal(session.lowdefyGlobal),
  _input: createMcpInput(session.inputs),
  _request: createMcpRequest(session.contexts[pageId].requests),
};
```

This is cleaner than creating a custom parser class. Just extend the operator map.
