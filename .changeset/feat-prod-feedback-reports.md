---
'@lowdefy/api': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/build': minor
'@lowdefy/docs': patch
---

feat: end users report problems from inside a running app

Set `config.feedback.enabled: true` (optionally restricting to `config.feedback.roles`) and a signed-in user can press Cmd/Ctrl+`/` to send a short report. Each report emits one `feedback_submitted` wide event carrying the text, the page, the URL, the reporter's id and the journey `session_id` of the tab it was written in, so the recorded steps that led to the report sit in the same log sink, keyed to it. Reports are always signed: an unauthenticated caller is refused, and the reporter's id is stamped whatever `logger.events.identity` says. A screenshot may ride along as an image data URL up to 256 KB. `lowdefy_prod_trace` accepts `{ session_id }` as well as `{ rid }`, so a report is one call away from the ordered journey that produced it.
