---
'@lowdefy/api': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

fix: A POST to `/api/endpoints/*` or `/api/request/*` whose body is not a JSON object is answered with 400 and logged as a warning, instead of a 500 logged as a server error.
