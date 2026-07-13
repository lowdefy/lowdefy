---
'@lowdefy/server': minor
---

feat(server): Log response status and duration on every request.

The server's per-request log line now fires after the response is finalized and includes `status` and `duration_ms`, turning it into a standard access log for production observability. Errored requests log their final status alongside the existing error detail line.
