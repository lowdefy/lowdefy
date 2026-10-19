---
'@lowdefy/server-dev': minor
'lowdefy': patch
'@lowdefy/docs': patch
---

`lowdefy_build_status` takes `wait: true` (`GET /lowdefy-docs/build-status?wait=true`): it answers once the dev server has processed your latest edits — the rebuild or page invalidation they trigger, and any server restart or plugin install they need (a new connection type, a new plugin package, a `.env` change) — instead of with the build before them. After `lowdefy_restart`, the same call waits for the restarted server to be ready. One call returns the result of the edit the agent just made, with no polling. It waits up to a minute and says `settled: false` if it gives up. The MCP instructions, `lowdefy agent-setup` guidance and docs tell agents to call it this way after every edit.
