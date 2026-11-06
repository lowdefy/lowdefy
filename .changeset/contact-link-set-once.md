---
'@lowdefy/api': patch
'@lowdefy/plugin-better-auth': patch
'@lowdefy/docs-content': patch
---

fix(api,plugin-better-auth): The login's contact link is set once and changed only by an admin

`_user.contact_id` is compared in apps' author and access checks, so it is now treated as an authorization input. Accepting an invitation sets `contactId` only on a login that has none. An invitation naming a different contact than the login already holds is refused with `CONTACT_LINK_MISMATCH`, before any membership is written, and the invitation stays pending; correct the link in the data, then accept again. A self-service `UpdateUserProfile` that sets `contactId` now needs `user: [update]` authority in an organization the person belongs to, like a call on someone else. Self-service saves of `name`, `image` and `profile` are unchanged.
