---
'@lowdefy/server': patch
---

fix(deps): Update the Sentry SDKs to 10.78.0

Updates `@sentry/browser`, `@sentry/node` and `@sentry/node-core` to 10.78.0 and `@sentry/vite-plugin` to 5.4.1. Sentry now replaces the values of URL query parameters with sensitive names (such as `key`, `token` or `session`) with `[Filtered]` before Lowdefy's own scrub runs, so those show as `[Filtered]` rather than `[REDACTED]` in Sentry. Replay now masks attributes in breadcrumb messages too.
