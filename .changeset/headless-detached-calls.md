---
'@lowdefy/api': patch
'@lowdefy/journey-headless': patch
'@lowdefy/server-dev': patch
'@lowdefy/test-utils': patch
---

feat(test-utils, journey-headless): The test host records a detached `CallApi` instead of failing it

On a production build (`lowdefy test --headless --build` and endpoint tests), a `CallApi` with `detached: true` failed for want of `CRON_SECRET`, so a routine that made one outside a `:try` failed its journey or test.

- The test host now takes a detached call itself: it records the target endpoint and the payload the step built, and never runs the target. The routine carries on as on a server.
- An endpoint test's answer lists them as `answer.detached`, `[{ endpointId, payload }]`.
- A headless journey records each as a call to its target endpoint, on the person whose call made it, so `expect: { calls: { endpoint, count, payload } }` checks it. The dev server's headless host still sends the call for real and records it the same way.
- Servers are unchanged: a detached call still needs `CRON_SECRET` and still fails without it. `@lowdefy/api` reads an optional `context.sendDetached`, which only the test hosts set, and exports the server's own dispatch as `sendDetachedRequest`.
