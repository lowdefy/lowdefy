---
'@lowdefy/errors': minor
'@lowdefy/actions-core': minor
'@lowdefy/engine': minor
---

feat(errors): Add UserError class and thread actionId through request pipeline

**UserError Class**

- New `UserError` in `@lowdefy/errors` for expected user-facing errors (validation failures, intentional throws)
- UserError logs to browser console only — never sent to the server terminal
- `Throw` action now throws `UserError` instead of custom `ThrowActionError`

**Engine Error Routing**

- `Actions.logActionError()` routes errors by type: `UserError` → `console.error()`, all others → `logError()` (terminal)
- Deduplication by error message + action ID prevents repeated logging

**actionId Threading**

- `actionId` threaded from `callAction` through `createRequest` to `Requests.callRequests`
- Server-dev request handler logs request trace via `logger.ui.dim()` for dimmed output
- Enables request logs to include the triggering action for better debugging context
