---
'@lowdefy/build': minor
'@lowdefy/api': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/cli': minor
---

feat: Scheduled API endpoints (cron) on Vercel.

`Api` and `InternalApi` endpoints can now declare `schedules` to run their routine on a timer:

```yaml
id: purge-stale-conversations
type: Api
schedules:
  - cron: '0 6 * * *'
    payload: { mode: full }
  - cron: '*/15 * * * *'
    payload: { mode: incremental }
routine:
  - id: purge
    type: MongoDBDeleteMany
    connectionId: conversations
    properties:
      filter: { updatedAt: { $lt: { _payload: cutoff } } }
```

- **build**: `schedules` is validated (Vercel cron syntax, unique crons per endpoint, object
  payloads) and passed through to the endpoint artifact; a `build/schedules.json` manifest is
  emitted for scheduled endpoints.
- **api/servers**: a new `/api/cron/*` route runs a scheduled endpoint's routine as a system context
  (no user session — `_user` is `undefined`), resolving the payload from the firing schedule via the
  `x-vercel-cron-schedule` header, and secured by the `CRON_SECRET` env var (fails closed).
- **cli**: the Vercel deployment now uses the Build Output API. `lowdefy init-vercel` scaffolds a
  `vercel.build.sh` and a new `lowdefy vercel-output` command assembles `.vercel/output/`
  (static + one `api.func` + `config.json`), generating the `crons` array from the declared schedules
  on every deploy — nothing is committed by hand.

This migrates how all Lowdefy Vercel apps deploy; re-run `lowdefy init-vercel` (or update the
`deploy/` files by hand) after upgrading. Cron jobs run in UTC and are subject to Vercel plan limits
(Hobby: daily only; Pro: per-minute).
