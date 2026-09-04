When you run `lowdefy dev`, the development server also serves a documentation API and an [MCP](https://modelcontextprotocol.io) endpoint built for AI coding agents. It describes everything installed in _your_ project — every block, operator, action, connection and request type from core Lowdefy plugins _and_ your own local plugins — plus the full Lowdefy documentation as markdown. This means an agent like Claude Code never has to guess type names or property shapes: it can look up the exact schema, real examples, and the relevant docs page while it writes your config.

Everything is served under the `/lowdefy-docs` path of your dev server (default `http://localhost:3000`). No setup or configuration is needed — it is always on in dev, and never part of your production server.

> The `/lowdefy-docs` route prefix is reserved by the dev server. A page with `id: lowdefy-docs` will not be reachable in dev.

## The MCP endpoint

The dev server exposes an MCP server (streamable HTTP) at:

```
http://localhost:3000/lowdefy-docs/mcp
```

It provides these tools:

| Tool                             | Purpose                                                                                                                                                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lowdefy_overview`               | Start here — what is installed, counts per kind, and how to use the rest                                                                                                                                                                                                |
| `lowdefy_list_types`             | List ALL available types of a kind (blocks, operators, actions, connections, requests)                                                                                                                                                                                  |
| `lowdefy_list_plugins`           | Installed plugin packages, including local plugins, and the types each provides                                                                                                                                                                                         |
| `lowdefy_get_schema`             | JSON Schema for a specific type — all properties and events                                                                                                                                                                                                             |
| `lowdefy_get_examples`           | Real YAML usage examples for a block type                                                                                                                                                                                                                               |
| `lowdefy_get_doc`                | A Lowdefy docs page as markdown, by slug or by type name                                                                                                                                                                                                                |
| `lowdefy_search_docs`            | Keyword search over the Lowdefy docs                                                                                                                                                                                                                                    |
| `lowdefy_get_plugin_doc`         | Markdown (READMEs, guides) shipped inside an installed plugin package                                                                                                                                                                                                   |
| `lowdefy_build_status`           | Current build errors and warnings (with source file locations) plus recent browser runtime errors — call after every edit                                                                                                                                               |
| `lowdefy_get_page_config`        | The fully built config for a page, or its structured build errors                                                                                                                                                                                                       |
| `lowdefy_screenshot_page`        | PNG screenshot of a rendered page (headless Chromium) for visual verification                                                                                                                                                                                           |
| `lowdefy_find_config`            | Which yaml file (and line) defines a given page, block, or request id                                                                                                                                                                                                   |
| `lowdefy_scaffold_page`          | Create a new page yaml file with a canonical minimal structure                                                                                                                                                                                                          |
| `lowdefy_app_brief`              | A page (or the whole app) in one deterministic brief: what it reads and writes, the journeys and request tests covering it, its uncovered `(blockId, event)` triples, and what changed since a git ref                                                                  |
| `lowdefy_app_map`                | The whole-app graph: every page, menu, connection, endpoint, and agent in one call                                                                                                                                                                                      |
| `lowdefy_data_model`             | The app's data layer in one call: every collection with fields, relations, indexes, tenant verdict, connections, and which requests/steps/websockets read or write it                                                                                                   |
| `lowdefy_inspect_state`          | The LIVE state, request results, and event log of a running page — reads your open browser tab, or runs the page headless                                                                                                                                               |
| `lowdefy_eval_operator`          | Evaluate any operator expression against live page state — a REPL for config                                                                                                                                                                                            |
| `lowdefy_run_request`            | Execute a request with a test payload, as a given `user`, to verify data shape (read-only unless opted in)                                                                                                                                                              |
| `lowdefy_run_endpoint`           | Execute an Api endpoint routine with a test payload, as a given `user`, to see what it returns, rejects or throws (needs `allowWriteRequests`; a `:reject` comes back as data)                                                                                          |
| `lowdefy_snapshot_state`         | Capture live page state + request responses into a committable checkpoint folder                                                                                                                                                                                        |
| `lowdefy_load_state`             | Restore a state checkpoint — headless, or a `?_checkpoint=` URL for manual testing. Requests replay from the checkpoint until the next build unless `replayRequests: false`                                                                                             |
| `lowdefy_list_state_checkpoints` | List saved state checkpoints                                                                                                                                                                                                                                            |
| `lowdefy_restart`                | Restart the dev server process — after editing a local plugin's server-side code, or when `build_status` looks stale. Wait ~2s, then call `lowdefy_build_status`                                                                                                        |
| `lowdefy_checkpoint`             | Snapshot all config files before risky changes                                                                                                                                                                                                                          |
| `lowdefy_revert_checkpoint`      | Restore config files from a checkpoint                                                                                                                                                                                                                                  |
| `lowdefy_check`                  | Run every production build check offline — including the prod-only checks `lowdefy dev` hides — plus the check-only rules (js lint). Returns located errors and warnings; the same report as `lowdefy check --json`. Call before telling the developer a change is done |
| `lowdefy_run_journey`            | Drive a page headless through declarative steps (`click`, `fill`, `select`, `press`, `wait`, `screenshot`, `expect`) and assert state, visibility, text or url — verify behaviour, not just layout                                                                      |
| `lowdefy_measure_page`           | Measure what one state change costs the engine on a page: blocks re-evaluated, operator parses (total and per block expression), nodes copied, and p50/p95/max ms per update — with an optional journey to measure a real interaction                                   |
| `lowdefy_snapshot`               | Golden snapshot of a page as a named user under deterministic browser settings: the viewport PNG, the app root DOM, the page state and the page's `~snapshotIgnore` paths — what `lowdefy snapshot --check` diffs                                                       |
| `lowdefy_seed_fixture`           | Load a named fixture (`fixtures/<name>.yaml`) into the dev database through the connection layer so a page has data to show (needs `allowWriteRequests`; `reset` empties first)                                                                                         |
| `lowdefy_prod_errors`            | Production failures from the app log sink, grouped by `source`, `org`, `page` or `endpoint`, since the deploy or an ISO time — each group carries a resolved `source` and a `sample_rid`                                                                                |
| `lowdefy_prod_trace`             | Every production event carrying one `rid`, oldest first, each with its `source` or `config_key`                                                                                                                                                                         |
| `lowdefy_prod_slow`              | The slowest production work by duration percentile, grouped by event, endpoint, step, request and page                                                                                                                                                                  |
| `lowdefy_prod_repro`             | The events behind one `rid` with the page and block ids involved, as the raw material for a journey (`note: "compiler pending"`)                                                                                                                                        |

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
6. Under `auth.organizations.policy: tenant`, every request, endpoint step or websocket that ran with `tenant: none` appears under `devNotices` — each with the request or step id, the connection, the tenant field the wall would have used, and the yaml `source` (`file:line`) of the `tenant: none` declaration. These are not errors: `tenant: none` is the deliberate opt-out for caller-less contexts, but an unscoped read looks exactly like a scoped one, so the dev server flags every execution to keep the opt-outs visible while building. One entry is kept per config site per dev server process (a looped request does not flood the list); the store holds 50 and is cleared on restart. The browser error bar shows the same notices as an `unscoped reads (N)` group on an amber bar, and includes them in the copied text under `Unscoped reads (tenant: none):`.

### Events are pushed — no need to poll

The dev server pushes what changed instead of waiting to be asked. Two channels carry the same events:

- **MCP clients** receive them as `notifications/message` from logger `lowdefy` on the standalone GET stream of `/lowdefy-docs/mcp` (the server declares the `logging` capability, so any MCP client surfaces them). Failed builds arrive at level `error`, everything else at `info`.
- **Everything else** uses `GET /lowdefy-docs/events`, a Server-Sent Events stream — `curl -N http://localhost:3000/lowdefy-docs/events` — with one frame per event, named by the event type.

Every event carries `type` and an ISO `timestamp`. The five types:

| Type             | When                                                            | Carries                                                                                                                                               |
| ---------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `restart`        | First event on every connection                                 | `bootedAt` — the dev server process start time, so a reconnecting client can tell a restart from a dropped connection                                 |
| `build`          | Every time a rebuild finishes, success or failure               | `status`, `errorCount`, `warningCount`, `errors`, `warnings`, and `stale` / `staleSince` (see below)                                                  |
| `client_error`   | A browser reports a runtime error                               | The same entry `lowdefy_build_status` lists under `clientErrors`                                                                                      |
| `server_error`   | A request, endpoint, MCP tool or agent tool fails on the server | The same entry `lowdefy_build_status` lists under `serverErrors`                                                                                      |
| `fixture_seeded` | `lowdefy_seed_fixture` wrote a fixture into the dev database    | `name`, `reset` and `seeded` — per connection the `collection`, `deleted` and `inserted` counts — so a watching agent knows the data changed under it |

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

`lowdefy_build_status` reports what the dev build saw; `lowdefy_check` reports what a production build would say. Run `lowdefy_check` (or `lowdefy check --json` in a terminal) before declaring a change done — it runs the prod-stage validation without producing a build, so the `prodError` warnings above come back as errors.

## Live state — the agent sees what you see

When you have a page open in your browser, the agent can read its **actual live state** — page state, request results, and the event log of recent actions — via `lowdefy_inspect_state`. Reproduce a problem by clicking through the app, then ask the agent to look: it inspects your exact tab, not a guess. `lowdefy_eval_operator` then evaluates any operator expression (like `{"_state": "customer.name"}`) against that same live context, so `_state`/`_request` binding bugs get debugged against real data. With no tab open, both tools run the page headless instead.

A headless capture waits for the page's full async lifecycle before it reads anything: `onInit`, `onInitAsync`, `onMount` and `onMountAsync`, every in-flight request, and the first message on each websocket subscription. A page whose data arrives through an `onMountAsync` `Request` action is therefore captured with its data, not empty. If a page has not settled within 15 seconds the result is still returned, carrying `ready: false` and a note — read that result as a snapshot of a page that was still loading, not as the page's settled state. One case escapes the wait: an event with a `debounce` is not yet marked loading during its delay, so a debounced `onMountAsync` can be captured before it runs.

## Auth-protected pages

The headless renderer behind `lowdefy_screenshot_page` and `lowdefy_inspect_state` authenticates as a signed-in user, so pages with `auth.public: false` render for the agent instead of bouncing to the sign-in page. That default user carries **no roles**, so a page or request gated on a role still comes back refused or empty.

To act as a specific caller, pass `user` — every tool that renders a page headless accepts it, as do `lowdefy_run_request` and `lowdefy_run_endpoint`: `lowdefy_screenshot_page`, `lowdefy_run_journey`, `lowdefy_inspect_state`, `lowdefy_eval_operator`, `lowdefy_load_state`, `lowdefy_run_request` and `lowdefy_run_endpoint`:

```json
{ "pageId": "users", "user": { "roles": ["admin"] } }
```

A caller you use often is better declared once as a named fixture under `auth.dev.users` in `lowdefy.yaml`, and then named by any tool's `user`:

```json
{ "pageId": "users", "user": "admin" }
```

A name that is not declared is a `400` (an MCP error result), listing the names that are declared — never a silent fall back to the roleless default, which renders an empty page that reads like a working one. See [Auth Configuration](/auth-configuration#named-dev-users-dev-server-only).

An inline object is merged over the default user, so `{"roles": [...]}` is usually all you need. No auth engine runs for an injected caller, so nothing derives the rest of the record — include `email`, `profile` or `attributes` in the object if the page reads them. Every call opens its own browser context, so one call can act as an admin and the next as a plain member.

`user` applies to the headless renderer only — it is never applied to a page you open in your own browser, which carries your real session and cannot be re-identified. `lowdefy_inspect_state` and `lowdefy_eval_operator` normally prefer your open tab, so passing `user` selects the headless source instead; combining it with `source: "tab"` is an error rather than a silently ignored role, as is combining it with `lowdefy_load_state`'s `mode: "registry-only"` (that mode hands you a URL to open yourself). The plain HTTP routes take the same param, name or object: `?user=admin` or `?user={"roles":["admin"]}` on the GET routes, a `user` key in the body of `POST /lowdefy-docs/eval-operator`, `POST /lowdefy-docs/state-checkpoints/load`, `POST /lowdefy-docs/run-request` and `POST /lowdefy-docs/run-endpoint`. They answer a malformed or contradictory `user` with a `400`, distinct from the `502` a failed render returns.

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
- **Replay is a mode, not a copy**: while a checkpoint is loaded with `replayRequests` on (the default), every browser tab's page requests are answered from the recorded responses instead of the database, until the next build or `lowdefy_revert_checkpoint`. Pass `replayRequests: false` to restore the state and still hit the real connections. To put data into an [e2e test](/e2e-introduction), write fixtures and request tests rather than exporting a checkpoint.

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

## Seeding fixtures

A list page cannot be seen to work while its collection is empty. `lowdefy_seed_fixture` (or `POST /lowdefy-docs/seed-fixture`) loads a named [fixture](/fixtures) — `fixtures/<name>.yaml` in the app, documents keyed by `connectionId`, the same files request tests use — into the dev database:

```json
{ "name": "base", "reset": true }
```

It writes to the developer's real dev database, so it is refused unless `cli.agentTools.allowWriteRequests: true` is set, answering `refused: true` with the reason and how to enable it. Every key is written through the connection layer as a `MongoDBInsertMany`, so operator-valued connection properties resolve and a connection without `write: true` refuses with its normal error. `reset` defaults to `false` — documents are added on top of what is there; `reset: true` first empties every collection the fixture names, and only those. Documents are inserted exactly as written, never tenant-stamped, so a fixture carries its own tenant fields. The result lists `seeded: [{ connectionId, collection, deleted, inserted }]`, or `error: { name, message }` with what was seeded before the failure. Every seed is logged as `agent_seed_fixture` and pushed as a `fixture_seeded` event.

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

## Measuring a page — `lowdefy_measure_page`

A page that feels slow to type in is usually not slow to render — it is slow to evaluate. Every state change makes the engine walk every block on the page and parse nine expressions per block (`visible`, `properties`, `required`, `class`, `style`, `layout`, `loading`, `skeleton`, `slotsLayout`) plus one per validation test, and a change that flips a block's visibility runs the whole cascade again, up to twenty times. `lowdefy_measure_page` (or `POST /lowdefy-docs/measure-page`) opens the page headless, turns the engine's counters on once the page has settled, drives it, and reports what one state change actually cost:

```json
{
  "pageId": "customers",
  "blocks": 214,
  "updates": 6,
  "blockVisits": 1284,
  "parses": { "total": 11556, "byKind": { "properties": 1284, "visible": 1284 } },
  "copyNodes": 98342,
  "msPerUpdate": { "p50": 8.4, "p95": 19.1, "max": 22.7 },
  "heaviestBlocks": [{ "blockId": "row_total", "parses": 60, "ms": 14.2, "nodes": 3120 }],
  "verdict": "1926 parses per state update on 214 blocks (6 updates from 6 synthetic updates, p50 8.4ms, p95 19.1ms per update)."
}
```

Pass `steps` (the `lowdefy_run_journey` grammar) to measure a real interaction — typing into a form is the case that matters — and omit them to measure synthetic state updates on the loaded page. The counters cost nothing when nobody asks for them: the engine only allocates them for a session that turned them on, and only a dev build exposes the switch.

Measure before optimising and again after, on the same page and the same steps. The `verdict` line is the number that decides whether operator evaluation is worth compiling away rather than tuning config: if a keystroke on the heaviest page is a few hundred parses and a millisecond, the walker is not the problem and the page's own config is.

## Explaining a request — `explain: true`

Between the YAML you write and the query the database runs, two invisible transformations happen: operators in the connection and request properties are evaluated, and on a [tenant-walled](/organizations#the-tenant-wall) connection the wall rewrites what it received — a `$match` prepended at the root of an aggregation and inside every `$lookup` / `$unionWith` sub-pipeline, find/update/delete selectors merged with the tenant equality, written documents stamped. A request that returns `[]` for no visible reason is usually one of these.

Pass `explain: true` to `lowdefy_run_request` or `lowdefy_run_endpoint` (or in the body of `POST /lowdefy-docs/run-request` / `POST /lowdefy-docs/run-endpoint`) and the result gains an `explain` key. It is non-behavioural: the request runs exactly as it would without the flag, and without the flag nothing is collected.

```json
{ "pageId": "search", "requestId": "search_records", "user": "org_admin", "explain": true }
```

```json
"explain": {
  "caller": { "id": "u_1", "organization_id": "org_1", "roles": ["admin"] },
  "connection": { "id": "app_data", "type": "MongoDBCollection", "tenant": { "field": "organization_id", "value": "org_1" } },
  "properties": { "pipeline": [{ "$match": { "status": "open" } }, { "$lookup": { "from": "controls", "as": "c", "pipeline": [] } }] },
  "effective": {
    "pipeline": [
      { "$match": { "organization_id": "org_1" } },
      { "$match": { "status": "open" } },
      { "$lookup": { "from": "controls", "as": "c", "pipeline": [{ "$match": { "organization_id": "org_1" } }] } }
    ]
  },
  "rewritten": [
    { "at": "$lookup[1].pipeline", "injected": { "$match": { "organization_id": "org_1" } } },
    { "at": "$match[0]", "injected": { "$match": { "organization_id": "org_1" } } }
  ]
}
```

- `caller` — exactly `id`, `organization_id` and `roles` of the user the request ran as. Nothing else from the session is ever included.
- `connection` — the connection id and type, and the tenant verdict the wall applied (`{ field, value }`, `{ field, value, authored: true }` for a `tenant: authored` request, or `null` when the request is unscoped).
- `properties` — the request `properties` after operator evaluation: what the resolver received.
- `effective` — what the driver received. MongoDB request types report `{ pipeline, options }` (aggregation), `{ query, options }` (find), `{ filter, update, options }` (updates), `{ filter, options }` (deletes), `{ doc, options }` / `{ docs, options }` (inserts) and `{ operations, options }` (bulk write). A request type that does not report one yields `effective: null` and a `note` saying so.
- `rewritten` — one entry per clause the tenant wall injected. `at` is a path into the properties you wrote: `$match[0]` for the root prepend, `$lookup[<i>].pipeline`, `$unionWith[<i>].pipeline` and `$facet.<branch>` composed as the wall descends, and the property name (`query`, `filter`, `doc`, `docs[<i>]`, `update.$setOnInsert`, `operations[<i>].updateOne.filter`) for selectors and documents. An audited `tenant: authored` stage records `{ at: "$search[0]", audited: true }` instead of `injected`. An empty array on a walled connection means the wall changed nothing.

For an endpoint, `explain` is an array with one entry per request step, each carrying its `stepId`; control steps (`:if`, `:set_state`, …) contribute nothing. When a request run fails, the trace collected up to the failure is still returned beside `error`.

When a request returns an empty or unexpected result on a multi-tenant app, re-run it with `explain: true` before changing config — the wall's injected clauses are the usual cause, and the `rewritten` entries name the exact stage.

## Data model — `lowdefy_data_model`

Answering "what is in the `answers` collection, who reads it, who writes it, and which field points at `evidence`" used to mean opening every page, endpoint and connection file. `lowdefy_data_model` (or `GET /lowdefy-docs/data-model`) assembles the answer from the build artifacts in one call — offline, no database introspection, no row counts.

The collection set starts from the app's [`collections:` declaration](/collections) and adds every collection a connection names with a literal `properties.collection`, plus any collection a literal aggregation pipeline joins or writes — so the tool is useful in an app that declares nothing. Each collection reports:

- `declared` — whether `collections:` declares it. `fields`, `relations` and `indexes` come straight from the declaration and are empty when undeclared.
- `tenant` — the declared value when there is one; otherwise the connections' tenant verdict when they agree; otherwise `{ conflict: [...] }` naming the disagreeing connections. An undeclared connection under `auth.organizations.policy: tenant` reads as scoped on the default field, as the build resolved it.
- `connections` — `{ connectionId, type, read, write, tenant }` for every connection addressing it (`read` defaults `true`, `write` defaults `false`, matching `MongoDBCollection`).
- `readers` and `writers` — every page request, routine step (however deeply nested in `:if` / `:try` / `:for`) and websocket that touches it, each as `{ kind, pageId?, requestId?, endpointId?, stepId?, websocketId?, type, connectionId, via, source }`, where `source` is the `file:line` that defines it.

```json
{
  "collections": {
    "answers": {
      "declared": true,
      "tenant": { "field": "organization_id" },
      "fields": { "test_id": { "type": "string" } },
      "relations": { "test_id": { "collection": "tests", "field": "_id" } },
      "indexes": [],
      "connections": [
        {
          "connectionId": "answers_rw",
          "type": "MongoDBCollection",
          "read": true,
          "write": true,
          "tenant": { "field": "organization_id" }
        }
      ],
      "readers": [
        {
          "kind": "request",
          "pageId": "answers",
          "requestId": "get_answers",
          "type": "MongoDBFind",
          "connectionId": "answers_rw",
          "via": "request",
          "source": "pages/answers.yaml:42"
        }
      ],
      "writers": [
        {
          "kind": "step",
          "endpointId": "submit_answer",
          "stepId": "insert",
          "type": "MongoDBInsertOne",
          "connectionId": "answers_rw",
          "via": "step",
          "source": "api/submit.yaml:12"
        }
      ]
    }
  },
  "unresolved": [],
  "note": "No collections: declared in lowdefy.yaml — fields and relations are empty. See /lowdefy-docs/content/concepts/collections."
}
```

**How readers and writers are classified.** The request type's own `meta` (`checkRead` / `checkWrite`, the same flags `lowdefy_run_request` uses to gate writes) decides: `checkWrite: true` is a writer, otherwise `checkRead: true` is a reader — no list of type names that could go stale. On top of that, literal aggregation pipelines are scanned: `$lookup.from`, `$graphLookup.from` and `$unionWith` add read edges on the named collections with `via: "$lookup"`; `$merge.into` and `$out` add write edges with `via: "$merge"`. An aggregation is `checkRead: true, checkWrite: false`, so without the scan a `$merge` writer would be reported as a reader. A websocket is always a reader (`via: "websocket"`).

**Nothing is dropped silently.** Anything that could not be joined lands in `unresolved` with a reason — a connection whose `collection` is an operator, a request with no `connectionId`, a request on a connection that does not exist, a pipeline stage whose target is not a literal — because a missing edge reads as "nothing writes this collection", which is worse than saying so. `unbuiltPages` names pages whose requests could not be read yet (pages are built on first visit in dev), and `note` appears only when the app declares no `collections:` at all.

Like every other dev response, the result carries `stale: true` while the last build failed.

## Setting up a project — one command

```bash
npx lowdefy agent-setup
```

This writes four things into your project (merging safely if they exist): `.mcp.json` registering the `lowdefy-docs` MCP server, `.claude/settings.json` enabling that server and the post-edit hook (below), the Lowdefy skills under `.claude/skills/` (see below), and an `AGENTS.md` section for other coding agents. Use `--port` if your dev server doesn't run on 3000.

## Hooks — verification the agent cannot forget

`agent-setup` installs a Claude Code **post-edit hook**: `.claude/hooks/lowdefy-build-status.mjs`, registered as a `PostToolUse` hook for `Edit|Write|MultiEdit` in `.claude/settings.json`. After the agent edits a file inside the config directory, the hook reads the dev manager's lock file (`.lowdefy/dev/.manager.lock`) for the running server's port, waits for the rebuild that edit triggered, and hands the agent the build errors and warnings plus the newest server and browser errors — the same payload as `GET /lowdefy-docs/build-status`. It is a few milliseconds of HTTP, not a build, so it can run on every edit.

The hook is deliberately quiet: no dev server running, no lock file, a clean build, or an edit outside the config directory all exit 0 with no output. `.claude/settings.json` is committed, so the hook runs on every teammate's machine — including those who never start a dev server, for whom it does nothing.

The **pre-commit hook** is opt-in, because a hook that fails a commit is a bigger imposition:

```bash
npx lowdefy agent-setup --git-hooks
```

This writes `.claude/hooks/lowdefy-pre-commit.mjs` and wires it into the project's existing hook manager — a `lefthook.yml` command or `.husky/pre-commit` if either is there, otherwise `.git/hooks/pre-commit`. On commit it runs `lowdefy check --json` over the staged config (the full production build, which the post-edit hook deliberately does not do), then the journeys that cover the pages the staged files touch, read from the `page → journeys` index `lowdefy test --coverage` writes to `.lowdefy/test/journeyIndex.json`. Without that index it runs every journey and says so. The runner drives an already-running dev server when it finds one, so the hook does not start a second server.

To remove either hook, delete the script under `.claude/hooks/` and the entry that calls it — the `PostToolUse` group in `.claude/settings.json`, or the line in your pre-commit hook. `agent-setup` never overwrites a hook script you have edited; delete it and rerun to regenerate.

## Skills — the framework's manual for agents

Beside `lowdefy-config`, which teaches the lookup workflow, `agent-setup` installs 28 topic skills. Each is a Claude Code skill (`.claude/skills/<name>/SKILL.md`) an agent loads when the task matches its description, with a **Reference** section generated from the docs and plugin schemas of the installed Lowdefy version and a hand-written **Recipe** section: the order to build things in, the traps, which MCP tool supersedes it, and how to verify.

| Skill                       | Use when                                                      |
| --------------------------- | ------------------------------------------------------------- |
| `lowdefy-aggregations`      | grouped, counted or joined data from MongoDB behind a request |
| `lowdefy-aggrid-tables`     | a data table with AgGrid                                      |
| `lowdefy-api-routines`      | server-side logic as an `Api` endpoint routine                |
| `lowdefy-block-plugins`     | a custom React block plugin                                   |
| `lowdefy-change-stamps`     | created/updated audit fields on records                       |
| `lowdefy-charts`            | a chart from request data with `EChart`                       |
| `lowdefy-contact-fields`    | names, email, phone and address fields on a form              |
| `lowdefy-data-schema`       | designing a collection's document shape                       |
| `lowdefy-detail-pages`      | a page that shows one record                                  |
| `lowdefy-edit-pages`        | a create/edit form page                                       |
| `lowdefy-enums`             | a field with a fixed set of values                            |
| `lowdefy-events`            | wiring events to action chains                                |
| `lowdefy-file-structure`    | laying out a project's files and `_ref`s                      |
| `lowdefy-filters`           | filter controls over a list or table                          |
| `lowdefy-form-validation`   | `required`, `validate` rules and the `Validate` action        |
| `lowdefy-js-operator`       | the `_js` escape hatch and when to use an operator instead    |
| `lowdefy-layout`            | arranging blocks with the grid, `Box` and `Flex`              |
| `lowdefy-list-pages`        | a page that lists records from a request                      |
| `lowdefy-lists`             | repeating blocks over an array with `List`/`ControlledList`   |
| `lowdefy-loading-skeletons` | skeletons while requests run                                  |
| `lowdefy-modules`           | installing or authoring a module                              |
| `lowdefy-notifications`     | user feedback after an action                                 |
| `lowdefy-operators`         | writing operator expressions                                  |
| `lowdefy-page-layouts`      | the page frame: sidebar, header and menus                     |
| `lowdefy-pagination`        | paging a long list                                            |
| `lowdefy-status-enums`      | a record that moves through statuses                          |
| `lowdefy-status-fields`     | tags, badges and switches for status values                   |
| `lowdefy-styling`           | `style`, `class`, theme tokens and custom CSS                 |

Choose which to install with `--skills`:

```bash
npx lowdefy agent-setup                                          # all 28 plus lowdefy-config
npx lowdefy agent-setup --skills lowdefy-list-pages,lowdefy-filters
npx lowdefy agent-setup --skills none                            # only lowdefy-config
```

An unknown name is an error that lists the available skills. Files that already exist in `.claude/skills/` are never overwritten, so a project can edit a skill and keep its edits across upgrades. The skills are maintained in the Lowdefy repository under `skills/` and regenerated for every release, so the Reference section always describes the version you have installed; the live versions of the same schemas and docs are one `lowdefy_get_schema` or `lowdefy_get_doc` call away on the running dev server.

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

| Route                                                             | Purpose                                                                                                                      |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `GET /lowdefy-docs`                                               | Overview and route index                                                                                                     |
| `GET /lowdefy-docs/{kind}`                                        | List all available types of a kind, e.g. `/lowdefy-docs/blocks`                                                              |
| `GET /lowdefy-docs/plugins`                                       | Installed plugin packages and the types each provides                                                                        |
| `GET /lowdefy-docs/schema/{kind}/{type}`                          | JSON schema for a type, e.g. `/lowdefy-docs/schema/blocks/Button`                                                            |
| `GET /lowdefy-docs/examples/{type}`                               | Example YAML for a block type                                                                                                |
| `GET /lowdefy-docs/content/{slug}`                                | A docs page as markdown, e.g. `/lowdefy-docs/content/operators/_get`                                                         |
| `GET /lowdefy-docs/search?q={query}`                              | Search the docs                                                                                                              |
| `GET /lowdefy-docs/plugin-doc/{package}`                          | Markdown shipped inside a plugin package                                                                                     |
| `GET /lowdefy-docs/build-status`                                  | Current build errors/warnings + recent browser runtime errors                                                                |
| `GET /lowdefy-docs/events`                                        | SSE stream of `restart`, `build`, `client_error`, `server_error` and `fixture_seeded` events                                 |
| `GET /lowdefy-docs/page-config/{pageId}`                          | Fully built page config, or its build errors                                                                                 |
| `GET /lowdefy-docs/screenshot/{pageId}`                           | PNG screenshot of the rendered page                                                                                          |
| `GET /lowdefy-docs/snapshot/{pageId}`                             | Golden snapshot under deterministic browser settings: screenshot, DOM, state and the page's `~snapshotIgnore` paths          |
| `GET /lowdefy-docs/dev-users`                                     | Names of the `auth.dev.users` fixtures headless tools can render as                                                          |
| `POST /lowdefy-docs/journey`                                      | Drive a page headless through declarative steps and assert what happens; screenshots returned as base64                      |
| `GET /lowdefy-docs/find/{id}?pageId=`                             | Locate where a page/block/request id is defined                                                                              |
| `GET /lowdefy-docs/inspect-state/{pageId}`                        | Live state/requests/eventLog of a running page (tab or headless)                                                             |
| `POST /lowdefy-docs/eval-operator`                                | Evaluate an operator expression against live page state                                                                      |
| `POST /lowdefy-docs/run-request`                                  | Execute a request with a test payload (read-only unless opted in)                                                            |
| `POST /lowdefy-docs/run-endpoint`                                 | Execute an Api endpoint routine with a test payload and caller (needs `allowWriteRequests`; rejects return as data)          |
| `POST /lowdefy-docs/seed-fixture`                                 | Load `fixtures/{name}.yaml` into the dev database through the connection layer (`{name, reset}`; needs `allowWriteRequests`) |
| `GET /lowdefy-docs/app-map`                                       | Whole-app graph: pages, menus, connections, endpoints, agents                                                                |
| `GET /lowdefy-docs/data-model`                                    | Data layer: collections, fields, relations, tenant verdicts, connections, readers and writers, `unresolved`                  |
| `GET/POST /lowdefy-docs/checkpoints` + `/revert`                  | Config-file checkpoints                                                                                                      |
| `GET/POST /lowdefy-docs/state-checkpoints` + `/snapshot`, `/load` | State & data checkpoints                                                                                                     |
| `POST /lowdefy-docs/restart`                                      | Restart the dev server process (`{reason}` optional; poll `build-status` after ~2s)                                          |
| `GET /lowdefy-docs/ops/errors?since=&group_by=&limit=`            | Production failures from the log sink, grouped (the `lowdefy_prod_errors` twin)                                              |
| `GET /lowdefy-docs/ops/trace/{rid}`                               | Every production event carrying one request id                                                                               |
| `GET /lowdefy-docs/ops/slow?endpoint_id=&page_id=&percentile=`    | The slowest production work by duration percentile                                                                           |
| `GET /lowdefy-docs/ops/repro/{rid}`                               | The events behind one request id, with the page and block ids involved                                                       |
| `ALL /lowdefy-docs/mcp`                                           | The MCP endpoint (streamable HTTP) exposing all of the above as tools                                                        |

## Production telemetry — the `lowdefy_prod_*` tools, and how they are locked

The four `lowdefy_prod_*` tools query the log sink your app ships events to with [`logger.otlp`](/concepts/logger), so an agent can go from a production failure to the yaml line that caused it in one hop. Every row carries `source` (a `file:line`) when the event's `git_sha` matches the build the dev server is running, resolved through that build's `keyMap.json`; when the shas differ the row keeps its raw `config_key` and says why, so you know to check out that revision. Feed `source` to `lowdefy_find_config` and `sample_rid` to `lowdefy_prod_trace`.

**Retention is the sink's, not Lowdefy's.** Nothing older than the sink's retention window can be queried — assume 30 days unless your sink is configured otherwise. A `rid` from last quarter returns no events, not an error.

The dev MCP endpoint has **no authentication of its own** — the loopback bind is its entire security boundary — and these tools put production data behind it. So they are locked, and the lock is checked on **every call**, not at startup:

1. **Separate read-only credentials.** All three of `LOWDEFY_OPS_QUERY_URL`, `LOWDEFY_OPS_READ_TOKEN` and `LOWDEFY_OPS_DATASET` must be set in the dev environment.
2. **The read token may never be a write credential.** If `LOWDEFY_OPS_READ_TOKEN` holds the same value as any `LOWDEFY_SECRET_*` variable, or as a header written inline under `logger.otlp.headers`, every query is refused and names the collision. Issue a read-only query token at the sink.
3. **Loopback only.** If the dev server was reached on anything but `localhost` / `127.0.0.0/8` / `::1` — a tunnel, a port forward, `--host 0.0.0.0` reached on a LAN address — the tools refuse. The check is on the host the request arrived with, so a tunnel in front of a loopback bind is caught too.
4. **The app can refuse them outright.** Set `config.ops.enabled: false` in `lowdefy.yaml` and no credential enables them. Recommended for apps whose connections are tenant-walled — a dev server with ops credentials logs one `warn` line at boot to say so.

The tools are always **registered** and refuse at call time with a `howToEnable` message, so an agent learns what the tool is and what you have to do rather than never seeing it.

**Every query is audited.** Each call — the ones that ran and the ones that were refused — writes an `ops_query` line to the dev terminal and a dev notice, so `lowdefy_build_status` shows you what production data was asked for while you were not watching.

```yaml
# lowdefy.yaml
config:
  ops:
    enabled: false # refuse the dev MCP ops tools for this app
```

```bash
# .env.development — a read-only query credential, never the ingest token
LOWDEFY_OPS_QUERY_URL=https://api.axiom.co
LOWDEFY_OPS_READ_TOKEN=xaqt-read-only-...
LOWDEFY_OPS_DATASET=my-app-prod
```

Set `LOWDEFY_OPS_QUERY_URL` to a `file://` path instead and the same four tools run over a saved JSONL export of your logs, with no network access at all — useful on a laptop, or when you only have a downloaded log file.

## Local plugins

Your project's own plugins (declared under `plugins:` in `lowdefy.yaml`) are included automatically:

- Types appear in `lowdefy_list_types` and `/lowdefy-docs/{kind}` listings.
- Block schemas are derived from each block's `meta`, and connection/request schemas from the `schema` property on your connection and request definitions.
- Ship a `gallery.yaml` or `examples.yaml` next to a block in your plugin's `dist/blocks/{BlockName}/` and it is served by `lowdefy_get_examples`.
- A `README.md` or `docs/*.md` files in your plugin package are served by `lowdefy_get_plugin_doc`.
- Editing a local plugin's server-side source (connections, requests, server operators, agents, websockets, notifications, auth) under its `src/` restarts the dev server automatically, so the new implementation is what runs. Block, action and client-operator edits hot-reload through Vite without a restart. If the server still looks stale, call `lowdefy_restart` or `POST /lowdefy-docs/restart`.

## Docs for crawling agents

The docs site itself serves agent-friendly formats: every page as raw markdown at `https://docs.lowdefy.com/md/{section}/{slug}.md`, an [llms.txt](https://llmstxt.org) index at `https://docs.lowdefy.com/llms.txt`, and the full documentation as one file at `https://docs.lowdefy.com/llms-full.txt`. Generic browser tools like Playwright MCP and Chrome DevTools MCP also work well against a running Lowdefy app — blocks render stable DOM ids matching their `blockId`.
