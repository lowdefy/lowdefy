---
'@lowdefy/api': patch
'@lowdefy/connection-mongodb': patch
'@lowdefy/plugin-better-auth': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
---

fix(deps): Update better-auth to 1.7.20

Updates `better-auth`, `@better-auth/cimd`, `@better-auth/oauth-provider` and `@better-auth/passkey`
to 1.7.20. The releases fix revoked sessions staying usable through the cookie cache, password
resets consuming the reset link before the new password is saved, MongoDB writes failing on
transaction conflicts and paginated MongoDB queries skipping rows, passkey `userVerification:
"required"` not being enforced, and tighten ID token and OAuth provider checks.

A banned or otherwise refused magic-link sign-in is now redirected to the same error page better-auth
uses for an expired link when the error page URL carries percent-encoded query values; better-auth
1.7.8 stopped decoding those values a second time and Lowdefy's redirect now matches it.
