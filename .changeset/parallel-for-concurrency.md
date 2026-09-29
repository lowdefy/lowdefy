---
'@lowdefy/api': minor
'@lowdefy/build': minor
---

`:parallel_for` takes `:concurrency`, and errors a `:catch` handles log at debug

- **`:concurrency`** on `:parallel_for` runs at most that many iterations at once (a positive integer; operators allowed), for routines that call a rate-limited service for every item. Every item still runs, and the result is the same as without it.
- **Caught errors.** An error inside a `:try` that has a `:catch` was logged as an error before the `:catch` handled it, so a routine that expects failures (a provider waterfall's 404s) filled the log. It is now logged at debug. Errors with no `:catch`, and errors in `:catch` or `:finally`, are logged as before.
- A request's schema errors in an endpoint step now name the step instead of `Request "undefined"`.
