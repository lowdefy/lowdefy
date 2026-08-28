---
'@lowdefy/api': minor
'@lowdefy/plugin-better-auth': minor
'@lowdefy/connection-mongodb': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
---

feat: Lowdefy apps as OAuth 2.1 authorization server for external MCP clients.

Placeholder for the whole MCP OAuth provider feature: BetterAuth moves to the 1.7 line and the
per-org `/api/mcp/:org` endpoint gains an app-issued OAuth 2.1 envelope so external MCP clients
connect with app-issued bearer tokens. This entry covers all tasks of that feature — do not add
further changesets for it; rewrite this one when the feature ships.
