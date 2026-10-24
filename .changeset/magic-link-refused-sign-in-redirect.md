---
'@lowdefy/api': patch
---

fix(api): A refused magic-link sign-in lands on the error page instead of raw JSON

A banned user, or an existing user with no membership under `signup: invite-only`, who followed an emailed sign-in link saw BetterAuth's JSON error in the browser (`{"code":"BANNED_USER",...}`). The sign-in link now redirects them to the error callback URL (by default `auth.authPages.error`) with `?error=BANNED_USER` or `?error=MEMBERSHIP_REQUIRED`, the same way an expired link lands with `?error=INVALID_TOKEN`.
