---
'lowdefy': patch
'@lowdefy/server': patch
'@lowdefy/build': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

fix(server,cli): Vercel functions no longer wait on Sentry after every request, and start faster with Sentry on.

- **No wait after each response.** With `SENTRY_DSN` set, every Vercel invocation stayed billed for one upload to Sentry after its response, about 300 to 400 ms, even when nothing went wrong: the server sent a client report (the count of unsampled transactions) with every flush. Client reports are now off on Vercel, and the flush starts once the response closes, so a request that captured nothing ends right after its response, and one that captured an error, or whose transaction tracing sampled, waits only for that upload.
- **Errors only on Vercel by default.** On Vercel the server now reports errors with Sentry's light SDK (`@sentry/node-core/light`): no tracing, no OpenTelemetry set-up and no module loader hooks, which added about 300 ms and 130 MB to each cold start. Set `logger.sentry.serverTracing: true` to trace server requests on Vercel as before. The Node server still traces by default; `serverTracing: false` makes it report errors only too.
- **No Sentry import without `SENTRY_DSN`.** The server imports a Sentry SDK only when `SENTRY_DSN` is set and `logger.sentry.server` is not `false`, which also takes about 100 ms off the start of an app that does not use Sentry.

Redeploy to pick it up; the function entry is regenerated on every build.
