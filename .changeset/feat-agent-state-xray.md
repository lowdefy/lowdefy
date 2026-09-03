---
'@lowdefy/server-dev': minor
'@lowdefy/e2e-utils': minor
---

feat: Live state x-ray, state & data checkpoints, request execution, and app map for AI agents

The dev server's agent toolbelt grows from discovery and build feedback to full runtime visibility — 23 MCP tools total at `/lowdefy-docs/mcp`.

**Live state x-ray (`@lowdefy/server-dev`)**

- `lowdefy_inspect_state`: read the ACTUAL state, request results, and event log of a running page. When you have the page open in your browser it reads your live tab — reproduce a bug by clicking through the app, then let the agent look at exactly what you see. Falls back to a headless run otherwise.
- `lowdefy_eval_operator`: evaluate any operator expression (like `{"_state": "customer.name"}`) against live page state — a REPL for config, running in the real browser runtime.

**State & data checkpoints**

- `lowdefy_snapshot_state` captures a page's state and every request's recorded response into a committable `checkpoints/<name>/` folder — one file per part, one file per request, easy to review in git.
- `lowdefy_load_state` puts the app back into that state: recorded request data is served by the dev server automatically, and `?_checkpoint=<name>` on any page URL restores the state in a normal browser tab — hand a teammate a URL that opens the app mid-scenario.
- `lowdefy_checkpoint` / `lowdefy_revert_checkpoint` snapshot and restore config files around risky edits.

**Request execution and app understanding**

- `lowdefy_run_request` executes a request with a test payload to verify data shape. Read-only types always run; write requests need `cli.agentTools.allowWriteRequests: true` in lowdefy.yaml (dev-only opt-in).
- `lowdefy_app_map`: every page, menu, connection, endpoint, and agent in one call — onboard to a large app instantly.

**@lowdefy/e2e-utils**

- New `@lowdefy/e2e-utils/runtime` export: the runner-agnostic surface (navigation, state/request getters, mocking, page manager) usable outside the Playwright test runner. Assertions moved to `src/assertions/` — the package's public API is unchanged.
- Fixed `setState` silently doing nothing — it now uses the engine's real state primitives.
