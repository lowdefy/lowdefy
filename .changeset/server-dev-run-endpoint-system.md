---
'@lowdefy/server-dev': minor
---

feat(server-dev): `lowdefy_run_endpoint` and `POST /lowdefy-docs/run-endpoint` accept `system: true` to run an endpoint routine as a system context, through the same api entry point `/api/detached` uses — no user, endpoint `auth` not checked, `InternalApi` allowed. This gives scheduled and detached-only routines a local test path without `CRON_SECRET`. `system` cannot be combined with `user`; the write-access gate and result shape are unchanged.
