---
'@lowdefy/build': minor
'@lowdefy/docs': minor
'@lowdefy/docs-content': minor
---

feat(build): Module websockets need a signed-in caller by default

In an app with auth configured, a websocket a module ships is protected unless the module lists it under `auth.websockets.public` in its manifest, or the app makes it public with `auth.websockets.public: true` or a `public` list that names it. With no `auth.websockets` rule, or under a `protected` list that does not name it, a module websocket stays protected where an app websocket would be public, so installing a module never adds a public change stream unannounced. Roles in `auth.websockets.roles` apply as before.
