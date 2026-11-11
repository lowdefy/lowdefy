---
'@lowdefy/api': patch
'@lowdefy/connection-mongodb': patch
'@lowdefy/errors': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': minor
'@lowdefy/server-e2e': minor
---

fix(server-dev, server-e2e): A user injected without signing in meets the same authorization gate as production

In an app with `auth` configured, the dev server and the e2e server now check an injected caller the way the production server checks a caller who signed in. An injected caller is one no sign-in produced: a dev mock user (`auth.dev.mockUser` or `LOWDEFY_DEV_USER`), the `user` of a journey or a dev tool call, a data set user, and on the e2e server the `ldf.user()` cookie user or no user at all. Before, these callers met a looser gate than production's, so a journey or an e2e test could pass on an answer production never gives.

Three answers change. An app with no `auth` configured is unchanged, and so is a caller who signs in through the app (a journey with `user: none`).

1. **A signed-out caller is told to authenticate when it asks for a request or endpoint that does not exist, or for an `InternalApi` endpoint.** The answer is a 401 `AuthenticationError` ("Authentication required for ..."), where it was a 500 `ConfigError` ("... does not exist"), so a signed-out caller can not learn which ids exist. On the e2e server this is every test that sets no user. On the dev server it is only a request on a data set that carries no user. If a test expects the 500 or the "does not exist" message, expect the 401, or set a user: a signed-in caller is still told the id does not exist.
2. **A signed-out caller on a path that matches no page gets `unauthenticated`, not `not_found`, when the app protects unlisted pages by default.** On the dev server the browser goes to the sign-in page with a `callbackUrl`, where it showed the 404 page; again only for a request on a data set that carries no user. The e2e server answers both outcomes with its redirect to `/404`, so a Playwright test sees no difference.
3. **A user that carries `two_factor_enrolled: false` is asked to enrol when `auth.twoFactor.required` is true.** Before, the user was let in. A protected page answers `enrol_required`: the dev server sends the browser to the `auth.authPages.twoFactorEnrol` page, and the e2e server redirects to `/404`, as it does for every page it refuses. A protected request or endpoint answers a 403 `TwoFactorEnrolmentRequiredError`. A user with no `two_factor_enrolled` key passes as before, so most mock users, journey users, data set users and `ldf.user()` objects are unaffected. To act as an enrolled user, remove the key or set it to `true`. Keep `false` only to test the enrolment gate itself. `twoFactorEnrolled` is read as the same key.

Behind this, three pieces of server behaviour that each server copied now live in one place. They are the seams a test harness needs to run an app's endpoints the way the servers do.

- `@lowdefy/api` exports `createInjectedApiContext(context, { authJson })`. It builds the API context for a caller no auth engine resolved and takes from the built `auth.json` what the engine would have retained: `context.organization`, so the tenant wall still engages under `auth.organizations.policy: tenant`, and `context.authEnforcement` (the unlisted-page default, the required second factor and its enrolment page), which is what changes the three answers above. The dev and e2e servers set the organization by hand before and never set the enforcement facts; both call the function now. The production server does not use it.
- `@lowdefy/errors` exports `expectedAnswers`, the HTTP status, warning line and page text for each expected outcome (`AuthenticationError` 401, `AuthorizationError` 403, `TwoFactorEnrolmentRequiredError` 403, `UserError` 400). The production, dev and e2e servers each held a copy of the table in their error handler and now read this one.
- `@lowdefy/connection-mongodb` has a new entry, `@lowdefy/connection-mongodb/clients`, that exports `closeClients`. It closes the driver clients the package keeps open for the life of the process, so a test run can let its worker exit. It was reachable only by file path before.
