---
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
---

fix(server): the MCP endpoint answers `GET` with 405

The MCP server is stateless and pushes no notifications, but a `GET /api/mcp` opened an event stream nothing wrote to, which MCP clients held open until the host's time limit. On a serverless host each one held a function until `maxDuration`. A `GET` now answers 405 with `Allow: POST` after the auth checks, as the MCP spec allows for a server without a stream, and clients stop opening one.
