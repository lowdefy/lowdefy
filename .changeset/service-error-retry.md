---
'@lowdefy/errors': patch
---

fix(errors): An error from a client that retried and gave up is classified by the failure it retried on. The AI SDK retries a provider's 5xx response and then throws a `RetryError` with no status, so a provider outage on an AI request was reported as a `RequestError` (a config problem) rather than a `ServiceError`.
