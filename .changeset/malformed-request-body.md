---
'@lowdefy/api': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

fix: A POST whose body is not a JSON object is answered with 400 and logged as a warning, instead of a 500 logged as a server error. This covers `/api/endpoints/*`, `/api/request/*`, `/api/agent/*`, `/api/detached/*`, `/api/usage` and `/api/client-error` on every server, plus the dev server's `/api/dev-inspect`, `/lowdefy-feedback` and `/lowdefy-docs/state-checkpoints/{load,snapshot}`. The dev tool routes that already treat a missing or unreadable body as empty keep doing so.
