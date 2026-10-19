---
'@lowdefy/server-dev': minor
'@lowdefy/docs': patch
---

feat(server-dev): Add the `lowdefy_restart` MCP tool and `POST /lowdefy-docs/restart` route so an agent can restart the dev server process itself (via a `build/.restart` sentinel consumed by the manager), and watch every local plugin `lowdefy.yaml` lists. Editing a local plugin rebuilds the config, so a new block, action, operator or request type is defined and a build a broken plugin failed clears once the plugin is fixed; editing a plugin with server-side types (connections, requests, server operators, agents, websockets, notifications, auth) also restarts the dev server instead of serving a stale module.
