---
'@lowdefy/server-dev': minor
'@lowdefy/build': patch
'lowdefy': patch
'@lowdefy/docs': patch
---

feat: Dev tools build status and request runner report the config you just edited

The dev server builds a page only when it is requested, so agent tools could answer from a page's previous build after an edit. They now tell the truth about pages built on request:

**Build status (`lowdefy_build_status`, `GET /lowdefy-docs/build-status`)**

- With `wait: true`, build status builds every page your edit touched before it answers, whether or not anything has opened the page since. A new `pages` section lists the pages it built (`checked`), the pages whose last build failed with their errors and source file (`failed`), pages changed on disk that the dev server has not rebuilt (`changedSinceBuild`), and how many pages nothing has built since the dev server started (`unbuilt`).
- Browser and server errors carry the build they happened under (`buildId`). Errors reported before the latest config build or page edit are listed apart under `earlierErrors`, so errors that may already be fixed no longer read as live.
- A build that fails with an internal error now reports the error's message, stack and the config file being resolved, instead of only "Build failed due to internal error. See above for details."

**Request and endpoint runners (`lowdefy_run_request`, `lowdefy_run_endpoint`)**

- `lowdefy_run_request` builds the page first when it changed since its last build, so it runs the request in the config now rather than the page's previous build. A page that fails to build is refused with its `buildErrors`, and a result from a page whose edit the dev server has not picked up yet carries a `staleConfig` note.
- A response over 40,000 serialized characters is no longer cut to a string prefix. It is written in full to a JSON file under `.lowdefy/responses/` in the app directory, and the result carries `responseFile`, `responseChars` and, for an array, `responseItems`. The new `saveResponse: true` option writes any response there.
