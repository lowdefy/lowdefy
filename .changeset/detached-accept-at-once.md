---
'@lowdefy/api': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/docs': patch
---

fix(api,servers): detached calls release the dispatcher at once. The `/api/detached` route awaited the target's whole routine before replying, and the dispatching invocation keeps itself alive (`waitUntil`) until that reply arrives — so every parent stayed alive and billed for as long as its detached children ran (a cron tick that answers in milliseconds was held open by its slowest dispatched job), and a chain of detached hops was a chain of nested in-flight requests, which trips the platform's loop detection (508) a few hops down. The route now answers `202` as soon as the call is authorized and runs the target after the response under its own `waitUntil` (new `acceptDetachedEndpoint` in `@lowdefy/api`); the outcome is logged as `detached_run_done` / `detached_run_failed`.
