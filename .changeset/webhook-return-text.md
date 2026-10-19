---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/docs': minor
'@lowdefy/docs-content': minor
---

feat: Webhook endpoints can answer with plain text

- **`:return` takes `:content_type: text/plain`.** In a webhook endpoint, the endpoint answers `200` with the returned string as the body, `Content-Type: text/plain; charset=UTF-8` and `X-Content-Type-Options: nosniff`. This completes subscription handshakes that want the token echoed as text, such as Microsoft Graph's `validationToken` check.
- **Strings only.** The returned value must be a string; any other value fails the run with the `500` answer.
- **Build check.** `:content_type` on a `:return` outside a webhook endpoint, or with any value other than `text/plain`, is a build error.
- A `:return` without `:content_type` answers JSON exactly as before.
