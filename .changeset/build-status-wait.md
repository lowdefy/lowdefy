---
'@lowdefy/server-dev': minor
'lowdefy': patch
'@lowdefy/docs': patch
---

`lowdefy_build_status` takes `wait: true` (`GET /lowdefy-docs/build-status?wait=true`): it answers once the dev server has processed your latest edits — the rebuild or page invalidation they trigger — instead of with the build before them. Right after an edit, an agent used to read the previous, still-passing build and had to poll; now one call returns the result of the edit it just made. It waits up to a minute and says `settled: false` if it gives up. The MCP instructions, `lowdefy agent-setup` guidance and docs now tell agents to call it this way after every edit.
