---
'@lowdefy/client': patch
'@lowdefy/errors': patch
'@lowdefy/server-dev': patch
---

fix: A role or sign-in refusal from a request or endpoint is an expected outcome in the browser

When an auth gate refused a request or endpoint an action called (a 401 for a signed-out caller, a 403 for a caller without the role or without an enrolled second factor), the browser lost the error's class. The action failed as an `ActionError`, the refusal was posted to `/api/client-error` and logged at error level, and a journey or explorer walk that clicked the action failed with an app error.

The browser now keeps the class of an expected outcome the server answers itself: `AuthenticationError`, `AuthorizationError`, `TwoFactorEnrolmentRequiredError`, and a `UserError` answered with a 400. The action still stops, its error message still shows and its `catch` actions still run, but the error logs to the browser console only, and journeys and explorer walks pass over it.
