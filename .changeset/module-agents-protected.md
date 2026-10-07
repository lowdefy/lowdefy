---
'@lowdefy/build': minor
'@lowdefy/docs': minor
'@lowdefy/docs-content': minor
---

feat(build): Module agents need a signed-in caller by default

In an app with auth configured, an agent a module ships is protected unless the module lists it under `auth.agents.public` in its manifest, or the app makes it public with `auth.api.public: true` or a `public` list that names it. With no `auth.api` rule, or under a `protected` list that does not name it, a module agent stays protected where an app agent would be public, so installing a module never lets signed-out callers run an agent, spend model calls and run its tools unannounced. Roles in `auth.api.roles` apply as before; without app auth nothing changes. A public agent's tool endpoints keep their own access, and an agent listed under a module's `auth.api.public` is refused with a message that names `auth.agents.public`.
