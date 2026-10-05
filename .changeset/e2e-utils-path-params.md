---
'@lowdefy/e2e-utils': minor
---

feat(e2e-utils): `goto` and `waitForPage` take `{ pageId, path, pathParams, urlQuery }`, and the ready check and the state, request, validation and `setUrlQuery` helpers read the page instance on screen, so a patterned page's instances are told apart. The e2e manifest carries the path pattern of each patterned page, and `ldf.goto({ pageId, pathParams })` uses it.
