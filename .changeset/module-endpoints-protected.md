---
'@lowdefy/build': minor
'@lowdefy/docs': minor
'@lowdefy/docs-content': minor
---

feat(build): Module endpoints need a signed-in caller by default

In an app with auth configured, an API endpoint a module ships is protected unless the module lists it under `auth.api.public` in its manifest, or the app makes it public with `auth.api.public: true` or a `public` list that names it. With no `auth.api` rule, or under a `protected` list that does not name it, a module endpoint stays protected where an app endpoint would be public, so installing a module never adds a public endpoint unannounced. Roles in `auth.api.roles` apply as before, and a module webhook endpoint must still be listed in the app's `auth.api.public`.
