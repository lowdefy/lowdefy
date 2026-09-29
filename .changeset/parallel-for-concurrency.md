---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/block-dev-e2e': patch
---

`:parallel_for` takes `:concurrency`, and expected errors a `:catch` handles log at debug

- **`:concurrency`** on `:parallel_for` runs at most that many iterations at once (a positive integer; operators allowed), for routines that call a rate-limited service for every item. Every item still runs, and the result is the same as without it.
- **Caught errors.** A request, service or user error inside a `:try` that has a `:catch` was logged as an error before the `:catch` handled it, so a routine that expects failures (a provider waterfall's 404s) filled the log. Those expected outcomes are now logged at debug. Config, operator and internal errors still go through full error handling (config location, the dev error feed, Sentry) even when caught. Errors with no `:catch`, and errors in `:catch` or `:finally`, are logged as before.
- A request's schema errors in an endpoint step now name the step instead of `Request "undefined"`.
- `createPlaywrightConfig` (`@lowdefy/block-dev-e2e`) takes optional `appDir`, `name`, `testMatch`, `services`, `env`, `fullyParallel` and `workers`, for suites that need their own app and services.
