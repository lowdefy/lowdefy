---
'@lowdefy/api': major
'@lowdefy/build': major
'@lowdefy/ai-utils': patch
'@lowdefy/helpers': patch
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/server-e2e': minor
---

feat(api): A declared `payloadSchema` is now enforced on every caller.

Until now an endpoint's `payloadSchema` was only advertised to MCP clients and agents; nothing
checked a payload against it. Every payload is now validated before the routine starts, on every
call path, and a non-conforming payload is refused:

- REST (`POST /api/endpoints/<endpointId>`) answers `400` with `{ name: 'UserError', message }`.
- MCP `tools/call` answers `isError: true` carrying the message so the model can retry.
- Agent tool calls and nested `CallApi` steps surface the message as a tool error.
- Scheduled runs fail when the authored `schedule.payload` breaks the endpoint's own contract.

The refusal is a `UserError`: logged at warn level, never at error level, never captured to
Sentry. The message names the endpoint, the failing location and the first ajv reason, e.g.
`Payload for endpoint "create_order" does not match its payloadSchema at /quantity: must be number.`

There is no opt-out - the way to not validate is to not declare a `payloadSchema`. The build now
fails when an endpoint declares both `webhook` and `payloadSchema`, since a webhook routine receives
the `{ body, query, headers }` envelope rather than the schema's shape.

`cleanBuildArtifact` (strips `~k`/`~r`/`~l` markers and unwraps `~arr`) moves into
`@lowdefy/helpers`, replacing the two private copies in `@lowdefy/api` and `@lowdefy/ai-utils`.
