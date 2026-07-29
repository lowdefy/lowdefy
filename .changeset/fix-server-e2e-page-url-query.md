---
'@lowdefy/server-e2e': patch
---

fix: Pass urlQuery to getPageConfig in the e2e server.

Dynamic pages built with `lowdefy build --server e2e` received an empty `urlQuery` object, so endpoints reading `_payload: urlQuery.*` resolved no URL parameters. Pages that work in development and production failed only under e2e tests.

The e2e server now resolves dynamic content with the request query string on both paths, matching `@lowdefy/server`:

- The initial HTML render passes `urlQuery` to `getPageConfig`.
- Client-side navigation forwards the current query string on its `/api/page/*` fetch, and the route reads it.
