---
'@lowdefy/api': minor
'@lowdefy/server': minor
---

feat: View sessions for MCP App views, and the view host list. `mintViewSession(context)` gives an MCP caller holding an OAuth grant a bearer session for its own user in the grant's organization. The session lasts 15 minutes from minting and is never extended, stops as soon as the grant is revoked, and a grant holds at most 20 of them: minting another ends the oldest. A member token and an anonymous caller are refused. A caller resolved from a view session carries `context.viewSession` (`{ clientId, grantedScopes }`, the grant's scopes cut to what its consent still carries); it is `null` for every other caller. `getViewHosts({ config })` returns the hosts views are served to, with the domain and origin each renders them on. The bearer plugin is now also on for an app whose `mcp` block has a view; it accepts only tokens the auth secret signed, and in an app with no `mobile` section no response carries the `set-auth-token` header.
