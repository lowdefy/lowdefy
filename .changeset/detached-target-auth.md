---
'@lowdefy/api': patch
---

fix(api): A detached `CallApi` checks the target endpoint's `auth` like a synchronous call

A `CallApi` step with `detached: true` now runs its target only when the dispatching user could call that endpoint synchronously. System dispatchers (cron, hooks, verified webhooks) pass as before.
