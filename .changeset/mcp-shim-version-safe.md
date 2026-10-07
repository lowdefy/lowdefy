---
'lowdefy': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

fix(cli): `lowdefy mcp` works with a dev server on another Lowdefy version, or says how to match them

When `lowdefy mcp` and the dev server it calls run different Lowdefy versions, a tool call either works or fails with the fix spelled out, never with an internal error. The shim reads the server's version from one place, the server's instance status, for both learning its tools and the version note. A successful call notes both versions and how to match them once a session (rerun `lowdefy agent-setup` for a pinned shim, or install and build a Lowdefy checkout, then restart the agent session); every failed call carries the note. An instance record in a format the shim cannot read leaves the hub to decide where the server runs, and a server the shim cannot reach is reported with its URL instead of a bare `fetch failed`.
