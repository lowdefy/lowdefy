---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/server-e2e': minor
'@lowdefy/docs': minor
---

feat: Config-driven audit logging.

A new `audit` block under `logger:` in `lowdefy.yaml` captures who-did-what events server-side at well-defined interception points (auth sign-in/out, request execution, endpoint execution, authorization denial, and server errors) and emits them as structured pino log lines with `audit: true` and a stable CADF-shaped schema. When `logger.audit` is not configured (or `enabled: false`), there is zero runtime overhead.

Audit events emit on stdout alongside Lowdefy's existing operational logs and can be routed to any log drain — Vercel, CloudWatch, Datadog, Splunk, or S3 via Kinesis Firehose — by filtering on `audit: true`. Retention, immutability, and access control are handled by the destination.

```yaml
logger:
  audit:
    events: [auth, request, authorization, error]
    severity: medium
    mask: [password, ssn]
    capture:
      request: { payload: true, response: false }
    fields:
      appName: My App
      environment:
        _secret: ENVIRONMENT
    exclude:
      requests: [fetch_dropdown]
    sampling:
      request: 0.1
    rateLimit:
      perSecond: 1000
```

Highlights:

- **CADF event shape**: every event has `initiator`, `target`, `action`, `outcome`, severity, and an `auditEvent` body that's queryable in any log platform.
- **Field masking**: built-in heuristics (`password`, `token`, `secret`, `authorization`, `apikey`) plus a user `mask` list. Strings are capped at 10,000 chars to prevent log bloat.
- **Filtering**: per-category `events` allowlist; `severity` threshold; `exclude`/`include` for pages, requests, and endpoints; per-category `sampling` rate; global `rateLimit.perSecond` cap.
- **Operators in `audit.fields`**: `_secret` (and other server operators) are evaluated once at startup and merged into every event's `appFields`.
- **Per-request correlation**: each event carries the request ID (`rid`) bound on the existing pino child logger, so audit events automatically correlate with operational logs from the same request.

See the "Audit Logging" page under Concepts in the docs for the full configuration reference, the event schema, and how to route the audit stream to common log destinations.
