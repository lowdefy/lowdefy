---
'@lowdefy/server': patch
'@lowdefy/api': patch
'@lowdefy/docs': patch
---

Browser-only POST routes (`/api/feedback`, `/api/journey`, `/api/client-error`) now share one cross-site defence instead of three copies of the same check, and additionally refuse a request the browser itself marks as cross-site via `Sec-Fetch-Site`, so a page on another site can no longer post to your log sink with the user's cookies attached. When a user submits a feedback report, the server stops sampling that journey session: every wide event carrying the same `session_id` is kept at `info` regardless of `logger.events.sample_rate`, so the trace a developer opens from the report is complete. The keep-set is bounded to the 100 most recently reporting sessions per server instance.
