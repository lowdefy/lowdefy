---
'@lowdefy/api': minor
'@lowdefy/plugin-better-auth': minor
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

feat(api, plugin-better-auth): Suspend a member in one organization without banning their login

Two new auth steps, `SuspendMember` and `UnsuspendMember` (`memberId`, and optionally `organizationId`), suspend and restore a membership. A suspended membership keeps its row, app roles, org tier and attributes, so the app's own queries still find the person, but Lowdefy treats it as no membership. The person resolves unauthenticated on every protected page, request and endpoint, their MCP tokens stop working, and a pinned app refuses their sign-in with `MEMBERSHIP_REQUIRED`. Under `tenant`, `ListOrganizations` leaves the organization out and the organization endpoints refuse it. `BanUser` covers every organization and app sharing the auth database, so use this when someone should lose access to only one of them.

The membership row stores the flag as `suspended: true` in `user-members`; rows without it are not suspended. Both steps need the new `member: [suspend]` permission, which `owner` and `admin` hold. An `owner` cannot be suspended (change their org tier with `UpdateMemberOrgRole` first), and a suspended member cannot be made an `owner`.
