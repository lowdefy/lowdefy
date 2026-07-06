---
'@lowdefy/api': minor
'@lowdefy/build': minor
'lowdefy': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
---

feat: Endpoint execution controls and webhook endpoints.

**Serverless function settings**

- New `config.vercel` section in `lowdefy.yaml`: set `maxDuration` (default 60 seconds) and `memory` for the deployed Vercel function, instead of the previously fixed 60 second cap.

**Async endpoints**

- `async: true` on an `Api` or `InternalApi` endpoint responds `{ accepted: true }` immediately and runs the routine in the background — for both client calls and scheduled (cron) runs. Authorization is still checked before accepting; completion and failure are written to the server logs.

**Detached endpoint calls**

- `detached: true` on a `CallApi` step fire-and-forgets the target endpoint in its own server invocation with a fresh execution time budget, so chained background work can run on serverless without a queue. The dispatch is secured by `CRON_SECRET`; targets run as system context (no user) and must be idempotent.

**Webhook endpoints**

- New `POST /api/hooks/<endpointId>` route for receiving third-party webhooks (Stripe, SNS, Event Grid, ...). Endpoints opt in with `hook: true`; the routine receives `{ body, query, headers }` as its payload, runs as system context, owns caller authentication, and its return value is sent back as the raw response body so exact handshake shapes work.
