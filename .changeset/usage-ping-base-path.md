---
'@lowdefy/server': patch
---

fix(server): The client's usage ping posts to `<basePath>/api/usage`. It posted to `/api/usage`, which is outside the app when `config.basePath` is set, so it got a plain-text 404 back and every page threw an unhandled `Unexpected non-whitespace character after JSON` error on its first event. The ping now also drops a non-JSON or error response, a failed telemetry post, and disabled browser storage instead of throwing.
