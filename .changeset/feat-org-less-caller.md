---
'@lowdefy/api': minor
---

Under `auth.organizations.policy: tenant`, a session carrying no organization now resolves to a caller with identity, no membership and no roles, marked `awaitingOrganization` — the invited user before they accept. Authorization refuses that caller wherever `auth.public` is false, roles or not, so no protected page or request opens up; public pages can now tell an invited user from a stranger.

Fixes the invitation flow under `tenant`: an invited person's pre-accept session resolved to no caller, so the accept page read them as signed out and offered sign-in, which produced another organization-less session and the same screen.

Unchanged under `policy: pinned`, and unchanged for a member removed mid-session, whose session still resolves to unauthenticated.
