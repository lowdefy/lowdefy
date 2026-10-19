# @lowdefy/connection-smtp

## 6.1.0

### Minor Changes

- d1bd356: feat: Deployment environments declared once under `config.environments`.

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

  - **`url`** — the `RenderNotification` `serverUrl` (email links and logos) and the auth base URL (`AUTH_URL`) default to it; an explicit value still wins. The dev server always uses the request origin, even with a `LOWDEFY_ENVIRONMENT` that names a deployed environment.
  - **`cron`** — the current environment registers its own schedules. The environment Vercel fires crons on (one without a `cron.secret`) also registers the schedules of every environment with a `cron.secret` and forwards them to that environment's `url`. `cron.enabled: false` registers nothing for an environment. Endpoint `schedules` keyed by environment work as before; the dev server with no current environment runs the `default` schedules.
  - **`email.filter`** — applied to every `SMTPMailSend` and `SendGridMailSend` request unless the connection sets a `filter` of its own with at least one field; an unset connection filter, or one whose fields all resolve to `null`, falls back to it, and the new `filter: false` turns filtering off for a connection, the environment's too (for mail such as invites that must reach the real recipient). Connection resolvers now receive the current environment as `environment`. Auth emails are not filtered.
  - **Logs** — every server log line carries `environment`; the app metadata gains `environment` (`_app: environment`); `logger.sentry.environment` defaults to the environment name.
  - **Switches** — `cron.enabled`, `email.enabled` and `sentry.enabled` set to `false` turn that feature off in one environment: no crons registered or forwarded, no email sent by `SMTPMailSend`/`SendGridMailSend` (each message reports `disabled: true`; auth emails still send), no Sentry on server or client. The switched-off features are listed in the app metadata as `disabled` (`_app: disabled`). Logging has no switch.
  - **Guards** — `guards.secrets` (Lowdefy secret names) and `guards.env` (environment variable names) map to a regular expression the value must match in that environment; the build fails before deploy when a guarded value is unset or does not match, and the production server checks again at startup, so changing it (the prod database URI, say) also takes a config change. Unknown guard kinds fail the build. Values are never printed, and only the current environment's guards are kept, in the server-only `config.json`.

  `cron.secret` is the **name** of a Lowdefy secret, a plain string — not a `_secret` operator.

  - **Browser exposure** — environment settings stay on the server. The client learns only the current environment's name and switched-off features (`_app: environment`, `_app: disabled`); `build/config.json` is no longer bundled into the client (the auth client reads the base path from Vite's `BASE_URL`), and a test allowlists the build artifacts client code may import.

  The new [Deployment environments](https://docs.lowdefy.com/deployment-environments) docs page covers every setting.

  `config.environment` can name the current environment in config for a deployment that sets no `LOWDEFY_ENVIRONMENT`; the variable always wins. With environments declared, the current environment must be one of them, and a production build without one fails (the dev server warns). An `email.filter.regex` that is not a valid regular expression fails the build.

  **Replaces `config.cron.environments` (6.0):** a build with `config.cron` fails with the migration — move the environments to `config.environments`, each `secret` to `cron.secret` and `enabled` to `cron.enabled`, give production its `url`, and set `LOWDEFY_ENVIRONMENT` on each deployment.

### Patch Changes

- 1d3a0b8: Update dependencies to releases with published security fixes.

  - `hono` 4.13.5 and `@hono/node-server` 2.0.10 in the servers.
  - `ws` 8.21.0 in the servers; `postcss` 8.5.23 in the dev server.
  - The servers drop leftover Next.js-era dependencies they no longer use: `@sentry/nextjs` from `@lowdefy/server`, and the `webpack` and `@next/eslint-plugin-next` devDependencies.
  - `axios` 1.18.0 in the CLI and AxiosHttp.
  - `dompurify` 3.4.13 in `block-utils`, `blocks-basic` and `blocks-markdown`.
  - `echarts` 6.1.0, `mysql2` 3.23.1, `nodemailer` 9.1.1, `uuid` 13.0.1 and `@auth/mongodb-adapter` 3.11.3 in their plugins.
  - `tar` 7.5.21 and `picomatch` 4.0.4 in the build, `js-yaml` 4.3.2 in `e2e-utils`, and `@babel/core` 7.29.6 in `block-utils`.
  - `@auth/core` 0.41.3 in the servers and `plugin-next-auth`, whose peer range is now `>=0.41.3`. `@auth/mongodb-adapter` 3.11.3 depends on the same release.

  Two of these change output an app can see:

  - **`echarts` 6.1.0** changes chart defaults. Bar, pictorialBar, candlestick and boxplot series no longer draw past the grid edge; set `containShape: false` on the axis to restore the previous look. `axis.startValue` no longer sets `min`. The second argument of a `tooltip.valueFormatter` function is now `rawDataIndex`.
  - **`dompurify` 3.4.13** keeps a few attributes and elements that earlier releases removed: `command` / `commandfor`, `<selectedcontent>`, and some SVG attributes. HTML rendered by `Html`, `ClickableHtml`, `DangerousHtml`, `DangerousMarkdown` and other `renderHtml` properties may keep them.

- Updated dependencies [6d6f8fa]
- Updated dependencies [6d6f8fa]
  - @lowdefy/helpers@6.1.0

## 6.0.0

### Minor Changes

- 742a900: feat: Email notification rendering

  Lowdefy apps can now define notifications in config: branded emails rendered from framework templates, delivered over any SMTP provider. The framework renders; storing and sending are composed in YAML routines — so any database works through its normal request types, and apps or modules own the notification record.

  **`notifications:` config section (`@lowdefy/build`, `@lowdefy/api`)**

  - New root section where the template is the type: `{ id, type, properties }` with per-notification `theme` overrides and `testData`
  - Template properties are nunjucks data templates — `{{ task.title }}` interpolates against the pipeline's data with no operator syntax; interpolated values are inert (can never inject markup or links)
  - New `RenderNotification` API routine step: renders one data item per call and returns `{ subject, title, preview, html, text, data }` where `data` is the link-resolved item — inserting the record, deduplicating, sending and updating send results are plain routine steps (`:for`, requests, `_uuid`)
  - New `app.email` theme settings (logo, companyName, primaryColor, signature, footer)
  - Link resolution is driven by the step's `serverUrl`, `landingPage` and `recordId` properties: `{ pageId, urlQuery }` links resolve to direct page URLs, or through a landing page (`?_id=<recordId>&option=<dotpath>`) that can mark the record read before redirecting (for example the modules-mongodb notifications module's link page)

  **Email templates (`@lowdefy/email-templates`)**

  - Three React Email templates: `NotificationEmail` (message, metadata table, quoted comment, CTA button, action list), `DigestEmail` (item roundups) and `AlertEmail` (status-toned notices)
  - Sections render only when configured; markdown in `message` with raw HTML disabled
  - Custom templates are plain React Email plugin packages under the new `notifications` type category

  **SMTP connection (`@lowdefy/connection-smtp`)**

  - New `SMTP` connection wrapping nodemailer — works with SES, Postmark, Mailgun, Resend and self-hosted servers; `SMTPMailSend` request type
  - Environment-aware delivery `filter` (`replaceAddress` catch-all, domain `allowlist`, `regex`) applied to every send

  **SendGrid (`@lowdefy/connection-sendgrid`)**

  - Supports the same delivery `filter` and default `replyTo`; interchangeable with SMTP wherever a routine sends notification emails
  - Array requests now send per message; request-level `templateId` is no longer overridden by an unset connection `templateId`

  **Preview CLI (`lowdefy`)**

  - New `lowdefy emails` command: builds the app, generates a preview per notification from its `testData`, and opens React Email's preview server; warns when a template data key is missing from `testData`

  Builds also now validate that `CallAgent` steps reference existing agents — previously this check existed but never ran, so broken agent references that used to build will now fail with a config error.

- 9214aa3: feat: Mail send requests return per-message send results

  `SendGridMailSend` and `SMTPMailSend` now return a `results` array with one entry per message sent, so routines can record delivery outcomes:

  - Each result includes the post-filter `to` — the address mail was actually delivered to after the connection `filter` (`replaceAddress`, `allowlist`, `regex`) is applied. When a filter redirects mail to a test inbox, routines can now persist both the intended recipient and where the message really went.
  - Messages dropped entirely by the filter return `{ messageId: null, to: null, filtered: true }`.
  - `SendGridMailSend` previously discarded send results and returned only a response string; it now returns `results` with the SendGrid `messageId` per message, matching `SMTPMailSend`.
  - `SMTPMailSend` results keep nodemailer's `accepted` and `rejected` alongside the new `to`.

### Patch Changes

- Updated dependencies [6446ae6]
  - @lowdefy/helpers@6.0.0
