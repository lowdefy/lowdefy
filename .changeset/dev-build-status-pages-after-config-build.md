---
'@lowdefy/server-dev': patch
'@lowdefy/docs-content': patch
---

fix(server-dev): `lowdefy_build_status` with `wait: true` rebuilds the pages built before the latest config build. A page that failed because of the app config, such as a request whose connection was not defined yet, kept reporting its old error after a config build fixed it, until the page was opened again. A page that a config change breaks is reported the same way.
