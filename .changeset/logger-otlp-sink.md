---
'@lowdefy/build': minor
'@lowdefy/logger': minor
'@lowdefy/server': minor
'@lowdefy/api': minor
'@lowdefy/docs': patch
---

feat: `logger.otlp` ships structured logs to an observability platform

Set an `endpoint` (Axiom, Grafana, Honeycomb and Datadog all accept the same OTLP/HTTP JSON wire format) and any auth `headers`; a header value may be a `_secret` operator, which is never written into the build artefact and is resolved on the server when the logger is created. Log lines are batched (`batch.size`, default 50; `batch.flush_ms`, default 2000) and exported beside stdout, never instead of it: the exporter flushes after every request through the platform's `waitUntil` so serverless invocations do not drop logs, on a timer on long-lived hosts, and before the process exits. A failed export is retried once and then dropped with a rate-limited warning, so logging can never fail a request. Endpoints running with `async: true` also emit their `endpoint_completed`/`endpoint_failed` wide event, with `entry: background`, when the background routine settles.
