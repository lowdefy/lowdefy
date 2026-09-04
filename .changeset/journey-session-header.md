---
'@lowdefy/client': patch
'@lowdefy/server': patch
'@lowdefy/api': patch
---

Every API call a running app makes now carries the tab's journey session id in an `x-lowdefy-session` header, and the server stamps it on the `request_completed`, `step_completed` and `endpoint_completed` lines that call produces. Together with feedback force-keeping, a feedback report yields a trace that holds the requests and steps the session actually ran on the server, not only the browser events the recorder sampled, and it works for a tab the recorder never sampled. The header value is length- and charset-checked on the server and dropped if it is anything but a plain id, so a hostile client cannot write arbitrary text into your logs.
