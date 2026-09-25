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

The dev manager (`server-dev/manager/utils/acquireDevInstance.mjs`) creates it exclusively (`wx`) at start-up. It holds `pid`, the real `configDirectory`, `owner` (`hub` or `terminal`), `state` (`starting`, then `ready` once the child answers `/api/ping`), `port`, `internalPort`, `url`, `version` and `startedAt`. It is written with mode `0600` and removed on exit.

`readDevInstance` (`@lowdefy/node-utils`) returns a record only when its `configDirectory` is this directory **and** its pid is alive. The directory check makes a record copied into another git worktree harmless. The record is keyed on the config directory, not the dev directory, so every launch path (CLI, `--dev-directory`, `scripts/dev.mjs`) shares it.

It replaces the old `.lowdefy/dev/.manager.lock`. It is used in four places:

- The manager refuses to start beside another live instance.
- `lowdefy dev` checks it before `getServer`/`installServer`, which could rewrite `.lowdefy/dev` under a running server.
- `lowdefy test` reuses a ready instance instead of starting a second one.
- `lowdefy mcp` and the hub use it to find servers.

### Ports

- An explicit port is strict: `--port`, `PORT` and `cli.port` all fail if the port is taken. The CLI passes `LOWDEFY_SERVER_DEV_STRICT_PORT` to the manager, which binds the port. Only the unrequested default of 3000 moves to the next free port.
- The hub sets `LOWDEFY_DEV_PORT`, which outranks `--port`, because dev scripts often hard-code one. It also sets `LOWDEFY_SERVER_DEV_INTERNAL_PORT` for the Vite child, bound strictly.
- Hub ports come from 4100–4999 in public/internal pairs. They stick to the app's path across restarts, in `registry.json`.

### `lowdefy mcp`

A low-level MCP `Server` over stdio (`createShim.js`). Nothing else may write to stdout, so the command bypasses `runCommand`/`startUp` through `runHubCommand`.

- **Tool list.** It lists five lifecycle tools, plus every dev server tool with an added `directory` argument. The dev tool list is `dist/commands/mcp/devTools.json`, which `packages/cli/scripts/generateDevTools.mjs` generates at CLI build time from `server-dev/lib/docs/devToolDefinitions.js`, through the same `McpServer` the dev server uses. The schemas therefore match exactly and the list exists before any dev server runs. `lowdefy_restart` is hidden; restart is `lowdefy_dev_start({ restart: true })`.
- **Resolution.** `resolveApp.js` takes `directory`, else the session's working directory. It walks up to the checkout root looking for `lowdefy.yaml`, then falls back to the only app under the root, else errors with the list of apps. The app scan (`findApps.js`) skips directories that hold their own `.git` entry, which are nested worktrees.
- **Forwarding.** A ready instance is used as it is, including a terminal-owned one. Anything else goes to the hub (`start`), which waits for `ready`. Calls go through an SDK `Client` cached per instance (`createInstanceConnections.js`). The instance's push stream is relayed as `notifications/message` with the app label added.
- **Results.** Every forwarded result starts with `<app> @ <checkout> · <url>`.

### The hub

`lowdefy hub serve` (`hubServe.js` + `createHub.js`) speaks newline-delimited JSON-RPC over a Unix socket at `~/.lowdefy/hub/hub.sock`, or a named pipe on Windows. The socket falls back to the temp directory when the path is too long. `connectHub` starts the hub detached when none answers.

- **Start.**
  - `resolveDevCommand` picks the app's dev script: `cli.devScript`, else the one `package.json` script containing `lowdefy dev`, else `npx --no-install lowdefy dev`. Several matching scripts is an error, because one is often a production-secrets variant.
  - The hub spawns the script `detached` (its own process group), with the **requesting client's** environment plus `LOWDEFY_DEV_OWNER=hub`, `LOWDEFY_DEV_PORT` and `LOWDEFY_SERVER_DEV_INTERNAL_PORT`.
  - Output goes to `<app>/.lowdefy/dev.log`.
  - A hub-owned manager never opens a browser.
- **Stop.** `stopProcessGroup` sends SIGTERM to the group, then SIGKILL after 5 s; on Windows it runs `taskkill /T /F`. The hub only stops what is in its registry. It never kills by port or name.
- **Pid reuse.** `registry.json` survives crashes and reboots. Each entry records the leader's start time (`ps -o lstart=`). An entry whose pid is alive but whose start time differs is dropped, never signalled.
- **Adoption.** A new hub reads the registry and keeps the live entries. It can stop those servers, but has no exit events for them.
- **Reaping.** Every minute, the hub stops managed servers in two cases:

  - Their directory is gone.
  - No shim is attached, 30 minutes have passed, and `GET /api/dev-inspect` reports no open tabs.

  The hub exits after 10 idle minutes with no servers and no clients.

- **Protocol.** `hello` returns `{ protocol, version, pid }`. On a mismatch, the client errors and asks for the old hub to be stopped; servers survive that and the next hub adopts them.

### Cross-site guard

`src/middleware/localDevToolsOnly.js` applies the existing `createSameOriginGuard({ allowNoOrigin: true })` to `/lowdefy-docs*` and `/api/dev-inspect*`, registered before the MCP route.

- Agents and curl send no `Origin` or `Sec-Fetch-Site` header, so they pass.
- The dev app's own pages are same-origin, so they pass.
- A request a browser makes for another site is refused: a `text/plain` POST to `run-endpoint`, or an image GET.
- DNS rebinding is refused earlier, by Vite's host check.

## Files

| Area            | Files                                                                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instance record | `utils/node-utils/src/{getDevInstancePath,readDevInstance,isPidAlive}.js`, `server-dev/manager/utils/{acquireDevInstance,resolvePorts,waitForServer}.mjs`, `manager/run.mjs` |
| CLI dev         | `cli/src/commands/dev/{checkNoRunningInstance,resolveDevPort,isPortExplicit}.js`                                                                                             |
| Tool contract   | `server-dev/lib/docs/devToolDefinitions.js` (definitions), `createDocsMcpServer.js` (handlers; `registerDevTool` enforces the pairing), `cli/scripts/generateDevTools.mjs`   |
| Shim            | `cli/src/commands/mcp/*`                                                                                                                                                     |
| Hub             | `cli/src/commands/hub/*`, `cli/src/utils/runHubCommand.js`, `cli/src/utils/findDevScripts.js`                                                                                |
| agent-setup     | `cli/src/commands/agentSetup/{resolveMcpCommand,upsertMcpServer,devServerRules}.js`                                                                                          |

## Design

Design and decisions: `lowdefy-design/designs/agent-dev-hub/` (design, evidence, review).
