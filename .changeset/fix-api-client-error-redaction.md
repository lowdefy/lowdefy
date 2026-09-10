---
'@lowdefy/api': patch
'@lowdefy/helpers': patch
'@lowdefy/client': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

fix(api): Redact server internals from every client-bound error, not just the 500 response.

Errors sent to a browser or an API caller now have `received` and `stack` stripped at
**every** level of the error, and a non-`Error` `cause` dropped unless the error is a
`UserError`. Two live leaks are closed:

- The 500 handlers stripped fields from the outermost error only, so `cause.stack` — and
  the absolute server paths in its frames — reached production browsers.
- An endpoint result body (`callEndpoint`, and the cron, webhook, detached and agent
  routes) was not redacted at all. It carried `received`, which on the request path holds
  the **evaluated** request properties, so a `_secret` resolved into a request header
  crossed the wire at HTTP 200.

`source` is now guaranteed config-relative (`pages/home.yaml:5`, never `/var/task/...`),
and `configKey` is kept again: the browser deduplicates errors on `message:configKey`, so
stripping it collapsed two different errors that happened to share a message and silently
dropped the second.

**Breaking for app config that reads `error.received`.** Server-originated errors no longer
carry it, so `_actions` and `_request_details` expose `received` as `undefined`, and the
browser console no longer prints the `Received: <json>` line for them. This is deliberate —
the field can contain your own resolved secrets. The error `message` is unchanged, and
server logs still record `received` and `stack` in full in every environment, including dev.

Also fixes internal errors being logged twice. A `LowdefyInternalError` never gets a
`source`, and the browser used `source` to decide whether the server had already logged an
error, so it POSTed every internal error back to `/api/client-error` for a second log. The
browser now reads the `handled` flag the server sets when it logs.
