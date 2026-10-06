---
'@lowdefy/server': minor
'@lowdefy/server-e2e': minor
'@lowdefy/server-dev': minor
---

feat: Page routes match request paths to pages

- The HTML page route and `/api/page/*` take the request path and match it to a page, so a page with a `path` pattern such as `{space}/tickets/{ticket_id}` is served at `/support/tickets/1234`. A page without `path` is still served at its id, so `/api/page/{pageId}` keeps working.
- `/` (home) and `/404` stay fixed routes ahead of the matcher. When `homePageId` is unset, `/` redirects to the first menu link's URL built with its `pathParams`; a configured home page with a fixed `path` is served at `/`.
- The first-load payload and the `/api/page/*` response carry `pageId`, `pathParams` and `matchedPath` (the matched path without `basePath` or one trailing `/`) next to `pageConfig`.
- The sign-in and two-factor enrolment `callbackUrl` is the requested path plus query on every route; the `/api/page/*` sign-in redirect used to drop the query.
- The dev server matches the path against the route table, JIT-builds the matched page, and returns `{ pageId, pathParams, matchedPath, pageConfig }`.
