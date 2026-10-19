---
'@lowdefy/api': minor
'@lowdefy/client': minor
'@lowdefy/helpers': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
---

feat: Name the caller's session, roles and memberships on responses

The `x-lowdefy-caller` header on page, request and endpoint responses now names who the server answered as in full: `<caller>; session=<hash>; roles=<hash>; memberships=<hash>`. The first value is unchanged (a short hash of the user id and active organization id, empty when anonymous). `session` hashes the session id, `roles` the caller's app roles and organization role (owner, admin or member) in the active organization, and `memberships` the ids of every organization the person belongs to. Under the pinned organization policy, `memberships` names only the app's own organization, so memberships in other apps' organizations in a shared auth database do not change it. A field the server does not know is left out, such as `session` for an API key caller.

- When the server answers the signed-in person with different roles than the page shows (a role was granted or removed since the page loaded), the page reloads, so `_user.roles`, `_user.org_roles` and role-gated blocks always match the server. It shares the reload limit of the caller check: at most once every 10 seconds per tab, after which the call fails with an `AuthenticationError`.
- A new session or a changed list of organizations for the same person, organization and roles does not reload the page. The browser keeps the last stamp it received.
- The membership list comes from the same member lookup that already resolves the caller's roles: every member row of the person is read in one query, so no database round trip is added per request.
- `@lowdefy/helpers` exports `callerStamp`, `parseCallerStamp` and `rolesHash`.
