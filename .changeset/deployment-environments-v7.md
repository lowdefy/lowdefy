---
'@lowdefy/engine': minor
'@lowdefy/plugin-posthog': minor
'@lowdefy/api': patch
'@lowdefy/connection-smtp': patch
'@lowdefy/email-templates': patch
'@lowdefy/server-dev': patch
'lowdefy': minor
---

feat: Deployment environments reach PostHog, auth and MCP.

- **PostHog** — `PostHogInit` registers the current environment as the `environment` super property on every PostHog event, and actions now receive the read-only app metadata as `lowdefyApp`. `posthog.enabled: false` turns PostHog off in one environment (`PostHogInit` behaves as `enabled: false`), alongside the `cron`, `email` and `sentry` switches.
- **Auth and MCP** — the current environment's `url` is the default for the auth canonical URL (`BETTER_AUTH_URL`: auth links, CSRF origin allowlist) and the MCP resource URIs; an explicit value still wins. The dev server ignores it and uses the request origin.
- **Dependencies** — `nodemailer` 10.0.13 in `connection-smtp`, `@lowdefy/api` and the dev server, and `markdown-it` 14.3.1 in `email-templates`.
