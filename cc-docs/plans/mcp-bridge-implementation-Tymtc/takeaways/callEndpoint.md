# callEndpoint — Key Takeaways for MCP Bridge

**File:** `packages/api/src/routes/endpoints/callEndpoint.js`

## What It Does

Executes API endpoints — headless server-side routines defined in the `api:` config section. These are the EASIEST Lowdefy construct to expose via MCP because they already don't depend on browser state.

## The Pipeline

```javascript
async function callEndpoint(context, { blockId, endpointId, pageId, payload }) {
  context.payload = serializer.deserialize(payload);
  context.evaluateOperators = createEvaluateOperators(context);

  const endpointConfig = await getEndpointConfig(context, { endpointId });
  authorizeApiEndpoint(context, { endpointConfig });

  const routineContext = { arrayIndices: [], items: {} };
  const { error, response, status } = await runRoutine(context, routineContext, {
    routine: endpointConfig.routine,
  });

  return {
    error: serializer.serialize(error),
    response: serializer.serialize(response),
    status: success ? 'success' : status,
    success: !['error', 'reject'].includes(status),
  };
}
```

## Key Differences from callRequest

| Aspect | callRequest | callEndpoint |
|---|---|---|
| Executes | Single request (one DB/API call) | Routine (sequence of steps) |
| Auth check | `authorizeRequest` | `authorizeApiEndpoint` |
| Input | `payload` | `payload` |
| State | `context.state` available | No state concept |
| Output | `{ response }` | `{ response, error, status }` |
| Routine context | N/A | `{ items, arrayIndices }` — passed through steps |

## MCP Bridge Usage

API endpoints map directly to MCP tools with minimal transformation:

```yaml
# lowdefy.yaml
api:
  - id: process_order
    type: OrderProcessor
    routine:
      - id: validate_stock
        type: Request
        params: check_stock_request
      - id: create_order
        type: Request
        params: insert_order_request
```

Becomes:

```json
{
  "name": "api_process_order",
  "description": "Process Order",
  "inputSchema": { ... }  // From mcp config or auto-detected
}
```

The bridge calls `callEndpoint` with the tool params as `payload`. The routine's `_payload` operator accesses them.

## Session Consideration

API endpoints don't have page state, but they DO have `context.payload` which is evaluated with operators. If the session has a `lowdefyGlobal`, and the endpoint's routine references `_global`, it needs to be available. Currently `_global` is NOT in the server operator set — same gap as with requests.
