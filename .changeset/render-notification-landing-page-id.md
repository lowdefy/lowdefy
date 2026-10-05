---
'@lowdefy/api': minor
---

feat(api): RenderNotification's landingPage names the page by id

`properties.landingPage` is now a page id (or `{ pageId, pathParams }`) instead of a page path. The step builds the landing URL path from the route table with `buildPagePath`, like every other notification link, so a landing page with a `path` gets the right URL. A path string such as `/notifications/link` no longer works: pass the page id.
