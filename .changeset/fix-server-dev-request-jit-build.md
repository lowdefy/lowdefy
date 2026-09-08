---
'@lowdefy/server-dev': patch
---

fix(server-dev): Build the page JIT before serving a request. Page artifacts are built on `GET /api/page/*` and dropped on every page invalidation, so a client that already held the page config could fire a request during a rebuild and get `Request "x" does not exist.` — a fresh sign-in landing on a protected gate page hit this every time a config file was saved. `POST /api/request/*` now runs the same idempotent `buildPageIfNeeded` the page route runs.
