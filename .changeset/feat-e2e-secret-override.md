---
'@lowdefy/server-e2e': minor
---

feat(server-e2e): Add LOWDEFY*E2E_SECRET*\* override support.

Secrets can now be overridden in e2e tests using `LOWDEFY_E2E_SECRET_*` environment variables. These take precedence over `LOWDEFY_SECRET_*` values, allowing test infrastructure (e.g. MongoMemoryServer) to coexist with secret managers injected via `commandPrefix`.
