---
'@lowdefy/errors': patch
'@lowdefy/helpers': patch
'@lowdefy/api': patch
'@lowdefy/build': patch
'@lowdefy/client': patch
'@lowdefy/engine': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
'@lowdefy/ai-utils': patch
'@lowdefy/connection-mongodb': patch
'@lowdefy/connection-sendgrid': patch
'@lowdefy/operators-js': patch
'@lowdefy/plugin-aws': patch
'@lowdefy/plugin-better-auth': patch
'@lowdefy/plugin-gcp': patch
'@lowdefy/docs': patch
'lowdefy': patch
---

fix: Classify expected outcomes and faults consistently across the v7 runtime and build.

A sign-in the auth server rejects - a wrong password, an expired or already-used link, a stale
OAuth authorization query - was reported as an `ActionError`: logged in the browser, posted to
`/api/client-error`, and logged again on the server at error level against the action's config
location, while BetterAuth itself logged every 4xx as `ERROR [Better Auth]`. These are expected
outcomes of user interaction, not app faults. Auth client methods now throw a `UserError` for a
4xx (with `metaData.code` / `metaData.status` for `catch` actions to branch on), and the server
owns BetterAuth's API-error logging so a rejected attempt is one warn line.

The same rule was applied across the code new in v7:

- New `AuthorizationError` (403): an authenticated caller refused by a request, endpoint, agent,
  websocket or auth-step gate is one warn line and a 403, not a `ConfigError` logged at error
  level with a 500 and a Sentry event. The agent and websocket gates now also return 401 to an
  unauthenticated caller. All three servers handle `AuthenticationError`,
  `TwoFactorEnrolmentRequiredError` and `AuthorizationError` the same way; `server` no longer
  reports each fault to Sentry twice.
- A wrong HTTP method on an API route is a 405, not an error-level log and a 500.
- Routine `:throw`, schema validation failures and a nested `CallApi` that ended in `:throw` are
  `UserError`s logged at warn, not error.
- Config faults that were plain `Error`s are `ConfigError`s (unconfigured auth, mock user without
  auth, missing `auth.email`, unknown block type, ambiguous link targets, strategy secrets,
  tenant-wall refusals, storage post-policy fields, `_organization` / `_build.authConfig`
  misuse); invariant violations are `LowdefyInternalError`s (write-phase artifact checks, invalid
  routine, auth adapter contract); upstream failures are `ServiceError`s (websocket transport,
  JWKS fetch, BetterAuth 5xx, tenant preflight probes, SMTP only when the network failed).
  `ServiceError.isServiceError` also recognises AWS SDK `$metadata.httpStatusCode` and numeric
  5xx codes.
- Build: agents, MCP endpoints, notifications, websockets, `CallAgent` / `RenderNotification`
  step references and organization client-action references collect every error instead of
  stopping at the first; `websocket-refs`, `dynamic-endpoint-refs`, `callapi-refs`,
  `callapi-internal-refs` and `icons` are valid `~ignoreBuildChecks` slugs; a plugin module that
  fails to load is reported instead of surfacing later as an unknown type; the deprecated
  `public/styles.less` check runs as a validation step rather than failing the write phase.
- Errors revived from the wire keep their class for the auth gate errors, and the dev client
  revives serialized Lowdefy errors instead of flattening them to their message.
