---
'@lowdefy/server-dev': minor
---

feat: `lowdefy_run_endpoint` runs an Api endpoint routine headlessly

The dev MCP server could execute a page request (`lowdefy_run_request`) but not an `Api` endpoint, so routines — where multi-step server logic, `:if`/`:try` control flow, `CallApi` chains, writes and `:return`/`:reject` shapes live — could only be verified by clicking through the browser.

`lowdefy_run_endpoint` (and `POST /lowdefy-docs/run-endpoint`) runs an endpoint in-process with a test payload and an optional `user`, merged over the roleless headless caller exactly as `lowdefy_run_request` does:

```json
{ "endpointId": "create_order", "payload": { "sku": "A1" }, "user": { "roles": ["admin"] } }
```

Endpoints are not classified read-only — a routine has no `checkWrite` meta, and one routine can read, write, call other endpoints and send notifications — so the tool always requires `cli.agentTools.allowWriteRequests: true` in `lowdefy.yaml`. Without it the call answers `refused: true` with the reason and how to enable it, before anything runs.

The result is the `{ error, response, status, success }` object the HTTP endpoint route returns. A `:reject` or `:throw` comes back as data (`success: false`, `status: "reject"`/`"error"`, the routine's own `error`), not as a tool failure; `InternalApi` endpoints are refused with the same message HTTP callers get; an unknown endpoint answers `refused: true`; faults that escape the routine are returned as `error: { name, message, source, configKey }`. Oversized responses are truncated the same way `lowdefy_run_request` truncates them — the shared helper is now `lib/docs/truncateResponse.js`.
