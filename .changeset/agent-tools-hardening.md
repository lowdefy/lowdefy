---
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

fix: `<basePath>/` serves the app, and the screenshot viewport is capped

- With `config.basePath` set, `<basePath>/` (with a trailing slash) serves the app root in `lowdefy dev`, in production and in the e2e server. It answered 404 before.
- The screenshot tool's viewport `width` and `height` are at most 4096.
