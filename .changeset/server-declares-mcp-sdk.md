---
'@lowdefy/server': patch
---

fix(server): Declare `@modelcontextprotocol/sdk`, the peer of `@hono/mcp` the MCP route loads

The server imports `@hono/mcp`, which needs `@modelcontextprotocol/sdk` as a peer. The server never declared it, so it only arrived when the package manager installed peers on its own; an install with `autoInstallPeers: false` left it out and the server failed to start with `Cannot find package '@modelcontextprotocol/sdk'`.
