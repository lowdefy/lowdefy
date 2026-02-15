# evaluateOperators (API route) — Key Takeaways for MCP Bridge

**File:** `packages/api/src/routes/request/evaluateOperators.js`

## What It Does

Evaluates operators in both connection properties and request properties at request execution time. This is where `_secret`, `_state`, `_user`, `_payload` operators get resolved.

## The Code

```javascript
function evaluateOperators({ evaluateOperators }, { connectionConfig, items, requestConfig }) {
  const connectionProperties = evaluateOperators({
    input: connectionConfig.properties || {},
    location: connectionConfig.connectionId,
  });
  const requestProperties = evaluateOperators({
    input: requestConfig.properties || {},
    items,
    location: requestConfig.requestId,
  });
  return { connectionProperties, requestProperties };
}
```

## Two Evaluations Happen

1. **Connection properties** — typically contain `_secret` operators for credentials
2. **Request properties** — contain the actual query/mutation config, may use `_payload`, `_state`, `_user`

## The `items` Parameter

Passed to request property evaluation but NOT connection property evaluation. `items` comes from endpoint routine context — it's how steps in an API endpoint routine can pass data to requests via `_steps` operator.

For the MCP bridge, when executing a request from a page action chain (not an API endpoint), `items` is undefined/empty. When executing via an API endpoint, `items` accumulates results from previous routine steps.

## MCP Bridge Implication

This function is called by `callRequest` internally. The bridge doesn't call it directly. But understanding it matters because:

- Connection secrets (`_secret`) are evaluated here — the bridge needs `context.secrets` set
- Request `_state` operators are evaluated here — the bridge needs `context.state` set
- Request `_payload` operators are evaluated here — the bridge needs proper payload
- The `items` flow is how API endpoint routines chain results between steps
