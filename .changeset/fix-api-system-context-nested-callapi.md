---
'@lowdefy/api': patch
---

fix(api): CallApi steps inside scheduled, webhook, and detached endpoint routines no longer fail authorization; the system context now authorizes nested endpoint calls.

Scheduled (cron), webhook, and detached endpoint runs execute as a system context with no
user session. Nested CallApi steps in those routines were re-authorized against that
session-less context, so any call to a protected (`auth.public: false`) endpoint threw
`API Endpoint "<id>" does not exist.` — silently breaking cron endpoints that compose other
endpoints via CallApi. A routine that is already executing was authorized at its entry point
(CRON_SECRET or webhook token), so the system context now authorizes nested endpoint calls
unconditionally. User-session behavior is unchanged: a user-initiated CallApi chain still
re-authorizes each target against the user's roles.
