---
'@lowdefy/api': minor
---

feat(api): Limit what an MCP App view session may reach

A view session, the short bearer session an MCP App view signs in with, was a full session on every route. It is now held to the pages the app names as views and to the scopes of the MCP grant it was minted from.

- **Pages.** A view is a third page surface, read from the session. A view session is served view pages only. Any other page its roles allow answers `wrong_surface`, which the view opens in the browser. A view page whose `target` is `mobile` is not served to a view, since a view runs the web client.
- **Requests.** A view session calls a request only when the request's page is a view page.
- **Endpoints, websockets and agents.** A view session reaches only what the build listed for a view page. An MCP tool that no view page calls is refused, though the same grant may call it over `/api/mcp`. The build lists no agents yet, so a view session reaches no agent. An endpoint that a listed endpoint's routine calls is not held to the list.
- **Read-only grants.** With `mcp:read` and no `mcp:write`, a request whose resolver writes, an endpoint whose scope is `mcp:write` and a websocket publish are refused with the error code `view_write_required`. With `mcp:write` the person's roles alone decide. A grant with no MCP scope reaches nothing.
- **`/api/auth`.** A view session is refused on every path of the auth handler, sent as a bearer or as the session cookie: the session read, sign out, session listing and revoking, update user, change email, passkey registration, organization switching and OAuth consent. The answer is a 403 with the code `VIEW_SESSION_REFUSED`.

Roles still apply throughout: a view session never reaches what the same person's browser session could not. Every refusal other than `view_write_required` answers as a role refusal does, so a view session cannot tell what exists. Callers that are not view sessions are unaffected.
