---
'@lowdefy/build': minor
'@lowdefy/api': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/connection-smtp': minor
'@lowdefy/connection-sendgrid': minor
'lowdefy': minor
---

feat: Deployment environments declared once under `config.environments`.

Everything that differs between an app's deployments — its URL, cron forwarding, the email delivery filter, the Sentry environment — is now declared in one place, and each deployment names the environment it is with the `LOWDEFY_ENVIRONMENT` variable (read at build time):

```yaml
config:
  environments:
    prod:
      url: https://app.example.com
    staging:
      url: https://staging.example.com
      cron:
        secret: STAGING_CRON_SECRET # staging's CRON_SECRET, set on prod
      email:
        filter:
          replaceAddress: team+staging@example.com
```

The current environment supplies the defaults:

- **`url`** — the `RenderNotification` `serverUrl` (email links and logos) and the auth base URL (`AUTH_URL`) default to it; an explicit value still wins.
- **`cron`** — the current environment registers its own schedules. The environment Vercel fires crons on (one without a `cron.secret`) also registers the schedules of every environment with a `cron.secret` and forwards them to that environment's `url`. `cron.enabled: false` registers nothing for an environment. Endpoint `schedules` keyed by environment work as before, plus a build with no current environment runs the `default` schedules.
- **`email.filter`** — applied to every `SMTPMailSend` and `SendGridMailSend` request unless the connection sets its own `filter`. Connection resolvers now receive the current environment as `environment`. Auth emails are not filtered.
- **Sentry** — `logger.sentry.environment` defaults to the environment name.

`config.environment` can name the current environment in config instead of `LOWDEFY_ENVIRONMENT`. With environments declared, the current environment must be one of them.

**Deprecated:** `config.cron.environments` (6.0) still builds, converted to `config.environments` with a warning; its url-less host stays the current environment when `LOWDEFY_ENVIRONMENT` is not set, so existing deployments register the same crons. To migrate, move the environments to `config.environments`, each `secret` to `cron.secret` and `enabled` to `cron.enabled`, give production its `url`, and set `LOWDEFY_ENVIRONMENT` on each deployment.
