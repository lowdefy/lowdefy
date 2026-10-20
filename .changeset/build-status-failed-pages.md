---
'@lowdefy/server-dev': patch
'lowdefy': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

fix(server-dev): Build status no longer says ok while a page fails to build

The dev server builds each page when it is first requested, after the config build. `lowdefy_build_status` and `GET /lowdefy-docs/build-status` took their top-level `build.status` from the config build alone, so it read `ok` while a page failed, and the failure showed only in `pages.failed` further down. Agents that read the top line moved on with a broken page.

`build.status` now reads `pages_failed` when the config builds but a page failed its latest build and has not changed since, and `build.failedPages` names those pages. A failed page that changed after that build is not counted until it is rebuilt, since its failure may already be fixed. Each page's errors stay under `pages.failed`. `error` still means the config build itself failed and the dev server is serving the previous build; it names no failed pages. `build.configStatus` is the config build's own status, and `lowdefy journeys harden`, which waits for a successful config build after an edit, reads it. `lowdefy_dev_status` reports the number of failed pages as `failedPageCount`.
