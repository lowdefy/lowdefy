---
'@lowdefy/server': minor
---

feat(server): Log response status and duration on every request.

The server's per-request log line now fires after the response is finalized and includes `status` and `duration_ms`, turning it into a standard access log for production observability. Errored requests log their final status alongside the existing error detail line.

Every log line now also carries the app's deploy identity — `app_name`, `app_version`, and `git_sha` (each omitted when not set) — so errors and access logs can be correlated to a specific build across replicas and rolling deploys. The Lowdefy version logs once on the startup line.
