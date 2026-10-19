---
'@lowdefy/plugin-better-auth': patch
'@lowdefy/api': patch
---

fix: A new member token no longer prints in the debug log

`CreateMcpToken` returned the new token in plain text in every debug log line that held its result, such as `debug_control_return`, `debug_end_endpoint_call` and a later request's result. Auth steps now receive `markCredential`, and `CreateMcpToken` marks the token as a credential when it makes it, so every log line for the rest of the request shows `[REDACTED]` in its place. The caller still gets the token.
