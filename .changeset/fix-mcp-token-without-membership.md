---
'@lowdefy/api': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

fix(api): An MCP token whose user is no longer a member of its organization gets the sign-in challenge.

A verified MCP access token whose subject has no member row in the token's organization (removed, left, or the user deleted) now resolves as an invalid token, so `/api/mcp` answers `401` with the same `WWW-Authenticate` challenge an expired token gets. Before, the token stayed valid with an anonymous caller: every call was refused as if no one had signed in, and the client never learned to reconnect. Nothing revokes the grant; the client re-runs authorization and the organization picker, which lists only current memberships.
