---
'@lowdefy/plugin-better-auth': patch
'@lowdefy/docs': patch
---

fix(plugin-better-auth): Add `trustEmail` to `GenericOAuth` so its users can accept invitations.

A `GenericOAuth` issuer that sends no `email_verified` claim created every user with an unverified email, and those users could never accept an organization invitation: under `organizations.policy: pinned` with `signup: invite-only` they signed in but never became members. Set `trustEmail: true` on the provider to mark the users it signs in as verified. Existing users of that provider become verified on their next sign-in. Set it only for an issuer that controls the emails it hands out: a verified email lets a sign-in link to an existing user with the same verified email, as a provider in `auth.account.accountLinking.trustedProviders` does.

An invalid auth provider property now fails startup with the provider id and its config location.
