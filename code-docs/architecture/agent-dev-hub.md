# Agent Dev Hub

How coding agents reach the right dev server: `lowdefy mcp` (a stdio MCP server per agent session), the Lowdefy hub (a per-user daemon that runs dev servers), and `.lowdefy/instance.json` (each running dev server's record of itself).

## Why

The dev server's MCP endpoint is served over HTTP on the dev server's own port, and agents used to reach it through a checked-in `.mcp.json` URL such as `http://localhost:3000/lowdefy-docs/mcp`. That broke in four ways:

- A port in a checked-in file cannot differ per git worktree, so every worktree's agent talked to the main checkout's server.
- Clients connect to an HTTP MCP server once, at session start. A server that was down then left the session without tools.
- Agents started and stopped dev servers with shell commands. They picked ports by hand, killed processes by port (including the developer's own server), left orphans behind, and could not start a dev script wrapped in a secrets manager.
- `lowdefy dev --port N` quietly moved to another port when N was taken, so an agent read another app's answers.

## Pieces

```
Agent client (Claude Code, Cursor, ...)         one per session
  │ stdio, spawned by the client
  ▼
lowdefy mcp  (packages/cli/src/commands/mcp)    one per session
  │ resolves directory → app → instance
  ├── lifecycle calls ──► hub (~/.lowdefy/hub/hub.sock)       one per user
  │                        └─ spawns the app's dev script as its own process group
  └── dev tool calls ───► http://localhost:<port>/lowdefy-docs/mcp

Discovery, for every reader: <app>/.lowdefy/instance.json
```

### `.lowdefy/instance.json`

The dev manager (`server-dev/manager/utils/acquireDevInstance.mjs`) creates it exclusively (`wx`) at start-up. It holds `pid`, the real `configDirectory`, `owner` (`hub` or `terminal`), `state` (`starting`, then `ready` once the child answers `<basePath>/api/ping`), `port`, `internalPort`, `url`, `version`, `startedAt` and `processStartTime`. `url` is the app's base URL, `http://localhost:<port><basePath>`: the dev server mounts every route under `config.basePath` (the app, `/api/*`, `/lowdefy-docs/*`), so readers append paths to `url` and never rebuild it from `port`. `startServer` rewrites it on every child start, because a config change can edit `basePath`. It is written with mode `0600` and removed on exit.

The manager also records whether the server is in use (`manager/utils/createRequestActivity.mjs`, wired in `run.mjs`):

- `building`: a change is queued or being processed, restarts included (`createBuildActivity`).
- `activeRequests`: requests through the manager's port proxy (`startProxy.mjs`) in flight, counted from receipt until the response finishes or the client goes away. A request held through a child restart stays counted. App routes, page loads, MCP tool calls and `/lowdefy-docs` REST calls all count.
- `lastActivityAt`: when a counted request last started or ended, a build settled, or the server became ready.

Not counted: requests with `x-lowdefy-passive: 1` (`devPassiveHeader` in `@lowdefy/node-utils`; the hub's tab poll and the shim's `lowdefy_dev_status` read send it), a GET whose `Accept` asks for `text/event-stream` (the shim's MCP push stream, a tab's reload stream) and websocket upgrades. Those streams live as long as the server and reconnect on their own, so counting them would keep every server they touch alive. An MCP tool call is a POST that may be answered as an event stream; it counts.

Writes are throttled to one per 5 s with a trailing write, so the final count always lands and the record is never more than 5 s behind. A request that starts while the record last said 0 in flight is written at once.

`readDevInstance` (`@lowdefy/node-utils`) returns a record only when its `configDirectory` is this directory **and** its pid is alive and still the process that wrote it: the manager records `processStartTime` (`getProcessStartTime`, `ps -o lstart=`), so a record left by a killed manager never passes for a live one on a reused pid. A start time `ps` cannot read leaves the pid to decide, and each pid's start time is read at most every 5 s. The directory check makes a record copied into another git worktree harmless. The record is keyed on the config directory, not the dev directory, so every launch path (CLI, `--dev-directory`, `scripts/dev.mjs`) shares it.

It replaces the old `.lowdefy/dev/.manager.lock`. It is used in four places:

- The manager refuses to start beside another live instance.
- `lowdefy dev` checks it before `getServer`/`installServer`, which could rewrite `.lowdefy/dev` under a running server.
- `lowdefy test` reuses a ready instance instead of starting a second one.
- `lowdefy mcp` and the hub use it to find servers.

### Ports

- An explicit port is strict: `--port`, `PORT` and `cli.port` all fail if the port is taken. The CLI passes `LOWDEFY_SERVER_DEV_STRICT_PORT` to the manager, which binds the port. Only the unrequested default of 3000 moves to the next free port.
- The hub sets `LOWDEFY_DEV_PORT`, which outranks `--port`, because dev scripts often hard-code one. It also sets `LOWDEFY_SERVER_DEV_INTERNAL_PORT` for the Vite child, bound strictly. The monorepo's `scripts/dev.mjs` honours `LOWDEFY_DEV_PORT` the same way, so an app in this repository can name a `package.json` script that runs it (for example `node ../../scripts/dev.mjs --config-directory .`) in `cli.devScript` and be run by the hub.
- Hub ports come from 4100–4999 in public/internal pairs. They stick to the app's path across restarts, in `registry.json`, until the app is removed.

### `lowdefy mcp`

A low-level MCP `Server` over stdio (`createShim.js`). Nothing else may write to stdout, so the command bypasses `runCommand`/`startUp` through `runHubCommand`.

- **Tool list.** It lists five lifecycle tools, plus every dev server tool with an added `directory` argument. The dev tool list is `dist/commands/mcp/devTools.json`, which `packages/cli/scripts/generateDevTools.mjs` generates at CLI build time from `server-dev/lib/docs/devToolDefinitions.js`, through the same `McpServer` the dev server uses. The schemas therefore match exactly and the list exists before any dev server runs. `lowdefy_restart` is hidden; restart is `lowdefy_dev_start({ restart: true })`.
- **Resolution.** `resolveApp.js` takes `directory`, else the session's working directory. It walks up to the checkout root looking for `lowdefy.yaml`, then falls back to the only app under the root, else errors with the list of apps. The app scan (`findApps.js`) skips directories that hold their own `.git` entry, which are nested worktrees.
- **Checkout guard.** Starting a server runs the app's dev script, and the user approved the tools once, for the checkout they opened the session in. `createCheckoutGuard.js` therefore allows an app only when its checkout root is the session's (the git root of the shim's working directory) or one of that repository's worktrees (`git worktree list`, run in the session checkout on each call, since agents add worktrees mid-session; `listSessionCheckouts.js`). Outside git, the session directory and anything inside it are allowed. A clone inside the session checkout has its own root and is refused. Anything else is put to the user as an MCP form elicitation when the client supports it; an accept or decline holds for the session (a dismissed question is asked again), and a client without elicitation gets a refusal naming the session checkout. `lowdefy_dev_list` is not affected: it lists, and runs nothing.
- **Forwarding.** A ready instance is used as it is, including a terminal-owned one. Anything else goes to the hub (`start`), which waits for `ready`. Calls go through an SDK `Client` cached per instance (`createInstanceConnections.js`). The instance's push stream is relayed as `notifications/message` with the app label added.
- **Results.** Every forwarded result starts with `<app> @ <checkout> · <url>`. A `lowdefy_dev_start` result also states the idle rule.
- **Stop rule.** The shim's instructions, and the rules `agent-setup` writes into new AGENTS.md files and skills (`devServerRules.js`), tell an agent to call `lowdefy_dev_stop` with the `directory` of a git worktree it created when it finishes there, never to stop a server in a checkout it shares with another agent, and that a server left running stops once it has been idle for 15 minutes. Existing AGENTS.md sections and skills are not rewritten.

### The hub

`lowdefy hub serve` (`hubServe.js` + `createHub.js`) speaks newline-delimited JSON-RPC over a Unix socket at `~/.lowdefy/hub/hub.sock`, or a named pipe on Windows. The socket falls back to the temp directory when the path is too long. It is bound under umask 077, so only its user can ever connect (`listenHubSocket.js`). `connectHub` refuses a socket another user owns, and starts the hub detached when none answers; a shim shares one connect between parallel tool calls. Hubs that start together against a stale socket take it over under a start lock (`withStartLock.js`, `hub/start.lock`), so exactly one keeps listening.

- **Start.**
  - `resolveDevCommand` picks the app's dev script: `cli.devScript`, else the one `package.json` script containing `lowdefy dev`, else `npx --no-install lowdefy dev`. Several matching scripts is an error, because one is often a production-secrets variant.
  - The hub spawns the script `detached` (its own process group), with the **requesting client's** environment plus `LOWDEFY_DEV_OWNER=hub`, `LOWDEFY_DEV_PORT` and `LOWDEFY_SERVER_DEV_INTERNAL_PORT`.
  - Output goes to `<app>/.lowdefy/dev.log`.
  - A hub-owned manager never opens a browser.
- **Stop.** `stopProcessGroup` sends SIGTERM to the group, then SIGKILL after 5 s; on Windows it runs `taskkill /T /F`. The hub only stops what is in its registry. It never kills by port or name.
- **Pid reuse.** `registry.json` survives crashes and reboots. Each entry records the leader's start time (`ps -o lstart=`, run with `LC_ALL=C` and `TZ=UTC` so hubs started from different sessions read the same string). An entry whose pid is alive but whose start time differs is dropped, never signalled.
- **Adoption.** A new hub reads the registry and keeps the live entries. It can stop those servers, but has no exit events for them.
- **One at a time.** `start` and `stop` decide and act one at a time (waiting for ready does not), so parallel starts of one app share one server and two apps never get the same port pair.
- **Leader exit.** When the group leader exits, the hub stops the rest of its group: a manager killed outright otherwise leaves Vite running on the internal port.
- **Reaping.** Every minute, the hub stops managed servers in two cases:

  - Their app is gone: two reap passes in a row found no `lowdefy.yaml` (a running server recreates `.lowdefy/` after its worktree is deleted, so the directory itself is no signal, and a checkout or rebase can hide the file for one pass). The port pairs of removed apps are released too.
  - Nobody has used them for the idle limit: the instance record says `ready`, `building` is false, `activeRequests` is 0, `lastActivityAt` is older than the limit, and `GET /api/dev-inspect` reports no open tabs (a poll that fails counts as none). The limit is 15 minutes, 5 at warn and 2 at critical memory pressure (`IDLE_LIMIT_MS`).

  Whether an agent session is attached does not count. Claude Code subagents share their parent session's one `lowdefy mcp` process, so attachment meant "the parent session is open" and kept a helper's server alive for hours after it finished. A record without `lastActivityAt` comes from an older server-dev; for it the hub keeps the attachment rule: no shim attached, 30 minutes since the last one detached (or since start), no open tabs. The shim keeps calling `attach` for those servers only.

  The hub exits after 10 idle minutes with no servers and no clients.

- **Memory pressure.** `readMemoryPressure.js` reads the OS level on each reap pass and each start: on macOS `sysctl -n kern.memorystatus_vm_pressure_level` (1 normal, 2 warn, 4 critical); on Linux `/proc/pressure/memory` (warn when `some avg10 ≥ 10`, critical when `full avg10 ≥ 10`); anywhere else, or when the read fails, normal. Free memory is not a gauge: macOS keeps it near zero by design. Under pressure the idle limit shortens, and a start that would take the hub past 4 running servers (`SOFT_CAP_SERVERS`) first runs a reap pass, outside `serialize`, so idle servers stop before the new one adds its memory. Nothing is ever refused or stopped on a count.
- **Start slots.** At most 2 servers launch at once across the machine, 1 at critical pressure (`START_SLOTS`, `createStartSlots.js`). Every launch takes one: a first start, `restart: true` and `clean: true`. The slot belongs to the server, held from launch until its record says `ready`, its process group is gone, or 5 minutes pass (`START_SLOT_HOLD_MS`); a timer checks held slots whether or not a caller waits. Apps without a slot queue in order, one place per app directory. `launchUnlessRunning` decides inside `serialize` whether to launch, queue or do nothing, and never waits there, so stops and other starts are never held up by a slot. When a slot frees, the next queued app is launched through `serialize`, unless it was started meanwhile. Stopping a queued app takes it off the queue. A replacement hub counts adopted servers that are still starting as holding slots.

  `start` waits for ready up to 120 s from the request, queue time included. Still queued, it answers `{ state: 'queued', ahead, note }`, the note saying how many starts are ahead and that calling again keeps the place. The shim shows it as a server that is not ready yet. `HUB_PROTOCOL` is unchanged.

- **Timeouts.** The open-tabs check (`fetchOpenTabs`, 5 s), `lowdefy_dev_status`'s build summary (10 s) and the shim's MCP connect to a dev server (15 s) give up on a server that stops answering. A reap pass still running is shared, not started again. A forwarded call is retried once on a new connection only when it never reached the server (an HTTP refusal such as a stale session, or a network error); a timeout or a server error is not retried (`callWithReconnect`).
- **Logs.** `readLogTail` loads only the last MiB of `dev.log` and returns at most 1000 lines.
- **Protocol.** `hello` returns `{ protocol, version, pid }`. On a mismatch, the client errors and asks for the old hub to be stopped; servers survive that and the next hub adopts them.

### Browser slots

At most 3 headless browser operations run at once across the machine, however they were called (the shim, direct HTTP MCP, `lowdefy test`, a terminal dev server). Each operation in `server-dev/lib/docs` that opens Chromium (a journey, a screenshot, an annotated screenshot, a state inspection, an operator evaluation, a state load) runs inside `withBrowserSlot.js`. A slot covers the whole operation, every journey actor included: a bound per page would deadlock a journey with more actors than slots. The operation's own timeouts start once the slot is taken; a wait longer than 5 minutes is answered as the operation's error.

Slots are lock files `<LOWDEFY_HOME>/slots/browser/<n>` (`acquireMachineSlot` in `@lowdefy/node-utils`), written aside and linked into place so a reader never sees half a file. Each holds the dev server's pid and process start time, so a slot whose process is gone, or whose pid now belongs to another process, is reclaimed: a killed server never keeps one. `release` removes only a file that still holds its own token. A dev server on an older server-dev takes no slot.

### Cross-site guard

`src/middleware/localDevToolsOnly.js` applies the existing `createSameOriginGuard({ allowNoOrigin: true })` to `/lowdefy-docs*` and `/api/dev-inspect*`, registered before the MCP route.

- Agents and curl send no `Origin` or `Sec-Fetch-Site` header, so they pass.
- The dev app's own pages are same-origin, so they pass.
- A request a browser makes for another site is refused: a `text/plain` POST to `run-endpoint`, or an image GET.
- DNS rebinding is refused earlier, by Vite's host check.

## Files

| Area            | Files                                                                                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instance record | `utils/node-utils/src/{getDevInstancePath,readDevInstance,isPidAlive,devPassiveHeader}.js`, `server-dev/manager/utils/{acquireDevInstance,createRequestActivity,resolvePorts,waitForServer}.mjs`, `manager/processes/startProxy.mjs`, `manager/run.mjs` |
| Browser slots   | `utils/node-utils/src/{acquireMachineSlot,getLowdefyHome}.js`, `server-dev/lib/docs/withBrowserSlot.js`                                                                                                                                                 |
| CLI dev         | `cli/src/commands/dev/{checkNoRunningInstance,resolveDevPort,isPortExplicit}.js`                                                                                                                                                                        |
| Tool contract   | `server-dev/lib/docs/devToolDefinitions.js` (definitions), `createDocsMcpServer.js` (handlers; `registerDevTool` enforces the pairing), `cli/scripts/generateDevTools.mjs`                                                                              |
| Shim            | `cli/src/commands/mcp/*` (checkout guard: `createCheckoutGuard.js`, `listSessionCheckouts.js`)                                                                                                                                                          |
| Hub             | `cli/src/commands/hub/*` (idle reaping in `createHub.js`, `readMemoryPressure.js`, `createStartSlots.js`), `cli/src/utils/runHubCommand.js`, `cli/src/utils/findDevScripts.js`                                                                          |
| agent-setup     | `cli/src/commands/agentSetup/{resolveMcpCommand,upsertMcpServer,devServerRules}.js`                                                                                                                                                                     |

## Design

Design and decisions: `lowdefy-design/designs/agent-dev-hub/` (design, evidence, review).
