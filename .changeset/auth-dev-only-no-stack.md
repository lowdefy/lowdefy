---
'@lowdefy/server-dev': patch
'@lowdefy/server': patch
'@lowdefy/build': patch
---

fix(build,server-dev): auth.dev alone is not an auth stack, and the dev mock user reaches \_user in the browser

An `auth` block whose only key is `dev` declares no provider and no session
store, so it is no longer treated as an auth configuration: the app builds and
runs signed out in production. The block is still schema-checked, and adding any
other `auth` key declares a real auth stack that is validated as before. In the
dev server the mock user's session is now also passed to the client, so `_user`
reads the same identity in the browser as on the server.
