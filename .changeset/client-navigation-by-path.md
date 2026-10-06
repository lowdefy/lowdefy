---
'@lowdefy/client': minor
'@lowdefy/server': minor
'@lowdefy/server-e2e': minor
'@lowdefy/server-dev': minor
'@lowdefy/e2e-utils': patch
---

Client navigation by path. The production, e2e and dev clients fetch pages by URL path and learn the page id and path values from the server. Each set of path values is its own page instance: `Client` keys the page tree by the instance key, so following a link from one ticket to another remounts the page, and passes `pathParams` to the page context. The shown page is written to the path memory before its context is built, and auth callbacks write their target before navigating. A navigation to the path the shown page was matched on skips the fetch, unless the page is dynamic. The router's location carries the path instead of a page id. `setUrlQuery` waits for a page refetch only on dynamic pages.
