---
'@lowdefy/api': patch
'@lowdefy/server-dev': minor
---

feat(server-dev): Flag every `tenant: none` execution while building.

Under `auth.organizations.policy: tenant`, a request, endpoint step or websocket that declares `tenant: none` runs unscoped — it reads and writes rows of every organization — and until now looked exactly like a scoped one. The dev server now records every such execution: the browser error bar shows them as an `unscoped reads (N)` group on an amber bar (they are notices, not errors) with the `file:line` of each `tenant: none` declaration and includes them in the copied text under `Unscoped reads (tenant: none):`; `lowdefy_build_status` and `GET /lowdefy-docs/build-status` list them under `tenantNotices` with the request or step id, the connection, the tenant field the wall would have used and the config source. One notice is kept per config site per dev server process, so a looped request does not flood the bar.

`@lowdefy/api`'s `resolveTenant` reports the opt-out through an optional `context.handleDevNotice` hook that only `@lowdefy/server-dev` sets — production servers emit nothing and request behaviour is unchanged.
