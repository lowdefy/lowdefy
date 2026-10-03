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

- **Launch.** Agent clients run `npx --prefer-offline --yes lowdefy@<exact version> mcp` (`agentSetup/buildNpxMcpCommand.js`), from a project `.mcp.json` (`lowdefy agent-setup`, pinned to the app's installed version, or the CLI's own when the app has none with `lowdefy mcp`) or from the client's user scope (`lowdefy agent-setup --user`, `agentSetupUser.js`, pinned to the CLI running it). It never runs from the checkout's `node_modules`: a client starts MCP servers once per session, and a fresh worktree with nothing installed would leave the session without tools. An exact version is served from the shared npm cache offline after its first download, and cannot resolve to a stale cached copy the way an unversioned `npx lowdefy` can.
  - **Pin check.** Both modes run the pinned `lowdefy mcp --help` through npx before writing anything (`checkPinnedMcp.js`), which also fills the npm cache. A version npm cannot serve with `lowdefy mcp` (unpublished, workspace-linked like this monorepo's own, or older than the command) is refused: a committed entry that fails would leave every teammate's session without tools.
  - **Contributor override.** Working on the shim or hub from this repository, override the entry for yourself with Claude Code's local scope, which beats project and user scope and is never committed: `claude mcp add --scope local lowdefy -- node <repo>/packages/cli/dist/index.js mcp`. The pin-check refusal prints this command.
  - **One name.** Both entries are named `lowdefy` (`agentSetup/mcpServerNames.js`). Claude Code resolves a name clash local, then project, then user, so a project entry shadows the user one rather than doubling the tools. `agent-setup` renames a `lowdefy-docs` entry in `.mcp.json`, `.claude/settings.json`, the skill and the `AGENTS.md` section, and `--user` removes a `lowdefy-docs` user registration.
  - **User registration.** `--user` runs `claude mcp add --scope user lowdefy -- <command> <args...>`, never JSON on a command line, since cmd.exe strips its quotes on Windows. The user registration is per machine, so on Windows it runs `cmd /c npx ...` (`buildUserMcpCommand.js`); a project entry stays plain `npx`, which Claude Code on native Windows cannot spawn, so Windows contributors add a local-scope entry or use WSL. `claude mcp add` refuses a name that exists, so `--user` first adds the new entry as `lowdefy-agent-setup`, then removes and re-adds `lowdefy`, and only then removes the staging and legacy names: a failed add leaves the old registration (or the staging one) in place, never none. On Windows `claude` runs through cmd.exe, which reports a missing command as an ordinary failure, so it is looked up with `where claude` first; a missing `claude` prints the entry for another client.
- **Tool list.** It lists six lifecycle tools, plus every dev server tool with an added `directory` argument. The dev tool list is `dist/commands/mcp/devTools.json`, which `packages/cli/scripts/generateDevTools.mjs` generates at CLI build time from `server-dev/lib/docs/devToolDefinitions.js`, through the same `McpServer` the dev server uses, so the list exists before any dev server runs. Because the pinned shim version need not be the app's, the shim lists each dev server's tools when it first connects (`learnTools` via `createInstanceConnections`' `onOpen`), adds any it does not know and sends `notifications/tools/list_changed`. The list only grows, since one session can reach several apps. Each held definition remembers the Lowdefy version it came from, the shim's own to start with, and a server newer than that replaces it, so a shared tool's schema and description follow the newest Lowdefy the session has met. A dev server reports its version as its MCP `serverInfo.version` (the manager passes `LOWDEFY_SERVER_DEV_VERSION` to the child); one that reports none, or an invalid one, changes nothing. `isNewerVersion.js` compares two versions only when both are releases or both have the same major: experimental builds are `0.0.0-experimental-<timestamp>`, which semver ranks below every release, so a shim on one would otherwise lose its newer definitions to the first released server it met. Across majors with a prerelease, neither counts as newer and the held definition stays. `lowdefy_restart` is hidden; restart is `lowdefy_dev_start({ restart: true })`, a full process restart when the hub owns the server. Agents are told to restart only when the server seems stuck or build status looks stale, or after secrets a wrapper injects have changed: the manager already rebuilds and restarts the Vite child on a `.env` edit (`envWatcher`) and on local plugin code with server-side types (`pluginSourceWatcher`).
- **Resolution.** `resolveApp.js` takes `directory`, else the session's working directory. It walks up to the checkout root looking for `lowdefy.yaml`, then falls back to the only app under the root, else errors with the list of apps. The app scan (`findApps.js`) skips directories that hold their own `.git` entry, which are nested worktrees.
- **Checkout guard.** Starting a server runs the app's dev script, and the user approved the tools once, for the checkout they opened the session in. `createCheckoutGuard.js` therefore allows an app only when its checkout root is the session's (the git root of the shim's working directory) or one of that repository's worktrees (`git worktree list`, run in the session checkout on each call, since agents add worktrees mid-session; `listSessionCheckouts.js`). Outside git, only the app the session was opened in, or one below it, is allowed: a session opened above several projects does not own them all. A clone inside the session checkout has its own root and is refused. This is a consent gate on the tool path, not a sandbox: an agent with a shell can run any script itself.
  - **Trusted repositories.** Any app in a trusted repository is allowed too. `~/.lowdefy/hub/trusted.json` lists repositories keyed by the real path of their git common directory (`findRepositoryKey.js`): `<clone>/.git` for an ordinary clone, `foo.git` for a bare repository with worktrees beside it, the separate directory of a `--separate-git-dir` clone. Every worktree of a repository shares that directory in every layout git supports, so one entry covers them all. The key is found by reading files, never by running git in a directory the agent chose. A `.git` directory is its own key; a `.git` symlink gives none. A `.git` file names an admin directory: with a `commondir` file it is a linked worktree, counted only when its `gitdir` links back to it (`isLinkedWorktree.js`), and `commondir` names the key; without one the admin directory is itself the key, unless it is named `.git`, since git only shares another checkout's `.git` through a `worktrees/<name>` directory. So a forged `.git` file cannot borrow a trusted repository's key.
  - **Writing trust.** Trust comes only from a person: ticking "Always allow this repository" on the elicitation, or `lowdefy hub trust` (`hubTrust.js`), which refuses without a TTY so an agent's shell tool cannot run it in passing, and refuses a directory outside git. `trustRepository`/`untrustRepository` read, change and write the list under `hub/trusted.lock` (`withStartLock`), so two sessions trusting at once both land; the file is written to a temporary file and renamed, mode `0600`. `lowdefy hub trusted` marks entries whose directory is gone, and `hub untrust <path>` removes one by its path or its `.git` directory. The guard reads the list on every call, so trust added mid-session applies at once.
  - **Asking.** Anything else is put to the user as an MCP form elicitation when the client supports it, with the "always allow" checkbox for a git repository. An accept or decline holds for the session, keyed like the trust list so it covers the repository's other worktrees (a dismissed question is asked again; a declined one is not, so an agent cannot keep asking). A client without elicitation gets a refusal naming the session checkout and `lowdefy hub trust`, and telling the agent not to run it. `lowdefy_dev_list` is not affected: it lists, and runs nothing.
  - **Dependencies.** Before it asks the hub to start an app, the shim runs `checkDependenciesInstalled.js` (as does `lowdefy hub start`). It runs in the shim, not the hub, because the hub may be an older version than the session's CLI (it is shared by every session and started by whichever came first). An app counts as declaring Lowdefy when any `package.json` from its config directory up to its checkout root lists `lowdefy`, so a monorepo that declares it at the root is checked. `node_modules/lowdefy` is looked for from the app up to the checkout root only (`utils/findInstalledCli.js`), so a worktree nested in an installed checkout or a stray `~/node_modules` does not pass. A Yarn Plug'n'Play install (`.pnp.cjs`) and an app that lists no `lowdefy` (its dev script brings its own) are left to run. The refusal names the install command and directory from `hub/findPackageManager.js`: the corepack `packageManager` field first, then the nearest lockfile up to the checkout root, then npm in the app directory. The dev script would otherwise fail in `dev.log`, where the agent does not look.
- **Forwarding.** A ready instance is used as it is, including a terminal-owned one. Anything else goes to the hub (`start`), which waits for `ready`. Calls go through an SDK `Client` cached per instance (`createInstanceConnections.js`). The instance's push stream is relayed as `notifications/message` with the app label added.
- **Results.** Every forwarded result starts with `<app> @ <checkout> · <url>`.

### The hub

`lowdefy hub serve` (`hubServe.js` + `createHub.js`) speaks newline-delimited JSON-RPC over a Unix socket at `~/.lowdefy/hub/hub.sock`, or a named pipe on Windows. The socket falls back to the temp directory when the path is too long. It is bound under umask 077, so only its user can ever connect (`listenHubSocket.js`). `connectHub` refuses a socket another user owns, and starts the hub detached when none answers; a shim shares one connect between parallel tool calls. Hubs that start together against a stale socket take it over under a start lock (`withStartLock.js`, `hub/start.lock`), so exactly one keeps listening.

- **Start.**
  - The hub does not check installs; its clients do (see **Dependencies** above).
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
  - No shim is attached, 30 minutes have passed, and `GET /api/dev-inspect` reports no open tabs.

  The hub exits after 10 idle minutes with no servers and no clients.

- **Timeouts.** The open-tabs check (`fetchOpenTabs`, 5 s), `lowdefy_dev_status`'s build summary (10 s) and the shim's MCP connect to a dev server (15 s) give up on a server that stops answering. A reap pass still running is shared, not started again. A forwarded call is retried once on a new connection only when it never reached the server (an HTTP refusal such as a stale session, or a network error); a timeout or a server error is not retried (`callWithReconnect`).
- **Logs.** `readLogTail` loads only the last MiB of `dev.log` and returns at most 1000 lines.
- **Protocol.** `hello` returns `{ protocol, version, pid }`. Several Lowdefy versions share one hub, so a protocol bump only adds: a hub keeps serving every earlier protocol's methods, and `connectHub` accepts a hub at its own protocol or newer. A client that finds an older hub errors and asks for it to be stopped; servers survive that and the next hub adopts them.

### Cross-site guard

`src/middleware/localDevToolsOnly.js` applies the existing `createSameOriginGuard({ allowNoOrigin: true })` to `/lowdefy-docs*` and `/api/dev-inspect*`, registered before the MCP route.

- Agents and curl send no `Origin` or `Sec-Fetch-Site` header, so they pass.
- The dev app's own pages are same-origin, so they pass.
- A request a browser makes for another site is refused: a `text/plain` POST to `run-endpoint`, or an image GET.
- DNS rebinding is refused earlier, by Vite's host check.

## Files

| Area            | Files                                                                                                                                                                                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instance record | `utils/node-utils/src/{getDevInstancePath,readDevInstance,isPidAlive}.js`, `server-dev/manager/utils/{acquireDevInstance,resolvePorts,waitForServer}.mjs`, `manager/run.mjs`                                                                                    |
| CLI dev         | `cli/src/commands/dev/{checkNoRunningInstance,resolveDevPort,isPortExplicit}.js`                                                                                                                                                                                |
| Tool contract   | `server-dev/lib/docs/devToolDefinitions.js` (definitions), `createDocsMcpServer.js` (handlers; `registerDevTool` enforces the pairing), `cli/scripts/generateDevTools.mjs`                                                                                      |
| Shim            | `cli/src/commands/mcp/*` (checkout guard: `createCheckoutGuard.js`, `listSessionCheckouts.js`, `findRepositoryKey.js`, `isLinkedWorktree.js`, `readGitLink.js`; install check: `checkDependenciesInstalled.js`; tool versions: `isNewerVersion.js`)             |
| Hub             | `cli/src/commands/hub/*` (trust list: `{read,write}TrustedRepositories.js`, `{trust,untrust}Repository.js`, `findRepository.js`, `hub{Trust,Untrust,Trusted}.js`; `findPackageManager.js`), `cli/src/utils/runHubCommand.js`, `cli/src/utils/findDevScripts.js` |
| agent-setup     | `cli/src/commands/agentSetup/{buildNpxMcpCommand,buildUserMcpCommand,checkPinnedMcp,resolveMcpCommand,upsertMcpServer,agentSetupUser,mcpServerNames,devServerRules}.js`                                                                                         |

## Design

Design and decisions: `lowdefy-design/designs/agent-dev-hub/` (design, evidence, review).
