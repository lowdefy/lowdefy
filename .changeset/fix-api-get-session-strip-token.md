---
'@lowdefy/api': patch
---

fix(api): Strip the session token from the `/get-session` response body.

BetterAuth's default `GET /api/auth/get-session` response includes the full session row,
including its `token` — the credential half of the httpOnly session cookie. The browser's
BetterAuth client fetches this endpoint on load and on every refresh, so the token was
delivered to client-readable JS on every authenticated page, even though Lowdefy is
cookie-based and reads only `session.user` from the response — the token was never used.

The `/get-session` response now omits `session.token`. A `customSession` plugin transforms
the endpoint's output through `sanitizeSessionResponse`, which drops `token` and returns the
rest of the session (`id`, `expiresAt`, `activeOrganizationId`, ...) unchanged. Because
`customSession` transforms whatever the core resolver returns, the token is stripped whether
the session is served from the database or the cookie cache. No app-facing behaviour changes:
`_user`, org switching and sign-out all read fields that are preserved.
