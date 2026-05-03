---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/plugin-aws': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/server-e2e': minor
'@lowdefy/docs': minor
---

feat: Config-driven audit logging.

A new top-level `audit` block in `lowdefy.yaml` captures who-did-what events server-side at well-defined interception points (auth sign-in/out, request execution, endpoint execution, authorization denial, and server errors) and writes them to MongoDB, S3, or stdout. When `audit` is not configured, there is zero runtime overhead.

Audit events follow a CADF-shaped JSON schema (`initiator`, `target`, `action`, `outcome`) with severity, masking, and per-category filters.

```yaml
audit:
  connectionId: audit_db
  requestType: MongoDBInsertMany
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
  batch:
    enabled: true
    size: 100
    interval: 5000
```

Highlights:

- **Two transports out of the box**: `MongoDBCollection` (via `MongoDBInsertMany`) and `AwsS3Bucket` (via the new `AwsS3PutObject` request type added in this release). A `transport: stdout` option writes events as JSON via the operational logger for local development.
- **Field masking**: built-in heuristics (`password`, `token`, `secret`, `authorization`, `apikey`) plus a user `mask` list. Strings are capped at 10,000 chars to prevent log bloat.
- **Filtering**: per-category `events` allowlist; `severity` threshold; `exclude`/`include` for pages, requests, and endpoints; per-category `sampling` rate; global `rateLimit.perSecond` cap.
- **Batching**: opt-in via `batch.enabled` with size and interval flush triggers. Mongo batches into a single `MongoDBInsertMany`; S3 batches into a single NDJSON object. SIGTERM/SIGINT/beforeExit handlers flush pending events on shutdown.
- **Operators in `audit.fields`**: `_secret` (and other server operators) are evaluated once at startup and merged into every event's `appFields`.
- **Failure modes**: default fire-and-forget never affects user requests; `audit.strict: true` propagates audit write failures as `ServiceError` for fail-closed compliance scenarios.
- **Recursion guard**: audit dispatch flags its context with `__audit: true` so the audit logger cannot recurse on its own writes.

See the new "Audit Logging" page under Concepts in the docs for the full configuration reference and an end-to-end example.
