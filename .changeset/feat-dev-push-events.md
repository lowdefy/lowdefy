---
'@lowdefy/server-dev': minor
---

feat(server-dev): Push build, restart and browser/server error events to AI agents.

The dev server no longer makes an agent poll `lowdefy_build_status` to learn that its edit broke the
build. Two push channels deliver the same events:

- MCP clients connected to `/lowdefy-docs/mcp` receive `notifications/message` from logger
  `lowdefy` on the standalone GET stream — the server now declares the `logging` capability.
- `GET /lowdefy-docs/events` streams the events over SSE for everything else, one frame per event,
  named by type.

Event types are `restart` (sent on connect with the process `bootedAt`), `build` (status, errors,
warnings and the `stale` flag, whenever `build/buildStatus.json` is written), `client_error` and
`server_error` (each entry as it lands in the build-status ring buffers). Events are not buffered —
a client that missed one calls `lowdefy_build_status`, which is derived from the same file.
