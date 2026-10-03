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

`readDevInstance` (`@lowdefy/node-utils`) returns a record only when its `configDirectory` is this directory **and** its pid is alive and still the process that wrote it: the manager records `processStartTime` (`getProcessStartTime`: `ps -o lstart=` on macOS and Linux, the WMI process creation time through PowerShell on Windows), so a record left by a killed manager never passes for a live one on a reused pid. A start time that cannot be read leaves the pid to decide, and each pid's start time is read at most every 5 s. The directory check makes a record copied into another git worktree harmless. The record is keyed on the config directory, not the dev directory, so every launch path (CLI, `--dev-directory`, `scripts/dev.mjs`) shares it.

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
- **Results.** Every forwarded result starts with `<app> @ <checkout> · <url>`.

### The hub

`lowdefy hub serve` (`hubServe.js` + `createHub.js`) speaks newline-delimited JSON-RPC over a Unix socket at `~/.lowdefy/hub/hub.sock`, or a named pipe on Windows. The socket falls back to the temp directory when the path is too long. It is bound under umask 077, so only its user can ever connect (`listenHubSocket.js`). `connectHub` refuses a socket another user owns, and starts the hub detached when none answers; a shim shares one connect between parallel tool calls. Hubs that start together against a stale socket take it over under a start lock (`withStartLock.js`, `hub/start.lock`), so exactly one keeps listening.

- **Start.**
  - `resolveDevCommand` picks the app's dev script: `cli.devScript`, else the one `package.json` script containing `lowdefy dev`, else `npx --no-install lowdefy dev`. Several matching scripts is an error, because one is often a production-secrets variant.
  - The hub spawns the script `detached` (its own process group), with the **requesting client's** environment plus `LOWDEFY_DEV_OWNER=hub`, `LOWDEFY_DEV_PORT` and `LOWDEFY_SERVER_DEV_INTERNAL_PORT`.
  - Output goes to `<app>/.lowdefy/dev.log`.
  - A hub-owned manager never opens a browser.
- **Stop.** `stopProcessGroup` sends SIGTERM to the group, then SIGKILL after 5 s; on Windows it runs `taskkill /T /F`. The hub only stops what is in its registry. It never kills by port or name.
- **Pid reuse.** `registry.json` survives crashes and reboots. Each entry records the leader's start time (`ps -o lstart=`, run with `LC_ALL=C` and `TZ=UTC` so hubs started from different sessions read the same string; on Windows `Get-CimInstance Win32_Process` `CreationDate`, converted to UTC and printed in round-trip format). An entry whose pid is alive but whose start time differs is dropped, never signalled. An entry written without a start time (a Windows hub before Windows had one) is kept by its pid alone.
- **Adoption.** A new hub reads the registry and keeps the live entries. It can stop those servers, but has no exit events for them.
- **One at a time.** `start` and `stop` decide and act one at a time (waiting for ready does not), so parallel starts of one app share one server and two apps never get the same port pair.
- **Leader exit.** When the group leader exits, the hub stops the rest of its group: a manager killed outright otherwise leaves Vite running on the internal port.
- **Reaping.** Every minute, the hub stops managed servers in two cases:

  - Their app is gone: two reap passes in a row found no `lowdefy.yaml` (a running server recreates `.lowdefy/` after its worktree is deleted, so the directory itself is no signal, and a checkout or rebase can hide the file for one pass). The port pairs of removed apps are released too.
  - No shim is attached, 30 minutes have passed, and `GET /api/dev-inspect` reports no open tabs.

  The hub exits after 10 idle minutes with no servers and no clients.

- **Timeouts.** The open-tabs check (`fetchOpenTabs`, 5 s), `lowdefy_dev_status`'s build summary (10 s) and the shim's MCP connect to a dev server (15 s) give up on a server that stops answering. A reap pass still running is shared, not started again. A forwarded call is retried once on a new connection only when it never reached the server (an HTTP refusal such as a stale session, or a network error); a timeout or a server error is not retried (`callWithReconnect`).
- **Logs.** `readLogTail` loads only the last MiB of `dev.log` and returns at most 1000 lines.
- **Protocol.** `hello` returns `{ protocol, version, pid }`. On a mismatch, the client errors and asks for the old hub to be stopped; servers survive that and the next hub adopts them.

### Servers exit with their owner

Every Lowdefy server process stops when whatever started it stops, however that ends (a normal exit, any signal, SIGKILL). The owner signals are opt-in, set by the spawner, so `node src/index.js` run directly (Docker, Vercel, systemd) behaves as before. `watchOwner` (`@lowdefy/node-utils`) implements both, in the production and e2e servers, the dev manager and the manager's Vite child:

- **`LOWDEFY_EXIT_ON_STDIN_CLOSE=1`.** The spawner holds the process's stdin pipe and never writes to it; the process shuts down when the pipe closes. The CLI (`utils/spawnServer.js`: `lowdefy start|dev|test`) and the monorepo `scripts/start.mjs` and `scripts/dev.mjs` start the server with `node` itself (no `pnpm run start`), hold its stdin and forward SIGINT, SIGTERM and SIGHUP. The dev manager holds its Vite child's stdin the same way. Without the pnpm hop the manager reads its version from its own `package.json` (`readManagerVersion.mjs`).
- **`LOWDEFY_EXIT_WITH_PID=<pid>`** (`--exit-with-pid` on `lowdefy start|dev`). The process polls `process.kill(pid, 0)` every 2 s, re-reads the owner's start time once a minute (`readProcessStartTime`, off the event loop: on Windows each read starts PowerShell), and exits at once if the owner is already gone. An environment variable passes through every wrapper (pnpm, npx, `sh -c`, a secrets manager), where an argument does not. The Playwright configs from `@lowdefy/e2e-utils` and `@lowdefy/block-dev-e2e`, `startServer` from `@lowdefy/e2e-utils/startServer`, and `lowdefy test` set it to their own pid.

### Server registry and prune

Every server and dev manager started through the CLI writes `<LOWDEFY_HOME>/servers/<pid>.json` (`registerServer`) and removes it on exit: `{ pid, processStartTime, kind, cwd, configDirectory, port, owner: { pid, processStartTime, via }, startedAt }`. The owner is the `LOWDEFY_EXIT_WITH_PID` process (`via: exit-with-pid`), else the CLI that spawned it (`via: cli`). The CLI passes the directory as `LOWDEFY_SERVER_REGISTRY_DIR`; a process without it writes nothing. The Vite child does not register.

`readServerRegistry` is the only reader. A record whose pid and start time no longer match a live process is stale: deleted and skipped. A live record is **prunable** only when its owner (pid plus start time) is gone and the record has a start time of its own: without one (the read failed, or a Windows record from before Windows had start times) a reused pid could not be told from the server, so such a record is never pruned. Windows records carry the process creation time, so the registered pass prunes there too; the process-table passes below are macOS and Linux only. It is a different file from `.lowdefy/instance.json`: instance.json is the per-app lock and status, the registry is the machine-wide list of processes and owners, and it survives a deleted worktree.

- `lowdefy hub ps` (`hubPs.js`) lists registered servers with owner and prunable flag, and unregistered servers that match the legacy heuristic.
- `lowdefy hub prune [--kill]` (`hubPrune.js`, `pruneServers.js`) is a dry run unless `--kill`. It re-checks each pid's start time before every signal (a start time that cannot be read is never signalled), sends SIGTERM to the **pid** (never a group: an orphan keeps its dead spawner's group), SIGKILL after 10 s, and removes the record.
- The person-run commands also treat a registered server as prunable when its owner is a live CLI that is itself orphaned (`findOrphanedClis.js`, rules in `selectOrphanedClis.js`): a `pnpm exec` wrapper or harness was SIGKILLed, the CLI survives under the reaper and keeps the server's stdin open. The CLI's ancestors must pass the same wrapper-chain rule as below (`findWrapperChain.js`), and the CLI's process group leader must be gone: a killed spawner leaves its group leaderless, while a launchd or systemd service (or a hub server) keeps a live leader, so a CLI run as a service is never matched. Signalling the server ends the CLI too.
- The legacy heuristic (`findLegacyOrphans.js`, rules in `selectLegacyOrphans.js`) finds servers leaked before servers registered: no record; command `node src/index.js` or `node manager/run.mjs`; cwd ending `/.lowdefy/server` or `/.lowdefy/dev`, or under `/_server/`; every ancestor up to the reaper (PID 1, or `systemd --user` on Linux) a known wrapper (pnpm, `@pnpm/exe`, `npm exec`, npx, `sh -c`, `infisical run`, a lowdefy CLI `start|dev|test`); not under a group leader in the hub's `registry.json`. macOS and Linux only. It cannot tell a dead spawner from `nohup`, so only the person-run commands use it.
- The hub runs one `pruneServers({ kill: true })` pass over registered records when it starts. Its own servers are never prunable: their `lowdefy dev` CLI is their owner and outlives a hub restart.

### Cross-site guard

`src/middleware/localDevToolsOnly.js` applies the existing `createSameOriginGuard({ allowNoOrigin: true })` to `/lowdefy-docs*` and `/api/dev-inspect*`, registered before the MCP route.

- Agents and curl send no `Origin` or `Sec-Fetch-Site` header, so they pass.
- The dev app's own pages are same-origin, so they pass.
- A request a browser makes for another site is refused: a `text/plain` POST to `run-endpoint`, or an image GET.
- DNS rebinding is refused earlier, by Vite's host check.

## Files

| Area            | Files                                                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instance record | `utils/node-utils/src/{getDevInstancePath,readDevInstance,isPidAlive}.js`, `server-dev/manager/utils/{acquireDevInstance,resolvePorts,waitForServer}.mjs`, `manager/run.mjs`                                                          |
| CLI dev         | `cli/src/commands/dev/{checkNoRunningInstance,resolveDevPort,isPortExplicit}.js`                                                                                                                                                      |
| Tool contract   | `server-dev/lib/docs/devToolDefinitions.js` (definitions), `createDocsMcpServer.js` (handlers; `registerDevTool` enforces the pairing), `cli/scripts/generateDevTools.mjs`                                                            |
| Shim            | `cli/src/commands/mcp/*` (checkout guard: `createCheckoutGuard.js`, `listSessionCheckouts.js`)                                                                                                                                        |
| Hub             | `cli/src/commands/hub/*`, `cli/src/utils/runHubCommand.js`, `cli/src/utils/findDevScripts.js`                                                                                                                                         |
| Owner watch     | `utils/node-utils/src/{watchOwner,registerServer,readServerRegistry,isProcessAlive}.js`, `cli/src/utils/{spawnServer,getLowdefyHome,getServerRegistryDirectory}.js`, `scripts/lib/ownedServerEnv.mjs`, `e2e-utils/src/startServer.js` |
| agent-setup     | `cli/src/commands/agentSetup/{resolveMcpCommand,upsertMcpServer,devServerRules}.js`                                                                                                                                                   |

## Design

Design and decisions: `lowdefy-design/designs/agent-dev-hub/` (design, evidence, review).
