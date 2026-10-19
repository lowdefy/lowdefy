---
'@lowdefy/server-dev': minor
'lowdefy': minor
---

Journeys can now test sign-up, sign-in and invitations through the app's own auth. `user: none` injects no user, so a journey starts signed out and the session cookies a sign-in sets carry through its steps. Three new steps: `goto` loads an app page the way a typed URL does (`goto: pageId` or `{ pageId, urlQuery }`); `email: { to, subject }` opens the newest email to an address that arrived during the journey, after which `click: { text: ... }` follows its links; `as: name` switches to another person with their own browser, cookies and client address, so an owner and an invitee, or a member whose session stays open while they are removed, act in one journey. The journey starts as `main`.

The dev server captures mail for the `email` step when `LOWDEFY_DEV_SMTP_PORT` is set: it receives SMTP on `127.0.0.1` on that port and writes each message to `.lowdefy/mail/` in the app directory instead of delivering it. Point the app's SMTP connection at that port to use it. Nothing is captured without the variable, and the production server never captures mail. `lowdefy test` and the `lowdefy_run_journey` tool accept the new steps and `user: none`.
