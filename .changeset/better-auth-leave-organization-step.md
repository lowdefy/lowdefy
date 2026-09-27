---
'@lowdefy/plugin-better-auth': minor
---

feat(plugin-better-auth): New `LeaveOrganization` auth step

An endpoint routine can now end the caller's own membership of an organization, so the leave and
what depends on it (a check before it, an audit event after it) run in one request. The step takes
`organizationId` (required) and calls the organization plugin's leave endpoint, so its checks run:
a caller who is not a member, or is the only owner, is refused, and the refusal throws with the
plugin's message for the routine to catch with `:try`. On success it returns the removed member
row. It is `caller`-scoped: it needs a caller and no organization authority, and refuses
`system: true`. The caller's session still names the left organization as active afterwards, so
the page follows with `SetActiveOrganization` or `Logout`. The `LeaveOrganization` client action is
unchanged; step and action types resolve separately, so the shared name is not ambiguous.
