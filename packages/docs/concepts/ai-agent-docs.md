When you run `lowdefy dev`, the development server also serves a documentation API and an [MCP](https://modelcontextprotocol.io) endpoint built for AI coding agents. It describes everything installed in _your_ project — every block, operator, action, connection and request type from core Lowdefy plugins _and_ your own local plugins — plus the full Lowdefy documentation as markdown. This means an agent like Claude Code never has to guess type names or property shapes: it can look up the exact schema, real examples, and the relevant docs page while it writes your config.

Everything is served under the `/lowdefy-docs` path of your dev server (default `http://localhost:3000`). No setup or configuration is needed — it is always on in dev, and never part of your production server.

> The `/lowdefy-docs` route prefix is reserved by the dev server. A page with `id: lowdefy-docs` will not be reachable in dev.

## The MCP endpoint

The dev server exposes an MCP server (streamable HTTP) at:

```
http://localhost:3000/lowdefy-docs/mcp
```

It provides these tools:

| Tool                     | Purpose                                                                 |
| ------------------------ | ----------------------------------------------------------------------- |
| `lowdefy_overview`       | Start here — what is installed, counts per kind, and how to use the rest |
| `lowdefy_list_types`     | List ALL available types of a kind (blocks, operators, actions, connections, requests) |
| `lowdefy_list_plugins`   | Installed plugin packages, including local plugins, and the types each provides |
| `lowdefy_get_schema`     | JSON Schema for a specific type — all properties and events              |
| `lowdefy_get_examples`   | Real YAML usage examples for a block type                                |
| `lowdefy_get_doc`        | A Lowdefy docs page as markdown, by slug or by type name                 |
| `lowdefy_search_docs`    | Keyword search over the Lowdefy docs                                     |
| `lowdefy_get_plugin_doc` | Markdown (READMEs, guides) shipped inside an installed plugin package    |
| `lowdefy_build_status`   | Current build errors and warnings (with source file locations) plus recent browser runtime errors — call after every edit |
| `lowdefy_get_page_config`| The fully built config for a page, or its structured build errors        |
| `lowdefy_screenshot_page`| PNG screenshot of a rendered page (headless Chromium) for visual verification |
| `lowdefy_run_journey`    | Drive a page headless through declarative steps (`click`, `fill`, `select`, `press`, `wait`, `screenshot`, `expect`) and assert state, visibility, text or url — verify behaviour, not just layout |
| `lowdefy_find_config`    | Which yaml file (and line) defines a given page, block, or request id    |
| `lowdefy_scaffold_page`  | Create a new page yaml file with a canonical minimal structure           |
| `lowdefy_app_map`        | The whole-app graph: every page, menu, connection, endpoint, and agent in one call |
| `lowdefy_inspect_state`  | The LIVE state, request results, and event log of a running page — reads your open browser tab, or runs the page headless |
| `lowdefy_eval_operator`  | Evaluate any operator expression against live page state — a REPL for config |
| `lowdefy_run_request`    | Execute a request with a test payload, as a given `user`, to verify data shape (read-only unless opted in) |
| `lowdefy_run_endpoint`   | Execute an Api endpoint routine with a test payload, as a given `user`, to see what it returns, rejects or throws (needs `allowWriteRequests`; a `:reject` comes back as data) |
| `lowdefy_snapshot_state` | Capture live page state + request responses into a committable checkpoint folder |
| `lowdefy_load_state`     | Restore a state checkpoint — headless, or a `?_checkpoint=` URL for manual testing |
| `lowdefy_list_state_checkpoints` | List saved state checkpoints |
| `lowdefy_checkpoint_to_mocks` | Convert a state checkpoint into e2e `mocks.yaml` fixtures |
| `lowdefy_restart`        | Restart the dev server process — after editing a local plugin's server-side code, or when `build_status` looks stale. Wait ~2s, then call `lowdefy_build_status` |
| `lowdefy_checkpoint`     | Snapshot all config files before risky changes                           |
| `lowdefy_revert_checkpoint` | Restore config files from a checkpoint                                |

## Hazards — what the schema cannot tell you

A hazard is a behaviour of a type that its schema does not show, but that an agent must know before writing config: the `Html` block sanitises its content, so a `<style>` tag is stripped; closing a `Modal` keeps the state of the blocks inside it, while `visible: false` prunes it; `_state` inside a request's `properties` is always `undefined`; a `_ref` to a `.njk` file renders at build time. Each hazard is `{ id, message, see }` — a stable kebab-case `id`, one or two sentences saying what happens and what to do instead, and a docs slug (or `null`) for `lowdefy_get_doc`.

`lowdefy_get_schema`, `lowdefy_get_doc` (when looked up by kind and type) and `lowdefy_find_config` (per match) return `hazards` alongside their normal result — `lowdefy_get_doc` appends them as a `## Hazards` section of the markdown. Some hazards are contextual: `tenant-wall-lookup` is only returned for a request whose connection is tenant-walled, so `find_config` on that request explains the wall's `$lookup` injection while the same request over a `tenant: shared` connection stays quiet.

Hazards come from two places. Framework-level hazards ship with `@lowdefy/docs-content` (`hazards.json`). Type-attached hazards are declared by the plugin: a block sets `meta.hazards`, a request sets `meta.hazards` on the request function, and an operator package exports a `./metas` module with `{ hazards }` per operator — see [Plugins](/plugins-introduction). Local plugins in your project use the same channel, so your own blocks can warn an agent about their own surprises.

## Annotate your app — point, draw, copy, paste

Press **Cmd+/** (macOS) or **Ctrl+/** (Windows/Linux) on any page of your running dev app. An overlay appears: hover to highlight blocks, click to select one, draw rectangles/arrows/freehand, type a comment, and batch several annotations. Hitting **Copy** (or just pressing Enter) puts an agent-readable feedback block on your clipboard — each annotation enriched with the **blockId and the exact yaml file and line** that defines it, plus **an annotated PNG screenshot of the page with your drawings on it** (saved under `.lowdefy/annotations/`, its path included in the block so the agent can view it; untick "Include annotated screenshot" to skip).

Paste it into whichever agent session you want — that explicit paste is also what keeps feedback unambiguous when you run several Claude Code sessions against one dev server. A pasted block looks like:

```
Feedback: 1 annotation(s) on page "orders" (/orders) — viewport 1280x800 @2x, scrollY 340

1. Element "submit_button" (pages/orders.yaml:42)
   Ancestors: submit_button > order_form
   Comment: Disable this while the form is submitting
   Shapes: 1 rect around the element
```

Esc cancels; the overlay never ships to production servers. The `/lowdefy-feedback` route prefix is reserved in dev.

## Open code — Option/Alt+click jumps to the yaml

Hold **Option** (macOS) or **Alt** (Windows/Linux) and click any element in your running dev app to open the yaml that defines its block in VS Code, at the exact line. While the modifier is held, the block under the cursor shows a blue highlight with its blockId — the same picking affordance as the annotation overlay — and the cursor becomes a pointer, so you see exactly what a click will open. The dev server resolves the clicked element to its block and looks up the config source the same way annotations do — blocks inside lists resolve to the item block that defines them (runtime array indices fold back to the config's `$` placeholder), other runtime-generated blocks resolve to their nearest configured ancestor, and blocks defined in modules open the module file that defines them. Plain clicks, Option/Alt+clicks outside any block, and Cmd/Ctrl+clicks (the browser's open-in-new-tab) keep their normal behaviour. Dev server only.

## The feedback loop

The dev server rebuilds automatically when config changes, so an agent works in a tight loop:

1. Discover types and schemas, write or edit YAML.
2. Call `lowdefy_build_status` — did the build succeed? Errors come back with the exact source file and location.
3. Call `lowdefy_get_page_config` to confirm the page builds, and `lowdefy_screenshot_page` to see it rendered.
4. Runtime errors from the browser (operator errors, block render errors) also appear in `lowdefy_build_status` under `clientErrors`, so problems that only show at runtime still reach the agent.
5. Server-side failures appear beside them under `serverErrors` — a request whose database filter is malformed, an endpoint step that throws, an MCP tool call or an agent tool call that fails — each with the yaml `source` (`file:line`) and `config` path that produced it, plus the `endpointId`, `requestId` and `pageId` where known. The store holds the last 50 errors and is cleared on dev server restart.

### Events are pushed — no need to poll

The dev server pushes what changed instead of waiting to be asked. Two channels carry the same events:

- **MCP clients** receive them as `notifications/message` from logger `lowdefy` on the standalone GET stream of `/lowdefy-docs/mcp` (the server declares the `logging` capability, so any MCP client surfaces them). Failed builds arrive at level `error`, everything else at `info`.
- **Everything else** uses `GET /lowdefy-docs/events`, a Server-Sent Events stream — `curl -N http://localhost:3000/lowdefy-docs/events` — with one frame per event, named by the event type.

Every event carries `type` and an ISO `timestamp`. The four types:

| Type           | When                                                                    | Carries                                                                                                   |
| -------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `restart`      | First event on every connection                                          | `bootedAt` — the dev server process start time, so a reconnecting client can tell a restart from a dropped connection |
| `build`        | Every time a rebuild finishes, success or failure                        | `status`, `errorCount`, `warningCount`, `errors`, `warnings`, and `stale` / `staleSince` (see below)     |
| `client_error` | A browser reports a runtime error                                        | The same entry `lowdefy_build_status` lists under `clientErrors`                                          |
| `server_error` | A request, endpoint, MCP tool or agent tool fails on the server          | The same entry `lowdefy_build_status` lists under `serverErrors`                                          |

Events are not buffered: a client that connects after an event missed it, and should call `lowdefy_build_status` — which is derived from the same `build/buildStatus.json` — for the current picture. Act on a `build` event with `status: "error"` immediately; `lowdefy_build_status` remains the full report.

### When a build fails, answers are marked stale

A failed rebuild does not take the dev server down — it keeps serving the last build that succeeded, so you can carry on looking at the app while you fix the error. That means every tool can keep answering from a build that predates the latest edits, which is a trap for an agent.

So while the last build is failing, every answer says so:

- MCP tool results start with a `STALE: ...` text item.
- JSON responses from `/lowdefy-docs` carry `stale: true`, `staleSince` and `staleReason`.
- Markdown responses are prefixed with a `> STALE: ...` banner.
- Every `/lowdefy-docs` response carries the `X-Lowdefy-Stale` and `X-Lowdefy-Stale-Since` headers.

Nothing is refused — the last-known-good schema or page config is often exactly what you need while fixing the build. The flag disappears as soon as a build succeeds. Call `lowdefy_build_status` (or `GET /lowdefy-docs/build-status`) for the errors.

Some build warnings are only warnings in `lowdefy dev` — they fail `lowdefy build`. Those carry `"prodError": true` in `lowdefy_build_status`, are printed in the dev terminal as `[ConfigWarning · fails in prod] …`, and are badged **fails in prod** on a dark-orange bar in the browser error bar. Treat them as errors: the production build will not pass until they are fixed.

## Live state — the agent sees what you see

When you have a page open in your browser, the agent can read its **actual live state** — page state, request results, and the event log of recent actions — via `lowdefy_inspect_state`. Reproduce a problem by clicking through the app, then ask the agent to look: it inspects your exact tab, not a guess. `lowdefy_eval_operator` then evaluates any operator expression (like `{"_state": "customer.name"}`) against that same live context, so `_state`/`_request` binding bugs get debugged against real data. With no tab open, both tools run the page headless instead.

A headless capture waits for the page's full async lifecycle before it reads anything: `onInit`, `onInitAsync`, `onMount` and `onMountAsync`, every in-flight request, and the first message on each websocket subscription. A page whose data arrives through an `onMountAsync` `Request` action is therefore captured with its data, not empty. If a page has not settled within 15 seconds the result is still returned, carrying `ready: false` and a note — read that result as a snapshot of a page that was still loading, not as the page's settled state. One case escapes the wait: an event with a `debounce` is not yet marked loading during its delay, so a debounced `onMountAsync` can be captured before it runs.

## Auth-protected pages

The headless renderer behind `lowdefy_screenshot_page` and `lowdefy_inspect_state` authenticates as a signed-in user, so pages with `auth.public: false` render for the agent instead of bouncing to the sign-in page. That default user carries **no roles**, so a page or request gated on a role still comes back refused or empty.

To act as a specific caller, pass `user` — every tool that renders a page headless accepts it (`lowdefy_screenshot_page`, `lowdefy_run_journey`, `lowdefy_inspect_state`, `lowdefy_eval_operator`, `lowdefy_load_state`), as do `lowdefy_run_request` and `lowdefy_run_endpoint`:

```json
{ "pageId": "users", "user": { "roles": ["admin"] } }
```

It is merged over the default user, so `{"roles": [...]}` is usually all you need. No auth engine runs for an injected caller, so nothing derives the rest of the record — include `email`, `profile` or `attributes` in the object if the page reads them. Every call opens its own browser context, so one call can act as an admin and the next as a plain member.

`user` applies to the headless renderer only — it is never applied to a page you open in your own browser, which carries your real session and cannot be re-identified. `lowdefy_inspect_state` and `lowdefy_eval_operator` normally prefer your open tab, so passing `user` selects the headless source instead; combining it with `source: "tab"` is an error rather than a silently ignored role, as is combining it with `lowdefy_load_state`'s `mode: "registry-only"` (that mode hands you a URL to open yourself). The plain HTTP routes take the same param: `?user={"roles":["admin"]}` on the GET routes, a `user` key in the body of `POST /lowdefy-docs/journey`, `POST /lowdefy-docs/eval-operator`, `POST /lowdefy-docs/state-checkpoints/load`, `POST /lowdefy-docs/run-request` and `POST /lowdefy-docs/run-endpoint`. They answer a malformed or contradictory `user` with a `400`, distinct from the `502` a failed render returns.

To bypass login for the whole dev server — your own browser included — start it with a mock user instead: `lowdefy dev --mock-user '{"id":"dev","roles":["admin"]}'` (or configure `auth.dev.mockUser`). See [Auth Configuration](/auth-configuration#mock-user-for-testing-dev-server-only).

## State checkpoints — put the app in a known state

`lowdefy_snapshot_state` captures a moment — page state plus every request's recorded response — into a folder you can commit:

```
checkpoints/broken-refund-flow/
  checkpoint.json        # manifest
  state.json
  urlQuery.json
  requests/
    get_order.json       # one file per request — easy to review and edit
```

Loading it back (`lowdefy_load_state`) serves the recorded request data from the dev server and re-injects the page state. Three ways to use it:

- **Agent verification**: the agent restores a scenario headless and confirms its fix works against the exact data that caused the bug.
- **Manual testing**: `mode: registry-only` returns a URL like `http://localhost:3000/orders?_checkpoint=broken-refund-flow` — open it and the app is in that state, no clicking required.
- **e2e fixtures**: `lowdefy_checkpoint_to_mocks` converts a checkpoint into `mocks.yaml` entries for [e2e tests](/e2e-introduction), so "write an e2e test for this flow" starts from captured reality.

## Running requests safely

`lowdefy_run_request` executes a request with a test payload so the agent can verify the data shape a page will receive. Read-only request types (like `MongoDBFind`) always run.

Pass `user` to run the request as a specific caller — `{ "pageId": "users", "requestId": "get_users", "user": { "roles": ["admin"] } }`. Without `user` the request runs as a roleless anonymous caller, so a tenant-walled or role-gated request returns empty rows rather than an error. Impersonation never unlocks writes: the write gate below applies to every caller. Write requests are refused unless you opt in:

```yaml
cli:
  agentTools:
    allowWriteRequests: true
```

## Running endpoints

`lowdefy_run_endpoint` (or `POST /lowdefy-docs/run-endpoint`) executes an `Api` endpoint routine headlessly with a test payload, so the agent can verify what a routine returns, rejects or throws without clicking through the page that calls it:

```json
{ "endpointId": "create_order", "payload": { "sku": "A1" }, "user": { "roles": ["admin"] } }
```

Endpoints are not classified read-only — a routine has no `checkWrite` meta, and a single routine can read, write, call other endpoints and send notifications — so running one always requires the same `cli.agentTools.allowWriteRequests: true` opt-in as write requests. Without it the tool answers `refused: true` with the reason and how to enable it, and nothing runs.

The result is the same `{ error, response, status, success }` object the HTTP endpoint route returns. A `:reject` or `:throw` in the routine is not a tool failure: it comes back as `success: false` with `status: "reject"` or `"error"` and the routine's own `error`, so the agent can assert on the shape it designed. `InternalApi` endpoints are refused with the same message HTTP callers get, an unknown `endpointId` answers `refused: true`, and faults that escape the routine (an auth refusal, a missing connection) come back as `error: { name, message, source, configKey }`. Only malformed input — a missing `endpointId` or a non-object `user` — is a `400`.

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

| Step                                              | What it does                                                                                                                                                                     |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{ "click": blockId }`                            | Clicks the block — its interactive control (button, link, input, checkbox…) when it has one, otherwise the block itself                                                          |
| `{ "fill": { blockId, value } }`                  | Fills the block's `input` or `textarea` with `value` (converted to a string)                                                                                                     |
| `{ "select": { blockId, value } }`                | Opens the block's dropdown and clicks the option whose text is exactly `value`; a native `<select>` inside the block is set by label instead                                     |
| `{ "press": key }`                                | Presses a key or chord, e.g. `"Enter"`, `"Escape"`, `"Mod+k"` — `Mod` becomes `Meta` or `Control` for the platform the page reports, the same way the app's shortcuts resolve it |
| `{ "wait": { "ms": n } }`                         | Sleeps `n` milliseconds                                                                                                                                                          |
| `{ "wait": { "request": requestId } }`            | Waits until the request has finished loading                                                                                                                                     |
| `{ "wait": { "state": path } }`                   | Waits until the state path is defined                                                                                                                                            |
| `{ "screenshot": name? }`                         | Captures a PNG of the viewport; returned with the result (`true`, `null` or a missing name defaults to `step-<index>`)                                                           |
| `{ "expect": { "state": { path, equals } } }`     | The state at `path` structurally equals `equals` (key order does not matter)                                                                                                     |
| `{ "expect": { "visible": blockId } }`            | The block is visible                                                                                                                                                             |
| `{ "expect": { "text": { blockId, contains } } }` | The block's text contains the string                                                                                                                                             |
| `{ "expect": { "url": { contains } } }`           | The page url contains the string                                                                                                                                                 |

Each step gets 5 seconds (Playwright's own auto-waiting — a `click` waits for the block to be attached, visible and enabled; nothing is retried). After an interaction the runner waits for the page to settle — the event the interaction fired, the requests it called — using the same readiness check the page open uses, so the next `expect` asserts against the outcome instead of racing it. The page opens with the same headless `user` and `urlQuery` handling as the other tools.

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

`expected` and `actual` hold the compared values for an `expect` step, and for an interaction step what the runner needed (`block "submit" to be actionable`, `option "Chile" in the dropdown of block "country"`) against Playwright's own message. The remaining steps are marked `skipped`. A passing journey returns `passed: true` and no `failure`. The final page `state` is always included, pass or fail — it is what the agent needs to write the next assertion. Screenshots taken before the failure are kept: over MCP they arrive as image content after the JSON (with the JSON listing only their names); over HTTP they are base64 in the JSON body.

Malformed steps are answered before a browser opens — an unknown key returns `Unknown journey step "hover". Steps are: click, fill, select, press, wait, screenshot, expect.` (a `400` on the HTTP route), distinct from the `502` a render that could not run returns.

Journeys are also the file format of `tests/journeys/*.yaml`, which `lowdefy test` runs through this same route — write the journey the agent used to verify a change, and it becomes the regression test for it.

## Setting up a project — one command

```bash
npx lowdefy agent-setup
```

This writes three files into your project (merging safely if they exist): `.mcp.json` registering the `lowdefy-docs` MCP server, `.claude/skills/lowdefy-config/SKILL.md` teaching Claude Code the workflow, and an `AGENTS.md` section for other coding agents. Use `--port` if your dev server doesn't run on 3000.

## Using it with Claude Code manually

Add the MCP server to your project so Claude Code can use it. In your project directory run:

```bash
claude mcp add --transport http lowdefy-docs http://localhost:3000/lowdefy-docs/mcp
```

Or commit a `.mcp.json` file at your project root so the whole team gets it:

```json
{
  "mcpServers": {
    "lowdefy-docs": {
      "type": "http",
      "url": "http://localhost:3000/lowdefy-docs/mcp"
    }
  }
}
```

If your dev server runs on a different port, adjust the URL. The MCP server includes instructions that teach the agent the workflow (list types first, then fetch schemas and examples), so it works well without any extra prompting.

## Referencing it in a skill

For the best results, add a skill to your project that tells the agent to use the docs server whenever it writes Lowdefy config. Create `.claude/skills/lowdefy-config/SKILL.md`:

```markdown
---
name: lowdefy-config
description: Use when writing or editing Lowdefy YAML config — pages, blocks, operators, actions, connections, or requests. Looks up exact type names, schemas, and examples from the running dev server instead of guessing.
---

# Writing Lowdefy config

The dev server serves docs for everything installed in this project at
`http://localhost:3000/lowdefy-docs` (also as MCP tools via the `lowdefy-docs` server).

Never guess type names or properties. Before writing config:

1. Call `lowdefy_list_types` (or `GET /lowdefy-docs/blocks`, `/lowdefy-docs/operators`,
   `/lowdefy-docs/actions`, `/lowdefy-docs/connections`, `/lowdefy-docs/requests`) to find the exact
   type name — this includes this project's local plugins.
2. Call `lowdefy_get_schema` (or `GET /lowdefy-docs/schema/{kind}/{type}`) for the
   exact properties and events of that type.
3. Call `lowdefy_get_examples` (or `GET /lowdefy-docs/examples/{type}`) to see real
   usage YAML for blocks.
4. For concepts (state, operators, events, requests), call `lowdefy_get_doc`
   or `lowdefy_search_docs`.

After every edit, call `lowdefy_build_status` and fix what it reports. Use
`lowdefy_inspect_state` to read the live state of the page (ask the developer
to interact with it first when debugging), `lowdefy_eval_operator` to test
operator expressions against real state, and `lowdefy_snapshot_state` /
`lowdefy_load_state` to capture and restore app states for testing.
```

## Plain HTTP routes

Everything the MCP tools serve is also available as plain GET routes — useful for `curl`, scripts, or agents without MCP support:

| Route                       | Purpose                                                        |
| --------------------------- | -------------------------------------------------------------- |
| `GET /lowdefy-docs`                 | Overview and route index                                        |
| `GET /lowdefy-docs/{kind}`          | List all available types of a kind, e.g. `/lowdefy-docs/blocks`         |
| `GET /lowdefy-docs/plugins`         | Installed plugin packages and the types each provides           |
| `GET /lowdefy-docs/schema/{kind}/{type}` | JSON schema for a type, e.g. `/lowdefy-docs/schema/blocks/Button` |
| `GET /lowdefy-docs/examples/{type}` | Example YAML for a block type                                   |
| `GET /lowdefy-docs/content/{slug}`  | A docs page as markdown, e.g. `/lowdefy-docs/content/operators/_get`    |
| `GET /lowdefy-docs/search?q={query}`| Search the docs                                                 |
| `GET /lowdefy-docs/plugin-doc/{package}` | Markdown shipped inside a plugin package                   |
| `GET /lowdefy-docs/build-status`    | Current build errors/warnings + recent browser runtime errors   |
| `GET /lowdefy-docs/events`          | SSE stream of `restart`, `build`, `client_error` and `server_error` events |
| `GET /lowdefy-docs/page-config/{pageId}` | Fully built page config, or its build errors               |
| `GET /lowdefy-docs/screenshot/{pageId}` | PNG screenshot of the rendered page                         |
| `POST /lowdefy-docs/journey`        | Drive a page headless through declarative steps and assert what happens; screenshots returned as base64 |
| `GET /lowdefy-docs/find/{id}?pageId=` | Locate where a page/block/request id is defined               |
| `GET /lowdefy-docs/app-map`         | Whole-app graph: pages, menus, connections, endpoints, agents   |
| `GET /lowdefy-docs/inspect-state/{pageId}` | Live state/requests/eventLog of a running page (tab or headless) |
| `POST /lowdefy-docs/eval-operator`  | Evaluate an operator expression against live page state         |
| `POST /lowdefy-docs/run-request`    | Execute a request with a test payload (read-only unless opted in) |
| `POST /lowdefy-docs/run-endpoint`   | Execute an Api endpoint routine with a test payload and caller (needs `allowWriteRequests`; rejects return as data) |
| `GET/POST /lowdefy-docs/checkpoints` + `/revert` | Config-file checkpoints                            |
| `GET/POST /lowdefy-docs/state-checkpoints` + `/snapshot`, `/load` | State & data checkpoints          |
| `POST /lowdefy-docs/restart`        | Restart the dev server process (`{reason}` optional; poll `build-status` after ~2s) |

## Local plugins

Your project's own plugins (declared under `plugins:` in `lowdefy.yaml`) are included automatically:

- Types appear in `lowdefy_list_types` and `/lowdefy-docs/{kind}` listings.
- Block schemas are derived from each block's `meta`, and connection/request schemas from the `schema` property on your connection and request definitions.
- Ship a `gallery.yaml` or `examples.yaml` next to a block in your plugin's `dist/blocks/{BlockName}/` and it is served by `lowdefy_get_examples`.
- A `README.md` or `docs/*.md` files in your plugin package are served by `lowdefy_get_plugin_doc`.
- Editing a local plugin's server-side source (connections, requests, server operators, agents, websockets, notifications, auth) under its `src/` restarts the dev server automatically, so the new implementation is what runs. Block, action and client-operator edits hot-reload through Vite without a restart. If the server still looks stale, call `lowdefy_restart` or `POST /lowdefy-docs/restart`.

## Docs for crawling agents

The docs site itself serves agent-friendly formats: every page as raw markdown at `https://docs.lowdefy.com/md/{section}/{slug}.md`, an [llms.txt](https://llmstxt.org) index at `https://docs.lowdefy.com/llms.txt`, and the full documentation as one file at `https://docs.lowdefy.com/llms-full.txt`. Generic browser tools like Playwright MCP and Chrome DevTools MCP also work well against a running Lowdefy app — blocks render stable DOM ids matching their `blockId`.
