---
'@lowdefy/api': minor
'@lowdefy/build': minor
---

feat(api): The app's MCP server can run an endpoint after every tool call

The `mcp` block takes an optional `afterToolCall`, the id of an API endpoint the server runs after each tool call that reached its endpoint, once the reply to the client is built. It runs as the tool's caller with the payload `{ tool, endpoint_id, scope, payload, success, response }`, so an app can record what agents do with its tools, refusals included.

```yaml
mcp:
  afterToolCall: record-tool-call
  endpoints:
    - id: search-customers
      scope: mcp:read
```

The hook never changes the reply: a hook that fails is logged as a warning and the client gets its reply as if there were no hook. It does not run for an unknown or hidden tool, a role or scope shortfall, or a payload the tool's `payloadSchema` rejects. The reply waits for the hook, so it is not cut short on serverless platforms. The build checks that the named endpoint exists; it is normally an `InternalApi` endpoint, not listed as a tool.
