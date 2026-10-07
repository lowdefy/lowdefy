---
'@lowdefy/operators-js': minor
'@lowdefy/operators': minor
'@lowdefy/api': minor
'@lowdefy/node-utils': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/server-e2e': minor
'@lowdefy/docs': minor
'@lowdefy/docs-content': minor
---

feat: The `_credential` operator keeps a runtime-made credential out of the server logs

The log scrub only knew the secrets the server holds, so a value a routine made at runtime, such as a new API key or a secret derived with `_hmac`, printed in plain text at debug level in every `:set_state`, `:return`, step result and error `received` that held it. Wrap the value in `_credential` where it is made: it is returned unchanged, so the routine and its caller still get it, and every log line for the rest of that request shows `[REDACTED]` in its place, on the production and development servers alike. The development server still logs `_secret` values in full.
