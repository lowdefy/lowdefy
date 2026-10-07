---
'@lowdefy/e2e-utils': patch
'@lowdefy/build': patch
---

fix: e2e page targets honour `basePath`; the dev server checks page paths without resolving page content

`ldf.goto` and `ldf.waitForPage` with a `{ pageId, pathParams, urlQuery }` target now build the URL under the app's `config.basePath`, so they reach pages in an app served under a base path. The e2e manifest records the base path from the build. A string target is still used as written.

After each edit to a page file, `lowdefy dev` checks whether the page's `path` changed. That check no longer resolves the page's blocks, events, requests and other content, so it does not read the files they reference. On a page with many references, each save is faster.
