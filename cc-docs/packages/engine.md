# @lowdefy/engine

Runtime state management and action execution engine. The brain of Lowdefy's client-side reactivity.

## Purpose

This package provides:
- Page state management (State class)
- Action execution pipeline (Actions class)
- Event handling (Events class)
- Request orchestration (Requests class)
- Block area management (Areas class)
- Navigation link creation

## Key Exports

```javascript
import getContext, {
  Actions,
  Areas,
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
│  │   Events    │    │  Requests   │    │    Areas    │         │
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

```javascript
// Events defined in config
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
```

Events orchestrate action execution and handle:
- Sequential action execution
- Error handling per action
- Event bubbling/propagation

### Actions

Executes individual actions within events:

```javascript
// Action types from plugins
SetState      // Modify state
Request       // Execute data request
Link          // Navigate to page
CallMethod    // Call block method
Message       // Show notification
Validate      // Validate form
...
```

Actions receive:
- `context` - Page context with state
- `params` - Action parameters (operators evaluated)
- `event` - Original event object

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
- Response caching in state
- Loading state management
- Error handling

### Areas

Manages the block tree structure:

```javascript
// Block areas
areas:
  content:
    blocks:
      - id: header
        type: Title
      - id: form
        type: Box
        areas:
          content:
            blocks: [...]
```

Areas class:
- Builds block hierarchy
- Evaluates block properties
- Manages block visibility
- Handles skeleton loading

## State Container Structure

Each page has these state containers:

| Container | Purpose | Access |
|-----------|---------|--------|
| `state` | Form values, user input | `_state: fieldName` |
| `urlQuery` | URL query parameters | `_url_query: paramName` |
| `input` | Data passed on navigation | `_input: fieldName` |
| `requests` | Cached request responses | `_request: requestId` |
| `global` | Cross-page shared state | `_global: fieldName` |

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
