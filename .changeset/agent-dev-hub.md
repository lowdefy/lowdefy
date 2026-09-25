---
'lowdefy': minor
'@lowdefy/server-dev': minor
'@lowdefy/node-utils': minor
'@lowdefy/docs': patch
---

Coding agents now get their Lowdefy tools from `lowdefy mcp`, a stdio MCP server the agent client starts itself, instead of a dev server URL with a port in it. One checked-in `.mcp.json` entry works in every git worktree, the tools are there from the first moment of a session whether or not a dev server is running, and each call reaches the dev server of the app and worktree the agent is working in — pass `directory` when a repository holds several apps or a subagent works in another worktree. Every result starts with the app and checkout it came from.

Agents no longer run `lowdefy dev`, pick ports or kill processes. `lowdefy mcp` starts dev servers through the Lowdefy hub, a small per-user background process: it gives each app its own port (4100 and up, kept across restarts), runs the app's own dev script so wrappers such as a secrets manager still apply, reports when the server is ready, restarts it fully (clearing local plugin code) with `lowdefy_dev_start({ restart: true })`, and stops servers nobody has used for 30 minutes or whose worktree was removed. It only ever stops servers it started — a `lowdefy dev` you run in a terminal is used by agents but never stopped by them. New tools: `lowdefy_dev_start`, `lowdefy_dev_stop`, `lowdefy_dev_status`, `lowdefy_dev_logs`, `lowdefy_dev_list`; new commands: `lowdefy mcp`, `lowdefy hub status|start|stop|logs`. When several `package.json` scripts run `lowdefy dev`, set `cli.devScript` in `lowdefy.yaml` to the one the hub should use.

Rerun `lowdefy agent-setup` to switch a project over: it replaces `http://localhost:<port>/lowdefy-docs/mcp` entries (keeping the `lowdefy-docs` name, so tool names and approvals carry over), removes per-port entries such as `lowdefy-3010`, and updates the skill and `AGENTS.md` section it wrote before. Add `lowdefy` to your app's `devDependencies` so the entry runs your app's own CLI. The `--port` option of `agent-setup` is gone; nothing it writes names a port any more.

`lowdefy dev` changes:

- A running dev server records itself in `.lowdefy/instance.json`, which replaces `.lowdefy/dev/.manager.lock`. A second `lowdefy dev` for the same app now exits before it touches `.lowdefy/dev` (it used to reinstall the dev server under the running one first). A record copied into another git worktree is ignored. `lowdefy test` runs against an already running dev server instead of failing to start a second one.
- A port you set — `--port`, `PORT` or `cli.port` — is used or the command fails. It no longer moves silently to the next free port and hands you a server on a port you did not expect; only the default port 3000 still does.
- `/lowdefy-docs/*` and `/api/dev-inspect/*` refuse requests a browser makes on behalf of another website, so a page you visit can no longer drive the dev tools (run requests and endpoints, load state checkpoints) on your machine. Agents, curl and the dev app's own pages are unaffected.

Also fixed: CLI error reports were sent to Lowdefy even with `--disable-telemetry` or `cli.disableTelemetry` set. They now respect the opt-out.
