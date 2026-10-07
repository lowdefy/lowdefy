---
'@lowdefy/operators-js': minor
'@lowdefy/docs': minor
'@lowdefy/docs-content': minor
---

feat: The `_hmac` server operator signs a string with a key

`_hmac.sha256: { key, data }` returns the lower-case hex HMAC-SHA256 of `data` under `key`, and `_hmac.sha512` the HMAC-SHA512. Both read `key` and `data` as UTF-8 strings. Like `_hash`, it runs only on the server, so a `_secret` key never reaches the browser. The output of one call works as the `key` of the next, so a routine can derive a per-app secret from one root secret and sign a webhook body with it.
