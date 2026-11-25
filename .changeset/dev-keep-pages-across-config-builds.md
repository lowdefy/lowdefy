---
'@lowdefy/build': patch
'@lowdefy/server-dev': patch
---

perf(server-dev): Keep built pages across config builds that change nothing they read

After a config build, the dev server no longer rebuilds every page it built. A page is rebuilt only when a file it read changed, its page registry entry changed, or the config build changed something page builds read (globals, theme, modules, endpoints, the set of pages). A page's next build reads the endpoint list from a small `endpoints.json` instead of every endpoint artifact, and reads `keyMap.json` only when it reaches a node the config build keyed. The dev build writes `modules.json` var caches and `deferredRecords.json` in a fixed order, and a page build removes the artifacts of requests its page no longer has.
