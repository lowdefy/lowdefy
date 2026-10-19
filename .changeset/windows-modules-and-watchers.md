---
'@lowdefy/build': patch
'@lowdefy/server-dev': patch
---

Fixes for apps built and developed on Windows. Apps with local modules now build on Windows: the build used to reject every module `_ref` as escaping the module's package root, because it compared paths using `/` separators. The page scaffold hint and annotated screenshot paths given to agents now use `/` separators on every platform.
