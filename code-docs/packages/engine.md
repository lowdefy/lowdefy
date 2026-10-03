# @lowdefy/engine

Runtime state management and action execution engine. The brain of Lowdefy's client-side reactivity.

## Purpose

This package provides:

- Page state management (State class)
- Action execution pipeline (Actions class)
- Event handling (Events class)
- Request orchestration (Requests class)
- Block slot management (Slots class, renamed from Areas)
- Navigation link creation

## Key Exports

```javascript
import getContext, {
  Actions,
  Slots,
  createLink,
  Events,
  Requests,
  State,
} from '@lowdefy/engine';

// Create page context
const context = getContext({
  config: pageConfig,
  lowdefy: lowdefyContext,
  ...
});
```

## App Context

`getAppContext({ events, jsMap, lowdefy })` builds the context that runs the app events
(`events.onInit` / `events.onInitAsync` in `lowdefy.yaml`, delivered in `rootConfig.events`).
It shares `createContext` with `getContext`, over a block-less `Box` root with id and blockId
`app`, and is memoized on `lowdefy.appContext` (not in `lowdefy.contexts`, so page
iteration never sees it; `initLowdefyContext` clears it so a dev config reload runs the app
events again).

- `runOnInit` / `runOnInitAsync` are single-flight: every page mount calls them
  (`client/src/Context.js`), and a navigation can mount the next page before they finish.
  `runOnInitAsync` always chains after `runOnInit`.
- The page's `runOnInit` awaits the app `runOnInit`; the app `runOnInitAsync` is not awaited.
- The app context's `update` also runs a tracked pass (`update({ changes: [] })`) on every page
  context, so a `SetGlobal` or `CallAPI` in the app `onInitAsync` re-renders the mounted page.
- Page-scoped actions and operators (`SetState`, `Request`, `_state`, `_input`, ...) are
  rejected by the build (`build/buildAppEvents.js`), and the app event types join every page's
  per-page type set (`buildPageTypes`), since any page can be the first to load.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Page Context                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                         State                                ││
│  │  { formField: 'value', list: [...], nested: { ... } }       ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│           ┌──────────────────┼──────────────────┐               │
│           ▼                  ▼                  ▼               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Events    │    │  Requests   │    │    Slots    │         │
│  │ (handlers)  │    │  (data)     │    │  (blocks)   │         │
│  └──────┬──────┘    └─────────────┘    └─────────────┘         │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐                                                │
│  │   Actions   │                                                │
│  │ (executors) │                                                │
│  └─────────────┘                                                │
└─────────────────────────────────────────────────────────────────┘
```

## Key Classes

### State

Manages page state with methods for mutation:

```javascript
class State {
  constructor(context) {
    this.context = context;
    this.frozenState = null;  // Initial state snapshot
  }

  set(field, value)           // Set value at path
  del(field)                  // Delete value at path
  swapItems(field, from, to)  // Swap array items
  removeItem(field, index)    // Remove array item
  freezeState()               // Snapshot initial state
  resetState()                // Restore to initial state
}
```

**Why freeze/reset?**

- `freezeState()` captures state after onInit completes
- `resetState()` allows "Reset Form" functionality
- Enables undo/restore patterns

### Events

Handles event registration and triggering:

```yaml
# Events defined in config
events:
  onClick:
    - id: action1
      type: SetState
      params:
        field: count
        value:
          _sum:
            - _state: count
            - 1

  # With debounce (300ms default)
  onSearchChange:
    debounce:
      ms: 500 # Debounce delay
      leading: false # Fire on leading edge
      trailing: true # Fire on trailing edge (default)
    actions:
      - id: search
        type: Request
        params:
          requestId: searchData
```

Events orchestrate action execution and handle:

- Sequential action execution
- Error handling per action
- Debounce support (prevents rapid-fire execution)
- Event-level catch actions for error recovery
- Keyboard shortcut metadata storage

#### DOM Event Bubbling

A DOM event bubbles through every block that wraps its target, and each wrapping block may call `triggerEvent` for it (a Button click also reaches the clickable Card around it). `triggerEvent` asks `claimDomEvent` (`src/claimDomEvent.js`) whether another block already handled the DOM event currently being dispatched, read from `window.event`. Only blocks on the event's path take part: `getPathIndex` finds the block's layout element (`bl-<blockId>`, rendered by the client) in `domEvent.composedPath()`. The first block on the path with actions for the event claims it in a module-level `WeakMap`; blocks further out on the path then return early with `handledBy: <blockId>` instead of running their actions, and a block further in runs and takes the claim. The same block may fire several events for one DOM event (AgGrid `onCellClick` and `onRowClick`). An event with `bubble: true` handles the DOM event without claiming it.

`window.event` stays set while React flushes a discrete update and its effects in a microtask inside the listener, so events blocks fire from effects (a Table's `onSelectionChange` after a Button's `CallMethod clearSelection`) see the click too. They run because the block is off the path, inside the handler, or was called: `createCallMethod` marks the target block with `exemptFromDomEvent`, and its events for that DOM event are never skipped. Internal events (`registerEvent`) are never skipped either. Outside a DOM dispatch `window.event` is undefined, so events from requests and timers are never skipped.

Blocks that fire events from third-party DOM listeners handle their own inner controls: AgGrid skips `onRowClick`/`onCellClick` for clicks on cell controls (`isCellControlClick`), because ag-grid's listeners run before React's.

#### Shortcut Support

`initEvent()` preserves the `shortcut` string (or string array) from the event config on the runtime event object. Blocks access it via `events.onClick?.shortcut` to render shortcut badges.

The `shortcut` property is read-only metadata — the Events class doesn't handle keyboard listening. The ShortcutManager in `@lowdefy/client` reads shortcut strings from the block tree and registers the actual keyboard listeners via tinykeys.

#### Trace Hook

`getTrace(lowdefy)` (`src/trace/getTrace.js`, exported) returns the one observation point for completed block and app events, a registry created on first use as `lowdefy._trace`. It lives on `lowdefy` itself, not `lowdefy._internal`, so it survives the dev config reload that replaces `_internal`, and a subscriber (the dev journey recorder) can subscribe before the client initialises `lowdefy`.

- **Where it emits.** `Events.triggerEvent` emits inside `actionHandle` only, right after `context.eventLog.unshift(res)`. So bounced debounced events, `handledBy` returns and events with no actions never emit; consumers do not filter them. `Events` builds a payload only when `wantsPayload({ success })` is true: while anyone subscribes, or for a failure while the registry still holds early failures (below). So an app without PostHog or the dev recorder builds nothing for a successful event, and at most 20 payloads for failures.
- **Early failures are held.** Until a subscriber passes `{ replay: true }`, `emit` keeps each failed payload (`success: false`), stateless, at most 20 (`HELD_FAILURES_LIMIT`). The first replay subscriber receives them in emit order, synchronously inside `subscribe`, and from then on nothing is held. A non-replay subscriber (the dev recorder) neither takes nor ends the holding. This exists because PostHog starts in the app's `onInitAsync`, which `getAppContext` runs only after app `onInit` has finished; `PostHogInit` subscribes with `{ replay: true }`.
- **Payload.** `{ scope, pageId, blockId, blockType, eventName, success, failure, debounceMs, actions, record, context, stateBefore }`, built by `createTracePayload`. `scope` is `app` when the context is `lowdefy.appContext` (then `pageId` is `lowdefy.pageId` and `blockType` is `null`). `failure` comes from `summariseFailure`, which reads callActions' `{ error, action, index }` wrapper (or `{ error }` for a control-flow parser error) into `{ actionId, actionType, configKey, errorName, invalidBlocks }`, so consumers never see the wrapper. `invalidBlocks` travels on the `UserError` that `createValidate` throws; `projectCaughtError` does not project it.
- **`stateBefore`** is a `serializer.copy` of the state taken before `callActions`, only while a subscriber asked `subscribe(listener, { state: true })` (`wantsState()`); others receive `undefined`. Production (PostHog) never asks, so it pays no copy.
- **Isolation.** `emit` calls listeners in order, each in its own try/catch; a throwing listener is warned once and the rest run.
- **Describe functions.** `describeElement(element)` reads a live element as a journey target (the runner's resolution in reverse) and `describeChain(elementsChain)` reads a posthog-js `$elements_chain` into the same `{ page_id, block_id, block_type, row, column, text, nth, option, block_ids }`, with `nth` always `null`. Both follow `journeyTargetSelectors` in `@lowdefy/helpers`, the rules `server-dev`'s `runJourney` resolves targets by; the chain parser is `targetFromElementsChain` there, pure so it runs in Node. A click that reaches no interactive control has no text, so its block alone targets it; a dropdown option stands in for a control. `pageIdOf(url)` reads the page from the URL (`parsePageId` with `lowdefy.basePath`, the configured home at `/`), never `lowdefy.pageId`, which lags posthog-js's `history_change` pageview.
- **Action argument.** `Actions.callAction` passes `registry.actionView` as `trace`: `{ subscribe, describeElement, describeChain, pageIdOf }`, without the engine-only `emit`, `wantsPayload` and `wantsState`.

Tests: `src/trace/*.test.js`, `test/EventsTrace.test.js`, and `src/trace/describeElement.test.js`, which round-trips every fixture in `@lowdefy/e2e-utils/targets` through `resolveTargetInDocument` (the runner's resolution in jsdom) and `describeElement`.

### Actions

Executes individual actions within events:

```yaml
# Action types from plugins
SetState        # Modify state
Request         # Execute data request
Link            # Navigate to page
CallMethod      # Call block method
DisplayMessage  # Show notification
Validate        # Validate form
...

# Error handling with catchActions
events:
  onSave:
    try:
      - id: saveData
        type: Request
        params:
          requestId: saveUser
    catch:
      - id: showError
        type: DisplayMessage
        params:
          type: error
          content:
            _error: message
```

Actions receive:

- `context` - Page context with state
- `params` - Action parameters (operators evaluated)
- `event` - Original event object
- `error` - Error object (in catch actions only)

### Requests

Manages data request lifecycle:

```javascript
// Request in config
requests:
  - id: getUsers
    type: MongoDBFind
    connectionId: mongodb
    properties:
      collection: users
```

Requests class handles:

- Request execution via API
- Response caching in state (stores history array, not just latest)
- Loading state management
- Error handling
- Automatic retry on transient failures

### Slots

Manages the block tree structure (renamed from Areas in v5):

```javascript
// Block slots
slots:
  content:
    blocks:
      - id: header
        type: Title
      - id: form
        type: Box
        slots:
          content:
            blocks: [...]
```

Slots class:

- Builds block hierarchy
- Evaluates block properties (including `class` and `styles`)
- Manages block visibility
- Handles skeleton loading

The engine also evaluates `class` (string, array, or cssKey-keyed object of Tailwind classes) and `styles` (cssKey-keyed inline style objects) alongside properties.

## Dependency-Tracked Evaluation

A block records what it reads while it self-evaluates (`src/tracking/ReadRecorder.js`, pushed in `Block.evaluateSelf`); `WebParser` reports each operator call to the current recorder through the operator's `tracking` declaration (pure / read keys / volatile / untracked — see `@lowdefy/operators` `classifyOperatorCall`), and `_js` accessor reads go through a tracked operator view. Writers report what they changed to the context's `DependencyTracker`: `State.set` (always), `State.republish` (only if the value differs), SetState, SetGlobal, request start/completion, input `setValue`. `update({ changes })` then re-evaluates only blocks whose reads intersect the changes (prefix match both ways), plus volatile/untracked/forced blocks, keeping today's visibility-driven settling loop; a bare `update()` is a full pass, as are unknown callers and any action method outside the reporting allowlist (`trackActionMethods`). Off switches: `config.dependencyTracking: false` (via appMeta), `window.__lowdefyFullEvaluation`, `lowdefy._internal.dependencyTracking === false`, `DependencyTracker.enabled`. Parity is proven differentially (`test/Block/dependencyTracking.parity.test.js`; `test:full` runs the suite with full passes).

Resizes report `media:size`, `media:width` and `media:height` through `context._internal.updateMedia()` (`src/tracking/updateMedia.js`), called by the client's debounced page resize listener. It diffs the viewport against `context._internal.media` (seeded when the context is created and on each render-time full pass) and skips the pass entirely when no block's reads intersect the changes (`blocksReadChanges`), so a same-breakpoint resize costs one scan of the block map and evaluates nothing when blocks only read `_media: size`. See `test/Block/media.test.js`.

## State Container Structure

Each page has these state containers:

| Container  | Purpose                   | Access                  |
| ---------- | ------------------------- | ----------------------- |
| `state`    | Form values, user input   | `_state: fieldName`     |
| `urlQuery` | URL query parameters      | `_url_query: paramName` |
| `input`    | Data passed on navigation | `_input: fieldName`     |
| `requests` | Cached request responses  | `_request: requestId`   |
| `global`   | Cross-page shared state   | `_global: fieldName`    |

## Operator Evaluation

The engine evaluates operators in block properties:

```yaml
# Before evaluation
properties:
  title:
    _if:
      test:
        _state: isAdmin
      then: Admin Panel
      else: User Dashboard

# After evaluation (if state.isAdmin = true)
properties:
  title: Admin Panel
```

Operators are evaluated:

- When state changes
- Before rendering blocks
- For action parameters

## Action Execution Flow

```
Event Triggered (e.g., onClick)
         │
         ▼
Events.triggerEvent()
         │
         ▼
For each action in event:
         │
    ┌────┴────┐
    ▼         ▼
Evaluate   Skip if
operators  condition
in params  is false
    │
    ▼
Actions.callAction()
    │
    ├──► SetState: Update context.state
    │
    ├──► Request: Call API, store response
    │
    ├──► Link: Navigate to new page
    │
    └──► etc.
         │
         ▼
Re-evaluate block properties
         │
         ▼
React re-renders
```

## Design Decisions

### Why Class-Based?

Classes provide:

- Encapsulated state per instance
- Clear lifecycle methods
- Bound methods for callbacks
- Easy to test in isolation

### Why Not Redux/MobX?

Lowdefy's state model is simpler:

- State is page-scoped, not global
- No complex reducers needed
- Actions are declarative (from config)
- Less boilerplate for users

### Why Evaluate Operators Client-Side?

Client-side evaluation enables:

- Reactive UI updates
- No round-trip for UI changes
- Fast form interactions
- Offline capability (for cached data)

### State Mutation vs Immutability

State is mutated directly for:

- Simplicity (no spread operators)
- Performance (no object recreation)
- Compatibility with form libraries

React detects changes through explicit re-render triggers.

## Integration Points

- **@lowdefy/client**: Uses engine for page context
- **@lowdefy/operators**: WebParser for operator evaluation
- **@lowdefy/helpers**: Utility functions
- **Action plugins**: Provide action implementations

## Block Property Evaluation

Blocks receive evaluated properties:

```javascript
// Config
blocks:
  - id: greeting
    type: Title
    properties:
      content:
        _string:
          - 'Hello, '
          - _state: userName
          - '!'

// Evaluated (state.userName = 'Alice')
block.eval.properties = {
  content: 'Hello, Alice!'
}
```

Properties re-evaluate when:

- State changes
- URL query changes
- Request completes
- Input changes
