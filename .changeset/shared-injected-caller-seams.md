---
'@lowdefy/api': patch
'@lowdefy/connection-mongodb': patch
'@lowdefy/errors': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

refactor: Three pieces of server behaviour that each server copied now live in one place

No behaviour changes. These are the seams a test harness needs to run an app's endpoints the way the servers do.

- `@lowdefy/api` exports `createInjectedApiContext(context, { authJson })`. It builds the API context for a caller no auth engine resolved (a dev mock or headless user, the e2e server's cookie user) and binds `context.organization` from the built `auth.json`, so the tenant wall still engages under `auth.organizations.policy: tenant`. The dev and e2e servers set that binding by hand before; both call the function now.
- `@lowdefy/errors` exports `expectedAnswers`, the HTTP status, warning line and page text for each expected outcome (`AuthenticationError` 401, `AuthorizationError` 403, `TwoFactorEnrolmentRequiredError` 403, `UserError` 400). The production, dev and e2e servers each held a copy of the table in their error handler and now read this one.
- `@lowdefy/connection-mongodb` has a new entry, `@lowdefy/connection-mongodb/clients`, that exports `closeClients`. It closes the driver clients the package keeps open for the life of the process, so a test run can let its worker exit. It was reachable only by file path before.
