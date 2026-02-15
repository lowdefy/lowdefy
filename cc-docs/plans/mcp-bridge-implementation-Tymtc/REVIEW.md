# PLAN.md Critical Review

## Verdict

The plan correctly identifies the core opportunity — Lowdefy configs already define what users can do, so exposing that via MCP is natural. The architecture (reuse `@lowdefy/api`, build-time tool generation, pluggable auth) is sound. However, the plan has **one factual error that invalidates its biggest stated risk**, several structural gaps, and a **complete absence of session/state management** that would make the bridge usable for real agent workflows.

---

## Critical Errors

### 1. `_state` is NOT client-only — the plan's biggest "hard problem" doesn't exist

The plan states at line 23:

> The ServerParser does NOT normally have `_state` — it's a WebParser-only operator. This is the biggest architectural challenge.

**This is wrong.** Verified in the source:

- `_state` lives in `operators/shared/state.js` (not `client/`)
- It is exported in `operatorsServer.js` (line 44: `export { default as _state } from './operators/shared/state.js'`)
- `ServerParser` already accepts `state` in its constructor (line 20) and passes `state: this.state` to operators (line 74)
- `createEvaluateOperators` already destructures `state` from `context` (line 4) and passes it to `ServerParser`

**Consequence:** The entire McpParser class (Phase 2.1) is unnecessary. To make `_state` work in the MCP bridge, you simply set `context.state = virtualState` before `callRequest()` runs. The existing `createEvaluateOperators` picks it up automatically.

This also means **Option A's proposed change to `callRequest.js` is unnecessary.** The bridge just needs to set `context.state` on the context object it creates. The existing pipeline handles the rest.

### 2. `_global` IS client-only — the plan doesn't address this

While `_state` is shared, `_global` lives in `operators/client/global.js` and is NOT in the server operator set. If request properties use `_global` (which they can), the server won't resolve them. The plan doesn't mention this at all.

**Fix:** Either:
- Register `_global` in the MCP server's operator set (it's a trivial function that reads from an object)
- Or ensure global state is passed via `payload` instead

### 3. `_request` is client-only — request chaining won't work

The plan acknowledges request chaining as an "open question" (item 2) but doesn't address it. `_request` is a client operator. If action B's request properties reference `_request: result_of_A`, the server won't resolve it.

**Fix:** The MCP bridge needs to register `_request` in its operator set, backed by the virtual requests context it maintains during action chain execution.

---

## Structural Gaps

### 4. No session/state management (MAJOR)

The plan treats every tool call as stateless — build virtual state from params, execute, discard. This makes it impossible for an agent to:

- Work across multiple pages with shared global state
- Resume work later (long-running workflows)
- Refer to results from previous tool calls (`_request` in subsequent actions)
- Maintain the same guarantees a browser user gets (state persists across interactions)

**This is the single biggest gap.** A real agent workflow looks like:

```
Agent: "Create session for Q1 invoice processing"
Agent: "Fill in customer name and amount on create_invoice page"
Agent: "Submit the invoice"  ← needs state from previous call
Agent: "Query invoice list to verify"  ← needs global state from submission
Agent: [hours later] "Resume session, check invoice status"
```

Without persistent session state, the bridge is limited to atomic one-shot operations. That's useful but far less powerful than the "same guarantees as a browser user" promise.

**Required addition:** A session management system with:
- Session creation/resumption/closing as built-in MCP tools
- Per-session state mirroring the Engine model (`state` per page, `lowdefyGlobal` shared, `requests` per page, `inputs` per page)
- Pluggable persistence (filesystem, MongoDB, etc.)
- Session ID on every tool call

### 5. No `_input` handling

`_input` resolves from `lowdefy.inputs[pageId]` — data passed during page navigation. If request properties use `_input`, the bridge needs to handle this. The plan doesn't mention `_input` at all.

With session state, this resolves naturally — the session tracks `inputs[pageId]` per page.

### 6. `payload` resolution is backwards

The plan says (line 25):

> The `payload` field on requests uses operators that are parsed client-side by WebParser before being sent to the server.

This is correct — `Requests.callRequest()` in the Engine (line 70-76) parses `requestConfig.payload` using `WebParser` client-side, then sends the resolved payload to the server. The server's `callRequest` receives `payload` as already-resolved data.

But the plan then says it needs to evaluate payload operators server-side. The actual fix is simpler: the MCP bridge should evaluate payload operators the same way the Engine does — using the McpParser (or just a parser with the right operator set) before calling the API's `callRequest`. The bridge acts as both client and server.

### 7. Build code placement is wrong

The plan puts build-time code in `packages/servers/server-mcp/src/build/`. But Lowdefy's build pipeline lives in `packages/build/`. The MCP build step should be added there (as a new `buildMcp.js` alongside `buildConnections.js`, `buildPages.js`, etc.), not in the server package.

The server package should only contain runtime code. This matches the existing pattern where `@lowdefy/build` produces artifacts and `@lowdefy/server` consumes them.

### 8. `callRequest` already reads `context.state` — no API change needed

The plan proposes modifying `callRequest.js` (line 38) to support a custom `createEvaluateOperators` factory. But since `createEvaluateOperators` already reads `context.state`, and `_state` is already a server operator, no modification is needed.

The bridge just needs to:
1. Create an API context (like the existing `apiWrapper` does)
2. Set `context.state` to the virtual/session state
3. Call `callRequest` normally

Zero changes to `@lowdefy/api`.

---

## Design Concerns

### 9. Page classification is too simplistic

The `classifyPage` function uses a binary heuristic: has inputs + submit = action_form, has requests + no inputs = query_display. Real pages are messier:

- A page with a search bar + results table is both input and display
- A page with multiple independent forms (tabs) needs multiple tools
- A CRUD page with inline editing in a table doesn't fit either category
- Pages with conditional blocks (`visible` based on state) change shape

The plan acknowledges "mixed" as a category but doesn't handle it. Suggest: default to generating tools for ALL pages (every page with requests gets a tool), and let `mcp.exclude` handle opt-out. Don't try to be clever about classification.

### 10. `findSubmitEvents` is undefined and non-trivial

The plan references `findSubmitEvents(page)` repeatedly but never defines it. Finding the "submit" button requires walking the block tree, finding buttons, and determining which button's onClick chain contains Request actions. What about:

- Multiple buttons with different request chains
- Buttons nested deep in areas
- Non-button triggers (e.g., `onEnter` on a TextInput, `onChange` on a Selector)
- Page-level `onInit` that fires requests automatically

This is more complex than the plan suggests.

### 11. Auth API keys in YAML config is a security concern

The plan proposes putting API keys in `lowdefy.yaml`:

```yaml
mcp:
  auth:
    keys:
      - key: sk_live_abc123
```

API keys should never be in config files that get committed. They should use `_secret` operator like connection credentials, or be environment-variable-only.

### 12. blockTypeMap maintenance burden

A static map from block types to JSON Schema types must be updated every time a new block plugin is added. The `mcpSchema` static export is the right long-term solution, but the plan treats it as optional enhancement (Phase 4). Suggest: make `mcpSchema` the primary mechanism from day one, with `blockTypeMap` as a fallback for blocks that haven't been updated yet.

---

## What the Plan Gets Right

1. **Reusing `@lowdefy/api`** rather than reimplementing request execution. This is the correct architectural decision.

2. **Build-time tool generation** from page configs. Generating at build time means zero runtime overhead for tool discovery and the MCP server starts fast.

3. **Auth parity** with the web app. Using the same `authorize()` logic ensures agents get exactly the permissions humans get.

4. **The `mcp:` config extension** in `lowdefy.yaml` is well-designed — additive, opt-in, and uses the same patterns as existing config.

5. **API endpoints (`api:` config) as the easiest win.** These are already headless routines. Starting here would provide immediate value.

6. **`mcpSchema` and `mcpOutput` on blocks.** This is the right extensibility point for block authors to control agent interaction.

---

## Recommended Changes

### Must Fix
- Remove McpParser entirely — use existing ServerParser with `context.state`
- Add `_global`, `_request`, `_input` to the MCP operator set
- Add session state management as a core feature, not an afterthought
- Move build code to `packages/build/`, not `packages/servers/server-mcp/src/build/`
- Use `_secret` for API keys, not plaintext YAML

### Should Fix
- Simplify page classification — don't overthink it
- Define `findSubmitEvents` properly or replace with explicit `mcp.tools` config
- Make `mcpSchema` the primary block→schema mechanism
- Address `onInit`/`onInitAsync` lifecycle properly (execute on first tool call per page per session)

### Nice to Have
- Connection pooling for HTTP transport mode
- MCP resource subscriptions for real-time data
- Tool grouping by page/category for large apps
