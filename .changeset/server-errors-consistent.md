---
'@lowdefy/api': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
'@lowdefy/connection-mongodb': patch
'lowdefy': patch
'@lowdefy/operators': patch
'@lowdefy/operators-js': patch
---

fix(api, servers, connection-mongodb): Server errors are classified, located and logged the same way everywhere

Every server site that tells an expected outcome from a fault now asks `isExpectedError`, so an auth refusal or a `UserError` is one warn line on every path: a nested `CallApi`, a websocket frame, a background run, an optional Dynamic block, an MCP tool call and the server error handlers. Faults reach a `handleError` sink instead of a raw `logger.error`: a background, detached or forwarded-cron run that fails, an optional Dynamic block that falls back, an unwalled connection that reaches walled data, an MCP `afterToolCall` hook that fails before its routine runs, an auth email send, and an auth engine error, which goes to a system context's sink. A detached `CallApi` whose dispatch `/api/detached` does not accept is now a fault rather than a completed dispatch. The request context is set before authentication runs, so a fault there is logged with the request id.

The prod log and Sentry no longer carry `received`, an operator's or control's evaluated input. The `debug_request` line no longer logs the page payload. BetterAuth's own log lines carry an error under `err` and name other values by type only. A connection error that is already typed leaves a request with the step's ids and its cause summarised, and a websocket source's failure is wrapped like a request's, without its evaluated properties. An auth hook that returns a non-object names its type, not the record.

A MongoDB error that refuses the request (a duplicate key, a malformed pipeline, a missing permission or collection) is now a `RequestError` with the same `code` and `hint`; only a time or memory limit stays a `ServiceError`. A failed unique index build at auth startup names the index and code instead of quoting the duplicate values.

Config faults carry their config location: endpoint control errors (`:for`, `:while`, `:if`, `:switch`, `:parallel_for`, `:log`) are `ConfigError`s at the control, and the detached `CRON_SECRET` check, cron forwarding, the auth secret, the invitation sender and the auth email connection name theirs. An auth hook's `:throw` now refuses the write with a 400 instead of a 500.

On the server, `_log` writes an info line through the request's logger instead of `console.log`, so secrets and values marked with `_credential` are removed from it like from every other log line. In the browser it still logs to the console.
