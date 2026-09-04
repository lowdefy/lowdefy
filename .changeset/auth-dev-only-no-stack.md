---
'@lowdefy/build': patch
'@lowdefy/server-dev': patch
'@lowdefy/server': patch
'@lowdefy/docs': patch
---

Declaring only `auth.dev` no longer forces a full auth stack. An `auth` block whose only key is `dev` is a dev-server concern, not an auth configuration: it no longer fails the build with "Auth is configured without an authentication mechanism" and no longer demands `secret` or `database`. Such an app builds and runs signed out in production, while `lowdefy dev` treats the browser as the `auth.dev.users` entry named by `auth.dev.browserUser`: the `_user` operator reports that caller in the browser as well as on the server, the boot warning fires for `browserUser` and not only the deprecated `mockUser`, and routes that require a signed-in caller (such as `/api/feedback`) accept it. `auth.dev` entries are still schema-checked, and adding any other `auth` key declares a real auth stack with the usual requirements.
