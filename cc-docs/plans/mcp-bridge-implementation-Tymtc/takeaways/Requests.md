# Requests (Engine) — Key Takeaways for MCP Bridge

**File:** `packages/engine/src/Requests.js`

## What It Does

Client-side request orchestration. Evaluates payload operators, sends requests to the API, stores results in `context.requests`.

## The Two-Phase Pattern

This is the most important thing to understand for the MCP bridge:

**Phase 1 — Client-side (Engine/Requests.js):**
```javascript
// Line 70-76: Evaluate payload operators using WebParser
const { output: payload } = this.context._internal.parser.parse({
  input: requestConfig.payload,  // May contain _state, _global, _input operators
  location: requestId,
});
```

**Phase 2 — Server-side (API/callRequest.js):**
```javascript
// The server receives the already-resolved payload
// Then evaluates request.properties operators using ServerParser
// request.properties may contain _payload, _secret, _user operators
```

## Why This Matters

The MCP bridge must perform BOTH phases:

1. **Evaluate `payload`** — resolve `_state`, `_global`, `_input`, `_request` operators against session state. This is what WebParser does in the browser. The bridge needs a parser with these operators available.

2. **Call the API** — pass the resolved payload to `callRequest`, which handles `properties` evaluation (with `_payload`, `_secret`, `_user`).

The plan conflates these two phases. It talks about making `_state` work in `callRequest`, but the real issue is that `payload` evaluation happens BEFORE `callRequest` is called.

## Request Result Storage

```javascript
// Line 87: New results are prepended
this.context.requests[requestId].unshift(request);

// Result shape:
{
  blockId: 'submit_btn',
  loading: false,
  payload: { name: 'Acme' },
  requestId: 'save_customer',
  response: { insertedId: 'abc123' },
  responseTime: 234,
  error: null,
}
```

The session state must store these request result arrays so that:
- `_request` operator works in subsequent tool calls
- The agent can reference previous results
- Request history is available for debugging

## callRequests (plural) Pattern

```javascript
// Line 33-51: Handles multiple request invocations
callRequests({ params }) {
  if (params.all === true) {
    // Execute ALL page requests
    return Promise.all(Object.keys(this.requestConfig).map(...));
  }
  // Execute specific request(s) by ID
  let requestIds = type.isString(params) ? [params] : params;
  return Promise.all(requestIds.map(...));
}
```

The MCP bridge action chain executor needs to handle both `params: 'single_request'` and `params: ['req_a', 'req_b']` formats, plus `params: { all: true }`.
