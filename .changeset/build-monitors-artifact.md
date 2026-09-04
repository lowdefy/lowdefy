---
'@lowdefy/build': minor
'@lowdefy/docs': patch
---

feat(build): every build writes `build/monitors.json`

A monitor definition for each `Api` endpoint, page request, connection and notification the app declares, expressed over the wide events the servers emit. Endpoints get an error-rate rule and, when scheduled, a "has not run" rule sized from their cron; page requests get a p95 latency and an error-rate rule; connections get a `ServiceError` rate rule; notifications are listed with who delivers them and what already watches that delivery. Every entry carries `config_key` and `source` (`file:line`), so an alert points at the config that declared the unit. Thresholds are app-wide defaults under `logger.monitors.defaults` (`error_rate`, `p95_ms`); there is no per-monitor or per-vendor config. `pnpm monitors:push` renders the artefact as APL queries and creates or updates the monitors in Axiom, idempotently by name, and any sink accepting the same events can consume the same file.
