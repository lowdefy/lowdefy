---
'@lowdefy/server-dev': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

Signing in on the dev server works again when it runs on a port other than the one `BETTER_AUTH_URL` names. A `BETTER_AUTH_URL` of `http://localhost:3000` refused every magic-link and email-code sign-in with "Invalid origin" once the dev server ran elsewhere: when the dev hub allocated its port, or `lowdefy dev` skipped a busy one. A `BETTER_AUTH_URL` on `localhost`, `127.0.0.1` or `[::1]` now follows the dev server's port. Any other origin, such as a tunnel, is used as set, and production is unchanged.
