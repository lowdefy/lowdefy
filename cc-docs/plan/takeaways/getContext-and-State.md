# getContext + State — Key Takeaways for MCP Bridge

**Files:**
- `packages/engine/src/getContext.js`
- `packages/engine/src/State.js`

## What They Do

`getContext` creates a page context in the browser. `State` manages the state object for that context. Together they define the state model that the MCP bridge's session system must replicate.

## The State Model

A page context contains:

```javascript
const ctx = {
  id,                     // Page ID (also used as context key)
  pageId,                 // Page identifier from config
  eventLog: [],           // Append-only history of all events
  jsMap,                  // Custom JS code
  requests: {},           // { requestId: [{ response, loading, error, ... }] }
  state: {},              // { blockId: value, ... } — flat with dot-notation keys
  _internal: { ... },     // Engine internals (parser, State class, Areas, etc.)
};
```

Shared across all page contexts:

```javascript
lowdefy.lowdefyGlobal    // Global state — persists across page navigations
lowdefy.inputs           // { pageId: { ...routeParams } } — per-page input
lowdefy.contexts         // { pageId: ctx } — memoized page contexts
```

## State Lifecycle

1. **Creation:** `state = {}` (empty object)
2. **Block init:** Each input block calls `State.set(blockId, initialValue)` during `Areas.init()`
3. **Freeze:** After `onInit` events run, `State.freezeState()` captures a serialized snapshot
4. **Mutation:** User interactions call `State.set(field, value)` via `setValue` on blocks
5. **Reset:** `State.resetState()` restores to the frozen snapshot

## Session State Design

For the MCP bridge, each session must maintain:

```javascript
{
  sessionId: 'sess_abc',
  userId: 'user_123',
  lowdefyGlobal: { ... },              // Shared across all pages in session
  inputs: { pageId: { ... } },         // Per-page route params
  contexts: {
    [pageId]: {
      state: { ... },                  // Block values
      requests: { requestId: [...] },  // Request history
      frozenState: '...',              // Serialized initial state (for Reset)
      initialized: false,              // Whether onInit has run
    }
  }
}
```

## Key Behaviors to Replicate

1. **Context memoization:** `getContext` returns existing context if already created (line 68-72). The session store serves this purpose — load existing page context from session, don't recreate.

2. **State freezing:** After `onInit`, state is frozen as the "clean" state. The session should track `frozenState` per page for `Reset` action support.

3. **Request arrays:** Requests are stored as arrays with newest first (`unshift`). Previous results remain accessible. The session must maintain this array structure.

4. **Global state sharing:** `lowdefyGlobal` is one object shared across all page contexts. When an agent calls `SetGlobal` on page A, page B's subsequent tool calls see the change.

5. **Input persistence:** `inputs[pageId]` is set once during page navigation and not modified. In the MCP bridge, inputs could be set when the agent first interacts with a page within a session.

## State.js Methods to Support

| Method | MCP equivalent |
|---|---|
| `set(field, value)` | Apply tool params to session page state |
| `del(field)` | Remove keys (for SetState with null values) |
| `freezeState()` | Serialize and store initial state in session |
| `resetState()` | Restore from frozen snapshot |
| `swapItems(field, from, to)` | List reordering (if lists are supported) |
| `removeItem(field, index)` | List item deletion |
