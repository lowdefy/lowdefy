---
'@lowdefy/api': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
---

fix(auth): MCP clients stay connected instead of re-consenting every hour.

The OAuth authorization server offered only `mcp:read` and `mcp:write`, and the
oauth-provider issues a refresh token only when the grant carries
`offline_access` - so every MCP access token died after an hour with nothing to
renew it and Claude / ChatGPT had to re-authorize. `offline_access` is now part
of the MCP scope vocabulary (shared `MCP_OAUTH_SCOPES`, exported from
`@lowdefy/api`) and advertised in every per-org protected-resource metadata
document's `scopes_supported`, so clients that request what is advertised get a
refresh token and renew silently. Token lifetimes are unchanged (oauth-provider
defaults: 1 hour access, 30 days refresh).
