---
'@lowdefy/api': minor
'@lowdefy/email-templates': minor
'@lowdefy/cli': minor
---

Notification and email links to patterned pages: a `{ pageId, urlQuery, pathParams }` link builds its URL from the page's pattern in `routes.json` with `buildPagePath`, and a missing path value fails with the builder's error. The stored notification record keeps `pathParams` on the link object. `resolveLink` in `@lowdefy/email-templates` now takes `{ link, paths }`, `buildPreviewProps` takes `paths`, and `lowdefy emails` passes the page paths from `routes.json`.
