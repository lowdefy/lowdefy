---
'@lowdefy/client': patch
'@lowdefy/errors': patch
'@lowdefy/server-dev': patch
---

fix: A role or sign-in refusal from a request or endpoint is an expected outcome in the browser

When an auth gate refused a request or endpoint an action called (a 401 for a signed-out caller, a 403 for a caller without the role or without an enrolled second factor), the browser lost the error's class. The action failed as an `ActionError`, the refusal was posted to `/api/client-error` and logged at error level, and a journey or explorer walk that clicked the action failed with an app error.

The browser now keeps the class of an expected outcome the server answers itself: `AuthenticationError`, `AuthorizationError`, `TwoFactorEnrolmentRequiredError`, and a `UserError` answered with a 400. The action still stops, its error message still shows and its `catch` actions still run, but the error logs to the browser console only, and journeys and explorer walks pass over it.

This changes what a `catch` list reads. For a refused `Request` or `CallAPI`, `_error.name` (and `_actions.<id>.error.name`) is now the refusal's class (`AuthorizationError`, `AuthenticationError`, `TwoFactorEnrolmentRequiredError`, or `UserError` for a 400), not `ActionError`, with the same message and no `cause`, so a catch list can branch on the refusal. A page's own `CallAPI` payload that the endpoint's `payloadSchema` refuses is a `ConfigError`, not a `UserError`.
