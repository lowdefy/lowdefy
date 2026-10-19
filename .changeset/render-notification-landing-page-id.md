---
'@lowdefy/api': major
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

feat(api)!: RenderNotification's landingPage names the page by id

**Breaking:** `properties.landingPage` is now a page id (or `{ pageId, pathParams }`) instead of a page path. Change `landingPage: /notifications/link` to the landing page's id, for example `landingPage: notifications-link`. A value that names no page, such as a path, fails the step with a `ConfigError` that says to pass the page id.

The step builds the landing URL path from the route table with `buildPagePath`, like every other notification link, so a landing page with a `path` gets the right URL.
