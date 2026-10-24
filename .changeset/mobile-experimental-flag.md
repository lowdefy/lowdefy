---
'@lowdefy/build': minor
'@lowdefy/server-dev': patch
'@lowdefy/docs': patch
---

Mobile apps are experimental: the `mobile` section and `offline` on requests build only when the app sets `config.experimental.mobile: true`. Without it the build fails with a message that names the flag. The new docs page, Mobile Apps (Experimental), covers the section, capability profiles, offline requests, sign-in and the phone dev loop.
