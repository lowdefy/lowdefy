---
'@lowdefy/build': minor
'@lowdefy/api': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/connection-smtp': minor
'@lowdefy/connection-sendgrid': minor
'@lowdefy/engine': minor
'@lowdefy/plugin-posthog': minor
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

- **`url`** — the `RenderNotification` `serverUrl` (email links and logos; on the dev server, with no environment url, the request origin), the auth canonical URL (`BETTER_AUTH_URL`: auth links, CSRF origin allowlist) and the MCP resource URIs default to it; an explicit value still wins.
- **`cron`** — the current environment registers its own schedules. The environment Vercel fires crons on (one without a `cron.secret`) also registers the schedules of every environment with a `cron.secret` and forwards them to that environment's `url`. `cron.enabled: false` registers nothing for an environment. Endpoint `schedules` keyed by environment work as before, plus a build with no current environment runs the `default` schedules.
- **`email.filter`** — applied to every `SMTPMailSend` and `SendGridMailSend` request unless the connection sets its own `filter`; an unset (`null`) connection filter falls back to it, and the new `filter: false` turns filtering off for a connection, the environment's too (for mail such as invites that must reach the real recipient). Connection resolvers now receive the current environment as `environment`. Auth emails are not filtered.
- **Logs and analytics** — every server log line carries `environment`; `PostHogInit` registers it as the `environment` super property on every PostHog event (actions now receive the read-only app metadata as `lowdefyApp`); the app metadata gains `environment` (`_app: environment`); `logger.sentry.environment` defaults to the environment name.

- **Switches** — `cron.enabled`, `email.enabled`, `posthog.enabled` and `sentry.enabled` default to `true`; set one to `false` to turn that feature off in one environment: no crons registered or forwarded, no email sent by `SMTPMailSend`/`SendGridMailSend` (each message reports `disabled: true`; auth emails still send), no PostHog (`PostHogInit` behaves as `enabled: false`), no Sentry on server or client. The switched-off features are listed in the app metadata as `disabled` (`_app: disabled`). Logging has no switch.

- **Guards** — `guards.secrets` (Lowdefy secret names) and `guards.env` (environment variable names) map to a regular expression the value must match in that environment; the build fails before deploy when a guarded value is unset or does not match, so changing it (the prod database URI, say) also takes a config change. Values are never printed, and guards are stripped from the build output.

`cron.secret` is the **name** of a Lowdefy secret, a plain string — not a `_secret` operator.

`config.environment` can name the current environment in config instead of `LOWDEFY_ENVIRONMENT`. With environments declared, the current environment must be one of them.

**Replaces `config.cron.environments` (6.0):** a build with `config.cron` fails with the migration — move the environments to `config.environments`, each `secret` to `cron.secret` and `enabled` to `cron.enabled`, give production its `url`, and set `LOWDEFY_ENVIRONMENT` on each deployment.
