---
'@lowdefy/build': patch
'@lowdefy/server-dev': patch
---

fix(build,server-dev): A dev server no longer keeps every module page and endpoint in memory

On an app that uses modules, the dev server held the whole config of the last config build for as long as it ran, in two ways. Each module's manifest kept the module's built pages and API endpoints after the build had moved them into the app's config, and the build wrote them to `build/modules.json`, which every page build reads back in full. The queue that runs config builds one at a time also held the last build's result.

The config build now takes a module's pages and endpoints out of its manifest once they are in the app's config, and the build queue no longer holds a finished build's result. A page build never read them from the manifest: it resolves a page from its source file.
