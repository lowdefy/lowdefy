---
'@lowdefy/build': patch
'@lowdefy/server-dev': patch
---

perf(server-dev): Keep built pages across config builds that change nothing they read

After a config build, the dev server no longer rebuilds every page it built. A page is rebuilt only when a file it read changed, its page registry entry changed, or the config build changed something page builds read (globals, theme, modules, endpoints, the set of pages). A page's next build also reads the endpoint list from a small `endpoints.json` instead of every endpoint artifact, and reads `keyMap.json` only when an error needs a location.
