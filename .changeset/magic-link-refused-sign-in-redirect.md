---
'@lowdefy/api': patch
---

fix(api): A refused magic-link sign-in lands on the error page instead of raw JSON

A person whose sign-in was refused after following an emailed sign-in link saw BetterAuth's JSON error in the browser (`{"code":"BANNED_USER",...}`). That covered a banned user, an existing user with no membership under `signup: invite-only`, a sign-in that needed a new organization while the auth indexes were unavailable, and a sign-in refused by an auth hook's `:reject`. The sign-in link now redirects to the error callback URL (by default `auth.authPages.error`) with the refusal's code in `?error=` and its message in `?error_description=`, the same way an expired link lands with `?error=INVALID_TOKEN`.

- An auth hook's `:reject` now carries the code `AUTH_HOOK_REJECTED`. A rejected sign-in through OAuth, or a magic-link sign-up refused at `user.create.before`, also lands on the error page with that code instead of showing JSON. A `Login` or `SignUp` action refused this way carries it as the error's `code`, as it does for every other auth refusal.
- A new user refused under `signup: invite-only` now gets the same message as an existing user without a membership, "You have not been granted access to this application.", instead of the bare code `MEMBERSHIP_REQUIRED`. The code is unchanged.
