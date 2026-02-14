# MCP Bridge Plan — Review & Takeaways

## Files in This Directory

| File | Purpose |
|---|---|
| **[REVIEW.md](REVIEW.md)** | Critical review of PLAN.md — errors found, gaps identified, what works |
| **takeaways/** | Per-file analysis of key Lowdefy source files relevant to MCP implementation |

## Takeaway Files

Each takeaway documents what a source file does, what matters for the MCP bridge, and what the plan gets right or wrong about it.

| Takeaway | Source File | Key Finding |
|---|---|---|
| [serverParser](takeaways/serverParser.md) | `operators/src/serverParser.js` | `_state` already works server-side. No custom McpParser needed. |
| [webParser](takeaways/webParser.md) | `operators/src/webParser.js` | Has `_global`, `_input`, `_request` that server doesn't. Two-phase eval is the real challenge. |
| [callRequest](takeaways/callRequest.md) | `api/src/routes/request/callRequest.js` | No modifications needed. Set `context.state` before calling. |
| [createEvaluateOperators](takeaways/createEvaluateOperators.md) | `api/src/context/createEvaluateOperators.js` | Extend `context.operators` to inject `_global`, `_input`, `_request`. |
| [getContext + State](takeaways/getContext-and-State.md) | `engine/src/getContext.js`, `engine/src/State.js` | Defines the state model sessions must replicate. |
| [Requests](takeaways/Requests.md) | `engine/src/Requests.js` | Payload is evaluated CLIENT-SIDE before `callRequest`. Bridge must do both phases. |
| [createAuthorize](takeaways/createAuthorize.md) | `api/src/context/createAuthorize.js` | Auth is simple and fully reusable. Just construct a valid session object. |
| [build-index](takeaways/build-index.md) | `build/src/index.js` | MCP build step goes in `packages/build/`, not in server package. |
| [lowdefySchema](takeaways/lowdefySchema.md) | `build/src/lowdefySchema.js` | `additionalProperties: false` means schema extension is mandatory. |
| [callEndpoint](takeaways/callEndpoint.md) | `api/src/routes/endpoints/callEndpoint.js` | API endpoints are the easiest win — already headless. |
| [evaluateOperators](takeaways/evaluateOperators-api.md) | `api/src/routes/request/evaluateOperators.js` | Two evals per request (connection + request properties). Bridge needs secrets + state. |
| [getRequestConfig](takeaways/getRequestConfig.md) | `api/src/routes/request/getRequestConfig.js` | Reads from `.lowdefy/build/`. Bridge needs same `readConfigFile`. |

## Top-Level Findings

### The plan's biggest error
`_state` is a shared operator (not client-only). ServerParser already supports it. The proposed McpParser class and the `callRequest.js` modification are both unnecessary.

### The plan's biggest gap
No session state management. Without it, the bridge is limited to stateless one-shot operations — no cross-page workflows, no resumption, no parity with browser users.

### The real architectural challenge
Two-phase operator evaluation: `payload` operators (normally WebParser/client) must be evaluated by the bridge before calling `callRequest`, which then evaluates `properties` operators (ServerParser/server). The bridge must register `_global`, `_input`, `_request` operators that aren't in the default server set.

### What's solid
- Reusing `@lowdefy/api` (no duplication)
- Build-time tool generation from page configs
- Auth parity via `createAuthorize`
- `mcpSchema`/`mcpOutput` block exports
- API endpoints as easiest first target
