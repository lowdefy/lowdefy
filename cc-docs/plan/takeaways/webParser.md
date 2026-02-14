# WebParser — Key Takeaways for MCP Bridge

**File:** `packages/operators/src/webParser.js`

## What It Does

Client-side operator evaluation. Used by the Engine when rendering blocks and preparing request payloads in the browser.

## What It Has That ServerParser Doesn't

These properties are pulled from `this.context._internal.lowdefy`:

- **`lowdefyGlobal`** — shared app-wide state. Operators: `_global`
- **`inputs[context.id]`** — per-page route params. Operators: `_input`
- **`this.context.requests`** — request results. Operators: `_request`
- **`_internal.globals`** — `window`, `document`, `fetch`. Operators: `_media`, `_location`
- **`event`** — current event data. Operators: `_event`
- **`eventLog`** — history of all events
- **`apiResponses`** — responses from API endpoints
- **`menus`** — navigation menu data

## Why This Matters for MCP

Request `payload` is evaluated CLIENT-SIDE by WebParser before being sent to the server. Example:

```yaml
requests:
  - id: save_user
    payload:
      name:
        _state: name_input          # Evaluated by WebParser (client)
      company:
        _global: currentCompany     # Evaluated by WebParser (client)
    properties:
      doc:
        _payload: name              # Evaluated by ServerParser (server)
```

The MCP bridge acts as BOTH client and server. It must:
1. Evaluate `payload` operators (like WebParser does) using session state
2. Then call `callRequest` which evaluates `properties` operators (like ServerParser does)

This two-phase evaluation is the actual architectural challenge, not `_state` support.

## Session State Mapping

To replicate WebParser's context, an MCP session needs:

| WebParser source | MCP session equivalent |
|---|---|
| `this.context.state` | `session.contexts[pageId].state` |
| `lowdefyGlobal` | `session.lowdefyGlobal` |
| `inputs[context.id]` | `session.inputs[pageId]` |
| `this.context.requests` | `session.contexts[pageId].requests` |
| `_internal.globals` | N/A (browser-only) |
| `event` | Tool call metadata |
