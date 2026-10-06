---
'@lowdefy/server-dev': minor
'lowdefy': minor
'@lowdefy/node-utils': minor
'@lowdefy/docs-content': minor
---

feat: Journeys fail at the step that causes an app error

A journey used to pass as long as every step found its target and every expectation held, even when the app threw along the way. It now fails at the step that caused an app error: an action that fails with an error that is not a user error, an uncaught exception in the page or an error the page reports, a request or endpoint that throws on the server, or a 5xx from one. Errors raised while the first page opens (its `onInit` and `onMount` requests) fail the journey on open. `lowdefy test` prints the step and each error's kind, message and config file and line; the journey route's result carries them as `failure.errors`, each with the explorer's finding key.

Only errors a journey's own browsers cause count. An error from your own tab on the same dev server does not fail a journey, and a journey's errors are reported in its result, no longer in the dev server's build status or event stream. Expected outcomes never fail a journey: a failed `Validate`, a `Throw` action or any other user error, and 401 or 403 refusals.

**Journeys that passed over hidden errors will start failing.** For each one, fix the app (most cases), or, where the error is the outcome the app means, make it a user error in config (a `Throw` action is one) or assert it with the new `expect: { error: <text> }` straight after the interaction that raises it. The expectation claims that interaction's errors whose message contains the text, and fails when none does; any other error from the interaction still fails it.
