---
'@lowdefy/api': patch
'@lowdefy/plugin-better-auth': patch
---

fix(api,plugin-better-auth): Resolve the caller's name and image per organization (T18).

The user row's `name`/`image` are deployment-global and last-edit-wins across workspaces, so a
caller acting in organization A was stamped and rendered with the identity last saved in
organization B — change stamps, the header avatar, and every `_user: name` read named another
workspace's identity.

`UpdateUserProfile` now also denormalizes the display copies onto the target's member row in the
organization the authority floor resolved (declared as internal `input: false` member
additionalFields), and `resolveMemberCaller` prefers the member copies, falling back to the global
user row for members who have never saved a profile in that organization. Empty strings are never
written to the member copy, so the fallback cannot be masked. No new authorization surface: the
denorm rides the existing step call under the same floor, and a self-service caller with no member
row in the resolved organization skips it silently.
