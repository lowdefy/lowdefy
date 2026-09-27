---
'@lowdefy/errors': patch
---

fix(errors): An error from a client that retried and gave up is classified by the failure it retried on, including a network failure wrapped under it. The AI SDK retries a provider's 5xx response or a refused connection, then throws a `RetryError` with no status, whose last error wraps the refused `fetch`. A provider outage on an AI request was reported as a `RequestError` (a config problem) rather than a `ServiceError`. The `ServiceError` now also carries the last error's status code.
