# callRequest — Key Takeaways for MCP Bridge

**File:** `packages/api/src/routes/request/callRequest.js`

## What It Does

Server-side request execution pipeline. This is the function the MCP bridge needs to call for every `Request` action.

## The Pipeline (in order)

```
1. context.payload = deserialize(payload)
2. context.evaluateOperators = createEvaluateOperators(context)  ← KEY LINE
3. getRequestConfig(context, { pageId, requestId })
4. getConnectionConfig(context, { requestConfig })
5. authorizeRequest(context, { requestConfig })
6. getConnection(context, { connectionConfig })
7. getRequestResolver(context, { connection, requestConfig })
8. evaluateOperators(context, { connectionConfig, requestConfig })  ← resolves _secret, _state, etc.
9. checkConnectionRead / checkConnectionWrite
10. validateSchemas
11. callRequestResolver  ← actual DB/API call
12. return { id, success, type, response: serialize(response) }
```

## Critical Detail: Line 38

```javascript
context.evaluateOperators = createEvaluateOperators(context);
```

`createEvaluateOperators` reads `context.state` and creates a `ServerParser` with it. This means if the MCP bridge sets `context.state` BEFORE calling `callRequest`, the state is ignored because `callRequest` recreates the evaluator.

**However:** `createEvaluateOperators` reads `state` from `context` at the time it's called (line 38). So if `context.state` is set before `callRequest` is called, it WILL be picked up because `createEvaluateOperators` destructures it from `context` at call time.

Wait — re-reading `createEvaluateOperators`:
```javascript
const { jsMap, operators, payload, secrets, state, steps, user } = context;
```

It destructures `state` from `context` at the moment `callRequest` line 38 runs. So YES — setting `context.state` before calling `callRequest` works. No code changes needed.

## MCP Bridge Usage

```javascript
const context = createMcpApiContext({ session, buildDirectory });
context.state = sessionState.contexts[pageId].state;  // Set virtual state
context.payload = serializer.deserialize(evaluatedPayload);

const result = await callRequest(context, {
  blockId: 'mcp-bridge',
  pageId,
  payload: serializer.serialize(evaluatedPayload),
  requestId,
});
```

## No Modifications Needed

The plan proposed modifying this file. That is unnecessary. The existing code works as-is for the MCP bridge use case.
