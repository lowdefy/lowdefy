---
'@lowdefy/api': patch
---

fix: A banned user is no longer sent a sign-in email. The magic-link and one-time code sends answer as they do for an address that is not admitted: the "check your email" screen is the same, and nothing is sent or created. This holds under every signup policy, open signup included. A ban whose `banExpires` has passed sends as normal. Each suppressed send logs one `auth_email_send_banned` info line with the user id. Signing in with a link or code sent before the ban still answers `BANNED_USER`.
