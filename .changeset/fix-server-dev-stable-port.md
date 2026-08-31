---
'@lowdefy/server-dev': patch
---

fix(server-dev): Keep the public port bound across dev-server restarts.

The manager now owns the public port with a lightweight proxy and runs the
Vite child on an internal loopback port. Previously every child restart (js
module change, .env change, plugin install) dropped the TCP listener for the
whole Vite boot, so long-lived clients — MCP coding agents on
/lowdefy-docs/mcp, the reload SSE stream, HMR websockets — hit ECONNREFUSED;
MCP clients in particular latch the failure and demand a manual reconnect
(sometimes surfacing a spurious authentication prompt). Requests and websocket
upgrades that arrive while the child is down now wait for it to come back (up
to 30s) instead of failing, so a restart reads as one slow request.
