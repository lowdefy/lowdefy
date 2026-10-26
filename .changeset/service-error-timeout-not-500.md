---
'@lowdefy/errors': patch
---

fix(errors): A request that times out is reported as a timeout, not a server 500

A `ServiceError` wrapped around a call that ran out of time now reads "Request timed out. The service may be slow, or the timeout too short." It finds the `TimeoutError` anywhere down the retry wrapper's `lastError` and the cause chain. Before, some clients turned the cancelled call into an error carrying a 500 that no server sent, such as the AI gateway client. The `ServiceError` then read "Server returned error 500" and carried `statusCode: 500`. A timed-out `ServiceError` now leaves `statusCode` unset, unless one is passed. A real 5xx with no timeout under it still reads "Server returned error 5xx".
