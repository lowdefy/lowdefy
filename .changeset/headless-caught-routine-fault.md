---
'@lowdefy/api': patch
'@lowdefy/journey-headless': patch
'@lowdefy/server-dev': patch
'@lowdefy/test-utils': patch
---

fix(journey-headless): A fault the routine's own `:catch` handled no longer fails a headless journey

A headless journey failed at a step whose endpoint answered 200 with its normal reply, when a routine step threw a config, operator or internal error inside a `:try` and the routine's `:catch` handled it. On a production build (`lowdefy test --headless --build`) that is every routine that catches a `CallApi` with `detached: true` or an auth step, since the build host has no `CRON_SECRET` and no auth engine.

- A headless journey is now judged by the answer when the routine's own `:catch` handled the fault, on `call`, `request` and `webhook` steps and on a page's own requests. A fault no `:catch` handles still fails the journey at its step.
- `runRoutine` tells `context.handleError` whether a `:catch` handles the fault it reports, as `handleError(error, { caught })`. The servers log it as before.
- In an endpoint test, such a fault is still listed in `answer.faults`, now with `caught: true`.
