---
'@lowdefy/server': patch
'@lowdefy/build': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

fix(server): The server imports a Sentry SDK only when `SENTRY_DSN` is set and `logger.sentry.server` is not `false`, which takes about 100 ms off the start of an app that does not use Sentry. The Node server traces requests by default; the new `logger.sentry.serverTracing: false` makes it report errors only.
