---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/docs': minor
'@lowdefy/docs-content': minor
---

feat: Webhook endpoints answer with the HTTP status their routine sets

- **`:reject` takes `:status` and `:body`.** In a webhook endpoint, `:status` (400 to 499) sets the HTTP status and `:body` the body, sent as is. A `:reject` without `:status` answers 400 with `{ error: { code: 'rejected', message } }`.
- **Through `CallApi`.** A `:reject` in an `InternalApi` endpoint the webhook calls sets the answer the same way, so the work can live in the called endpoint.
- **Clear statuses for the rest.** A failed `ValidateSchema` step answers 400 (`invalid_request`, naming the failing path), a failed verifier 401 (`unauthorized`), and any other error 500 (`internal_error`) with nothing from the error. A successful routine still answers 200 with its return value.
- **Build check.** `:status` and `:body` on a `:reject` in any endpoint other than a webhook or an `InternalApi` endpoint is a build error.
