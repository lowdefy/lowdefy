---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/plugin-better-auth': minor
'@lowdefy/connection-mongodb': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/actions-core': minor
'@lowdefy/engine': minor
'@lowdefy/client': minor
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

feat: Lowdefy apps as OAuth 2.1 authorization server for external MCP clients.

The app's MCP endpoint gains an app-issued OAuth 2.1 envelope, so external MCP clients connect with app-issued bearer tokens.

- One MCP address per deployment: `POST /api/mcp`, with RFC 9728 metadata at `/.well-known/oauth-protected-resource/api/mcp`. The resource URIs default to the current environment's `url` in `config.environments`. The organization a token acts in is chosen at authorization, not encoded in the address.
- After login and before consent the authorization server sends the user to `auth.oauthProvider.postLoginPage` (required under the `tenant` organizations policy) to choose one of their organizations; the page runs `SetActiveOrganization` then the new `OAuthContinue` action. Consent is then per (client, user, organization), and every access token carries the choice as its `organization_id` claim — refresh grants keep it.
- Scopes are `mcp:read`, `mcp:write` and `offline_access`, so clients get refresh tokens: access tokens last 1 hour, refresh tokens 30 days. A rotated refresh token is accepted again for two minutes, so several sessions sharing one sign-in can refresh together.
- The `/api/mcp` route resolves the member from that claim, refuses a token whose grant no longer stands (consent deleted), and stamps `auth_method: 'mcp'` on the caller. A token whose user is no longer a member of its organization gets the `401` `WWW-Authenticate` challenge and cannot be refreshed, which sends the client back through authorization.
- New `RevokeMcpGrant` auth step: an MCP tool built on it gives up the calling assistant's own grant, so the assistant's next call is challenged to reconnect — and to choose an organization again.
- `mcp.endpoints` entries carry a `scope` (`mcp:read` | `mcp:write`); tools are listed and callable only when the caller's role gate and token scope both allow.
