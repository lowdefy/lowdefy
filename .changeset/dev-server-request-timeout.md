---
'@lowdefy/server-dev': patch
---

The dev server applies `config.requestTimeout`

The production server cuts off requests after `config.requestTimeout` (30 seconds by default), but the dev server applied no timeout, so a slow request only failed once deployed. The dev server now applies the same timeout to requests, API endpoints, cron and detached endpoint runs, and cancels the upstream calls a timed-out request leaves behind, as production does. JIT page builds and the dev-only docs, MCP and live-reload routes are not affected.
