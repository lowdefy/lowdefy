---
'@lowdefy/shell': minor
---

feat: ListOrganizations and SetActiveOrganization work on a phone

The shell gives the core's auth actions a client over its bearer token, as the web gives its Better Auth client. `ListOrganizations` and `SetActiveOrganization` call Better Auth's `organization/list` and `organization/set-active` routes, where they failed with "undefined is not a function". A switch syncs the session the shell holds before the action resolves, so `_user.organization_id`, the roles and the pages the caller may open change at once, and the app opens afresh for the new organisation. `UpdateSession` re-syncs the caller, and `Logout` ends the phone's session on the server.
