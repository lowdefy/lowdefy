---
'@lowdefy/build': minor
'@lowdefy/api': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/connection-smtp': minor
'@lowdefy/connection-sendgrid': minor
'@lowdefy/node-utils': minor
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

- **`url`** — the `RenderNotification` `serverUrl` (email links and logos), the auth canonical URL (`BETTER_AUTH_URL`: auth links, CSRF origin allowlist) and the MCP resource URIs default to it; an explicit value still wins. The dev server ignores the current environment's `url` and uses the request origin, even with a `LOWDEFY_ENVIRONMENT` that names a deployed environment.
- **`cron`** — the current environment registers its own schedules. The environment Vercel fires crons on (one without a `cron.secret`) also registers the schedules of every environment with a `cron.secret` and forwards them to that environment's `url`. `cron.enabled: false` registers nothing for an environment. Endpoint `schedules` keyed by environment work as before; the dev server with no current environment runs the `default` schedules.
- **`email.filter`** — applied to every `SMTPMailSend` and `SendGridMailSend` request unless the connection sets a `filter` of its own with at least one field; an unset connection filter, or one whose fields all resolve to `null`, falls back to it, and the new `filter: false` turns filtering off for a connection, the environment's too (for mail such as invites that must reach the real recipient). Connection resolvers now receive the current environment as `environment`. Auth emails are not filtered.
- **Logs and analytics** — every server log line carries `environment`; `PostHogInit` registers it as the `environment` super property on every PostHog event (actions now receive the read-only app metadata as `lowdefyApp`); the app metadata gains `environment` (`_app: environment`); `logger.sentry.environment` defaults to the environment name.

- **Switches** — `cron.enabled`, `email.enabled`, `posthog.enabled` and `sentry.enabled` default to `true`; set one to `false` to turn that feature off in one environment: no crons registered or forwarded, no email sent by `SMTPMailSend`/`SendGridMailSend` (each message reports `disabled: true`; auth emails still send), no PostHog (`PostHogInit` behaves as `enabled: false`), no Sentry on server or client. The switched-off features are listed in the app metadata as `disabled` (`_app: disabled`). Logging has no switch.

- **Guards** — `guards.secrets` (Lowdefy secret names) and `guards.env` (environment variable names) map to a regular expression the value must match in that environment; the build fails before deploy when a guarded value is unset or does not match, and the production server checks again at startup, so changing it (the prod database URI, say) also takes a config change. Unknown guard kinds fail the build. Values are never printed, and only the current environment's guards are kept, in the server-only `config.json`.

`cron.secret` is the **name** of a Lowdefy secret, a plain string — not a `_secret` operator.

- **Browser exposure** — environment settings stay on the server. The client learns only the current environment's name and switched-off features (`_app: environment`, `_app: disabled`); `build/config.json` is no longer bundled into the client (the auth client reads the base path from Vite's `BASE_URL`), and a test allowlists the build artifacts client code may import.

The new [Deployment environments](https://docs.lowdefy.com/deployment-environments) docs page covers every setting.

`config.environment` can name the current environment in config for a deployment that sets no `LOWDEFY_ENVIRONMENT`; the variable always wins. With environments declared, the current environment must be one of them, and a production build without one fails (the dev server warns). An `email.filter.regex` that is not a valid regular expression fails the build.

**Replaces `config.cron.environments` (6.0):** a build with `config.cron` fails with the migration — move the environments to `config.environments`, each `secret` to `cron.secret` and `enabled` to `cron.enabled`, give production its `url`, and set `LOWDEFY_ENVIRONMENT` on each deployment.
