---
'@lowdefy/api': major
'@lowdefy/build': major
'@lowdefy/ai-utils': patch
'@lowdefy/helpers': patch
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/server-e2e': minor
---

feat(api)!: A declared `payloadSchema` is now enforced on every caller.

**Breaking:** a caller that sends a payload outside an endpoint's `payloadSchema` is now refused
before the routine runs. Until now the schema was only advertised to MCP clients and agents, and
nothing checked a payload against it. This is a major bump for `@lowdefy/api` and `@lowdefy/build`
because apps whose callers relied on the schema not being checked will see those calls fail.

Every payload is validated on every call path, and a non-conforming one is refused:

- REST (`POST /api/endpoints/<endpointId>`, the `CallAPI` action) answers `400` with
  `{ name: 'UserError', message }`, and `CallAPI` fails with that message.
- MCP `tools/call` answers `isError: true` carrying the message, so the model can retry.
- Agent tool calls and nested `CallApi` steps surface the message as a tool or step error.
- A detached `CallApi` target fails its run with the message in the logs.
- Scheduled runs fail when the authored `schedule.payload` breaks the endpoint's own contract.

The refusal is a `UserError`: logged at warn level, never at error level, never captured to Sentry.
The message names the endpoint, the failing location and what would be accepted, e.g.

- `Payload for endpoint "create_order" does not match its payloadSchema at /quantity: must be number.`
- `... at /status: must be equal to one of the allowed values (draft, placed).`
- `... at (root): must NOT have additional properties (colour).`
- `... at /slug: must match pattern "^[a-z0-9-]+$".`

When a location fails both its `type` and one of `enum`, `pattern`, `required` or
`additionalProperties`, that keyword is reported.

There is no opt-out: the way to not validate is to not declare a `payloadSchema`. The build now fails
when an endpoint declares both `webhook` and `payloadSchema`, since a webhook routine receives the
`{ body, query, headers }` envelope rather than the schema's shape.

`cleanBuildArtifact` (strips `~k`/`~r`/`~l` markers and unwraps `~arr`) moves into
`@lowdefy/helpers`, replacing the private copies in `@lowdefy/api` and `@lowdefy/ai-utils`.
