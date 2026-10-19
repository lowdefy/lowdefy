---
'@lowdefy/build': patch
'@lowdefy/server-dev': patch
---

Fixes for apps built and developed on Windows. Apps with local modules now build on Windows: the build used to reject every module `_ref` as escaping the module's package root, because it compared paths using `/` separators. The dev server now ignores `.lowdefy/server/build` and `.git` on Windows as it does elsewhere, and a `build/.restart` request restarts the server on Windows. The page scaffold hint and annotated screenshot paths given to agents now use `/` separators on every platform.
