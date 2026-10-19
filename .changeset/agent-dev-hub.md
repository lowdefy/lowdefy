---
'lowdefy': minor
'@lowdefy/server-dev': minor
'@lowdefy/node-utils': minor
'@lowdefy/docs': patch
---

Coding agents now get their Lowdefy tools from `lowdefy mcp`, a stdio MCP server the agent client starts itself, instead of a dev server URL with a port in it. One checked-in `.mcp.json` entry works in every git worktree, the tools are there from the first moment of a session whether or not a dev server is running, and each call reaches the dev server of the app and worktree the agent is working in — pass `directory` when a repository holds several apps or a subagent works in another worktree. Every result starts with the app and checkout it came from.

`lowdefy mcp` acts only on apps in the checkout the agent session started in and in the git worktrees of that repository. A `directory` anywhere else is refused with a message naming the session's checkout; when the agent client supports MCP elicitation, `lowdefy mcp` asks you first instead, and your answer holds for the session.

Agents no longer run `lowdefy dev`, pick ports or kill processes. `lowdefy mcp` starts dev servers through the Lowdefy hub, a small per-user background process whose socket only your user can read and write: it gives each app its own port (4100 and up, kept across restarts), runs the app's own dev script so wrappers such as a secrets manager still apply, reports when the server is ready, and restarts it fully (clearing local plugin code) with `lowdefy_dev_start({ restart: true })`. It only ever stops servers it started — a `lowdefy dev` you run in a terminal is used by agents but never stopped by them. New tools: `lowdefy_dev_start`, `lowdefy_dev_stop`, `lowdefy_dev_status`, `lowdefy_dev_logs` (at most 1000 lines), `lowdefy_dev_list`; new commands: `lowdefy mcp`, `lowdefy hub status|start|stop|logs`. When several `package.json` scripts run `lowdefy dev`, set `cli.devScript` in `lowdefy.yaml` to the one the hub should use.

The hub keeps few servers running, even when agents hand work to helper agents:

- **Idle by last use.** The hub stops a server it started once nobody has used it for 15 minutes (any request through its port, or a build; status polls and long-lived event streams do not count) and no browser tab has it open, or once its worktree is removed. A stopped server starts again on the next `lowdefy_` call.
- **Memory pressure.** When the operating system reports memory pressure (macOS and Linux), the idle limit drops to 5 minutes, or 2 at critical pressure, and a start that would take the hub past four servers first stops the idle ones.
- **Start slots.** At most two dev servers launch at once across the machine (one at critical pressure); the rest queue in order. A start still queued after two minutes answers `queued` with its place, and calling `lowdefy_dev_start` again keeps it.
- **Browser slots.** At most three headless browser operations (journeys, screenshots, state inspections, operator evaluations, state loads) run at once across the machine, whichever way they were called.
- **Agents are told.** The `lowdefy mcp` instructions, and the AGENTS.md and skill that `lowdefy agent-setup` writes, tell an agent to stop the dev server of a git worktree it created when it finishes there, and that a server left running stops after 15 idle minutes.

Rerun `lowdefy agent-setup` to switch a project over: it replaces the `lowdefy-docs` entry (`http://localhost:<port>/lowdefy-docs/mcp`) and other per-port entries such as `lowdefy-3010` in `.mcp.json` with one `lowdefy` server, and updates the skill and `AGENTS.md` section it wrote before. The `--port` option of `agent-setup` is gone; nothing it writes names a port any more.

`lowdefy dev` changes:

- A running dev server records itself in `.lowdefy/instance.json`. A second `lowdefy dev` for the same app exits before it touches `.lowdefy/dev`. A record copied into another git worktree, or left by a killed dev server whose process id has been reused, is ignored. `lowdefy test` runs against an already running dev server.
- A port you set — `--port`, `PORT` or `cli.port` — is used or the command fails. It no longer moves to the next free port and hands you a server on a port you did not expect; only the default port 3000 still does.
- `/lowdefy-docs/*` and `/api/dev-inspect/*` refuse requests a browser makes on behalf of another website, so a page you visit can no longer drive the dev tools (run requests and endpoints, load state checkpoints) on your machine. Agents, curl and the dev app's own pages are unaffected.

Also fixed: CLI error reports were sent to Lowdefy even with `--disable-telemetry` or `cli.disableTelemetry` set. They now respect the opt-out.
