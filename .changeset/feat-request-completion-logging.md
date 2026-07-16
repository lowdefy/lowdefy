---
'@lowdefy/server': minor
---

feat(server): Log response status and duration on every request.

The server's per-request log line now fires after the response is finalized and includes `status` and `duration_ms`, turning it into a standard access log for production observability. Errored requests log their final status alongside the existing error detail line.

Every log line now also carries the app's deploy identity — `app_name`, `app_version`, and `git_sha` (each omitted when not set) — so errors and access logs can be correlated to a specific build across replicas and rolling deploys. The Lowdefy version logs once on the startup line.

The request id (`rid`) now honors an `x-request-id` header set by an upstream proxy or load balancer (validated, falling back to a generated UUID) and is echoed on the response `x-request-id` header, so one id correlates client, proxy, and server logs. Also fixed the access and error logs reading the misspelled `x-forward-for` header — client IPs behind proxies are now captured under `x-forwarded-for`.
