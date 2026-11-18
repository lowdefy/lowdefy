---
'@lowdefy/build': minor
'@lowdefy/operators': minor
'@lowdefy/operators-js': minor
---

feat(build): View config for MCP tools

The `mcp` block accepts the config that lets an MCP tool show a page of the app as its view. This is the build half only; the server does not serve views yet.

- `mcp.endpoints[].view` names the page a tool shows: `pageId`, optional `pathParams` and `urlQuery`, and `entrypoint`. `pathParams` and `urlQuery` may use `_payload`, the arguments the tool was called with, and the new `_response` operator, what the endpoint's routine returned. `_response` is valid only there.
- `mcp.viewPages` lists more pages a view may show, `mcp.viewSources` the other origins a view page loads from or calls, and `mcp.viewEndpoints` gives a scope to endpoints a view page calls that are not tools.

The build refuses a view that names no page, `pathParams` that miss a placeholder of the page's `path`, a view when `auth.oauthProvider` is not configured, `entrypoint: true` on an endpoint whose `payloadSchema` has required properties, and a `viewEndpoints` id that names no endpoint.

`mcp.json` gains `views`: whether the app has a view, the `viewSources`, and for each view page the endpoints (with their scope) and websocket channels the page uses. A view page's artifact carries `view: true`.
