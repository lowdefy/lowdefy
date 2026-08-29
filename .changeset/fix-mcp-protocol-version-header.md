---
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
---

fix: Accept a repeated `MCP-Protocol-Version` header on `/api/mcp`.

Claude Code sends the negotiated protocol version under two spellings of the header, which the Fetch Headers constructor folds into one comma-joined value (`2025-11-25, 2025-11-25`). The MCP transport compared that raw string against its supported list and answered 404 "Unsupported protocol version" — shown by Claude Code as "MCP endpoint not found". The route now collapses a repeated value to the single version it names before the transport reads it; a header naming two different versions is still refused.
