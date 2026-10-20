---
'@lowdefy/server-dev': patch
'lowdefy': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

fix(server-dev): Build status no longer says ok while a page fails to build

The dev server builds each page when it is first requested, after the config build. `lowdefy_build_status` and `GET /lowdefy-docs/build-status` took their top-level `build.status` from the config build alone, so it read `ok` while a page failed, and the failure showed only in `pages.failed` further down. Agents that read the top line moved on with a broken page.

`build.status` now reads `pages_failed` when the config builds but a page built so far does not, and `build.failedPages` names those pages. Each page's errors stay under `pages.failed`. `error` still means the config build itself failed and the dev server is serving the previous build. `lowdefy journeys harden`, which waits for a successful config build after an edit, takes `pages_failed` as built.
