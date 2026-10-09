---
'@lowdefy/api': minor
'@lowdefy/plugin-better-auth': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/docs-content': minor
---

feat: Member tokens for MCP scripts

A script that runs on its own can now call an app's MCP tools with a long-lived **member token** instead of an OAuth grant, which a crashed refresh can sign out with no way back short of a person signing in again. A member creates a token for themselves from a signed-in session with the new `CreateMcpToken` auth step, choosing an expiry in days or none. The script sends it as `Authorization: Bearer ldf_mcp_…` to `/api/mcp` and is served as that member, with their roles and organization, exactly as an OAuth-connected assistant is (`_user.auth_method` is `'mcp'`).

- Tokens are stored hashed in the new `user-mcp-tokens` auth collection, created only in apps that set `auth.oauthProvider`.
- `RevokeMcpToken` switches off one of the caller's own tokens; `RevokeOrgMcpToken` lets owners and admins switch off any token in their organization. `RemoveMember`, `LeaveOrganization` and `DeleteUser` delete the member's tokens too.
- A token stops working when its member leaves, is removed or is banned. A refused token gets a `401` whose `error_description` says why.
- A banned user's OAuth access tokens are now refused on `/api/mcp` as well.

See "Tokens for scripts" on the MCP Server & OAuth docs page.
