---
'@lowdefy/build': minor
'@lowdefy/api': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'lowdefy': minor
---

feat: Per-environment cron schedules, forwarded from the production deployment.

Vercel fires cron jobs only on the production deployment, so staging and other environments never
ran their schedules. Declare the deployment environments once and Lowdefy registers every
environment's schedules on production, forwarding the ones for other environments to that
environment's own `/api/cron/<endpointId>` as a fire-and-forget ping:

```yaml
config:
  cron:
    environments:
      production: {} # no url: the deployment Vercel fires crons on
      staging:
        url: https://staging.example.com
        secret: STAGING_CRON_SECRET # Lowdefy secret holding staging's CRON_SECRET
```

`schedules` can then be keyed by environment, with a `default` every other environment inherits and
`[]` turning crons off — including through module vars, so a module's
`schedules: { _module.var: tick_schedule }` needs no change:

```yaml
schedules:
  default:
    - cron: '*/5 * * * *'
  staging:
    - cron: '0 * * * *'
  develop: []
```

- **build**: validates `config.cron` (exactly one environment without `url`; `url` + `secret` on the
  others; `enabled: false` registers nothing), resolves keyed schedules onto every declared
  environment, and emits `schedules.json` entries with `environment` and `forward`.
- **api/servers**: a new `/api/cron-forward/<environment>/<endpointId>` route (secured by
  `CRON_SECRET`) pings the target environment with its own `CRON_SECRET` read from
  `LOWDEFY_SECRET_<secret name>` on the production deployment (fails closed when unset) and answers
  immediately; `/api/cron/*` honours the `x-lowdefy-cron-environment` header forwarded requests carry.
- **cli**: `lowdefy vercel-output` registers forwarded schedules as `/api/cron-forward/...` cron jobs.

Existing apps without `config.cron` are unaffected.
