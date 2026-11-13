---
'@lowdefy/server': major
'@lowdefy/build': patch
'lowdefy': patch
---

feat(deps): Update the Sentry SDKs to 11.12.0

Updates `@sentry/browser`, `@sentry/node` and `@sentry/vite-plugin` to 11.12.0. `@sentry/node-core` is gone: a server that reports errors only (the default on Vercel) now runs `@sentry/node` with tracing off. What changes in your Sentry data:

- **Spans stream.** Each request's spans are sent as they end, not collected into one transaction event, so the server sends no transaction events. Alerts, saved queries and dashboards built on transactions may need to move to spans. A server request's span is named by its method and route as Lowdefy registers it (`POST /api/endpoints/*`), with its path and query in `url.path` and `url.query`. Lowdefy scrubs spans as they stream, so it always streams them: `SENTRY_TRACE_LIFECYCLE=static` has no effect. Health check requests (`/api/lowdefy-health`) are not traced.
- **No cookies.** Sentry 11 sends cookies, request and response bodies and the user's IP address by default. Lowdefy keeps all of them off, on the server and in the browser. For cookies this is stricter than before: with Sentry 10, server error events carried the request's cookies, the session cookie among them, unless your Sentry project's data scrubbing removed them. If you used Sentry with an earlier Lowdefy version, check those events. Request headers and query parameters that carry the client's address are filtered too, and so is the `Referer` header.
- **Stack traces and grouping are unchanged.** Captured messages still carry no stack trace, so existing issues keep grouping as before. Each server error is still captured once, with Lowdefy's tags.
- **Browser sessions** that end in an unhandled error are recorded as `unhandled` instead of `crashed` in release health.
- **Safari 15** is the oldest browser the Sentry browser SDK supports.

The server build no longer installs `@sentry/cli`; the CLI drops it from the build-script lists it writes into the server's `pnpm-workspace.yaml`.
