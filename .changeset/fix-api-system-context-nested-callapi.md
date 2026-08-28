---
'@lowdefy/api': patch
'@lowdefy/build': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
---

fix(api,build,servers): Model caller-less system contexts on a single `context.system` trust property, and correct the per-runner trust scope for cron, webhook, and detached endpoint runs.

Scheduled (cron), webhook, and detached endpoint runs execute with no user session. Nested
`CallApi` steps in those routines were re-authorized against that session-less context, so any
call to a protected (`auth.public: false`) endpoint failed — silently breaking runs that compose
other endpoints. This replaces the previous blanket `system` flag with one run-level trust
marker, `context.system`, read by every authorization layer, and scopes trust correctly per
runner:

- **Cron** is trusted at the transport (`CRON_SECRET`) and holds a system context from
  construction — nested `CallApi` steps blanket-pass (endpoint role-authorization is undefined
  without a caller, so it is skipped, not denied). Unchanged in behaviour.
- **Webhook** now starts caller-less **and untrusted**: its public transport proves nothing, so a
  nested protected `CallApi` fails closed until the run earns trust. An endpoint declares trust
  through a `webhook.verify` request plugin that runs as a gate against the raw request before the
  routine body; on success the run becomes trusted, on failure the route returns 401 and the
  routine never runs. A webhook with no verifier runs untrusted throughout. The build now requires
  a webhook endpoint to be declared explicitly public (listed in `auth.api.public`) — an implicit
  or protected webhook is a build error.
- **Detached** now carries the dispatching run's identity across the loopback hop instead of
  forcing a system context. A user-dispatched detached run authorizes nested calls against the
  user's roles exactly as a synchronous call would; a cron-, hook-, or verified-webhook-dispatched
  run inherits the system context and blanket-passes.

User-session behaviour is unchanged: a user-initiated `CallApi` chain still re-authorizes each
target against the user's roles.
