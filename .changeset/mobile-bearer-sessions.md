---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
---

feat: Phone apps sign in with ordinary sessions sent as bearers

An app with a `mobile:` section accepts its Better Auth session as `Authorization: Bearer <token>` on every route, for phone shells:

- A phone signs in on Better Auth's own routes, such as `/api/auth/sign-in/email-otp`, and reads the session token from the `set-auth-token` response header. The header goes only to requests with no `Origin` and no cookies, so page script in a browser never sees it.
- Bearer callers resolve like cookie callers, with the same roles, organization and caller stamp, and are read past the cookie cache: signing out, ending sessions or removing a member applies on the next call. Websockets accept the bearer on the upgrade.
- `/auth/mobile?shell=<id>&state=<s>` is the page a shell opens in a system sign-in sheet for every other sign-in method. It sends a signed-out person through the app's sign-in page, then redirects to the shell's scheme with a one-time token that lasts one minute and works once.
- The email code send is capped at 5 per address per 15 minutes.
- New `mobile.auth` keys: `emailCode`, `unlock`, `unlockAfter`, `sharedDevice` and `sessionExpiresIn`, which gives phone sessions their own lifetime. A shell `scheme` must be a lowercase URL scheme and not a web one.
