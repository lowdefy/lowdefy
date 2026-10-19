---
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

docs: Document the v7 (BetterAuth) auth surface — a new "MCP Server & OAuth" page (single `/api/mcp` resource, `auth.oauthProvider`, the `organization_id` token claim, `mcp.endpoints[].scope`, the keep-MCP-endpoints-out-of-`auth.api.public` rule, consent and organisation-picker pages, `RevokeMcpGrant`), a new "Organizations & Multi-Tenancy" page (pinned vs tenant policies and the connection tenant wall), and a new "Auth Steps" page (the org/system/caller authority model and every step's scope and permission). Rewrites the stale User Object and Auth Configuration pages for BetterAuth, corrects the wrong `_user.sub` examples to `_user.id`, updates Roles for membership-based app roles, and extends the Auth Upgrade guide with the MCP/OAuth changes. Regenerates `@lowdefy/docs-content`.
