---
'@lowdefy/server-dev': patch
'lowdefy': patch
---

perf(server-dev): A fresh dev server answers after one config build, not two

On a fresh checkout, the dev server's first config build cannot check plugins that are not installed yet. It installs them and builds again to run their checks, and that second build ran before the server started, so a large app took two full config builds to answer. The server now starts after the first build, and the second runs once it answers, as a change does: `lowdefy_build_status` with `wait: true` waits for it, and the browser reloads when it is done. The checks it runs and the warnings it gives are unchanged.
