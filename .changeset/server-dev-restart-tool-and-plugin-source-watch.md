---
'@lowdefy/server-dev': minor
'@lowdefy/docs': patch
---

feat(server-dev): Add the `lowdefy_restart` MCP tool and `POST /lowdefy-docs/restart` route so an agent can restart the dev server process itself (via a `build/.restart` sentinel consumed by the manager), and watch linked local plugins' server-side sources (connections, requests, server operators, agents, websockets, notifications, auth) so editing an implementation under `src/` restarts the dev server automatically instead of serving a stale module.
