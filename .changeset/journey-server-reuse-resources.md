---
'lowdefy': minor
'@lowdefy/server-dev': patch
---

feat(cli): Test runs wait for a starting dev server, report their server's resources, and cap the data store's cache

- `lowdefy test`, `lowdefy journeys harden` and `lowdefy journeys variants` wait up to 5 minutes for a dev server in the worktree that is still starting (for example after `lowdefy hub start .`), instead of booting a second one. A starting server whose `<basePath>/api/ping` answers counts as ready. If it never becomes ready, the run fails with `The dev server in this worktree did not become ready. See: lowdefy hub logs <dir>`.
- When a run uses a running dev server, it warns about `--ref-resolver`, `--port`, `--dev-directory` or `--server-directory`, which that server ignores.
- A run that started its own server ends with `Resources (approximate): server peak 0.71 GB, CPU 94 s, including data store and browsers.`, measured with `ps` every 5 seconds over the server's process tree (not on Windows). A run on a shared dev server says `Resources: not measured (shared dev server).`
- The journey data store's MongoDB starts with a 0.25 GB WiredTiger cache, so it no longer grows toward half the machine's memory.
