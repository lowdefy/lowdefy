# Docs for AI Agents

When you run `lowdefy dev`, the development server also serves a documentation API and an [MCP](https://modelcontextprotocol.io) endpoint built for AI coding agents. It describes everything installed in _your_ project — every block, operator, action, connection and request type from core Lowdefy plugins _and_ your own local plugins — plus the full Lowdefy documentation as markdown. This means an agent like Claude Code never has to guess type names or property shapes: it can look up the exact schema, real examples, and the relevant docs page while it writes your config.

Everything is served under the `/lowdefy-docs` path of your dev server. It is always on in dev, and never part of your production server. When your app sets `config.basePath`, the dev server serves these routes under the base path too, like the rest of the app: with `basePath: /app` they live at `/app/lowdefy-docs`. `lowdefy mcp` finds the right address by itself.

> The `/lowdefy-docs` route prefix is reserved by the dev server. A page with `id: lowdefy-docs` will not be reachable in dev.

## Connect your agent: `lowdefy mcp`

Run `npx lowdefy@<app version> agent-setup` once in your project (see _Setting up a project_ below). It registers the `lowdefy` MCP server in `.mcp.json`, pinned to the version of the CLI that ran it:

```json
{
  "mcpServers": {
    "lowdefy": {
      "type": "stdio",
      "command": "npx",
      "args": ["--prefer-offline", "--yes", "lowdefy@7.1.0", "mcp"]
    }
  }
}
```

Your agent client starts `lowdefy mcp` itself at the start of each session, so the tools are always there — whether or not a dev server is running yet. Nothing in the entry names a port or a `node_modules` path, so the same checked-in file works in every git worktree, including a fresh one nobody has installed yet: npx keeps the pinned version in the shared npm cache and starts it offline in under a second after the first download.

Before it writes the entry, `agent-setup` runs the pinned version's `lowdefy mcp` through npx. A version npm cannot serve — one that is not published, or one from before `lowdefy mcp` — is refused and `.mcp.json` is left as it was, because the file is committed and an entry that fails would leave every teammate's session without tools. To run your own build of the CLI instead, override the entry for yourself only with Claude Code's local scope, which wins over the project and user entries and is never committed: `claude mcp add --scope local lowdefy -- node <path to lowdefy>/dist/index.js mcp`. The refusal prints this command.

On native Windows, Claude Code cannot start the plain `npx` command a project entry uses. Add a local-scope entry that runs it through `cmd /c` (`claude mcp add --scope local lowdefy -- cmd /c npx --prefer-offline --yes lowdefy@<version> mcp`), use `agent-setup --user` (below), or work in WSL.

### Every project at once: `agent-setup --user`

If you work across several projects, register `lowdefy mcp` once for your user instead:

```bash
npx lowdefy agent-setup --user
```

This adds the same `lowdefy` server to Claude Code's user scope (`claude mcp add --scope user lowdefy -- npx --prefer-offline --yes lowdefy@<version> mcp`), pinned to the version of the CLI you run it with, so every session has the Lowdefy tools — in a repository nobody set up, in a directory above several projects, anywhere. It needs no app. It runs that version's `lowdefy mcp` through npx first, which downloads it into the npm cache so the first session does not wait, and refuses a version npm cannot serve. The version must be a published one that has `lowdefy mcp`; until Lowdefy 7 is released, run `npx lowdefy@experimental agent-setup --user`.

- On Windows it registers `cmd /c npx ...`, since Claude Code cannot start `npx` there without a shell.
- Without Claude Code on your `PATH` it prints the entry to add to your agent client's user configuration.
- Rerun it to move to another version. It replaces the `lowdefy` registration, and an old `lowdefy-docs` one. If Claude Code fails to add the new entry, your existing registration stays in place and the error prints the commands to finish by hand.
- A project whose `.mcp.json` defines `lowdefy` uses its own entry instead, so a session never has two sets of Lowdefy tools.

### Projects on different Lowdefy versions

One session can work with dev servers of several Lowdefy versions, through a `lowdefy mcp` pinned to yet another. When `lowdefy mcp` connects to a dev server, it reads that server's tools: tools it does not know are added to the session's tool list, and a tool both have takes its description and input schema from whichever of the two Lowdefy versions is newer. So each tool follows the newest Lowdefy version the session has met, and the client is told to list the tools again. Tools are never removed during a session, since the session may still use the older app. When `lowdefy mcp` and a dev server run different versions, calls go to the dev server's own tools, and the first result from it carries a note naming both versions and how to match them; a call that fails carries the note every time.

Versions are compared only when both are releases, or both have the same major version. An experimental build (`0.0.0-experimental-...`) is not compared with a release of another major, so neither replaces the other's tools.

`lowdefy mcp` sends each tool call to the dev server of the app and checkout the agent is working in:

- **It works out the app** from the session's working directory. Every tool also takes an optional `directory` argument — pass it when the repository holds several apps, or when an agent works in a different git worktree from the session (a subagent in its own worktree, for example).
- **It acts on the session's checkout, its git worktrees, and repositories you trust.** Starting a dev server runs the app's `package.json` dev script, so an app outside the checkout the session started in (and outside `git worktree list` of that repository) needs your approval — an agent must not run the scripts of a repository it just cloned without you seeing it. See [Working across projects](#working-across-projects).
- **It tells the agent what to install.** A fresh git worktree has no `node_modules`. When a `package.json` in the app's checkout lists `lowdefy` (in the app directory, or at a monorepo's root) but no `node_modules` from the app up to the checkout root has it, `lowdefy_dev_start` answers with the install command and where to run it, instead of starting a dev script that would fail in a log the agent does not read; the agent runs it and starts again. The command follows the repository: the `packageManager` field in `package.json` first, then the nearest lockfile (`pnpm-lock.yaml`, `yarn.lock`, `bun.lock`, `package-lock.json`, ...), for example `pnpm install` at the workspace root, else `npm install` in the app directory. It looks no higher than the checkout root, so a worktree created inside an installed checkout still counts as not installed. A Yarn Plug'n'Play install, and an app whose dev script brings its own Lowdefy (no `package.json` lists `lowdefy`), are left to run.
- **It starts the dev server when needed**, through the [Lowdefy hub](/cli#hub): a small per-user background process that gives each app its own port, runs the app's own dev script (so a secrets-manager wrapper still applies — set `cli.devScript` if several scripts run `lowdefy dev`), and stops servers nobody uses. A dev server you started yourself with `lowdefy dev` is used as it is, and never stopped by an agent.
- **Every result starts with the app and checkout it came from**, for example `apps/main @ app-wt-invoices · http://localhost:4102`, so an agent never mistakes another worktree's answer for its own.

Agents manage the dev server with these tools, and never run `lowdefy dev`, choose ports, or kill processes themselves:

| Tool                 | Purpose                                                                                                                                                                                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lowdefy_dev_start`  | Start the app's dev server (or return the running one) and wait until it is ready. `restart: true` when it seems stuck, or after secrets a wrapper injects have changed (`.env` and local plugin code need none); `clean: true` also deletes the build directory |
| `lowdefy_dev_stop`   | Stop the app's dev server if the hub started it                                                                                                                                                                                                                  |
| `lowdefy_dev_status` | Owner, state, URL and build status, without starting anything                                                                                                                                                                                                    |
| `lowdefy_dev_logs`   | Recent output of a hub-started dev server, optionally filtered                                                                                                                                                                                                   |
| `lowdefy_run_tests`  | Run the app's journeys against its dev server, as `lowdefy test` does: all of them, a folder or glob (`paths`), or a tagged section (`tags`), narrowed by name with `filter`. Returns each result as data                                                        |
| `lowdefy_dev_list`   | Dev servers across the checkout's apps and other checkouts                                                                                                                                                                                                       |

The dev server itself also serves the MCP endpoint over streamable HTTP at `/lowdefy-docs/mcp`, for clients that connect by URL. Through `lowdefy mcp`, restart is `lowdefy_dev_start` with `restart: true` rather than `lowdefy_restart`.

The `/lowdefy-docs` tools accept requests from agents and tools on your machine and from the dev app's own pages; a request a browser makes on behalf of another website is refused.

## Tool usage log

`lowdefy mcp` appends one line per tool call to `~/.lowdefy/tool-calls.jsonl` (under `LOWDEFY_HOME` when that is set): `{ "tool", "app", "ts", "ms", "ok" }`. It records the lifecycle tools and every forwarded dev tool, across all your projects and worktrees, in one file. It holds no arguments and no results, never leaves your machine, and rolls over at 1 MB, keeping one old file as `tool-calls.jsonl.1`. Count calls per tool from it to see which tools your agents use.

## Working across projects

A session can start and query the dev servers of several projects side by side — say, an app and the shared plugin repository it uses. Pass each call the `directory` of the app it is for. Without anything set up, `lowdefy mcp` allows apps in the session's own checkout and its git worktrees; for any other app it asks you first.

- **When the client can ask** (MCP elicitation), `lowdefy mcp` asks whether to allow that app's git repository. Allowing it holds for the rest of the session, for every worktree of that repository. Tick **Always allow this repository** to trust it in every session from then on. Declining also holds for the session, so an agent cannot keep asking.
- **Ahead of time, or when the client cannot ask**, run `lowdefy hub trust <directory>` yourself, in your own terminal. It refuses to run without an interactive terminal, so an agent cannot trust a repository in passing; the refusal an agent gets tells it to ask you. To work on two projects side by side, trust each once, and any session can start and query both.
- **Trust is per git repository**, and covers all of its worktrees, wherever they are. `lowdefy hub trusted` lists each trusted repository by its git directory (for example `/home/me/code/crm/.git`, or `crm.git` for a bare repository) and marks entries whose directory is gone (`(missing)`); `lowdefy hub untrust <path>` removes one, including a missing one by its old path. The list lives in `~/.lowdefy/hub/trusted.json`, readable only by you.
- **An app outside git cannot be trusted.** It is allowed for a session started in it or in a directory inside it, or for one session when you answer the question. A session started in a directory above several projects does not get all of them.

This is a consent check on the tools, not a sandbox: an agent that can run shell commands can run any script without `lowdefy mcp`.

## The tools

The dev server provides these tools:

| Tool                      | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lowdefy_list_types`      | List ALL available types of a kind (blocks, operators, actions, connections, requests); `target: "mobile"` lists the blocks, actions and client operators a native shell carries, for mobile pages                                                                                                                                                                                                                                                                                     |
| `lowdefy_get_schema`      | JSON Schema for a specific type — all properties and events                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `lowdefy_get_examples`    | Real YAML usage examples for a block type                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `lowdefy_get_doc`         | A docs page as markdown, by slug or by type name: a Lowdefy docs page, or a page this app's own plugins and modules ship                                                                                                                                                                                                                                                                                                                                                               |
| `lowdefy_search_docs`     | Search the Lowdefy docs and this app's plugin and module docs. Pages are ranked by how many query words match, title matches first; each hit names its source (`core`, `plugin`, `local-plugin` or `module`), package and version, and `source` narrows the search                                                                                                                                                                                                                     |
| `lowdefy_search_icons`    | Search icon names: semantic names first, then Lucide names, then the names of installed icon sets (qualified). Never invent an icon name                                                                                                                                                                                                                                                                                                                                               |
| `lowdefy_build_status`    | Current build errors and warnings (with source file locations) plus recent runtime errors from browsers and phones (`surface: "web"` or `"mobile"`) — call after every edit                                                                                                                                                                                                                                                                                                            |
| `lowdefy_check`           | Validate the whole app as `lowdefy build` would, without building — every page, and the prod-only checks dev shows as warnings come back as errors. Call before calling a change done                                                                                                                                                                                                                                                                                                  |
| `lowdefy_get_page_config` | The fully built config for a page, or its structured build errors                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `lowdefy_screenshot_page` | PNG screenshot of a rendered page (headless Chromium) for visual verification; `width`, `height` and `colorScheme: "dark"` check a phone layout or dark mode; `urlQuery` opens it at a query string; `pathParams` opens an instance of a page whose [`path`](/page-paths) has placeholders; `steps` (`{"open": "blockId"}`, `click`, `fill`, `select`, `wait`, …) run first so the capture shows an open dropdown, calendar or modal; `device` captures a phone in Lowdefy Dev instead |
| `lowdefy_run_journey`     | Drive a page headless through declarative steps (`click`, `fill`, `goto`, `email`, `as`, `expect`, …) and assert state, visibility, text, url, title or email — verify behaviour, not just layout; `device` runs it on a phone                                                                                                                                                                                                                                                         |
| `lowdefy_journey_session` | The recorded dev sessions, or one as a log (one line per interaction with what the app did, e.g. `click save → Validate failed [priority]`), to write journeys from                                                                                                                                                                                                                                                                                                                    |
| `lowdefy_find_config`     | Which yaml file (and line) defines a given page, block, or request id                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `lowdefy_app_map`         | The whole-app graph: every page, menu, connection, endpoint, and agent in one call                                                                                                                                                                                                                                                                                                                                                                                                     |
| `lowdefy_inspect_state`   | The LIVE state, request results, and event log of a running page — reads your open browser tab, or runs the page headless; `device` reads a phone (`expression` evaluates an operator expression against that state instead)                                                                                                                                                                                                                                                           |
| `lowdefy_run_request`     | Execute a request with a test payload, as a given `user`, to verify data shape (read-only unless opted in)                                                                                                                                                                                                                                                                                                                                                                             |
| `lowdefy_run_endpoint`    | Execute an Api endpoint routine with a test payload, as a given `user` or as a system context (`system: true`), to see what it returns, rejects or throws (needs `allowWriteRequests`; a `:reject` comes back as data)                                                                                                                                                                                                                                                                 |
| `lowdefy_device`          | Phones in Lowdefy Dev: `list` the connected phones (each tab id is the `device` the other tools take) and the booted simulators and Android devices, `start` Lowdefy Dev on a simulator or emulator, `inject` a phone's next scan, photo, NFC read, dictated transcript, location, permission answer, push or network state                                                                                                                                                            |
| `lowdefy_restart`         | Restart the dev server process — after editing a local plugin's server-side code, or when `build_status` looks stale. Then call `lowdefy_build_status` with `wait: true`, which answers once the server is back                                                                                                                                                                                                                                                                        |

## Hazards — what the schema cannot tell you

A hazard is a behaviour of a type that its schema does not show, but that an agent must know before writing config: the `Html` block sanitises its content, so a `<style>` tag is stripped; closing a `Modal` keeps the state of the blocks inside it, while `visible: false` prunes it; `_state` inside a request's `properties` is always `undefined`; a `_ref` to a `.njk` file renders at build time. Each hazard is `{ id, message, see }` — a stable kebab-case `id`, one or two sentences saying what happens and what to do instead, and a docs slug (or `null`) for `lowdefy_get_doc`.

`lowdefy_get_schema`, `lowdefy_get_doc` (when looked up by kind and type) and `lowdefy_find_config` (per match) return `hazards` alongside their normal result — `lowdefy_get_doc` appends them as a `## Hazards` section of the markdown. Some hazards are contextual: `tenant-wall-lookup` is only returned for a request whose connection is tenant-walled, so `find_config` on that request explains the wall's `$lookup` injection while the same request over a `tenant: shared` connection stays quiet.

Hazards come from two places. Framework-level hazards ship with `@lowdefy/docs-content` (`hazards.json`). Type-attached hazards are declared by the plugin: a block sets `meta.hazards`, a request sets `meta.hazards` on the request function, and an operator package exports a `./metas` module with `{ hazards }` per operator — see [Plugins](/plugins-introduction). Local plugins in your project use the same channel, so your own blocks can warn an agent about their own surprises.

## Open code — Option/Alt+click jumps to the yaml

Hold **Option** (macOS) or **Alt** (Windows/Linux) and click any element in your running dev app to open the yaml that defines its block in VS Code, at the exact line. While the modifier is held, the block under the cursor shows a blue highlight with its blockId — and the cursor becomes a pointer, so you see exactly what a click will open. The dev server resolves the clicked element to its block and looks up the config source of its block — blocks inside lists resolve to the item block that defines them (runtime array indices fold back to the config's `$` placeholder), other runtime-generated blocks resolve to their nearest configured ancestor, and blocks defined in modules open the module file that defines them. Plain clicks, Option/Alt+clicks outside any block, and Cmd/Ctrl+clicks (the browser's open-in-new-tab) keep their normal behaviour. Dev server only.

## The feedback loop

The dev server rebuilds automatically when config changes, so an agent works in a tight loop:

1. Discover types and schemas, write or edit YAML.
2. Call `lowdefy_build_status` with `wait: true` (`GET /lowdefy-docs/build-status?wait=true`) — it answers once the dev server has processed your edit, rather than with the build before it. That includes a server restart or plugin install the edit needs (a new connection type, a new plugin package, a `.env` change), so the next call reaches a ready server. Did the build succeed? Errors come back with the exact source file and location. A build that fails with an internal error carries its message, stack and the config file it was resolving.
3. Pages are built when they are first requested, after the config build. `build.status` covers both: it is `ok` when the config builds and no page failed its latest build, `pages_failed` when the config builds but a page failed its latest build and has not changed since (`build.failedPages` names those pages), and `error` when the config build fails. A failed page changed since its last build is not counted until it is rebuilt, since its failure may already be fixed: it is listed under `pages.changedSinceBuild`, and `wait: true` rebuilds it. `build.configStatus` is the config build's own status, whatever the pages do. With `wait: true`, build status also builds every page your edit touched (a page whose files changed since its last build, a page built before the latest config build, or a page file changed since the dev server started) and reports under `pages`: `checked` lists the pages it built, `failed` the errors of each page whose last build failed, `changedSinceBuild` pages changed on disk that the dev server has not rebuilt yet, and `unbuilt` how many pages nothing has built since the dev server started. `lowdefy_check` validates every page.
4. Call `lowdefy_get_page_config` to confirm the page builds, and `lowdefy_screenshot_page` to see it rendered.
5. Runtime errors from the browser (operator errors, block render errors) also appear in `lowdefy_build_status` under `clientErrors`, so problems that only show at runtime still reach the agent.
6. Server-side failures appear beside them under `serverErrors` — a request whose database filter is malformed, an endpoint step that throws, an MCP tool call or an agent tool call that fails — each with the yaml `source` (`file:line`) and `config` path that produced it, plus the `endpointId`, `requestId` and `pageId` where known. The store holds the last 50 errors and is cleared on dev server restart.
7. Each browser and server error carries the `buildId` it happened under: the time of the latest config build or page edit. Errors from before the current build are listed apart under `earlierErrors`, since they may already be fixed; `clientErrors` and `serverErrors` hold only errors under the current build.

### Events are pushed — no need to poll

The dev server pushes what changed instead of waiting to be asked. Two channels carry the same events:

- **MCP clients** receive them as `notifications/message` from logger `lowdefy` on the standalone GET stream of `/lowdefy-docs/mcp` (the server declares the `logging` capability, so any MCP client surfaces them). Failed builds arrive at level `error`, everything else at `info`.
- **Everything else** uses `GET /lowdefy-docs/events`, a Server-Sent Events stream — `curl -N http://localhost:3000/lowdefy-docs/events` — with one frame per event, named by the event type.

Every event carries `type` and an ISO `timestamp`. The four types:

| Type           | When                                                            | Carries                                                                                                               |
| -------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `restart`      | First event on every connection                                 | `bootedAt` — the dev server process start time, so a reconnecting client can tell a restart from a dropped connection |
| `build`        | Every time a rebuild finishes, success or failure               | `status`, `errorCount`, `warningCount`, `errors`, `warnings`, and `stale` / `staleSince` (see below)                  |
| `client_error` | A browser reports a runtime error                               | The same entry `lowdefy_build_status` lists under `clientErrors`                                                      |
| `server_error` | A request, endpoint, MCP tool or agent tool fails on the server | The same entry `lowdefy_build_status` lists under `serverErrors`                                                      |

Events are not buffered: a client that connects after an event missed it, and should call `lowdefy_build_status` — which is derived from the same `build/buildStatus.json`, plus the page builds — for the current picture. A `build` event reports the config build only, so its `status` is never `pages_failed`. Act on a `build` event with `status: "error"` immediately; `lowdefy_build_status` remains the full report.

### When a build fails, answers are marked stale

A failed rebuild does not take the dev server down — it keeps serving the last build that succeeded, so you can carry on looking at the app while you fix the error. That means every tool can keep answering from a build that predates the latest edits, which is a trap for an agent.

So while the last build is failing, every answer says so:

- MCP tool results start with a `STALE: ...` text item.
- JSON responses from `/lowdefy-docs` carry `stale: true`, `staleSince` and `staleReason`.
- Markdown responses are prefixed with a `> STALE: ...` banner.
- Every `/lowdefy-docs` response carries the `X-Lowdefy-Stale` and `X-Lowdefy-Stale-Since` headers.

Nothing is refused — the last-known-good schema or page config is often exactly what you need while fixing the build. The flag disappears as soon as a build succeeds. Call `lowdefy_build_status` (or `GET /lowdefy-docs/build-status`) for the errors.

Some build warnings are only warnings in `lowdefy dev` — they fail `lowdefy build`. Those carry `"prodError": true` in `lowdefy_build_status`, are printed in the dev terminal as `[ConfigWarning · fails in prod] …`, and are badged **fails in prod** on a dark-orange bar in the browser error bar. Treat them as errors: the production build will not pass until they are fixed.

### Agent instructions are checked, and said once

`lowdefy agent-setup` writes Lowdefy's guidance for coding agents as a marked block in `AGENTS.md` (or `CLAUDE.md`), stamped with the Lowdefy version that wrote it. The dev server checks that block and reports what it finds under `agentFiles` in `lowdefy_build_status`, as `{ code, message }` notices, never among the build's warnings:

| `code`                  | When                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `version_mismatch`      | The block comes from a different Lowdefy minor version than `lowdefy.yaml` (a patch difference is fine) |
| `claude_import_missing` | The block is in `AGENTS.md`, but the root `CLAUDE.md` is missing or has no `@AGENTS.md` line            |
| `block_missing`         | No block, but `.mcp.json` registers the `lowdefy` server, so the project set up agents                  |

The check reads the nearest `AGENTS.md` or `CLAUDE.md` holding the block, from the app folder up to the git root, and runs on every read, so a fix shows at once. It never changes a file. Apps on `lowdefy: local` get no version or missing-block notice. The dev server also prints the notices once when it starts.

`lowdefy mcp` passes each notice on once per agent session for each app, and again only if its text changes; later build-status results in that session leave `agentFiles` out. `GET /lowdefy-docs/build-status` reports it on every read. Each notice tells the agent to tell you rather than fix it: the fix (`npx lowdefy@<app version> agent-setup`) rewrites committed files on whatever branch is open, and in a repository whose apps pin different Lowdefy versions only you know which version the files should follow.

## Live state — the agent sees what you see

When you have a page open in your browser, the agent can read its **actual live state** — page state, request results, and the event log of recent actions — via `lowdefy_inspect_state`. Reproduce a problem by clicking through the app, then ask the agent to look: it inspects your exact tab, not a guess. Pass `expression` (like `{"_state": "customer.name"}`) and the same tool evaluates that operator expression against the live context instead, returning `{ value, errors, source, reads }`, where `reads` names the state, request and other paths the expression read — so `_state`/`_request` binding bugs get debugged against real data. With no tab open, it runs the page headless instead.

## Pages with path parameters

A page whose [`path`](/page-paths) has placeholders, such as `tickets/{space}/{ticket_id}`, has one instance per set of values, each with its own state and requests. `lowdefy_app_map` shows each page's `path`. The tools that open or read a page take `pathParams`, an object with one value per placeholder, next to `pageId` and `urlQuery`:

```json
{ "pageId": "ticket", "pathParams": { "space": "support", "ticket_id": "1234" } }
```

- **Headless** (`lowdefy_screenshot_page`, `lowdefy_inspect_state`, `lowdefy_run_journey`): `pathParams` is required to open a page that has placeholders. A missing placeholder is an error that names it, returned before a browser opens.
- **Your open tab** (`lowdefy_inspect_state`): with `pathParams`, the tool reads that instance. With only a `pageId`, it reads the instance your tab shows for that page, or the instance of that page most recently shown when no tab is on it.

A headless capture waits for the page's full async lifecycle before it reads anything: `onInit`, `onInitAsync`, `onMount` and `onMountAsync`, every in-flight request, and the first message on each websocket subscription. A page whose data arrives through an `onMountAsync` `Request` action is therefore captured with its data, not empty. If a page has not settled within 15 seconds the result is still returned, carrying `ready: false` and a note — read that result as a snapshot of a page that was still loading, not as the page's settled state. One case escapes the wait: an event with a `debounce` is not yet marked loading during its delay, so a debounced `onMountAsync` can be captured before it runs.

## Auth-protected pages

The headless renderer behind `lowdefy_screenshot_page` and `lowdefy_inspect_state` authenticates as a signed-in user, so pages with `auth.public: false` render for the agent instead of bouncing to the sign-in page. That default user carries **no roles**, so a page or request gated on a role still comes back refused or empty.

To act as a specific caller, pass `user` — every tool that renders a page headless accepts it (`lowdefy_screenshot_page`, `lowdefy_run_journey`, `lowdefy_inspect_state`), as do `lowdefy_run_request` and `lowdefy_run_endpoint`:

```json
{ "pageId": "users", "user": { "roles": ["admin"] } }
```

It is merged over the default user, so `{"roles": [...]}` is usually all you need. No auth engine runs for an injected caller, so nothing derives the rest of the record — include `email`, `profile` or `attributes` in the object if the page reads them. Every call opens its own browser context, so one call can act as an admin and the next as a plain member.

Every one of these tools takes `user` in the same three forms:

- a user object, as above;
- `"none"`: no injected caller, so the call runs signed out and the app's own auth decides what it sees;
- the name of a user in a [journey data set](/journey-data-sets), together with `data`, the data set's name. The call then acts as that user and runs on a fresh database of its own loaded with the data set, exactly as a journey with `data` does, so it never touches the app's real data:

```json
{ "pageId": "tickets", "user": "member", "data": "crm" }
```

A data set user name without `data` is refused, as are a data set while a dev mock user is active and `"none"` on a data set while auth is configured. `lowdefy_run_endpoint` also takes `system: true`, which cannot be combined with `user`.

`user` applies to the headless renderer only — it is never applied to a page you open in your own browser, which carries your real session and cannot be re-identified. `lowdefy_inspect_state` normally prefers your open tab, so passing `user` selects the headless source instead; combining it with `source: "tab"` is an error rather than a silently ignored role.

To bypass login for the whole dev server — your own browser included — start it with a mock user instead: `lowdefy dev --mock-user '{"id":"dev","roles":["admin"]}'` (or configure `auth.dev.mockUser`). See [Auth Configuration](/auth-configuration#mock-user-for-testing-dev-server-only).

## Running requests safely

`lowdefy_run_request` executes a request with a test payload so the agent can verify the data shape a page will receive. Read-only request types (like `MongoDBFind`) always run. The page is built first when it changed since its last build, so the request that runs is the one in the config now; a page that fails to build answers `refused: true` with its `buildErrors`.

A response over 40,000 serialized characters is not returned inline: it is written in full to a JSON file under `.lowdefy/responses/` in the app directory, and the result carries `responseFile` (its path), `responseChars` and, for an array, `responseItems`. Pass `saveResponse: true` to always write the response there. `lowdefy_run_endpoint` does the same. Only the 20 most recent response files are kept.

Pass `user` to run the request as a specific caller — `{ "pageId": "users", "requestId": "get_users", "user": { "roles": ["admin"] } }`. Without `user` the request runs as a roleless anonymous caller, so a tenant-walled or role-gated request returns empty rows rather than an error. Impersonation never unlocks writes: the write gate below applies to every caller. Write requests are refused unless you opt in:

```yaml
cli:
  agentTools:
    allowWriteRequests: true
```

## Running endpoints

`lowdefy_run_endpoint` executes an `Api` endpoint routine headlessly with a test payload, so the agent can verify what a routine returns, rejects or throws without clicking through the page that calls it:

```json
{ "endpointId": "create_order", "payload": { "sku": "A1" }, "user": { "roles": ["admin"] } }
```

Endpoints are not classified read-only — a routine has no `checkWrite` meta, and a single routine can read, write, call other endpoints and send notifications — so running one always requires the same `cli.agentTools.allowWriteRequests: true` opt-in as write requests. Without it the tool answers `refused: true` with the reason and how to enable it, and nothing runs.

The result is the same `{ error, response, status, success }` object the HTTP endpoint route returns. A `:reject` or `:throw` in the routine is not a tool failure: it comes back as `success: false` with `status: "reject"` or `"error"` and the routine's own `error`, so the agent can assert on the shape it designed. `InternalApi` endpoints are refused with the same message HTTP callers get, an unknown `endpointId` answers `refused: true`, and faults that escape the routine (an auth refusal, a missing connection) come back as `error: { name, message, source, configKey }`. Only malformed input — a missing `endpointId`, or a `user` or `data` the call cannot act as — is a `400`.

Scheduled and detached-only endpoints are `InternalApi` by design, so a plain run refuses them. Pass `system: true` to run the routine as a system context instead — the same code path `/api/cron` and `/api/detached` use: no session, no user (`_user` is `undefined`), the endpoint's `auth` is not checked, and `InternalApi` endpoints are allowed. This is the local test path for a `schedules` routine, without setting `CRON_SECRET` or curling the cron route:

```json
{ "endpointId": "purge_stale_conversations", "payload": { "mode": "full" }, "system": true }
```

`system` cannot be combined with `user` (a `400`); everything else — the `allowWriteRequests` gate, the result shape, rejects as data — is unchanged. One limit: a nested `CallApi` step with `detached: true` is not faked. It still dispatches over HTTP against the dev server's origin and needs `CRON_SECRET` set, so without it the routine's own error comes back as the result.

This is dev-only — enable it when you're comfortable with the agent writing to your dev data.

## Journeys — verify behaviour, not just layout

A screenshot shows what rendered; it cannot tell the agent whether the form submits, the modal opens or the filter works. `lowdefy_run_journey` (or `POST /lowdefy-docs/journey`) opens a page headless and drives it through a declarative list of steps — a tiny Playwright — then reports what happened as data. Blocks are addressed by their `blockId`, through the same `#bl-<blockId>` DOM contract `@lowdefy/e2e-utils` uses, so a journey reads like the config it tests:

```json
{
  "pageId": "new_customer",
  "user": { "roles": ["admin"] },
  "urlQuery": { "ref": "campaign-1" },
  "steps": [
    { "fill": { "blockId": "name", "value": "Ada Lovelace" } },
    { "select": { "blockId": "country", "value": "United Kingdom" } },
    { "click": "submit" },
    { "wait": { "request": "create_customer" } },
    { "expect": { "state": { "path": "created", "equals": true } } },
    { "expect": { "visible": "success_modal" } },
    { "expect": { "text": { "blockId": "success_message", "contains": "Ada Lovelace" } } },
    { "screenshot": "after-submit" },
    { "press": "Escape" },
    { "click": "go_to_list" },
    { "expect": { "url": { "contains": "/customers" } } }
  ]
}
```

Every step is an object with exactly one key:

| Step                                                     | What it does                                                                                                                                                                                                                                                                                          |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{ "click": target }`                                    | Clicks the block — its interactive control (button, link, input, checkbox…) when it has one, otherwise the block itself — or the control a target object narrows to (below)                                                                                                                           |
| `{ "click": { ...target, "count": 2 } }`                 | Clicks 2 or 3 times in quick succession, a double click, before the runner settles the page                                                                                                                                                                                                           |
| `{ "fill": { ...target, value } }`                       | Fills the block's (or grid cell's) `input` or `textarea` with `value` (converted to a string)                                                                                                                                                                                                         |
| `{ "select": { ...target, value } }`                     | Opens the block's (or grid cell's) dropdown and clicks the option whose text is exactly `value`; a native `<select>` inside the block is set by label instead, a radio, button or segmented selector's option is clicked by its label, and a checkbox option is ticked (left ticked if it already is) |
| `{ "press": key }`                                       | Presses a key or chord, e.g. `"Enter"`, `"Escape"`, `"Mod+k"` — `Mod` becomes `Meta` or `Control` for the platform the page reports, the same way the app's shortcuts resolve it                                                                                                                      |
| `{ "back": true }`                                       | Goes back one page, like the browser's Back button; fails when the journey has not navigated from an earlier page                                                                                                                                                                                     |
| `{ "goto": pageId }`                                     | Loads a page like a typed URL (`{ pageId, pathParams, urlQuery }` adds the values of a [page path](/page-paths)'s placeholders and a query); a protected page may redirect to sign-in, so assert where it landed                                                                                      |
| `{ "email": { to, subject? } }`                          | Opens the newest email to `to` that arrived during the journey, waiting for it; `click` follows its links by text. Needs `LOWDEFY_DEV_SMTP_PORT`                                                                                                                                                      |
| `{ "as": name }`                                         | Switches to another person with their own browser and cookies; the journey starts as `"main"`, and a new name opens the journey's page                                                                                                                                                                |
| `{ "wait": { "ms": n } }`                                | Sleeps `n` milliseconds                                                                                                                                                                                                                                                                               |
| `{ "wait": { "request": requestId } }`                   | Waits until the request has finished loading                                                                                                                                                                                                                                                          |
| `{ "wait": { "state": path } }`                          | Waits until the state path is defined                                                                                                                                                                                                                                                                 |
| `{ "screenshot": name? }`                                | Captures a PNG of the viewport; returned with the result (`true`, `null` or a missing name defaults to `step-<index>`)                                                                                                                                                                                |
| `{ "expect": { "state": { path, equals } } }`            | The state at `path` structurally equals `equals` (key order does not matter); a path that does not exist reads as `null`, so `equals: null` also passes for a misspelt path                                                                                                                           |
| `{ "expect": { "visible": target } }`                    | The block, or the control a target narrows to, is visible                                                                                                                                                                                                                                             |
| `{ "expect": { "hidden": target } }`                     | Nothing the target names is visible: no element matches, or every match is hidden. Passes at once when nothing matches yet, so pair it with something that must be present first                                                                                                                      |
| `{ "expect": { "text": { ...target, contains } } }`      | The block's text — or a grid row's or cell's — contains the string                                                                                                                                                                                                                                    |
| `{ "expect": { "url": { contains } } }`                  | The page url contains the string                                                                                                                                                                                                                                                                      |
| `{ "expect": { "title": { equals } } }`                  | The document title (the browser tab's text) is exactly the string; `{ contains }` checks part of it                                                                                                                                                                                                   |
| `{ "expect": { "calls": { request, pageId?, count } } }` | This actor's browser called the request (on `pageId`, default the current page) exactly `count` times since the journey started, compared once after the page settles; `{ endpoint, count }` counts an endpoint. Counts survive full page loads                                                       |
| `{ "expect": { "error": text } }`                        | The interaction step just before it raised an app error whose message contains `text` (below); must directly follow a click, open, fill, select, press or back                                                                                                                                        |

A **target** is a `blockId` string, or an object that narrows the search to a control that is not itself a block — a grid row's cell buttons, a confirm dialog's OK, a dropdown menu's items:

| Target key | Meaning                                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `blockId`  | The block to search inside                                                                                                           |
| `row`      | A grid row, zero-based as displayed (`AgGrid*`, `Table`, `TableInput`); needs `blockId`                                              |
| `column`   | A grid cell in that row, by the column's `field`, `colId` or `key`; needs `blockId`                                                  |
| `text`     | The visible interactive control whose text is exactly this — a button label, a tab, a menu item (`"Cat"` never matches `"Category"`) |
| `nth`      | When several elements match, the zero-based one to use                                                                               |

A radio, checkbox or segmented option is reached through its label: `{ "click": { "blockId": "period", "text": "Month" } }` clicks the Month option of a `SegmentedSelector`, whose own radio input has no size.

`text` without a `blockId` searches the page, front-most layer first — an open dropdown menu (`[role="menu"]`), then an open dialog (`[role="dialog"]`), then the page — so `{ "click": { "text": "Delete" } }` with a confirm dialog open clicks the dialog's Delete and not the grid's, without counting buttons. `fill`, `select` and `expect.text` always need a `blockId`. Unknown target keys are rejected before a browser opens.

A `click`, `open`, `fill` or `select` whose `text` or `containing` matches more than one visible element fails with `Matched <n> controls with text "<text>" in <scope>; add nth: 0..<n-1>, or a blockId/row to narrow it.` Add `nth` or narrow the scope. Expectations accept any match: `expect.visible` passes when one is visible, `expect.hidden` when none is.

```json
[
  { "click": { "blockId": "controls_grid", "row": 1, "text": "Delete" } },
  { "expect": { "visible": { "text": "Are you sure?" } } },
  { "click": { "text": "Delete" } },
  { "wait": { "request": "delete_control" } },
  {
    "expect": {
      "text": {
        "blockId": "controls_grid",
        "row": 1,
        "column": "title",
        "contains": "Key rotation"
      }
    }
  },
  { "click": { "blockId": "controls_grid", "row": 0, "column": "more" } },
  { "click": { "text": "Archive" } }
]
```

Each step gets 5 seconds (Playwright's own auto-waiting — a `click` waits for the block to be attached, visible and enabled; nothing is retried); pass `timeout` (milliseconds, up to 60000) to give every step of a journey longer on a slow machine. After an interaction the runner waits for the page to settle — the event the interaction fired, the requests it called — using the same readiness check the page open uses, so the next `expect` asserts against the outcome instead of racing it. The page opens with the same headless `user`, `pathParams` and `urlQuery` handling as the other tools.

A step that fails **stops the journey and comes back as data**, never as a tool error — a failed journey is the answer, not a fault:

```json
{
  "pageId": "new_customer",
  "passed": false,
  "steps": [
    {
      "index": 0,
      "step": { "fill": { "blockId": "name", "value": "Ada Lovelace" } },
      "status": "ok",
      "durationMs": 18
    },
    { "index": 1, "step": { "click": "submit" }, "status": "ok", "durationMs": 71 },
    {
      "index": 2,
      "step": { "expect": { "state": { "path": "created", "equals": true } } },
      "status": "failed",
      "durationMs": 1
    },
    { "index": 3, "step": { "screenshot": "after-submit" }, "status": "skipped", "durationMs": 0 }
  ],
  "failure": {
    "index": 2,
    "step": { "expect": { "state": { "path": "created", "equals": true } } },
    "expected": true,
    "actual": null,
    "message": "Expected state \"created\" to equal true but found undefined."
  },
  "screenshots": [],
  "state": { "name": "Ada Lovelace", "country": null }
}
```

`expected` and `actual` hold the compared values for an `expect` step, and for an interaction step what the runner needed (`block "submit" to be actionable`, `option "Chile" in the dropdown of block "country"`) against Playwright's own message. The remaining steps are marked `skipped`. A passing journey returns `passed: true` and no `failure`. The final page `state` is included, pass or fail — it is what the agent needs to write the next assertion. A page holding large request results can have hundreds of KB of state, so when the state is over 10000 characters of JSON the result carries `stateOmitted` instead: its size, each top-level key with its size, and a note. The `state` option picks what comes back:

| `state`                 | The result carries                                                    |
| ----------------------- | --------------------------------------------------------------------- |
| omitted                 | The whole state when it is small, otherwise `stateOmitted`            |
| `["form.name", "rows"]` | `state: { "form.name": …, "rows": … }`, `null` for a path not defined |
| `true`                  | The whole state, however large                                        |
| `false`                 | No state                                                              |

A journey also fails at the step that causes an **app error**, even when every expectation holds: an action that fails with an error that is not a user error, an uncaught page exception or a client error report, a server error from a request or endpoint, or a 5xx from one. Only errors the journey's own browsers cause count, and they are reported in its result, not in `build-status` or the event stream. A failed `Validate`, a `Throw` action and 401/403 refusals never count. The failure carries each error with its kind, its config `source` and a `key` that names the error by its kind, page and source, the same across runs:

```json
{
  "index": 1,
  "step": { "click": "save" },
  "kind": "app-error",
  "message": "Step 1 (click) caused an app error: server-error: MongoDB: MongoDB rejected the MongoDBInsertOne command.",
  "expected": "no app error",
  "actual": ["server-error: MongoDB: MongoDB rejected the MongoDBInsertOne command."],
  "errors": [
    {
      "kind": "server-error",
      "message": "MongoDB: MongoDB rejected the MongoDBInsertOne command.",
      "source": "pages/tickets.yaml:42",
      "configKey": null,
      "key": "server-error|tickets|pages/tickets.yaml:42"
    }
  ]
}
```

The kinds are `action-error`, `client-error`, `server-error`, `request-failed` (a 5xx no server error explains) and `environment` (a `$search` stage the journey's data set cannot run). An error raised while the first page opens fails with `"phase": "open"` in place of `index` and `step`, every step skipped. When the step failed on its own too, the app error leads `message` and the step's own message is kept as `stepMessage`. Where an error is the intended outcome, `{ "expect": { "error": text } }` straight after the interaction claims the errors whose message contains `text`, with the failed action that reported them; any other error from that interaction still fails it.

Screenshots taken before the failure are kept: over MCP they arrive as image content after the JSON (with the JSON listing only their names); over HTTP they are base64 in the JSON body.

Malformed steps are answered before a browser opens — an unknown key returns `Unknown journey step "hover". Steps are: click, fill, select, press, back, goto, email, as, wait, screenshot, expect.` (a `400` on the HTTP route), distinct from the `502` a render that could not run returns.

To test auth itself — sign-up, email verification, sign-in, invitations, organization switching — pass `"user": "none"`: no caller is injected, the journey starts signed out, and the app's own sessions carry through its steps. [Config Tests](/config-tests#testing-sign-up-and-sign-in) covers the mail sink and the database these journeys need.

Journeys are also the file format of `tests/journeys/`, which `lowdefy test` runs through this same route — write the journey the agent used to verify a change, and it becomes the regression test for it.

## Phones — the same tools on Lowdefy Dev

An app's mobile pages run in Lowdefy Dev, on an iPhone simulator, an Android emulator or a real phone (`lowdefy dev --ios`, `--android` or `--lan`). Lowdefy Dev joins the dev server as a tab, as a browser tab does, so the agent reaches it with the tools it already uses: pass a phone's tab id as `device`. The phone is used as it is — on the page it shows, signed in as whoever signed in on it, against the app's real database — so `user`, `data` and the headless browser's options (`width`, `urlQuery`, …) do not apply, and a tool given a page the phone does not show says which page it does show. Steps run on the phone by block id through the engine, the way the block's own view runs them: `click`, `fill`, `select` (an option by its text), `press` (`Enter`, on the input filled last), `wait`, `screenshot` and `expect` with `state`. Any other step is refused before the first one runs.

`lowdefy_device` with `action: "list"` names the phones connected now, and the simulators and Android devices on this computer:

```json
{
  "phones": [
    {
      "device": "6f1c…",
      "platform": "ios",
      "app": "com.lowdefy.dev",
      "shell": "7.1.0",
      "paired": false,
      "pageId": "ticket",
      "pathParams": {}
    }
  ],
  "simulators": [{ "udid": "A1B2…", "name": "iPhone 16", "runtime": "iOS-18-2" }],
  "android": [],
  "unavailable": []
}
```

`lowdefy_device` with `action: "start"` and `platform: "ios"` or `"android"` opens Lowdefy Dev on this dev server, as `lowdefy dev --ios` or `--android` does: it boots a simulator (or uses the booted one), or finds an Android phone on USB or starts the first emulator, installs the build `LOWDEFY_DEV_APP_IOS` or `LOWDEFY_DEV_APP_ANDROID` names, opens it, and returns the new phone's `device` once it joins:

```json
{ "action": "start", "platform": "ios" }
```

`lowdefy_screenshot_page` with `device` runs its `steps` on the phone, then captures the whole screen — system dialogs and alerts included — with `xcrun simctl io` on a simulator or `adb exec-out screencap` on an Android device. A phone paired over the network, or one the tools cannot reach (several simulators booted, a tool missing), is captured by Lowdefy Dev from the app's own view instead. The result's `capture` says which (`simctl`, `adb` or `view`), with a `note` why for `view`:

```json
{ "pageId": "ticket", "device": "6f1c…", "steps": [{ "click": "assign" }] }
```

`lowdefy_run_journey` with `device` runs a journey on the phone and returns the browser journey's result — `passed`, the step log, a `failure` with expected and actual, the phone's final state and the screenshots:

```json
{
  "pageId": "ticket",
  "device": "6f1c…",
  "steps": [
    { "fill": { "blockId": "note", "value": "Called the customer" } },
    { "click": "save" },
    { "expect": { "state": { "path": "note", "equals": "Called the customer" } } }
  ]
}
```

`lowdefy_inspect_state` with `device` reads that phone's live state, as it reads a browser tab (`source: "tab"`), and never falls back to headless. With `expression`, the phone evaluates it against the page it shows:

```json
{ "pageId": "ticket", "device": "6f1c…", "expression": { "_state": "status" } }
```

`lowdefy_device` with `action: "inject"` fakes the phone's next device result through Lowdefy Dev, which the app's device actions read, so it works on real phones too: `scan` `{ "data" }`, `photo` `{ "base64" }`, `nfc` (the tag read), `location` `{ "latitude", "longitude" }` or a list of them as a route, `permission` with `name` and `"granted"` or `"denied"`, `network` `"online"` or `"offline"`, `push`, and `clear`. On an iOS simulator a location and a permission are also set on the simulator itself (`xcrun simctl location`, `simctl privacy`; iOS may restart the app when a permission changes), and a push — an APNs payload with `aps` — is delivered by `xcrun simctl push`, which Lowdefy Dev cannot yet do itself on other phones:

```json
{
  "action": "inject",
  "device": "6f1c…",
  "inject": { "kind": "scan", "value": { "data": "JOB-42" } }
}
```

`lowdefy_list_types` with `target: "mobile"` lists the blocks, actions and client operators a mobile page can use — the ones the native shell carries, not the app's web plugins — and `lowdefy_build_status` lists a phone's runtime errors beside the browser's, marked `surface: "mobile"` with the shell version.

## Setting up a project — one command

```bash
npx lowdefy@<app version> agent-setup
```

Run it with the Lowdefy version your app's `lowdefy.yaml` pins. It writes to the project root, the nearest folder holding `.git` above the app (or `--project-directory`), and merges into files that already exist:

- **`.mcp.json`** registers the `lowdefy` MCP server, pinned to the version of the CLI running `agent-setup` (`npx lowdefy@<version> mcp`; see [Connect your agent](#connect-your-agent-lowdefy-mcp)). Other servers in the file stay.
- **Lowdefy's block** of guidance for coding agents: the dev server, looking up types and docs, icons and HTML, testing a change, visual feedback and the installed skills. It sits between `<!-- BEGIN:lowdefy-agent-rules version=<version> -->` and `<!-- END:lowdefy-agent-rules -->`, stamped with the version of the CLI that wrote it, and each run rewrites the whole block. Text outside the markers is yours and never touched. An existing block is replaced where it is. Otherwise the block is appended to `AGENTS.md` when it exists, else to `CLAUDE.md` when that is all the project has (no `AGENTS.md` is created), else to a new `AGENTS.md`.
- **The root `CLAUDE.md` imports `AGENTS.md`.** Claude Code skips `AGENTS.md` whenever it finds a Claude file in or above the working directory, including one outside the repository on your machine. When the block is in `AGENTS.md`, `agent-setup` creates a root `CLAUDE.md` holding only `@AGENTS.md`, or adds that line to the top of an existing one that lacks it. It never edits `.claude/CLAUDE.md` or `CLAUDE.local.md`.
- **Skills**, each written to both `.agents/skills/<name>/SKILL.md` (read by Codex, Cursor, Copilot, Gemini, Amp and opencode) and `.claude/skills/<name>/SKILL.md` (read by Claude Code). Agents that read both folders may list a skill twice.
  - `lowdefy-config`: writing Lowdefy config with exact types, schemas and examples from the dev server.
  - `journeys-from-dev`: turns what you tried in the development server into journeys (see [Dev recordings](/config-tests#dev-recordings)).
  - `journeys-from-production`: turns what real users do in production into journeys (see [Production journeys](/config-tests#production-journeys)).
  - `journeys-from-pr`: explores a pull request (or a bug bash goal) page by page, writes a journey for every path a user can take, keeps those that pass and reports those that fail as findings (see [Exploring a pull request](/explore-pull-request)).
  - `journeys-harden`: replays, lints and mutation-tests your journeys and writes their edge-case variants, never deleting a journey (see [Hardening journeys](/config-tests#hardening-journeys)).
  - `journeys-autopilot`: builds and hardens the journeys of a whole app on its own, cycle after cycle (see [Journeys on autopilot](/config-tests#journeys-on-autopilot)).

**Everything follows the CLI, not the app.** Nothing `agent-setup` writes names an app, so running it from any app in a repository writes the same files. A plain `npx lowdefy agent-setup` runs the latest release, whatever your app pins. When the CLI's version differs from your app's, `agent-setup` still writes, and warns with the command that matches them, such as `npx lowdefy@7.1.0 agent-setup`. The dev server keeps a notice about the block until someone does (see [Agent instructions are checked, and said once](#agent-instructions-are-checked-and-said-once)). Rerun `agent-setup` the same way after upgrading Lowdefy.

**Which app agents work on.** A Lowdefy app is a folder containing `lowdefy.yaml`. The block tells agents the rule the `lowdefy_` tools follow: the app folder the session started in, else the repository's only app; otherwise the tools fail and list the apps, and the agent passes the folder it means as `directory`. Shell commands such as `lowdefy test` take it as `--config-directory <app>`. The unattended `journeys-autopilot` skill stops and lists the apps rather than guess.

**Skills you edit are kept.** Each `SKILL.md` carries a `lowdefy-skill-hash` of its content. A rerun refreshes both copies of a skill, and recreates a missing one, while every copy still matches its hash. Edit either copy and both are frozen; `agent-setup` names the edited copy and its twin, so you can copy the edit across, or delete both and rerun to go back to Lowdefy's. A skill Lowdefy no longer ships is removed when unedited: its `SKILL.md` is deleted, and its folder only when nothing else is left in it. An edited one stays, and `agent-setup` says Lowdefy no longer maintains it. Skills without a `lowdefy-skill-hash` are not Lowdefy's and are never touched.

**Apps on `lowdefy: local`** are not supported: `agent-setup` stops with an error and writes nothing.

**Projects set up by an earlier version.** In `.mcp.json`, the `lowdefy` entry is replaced whatever it ran before (a dev server port such as `http://localhost:<port>/lowdefy-docs/mcp`, or the CLI in `node_modules`), and port-pinned entries under other names, such as `lowdefy-3010`, are removed. Approvals in `.claude/settings.json` under the server's old name, `lowdefy-docs`, carry over to `lowdefy`, whose tools are named `mcp__lowdefy__*`; remove an old `lowdefy-docs` entry from `.mcp.json` by hand. Guidance written before the block is not migrated: an unmarked `## Lowdefy` section stays where it is, and a `lowdefy-config` skill without a hash counts as edited. Delete them, then rerun `agent-setup`.

## Using it with Claude Code manually

Commit a `.mcp.json` file at your project root, pinning your app's Lowdefy version:

```json
{
  "mcpServers": {
    "lowdefy": {
      "type": "stdio",
      "command": "npx",
      "args": ["--prefer-offline", "--yes", "lowdefy@7.1.0", "mcp"]
    }
  }
}
```

Or register it for every project with `claude mcp add --scope user lowdefy -- npx --prefer-offline --yes lowdefy@7.1.0 mcp` (on Windows, `-- cmd /c npx ...`), which is what `lowdefy agent-setup --user` runs. The MCP server includes instructions that teach the agent the workflow (list types first, then fetch schemas and examples; let `lowdefy mcp` run the dev server), so it works well without any extra prompting.

## Plain HTTP routes

MCP is the agent interface. A few plain routes remain for the CLI, the dev app and scripts; the rest of the tools have no HTTP route:

| Route                                    | Purpose                                                                                                     |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `GET /lowdefy-docs`                      | Overview and route index                                                                                    |
| `GET /lowdefy-docs/build-status`         | Current build errors/warnings + recent browser runtime errors                                               |
| `GET /lowdefy-docs/events`               | SSE stream of `restart`, `build`, `client_error` and `server_error` events                                  |
| `GET /lowdefy-docs/page-config/{pageId}` | Fully built page config, or its build errors                                                                |
| `POST /lowdefy-docs/journey`             | Drive a page headless through declarative steps and assert what happens; screenshots returned as base64     |
| `GET /lowdefy-docs/find/{id}?pageId=`    | Locate where a page/block/request id is defined                                                             |
| `POST /lowdefy-docs/restart`             | Restart the dev server process (`{reason}` optional; then `build-status?wait=true` answers once it is back) |

## Local plugins

Your project's own plugins (declared under `plugins:` in `lowdefy.yaml`) are included automatically:

- Types appear in `lowdefy_list_types` listings.
- Block schemas are derived from each block's `meta`, and connection/request schemas from the `schema` property on your connection and request definitions.
- Ship a `gallery.yaml` or `examples.yaml` next to a block in your plugin's `dist/blocks/{BlockName}/` and it is served by `lowdefy_get_examples`.
- A `README.md` and `docs/*.md` files in your plugin package are searched by `lowdefy_search_docs` and read with `lowdefy_get_doc` (`plugins/<package>` for the README, `plugins/<package>/<file>` for a docs file). A docs file named after a type, such as `docs/MyBlock.md`, is the doc `lowdefy_get_doc` returns for that type. `lowdefy_get_plugin_doc` returns them all as one page.
- Editing a local plugin (a package linked from your workspace) rebuilds the config, so a new or renamed type is defined and a build the plugin broke clears once it is fixed. When the plugin has server-side types (connections, requests, server operators, agents, websockets, notifications, auth) the dev server also restarts, so the new implementation is what runs; block, action and client-operator edits hot-reload through Vite without a restart. If the server still looks stale, call `lowdefy_restart` or `POST /lowdefy-docs/restart`.

## Modules

The docs of your app's modules, fetched or local `file:`, are searched and read the same way:

- `modules/<id>` is the module's `README.md`, and `modules/<id>/<file>` each file in its `docs/` folder.
- `modules/<id>/manifest` lists the vars (type, required, description and default), components and exports its `module.lowdefy.yaml` declares.

`<id>` is the module's id in your `lowdefy.yaml`. Search with `source: module` to find only module docs. Plugin and module docs are read from the files the packages carry, so a change to one is served on the next call.

## Docs for crawling agents

The docs site itself serves agent-friendly formats: every page as raw markdown at `https://docs.lowdefy.com/md/{section}/{slug}.md`, an [llms.txt](https://llmstxt.org) index at `https://docs.lowdefy.com/llms.txt`, and the full documentation as one file at `https://docs.lowdefy.com/llms-full.txt`. Generic browser tools like Playwright MCP and Chrome DevTools MCP also work well against a running Lowdefy app — blocks render stable DOM ids matching their `blockId`.
