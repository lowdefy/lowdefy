---
'@lowdefy/server-dev': patch
---

fix(server-dev): The dev server opens one `build/reload` watcher for all open tabs instead of one per tab. Two `lowdefy_check` calls made at once on the same build share one check run; a call made after an edit still starts its own, and no report is kept after a run ends. The agent docs routes and the docs index load in the background after the server first answers, so a restart is ready sooner.
