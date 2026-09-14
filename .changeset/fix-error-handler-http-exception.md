---
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

fix: Send a route's own HTTP answer (hono `HTTPException`) instead of a 500.

The MCP transport refuses an unsupported `MCP-Protocol-Version` header with a 404 carrying a JSON-RPC body that the client SDK falls back on to negotiate a version both sides know — Claude Code probes with a newer protocol revision than the server's SDK supports and then downgrades. The error handler turned that into a logged internal error and a 500 on every connection. It now sends the exception's own response with one warning line, no structured error log and no Sentry capture.
