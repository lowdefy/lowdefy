---
'@lowdefy/api': patch
'@lowdefy/plugin-better-auth': patch
'@lowdefy/docs-content': patch
---

fix(api,plugin-better-auth): The login's contact link is set only by accepting an invitation

`_user.contact_id` is compared in apps' author and access checks, so it is now treated as an authorization input. Accepting an invitation sets `contactId` only on a login that has none. An invitation naming a different contact than the login already holds is refused with `CONTACT_LINK_MISMATCH`, before any membership is written, and the invitation stays pending. The message carries no ids; the server logs the login, the invitation and both contact ids as an `invitation_contact_link_mismatch` warning.

**Breaking:** `UpdateUserProfile` no longer accepts `contactId`; a call that passes it fails with an unknown-property error. No auth step changes the link after the invitation sets it, and a wrong link is corrected in the data. An app that linked a login to a contact from a hook after the user was created, such as an `email.verified` match for email/password signups, can no longer do so: set the link in `user.create.before` or through an invitation. Saves of `name`, `image` and `profile` are unchanged, and self-service saves stay exempt from the org authority check.

`InviteMember` refuses an empty-string `contactId`, which accepting would otherwise set as the login's link for good.

An existing member who accepts an invitation that sets their link gets a session cookie carrying it, when the session cookie cache is on.
