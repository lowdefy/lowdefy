---
'@lowdefy/api': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

fix(api): The MCP authorization server refuses to refresh a grant whose user is no longer a member of its organization.

A user removed from an organization, or who left it, could still refresh the MCP grant for it: the refresh grant re-stamped the organization without checking membership. The MCP route refused the new token, so an MCP client refreshed, retried, got the same `401` and stopped, and never ran sign-in and the organization choice again. Every access token mint, refresh included, now checks the member row and answers `invalid_grant` when it is gone, which sends the client back through authorization.
