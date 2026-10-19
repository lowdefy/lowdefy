---
'@lowdefy/errors': patch
'@lowdefy/server': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

A rate-limited request (HTTP 429) is a `ServiceError` on every connection, not a `RequestError`.

`ServiceError.isServiceError` treats a 429 like a 5xx: an external condition that passes with time, not a config fault. It reads the status where client libraries put it (`statusCode`, `status`, `response.status`, the AWS SDK's `$metadata.httpStatusCode`, or a numeric `code`), follows a retrying client's last error and the `cause` chain, and also counts AWS SDK throttling exceptions and timeouts (`TimeoutError`). The `ServiceError` reports the status as `statusCode` and keeps the service's `Retry-After` as `retryAfter`, which the server log records.

A `:catch` or a client `catch` that checked for `RequestError` on a 429 now sees `ServiceError`. `_error: statusCode` is `429` in both cases.
