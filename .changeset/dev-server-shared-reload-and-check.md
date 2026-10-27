---
'@lowdefy/server-dev': patch
---

fix(server-dev): The dev server opens one `build/reload` watcher for all open tabs instead of one per tab. The agent docs routes and the docs index load in the background after the server first answers, so a restart is ready sooner.
