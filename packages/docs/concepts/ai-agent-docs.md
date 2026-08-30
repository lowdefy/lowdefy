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
| `lowdefy_find_config`    | Which yaml file (and line) defines a given page, block, or request id    |
| `lowdefy_scaffold_page`  | Create a new page yaml file with a canonical minimal structure           |
| `lowdefy_app_map`        | The whole-app graph: every page, menu, connection, endpoint, and agent in one call |
| `lowdefy_inspect_state`  | The LIVE state, request results, and event log of a running page — reads your open browser tab, or runs the page headless |
| `lowdefy_eval_operator`  | Evaluate any operator expression against live page state — a REPL for config |
| `lowdefy_run_request`    | Execute a request with a test payload to verify data shape (read-only unless opted in) |
| `lowdefy_snapshot_state` | Capture live page state + request responses into a committable checkpoint folder |
| `lowdefy_load_state`     | Restore a state checkpoint — headless, or a `?_checkpoint=` URL for manual testing |
| `lowdefy_list_state_checkpoints` | List saved state checkpoints |
| `lowdefy_checkpoint_to_mocks` | Convert a state checkpoint into e2e `mocks.yaml` fixtures |
| `lowdefy_checkpoint`     | Snapshot all config files before risky changes                           |
| `lowdefy_revert_checkpoint` | Restore config files from a checkpoint                                |

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
4. Runtime errors from the browser (operator errors, block render errors) also appear in `lowdefy_build_status`, so problems that only show at runtime still reach the agent.

Some build warnings are only warnings in `lowdefy dev` — they fail `lowdefy build`. Those carry `"prodError": true` in `lowdefy_build_status`, are printed in the dev terminal as `[ConfigWarning · fails in prod] …`, and are badged **fails in prod** on a dark-orange bar in the browser error bar. Treat them as errors: the production build will not pass until they are fixed.

## Live state — the agent sees what you see

When you have a page open in your browser, the agent can read its **actual live state** — page state, request results, and the event log of recent actions — via `lowdefy_inspect_state`. Reproduce a problem by clicking through the app, then ask the agent to look: it inspects your exact tab, not a guess. `lowdefy_eval_operator` then evaluates any operator expression (like `{"_state": "customer.name"}`) against that same live context, so `_state`/`_request` binding bugs get debugged against real data. With no tab open, both tools run the page headless instead.

## Auth-protected pages

The headless renderer behind `lowdefy_screenshot_page` and `lowdefy_inspect_state` authenticates as a signed-in user, so pages with `auth.public: false` render for the agent instead of bouncing to the sign-in page. That default user carries **no roles**, so a page or request gated on a role still comes back refused or empty.

To act as a specific caller, pass `user` — every tool that renders a page headless accepts it: `lowdefy_screenshot_page`, `lowdefy_inspect_state`, `lowdefy_eval_operator` and `lowdefy_load_state`:

```json
{ "pageId": "users", "user": { "roles": ["admin"] } }
```

It is merged over the default user, so `{"roles": [...]}` is usually all you need. No auth engine runs for an injected caller, so nothing derives the rest of the record — include `email`, `profile` or `attributes` in the object if the page reads them. Every call opens its own browser context, so one call can act as an admin and the next as a plain member.

`user` applies to the headless renderer only — it is never applied to a page you open in your own browser, which carries your real session and cannot be re-identified. `lowdefy_inspect_state` and `lowdefy_eval_operator` normally prefer your open tab, so passing `user` selects the headless source instead; combining it with `source: "tab"` is an error rather than a silently ignored role, as is combining it with `lowdefy_load_state`'s `mode: "registry-only"` (that mode hands you a URL to open yourself). The plain HTTP routes take the same param: `?user={"roles":["admin"]}` on the GET routes, a `user` key in the body of `POST /lowdefy-docs/eval-operator` and `POST /lowdefy-docs/state-checkpoints/load`. They answer a malformed or contradictory `user` with a `400`, distinct from the `502` a failed render returns.

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

`lowdefy_run_request` executes a request with a test payload so the agent can verify the data shape a page will receive. Read-only request types (like `MongoDBFind`) always run. Write requests are refused unless you opt in:

```yaml
cli:
  agentTools:
    allowWriteRequests: true
```

This is dev-only — enable it when you're comfortable with the agent writing to your dev data.

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
| `GET /lowdefy-docs/page-config/{pageId}` | Fully built page config, or its build errors               |
| `GET /lowdefy-docs/screenshot/{pageId}` | PNG screenshot of the rendered page                         |
| `GET /lowdefy-docs/find/{id}?pageId=` | Locate where a page/block/request id is defined               |
| `GET /lowdefy-docs/app-map`         | Whole-app graph: pages, menus, connections, endpoints, agents   |
| `GET /lowdefy-docs/inspect-state/{pageId}` | Live state/requests/eventLog of a running page (tab or headless) |
| `POST /lowdefy-docs/eval-operator`  | Evaluate an operator expression against live page state         |
| `POST /lowdefy-docs/run-request`    | Execute a request with a test payload (read-only unless opted in) |
| `GET/POST /lowdefy-docs/checkpoints` + `/revert` | Config-file checkpoints                            |
| `GET/POST /lowdefy-docs/state-checkpoints` + `/snapshot`, `/load` | State & data checkpoints          |

## Local plugins

Your project's own plugins (declared under `plugins:` in `lowdefy.yaml`) are included automatically:

- Types appear in `lowdefy_list_types` and `/lowdefy-docs/{kind}` listings.
- Block schemas are derived from each block's `meta`, and connection/request schemas from the `schema` property on your connection and request definitions.
- Ship a `gallery.yaml` or `examples.yaml` next to a block in your plugin's `dist/blocks/{BlockName}/` and it is served by `lowdefy_get_examples`.
- A `README.md` or `docs/*.md` files in your plugin package are served by `lowdefy_get_plugin_doc`.

## Docs for crawling agents

The docs site itself serves agent-friendly formats: every page as raw markdown at `https://docs.lowdefy.com/md/{section}/{slug}.md`, an [llms.txt](https://llmstxt.org) index at `https://docs.lowdefy.com/llms.txt`, and the full documentation as one file at `https://docs.lowdefy.com/llms-full.txt`. Generic browser tools like Playwright MCP and Chrome DevTools MCP also work well against a running Lowdefy app — blocks render stable DOM ids matching their `blockId`.
