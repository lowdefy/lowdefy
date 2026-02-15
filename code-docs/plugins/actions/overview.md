# Actions Plugin Overview

Actions are functions executed in response to events. They power interactivity in Lowdefy apps.

## What Are Actions?

Actions are:
- Triggered by block events (onClick, onChange)
- Executed sequentially in an event
- Can modify state, make requests, navigate, etc.
- The "verbs" of Lowdefy applications

## Event-Action Model

```yaml
blocks:
  - id: button
    type: Button
    events:
      onClick:                    # Event
        - id: updateState         # Action 1
          type: SetState
          params:
            loading: true
        - id: saveData            # Action 2
          type: Request
          params:
            requestId: saveUser
        - id: navigate            # Action 3
          type: Link
          params:
            pageId: success
```

## Available Action Packages

| Package | Purpose | Actions |
|---------|---------|---------|
| [@lowdefy/actions-core](./core.md) | Core actions | SetState, Request, Link, etc. |
| [@lowdefy/actions-pdf-make](./pdf-make.md) | PDF generation | PdfMake |

## Action Structure

Each action has:

```yaml
- id: actionId           # Unique ID within event
  type: ActionType       # Action type name
  params:                # Action parameters
    key: value
  skip:                  # Optional: skip condition
    _state: skipAction
  onError:               # Optional: error handling
    - id: handleError
      type: Message
```

## Action Execution Flow

```
Event Triggered
      │
      ▼
┌─────────────────────┐
│  For each action:   │
├─────────────────────┤
│ 1. Evaluate skip    │
│ 2. Evaluate params  │
│ 3. Execute action   │
│ 4. Handle errors    │
└─────────────────────┘
      │
      ▼
All actions complete
```

## Common Patterns

### Conditional Actions

```yaml
events:
  onClick:
    - id: adminAction
      type: SetState
      skip:
        _not:
          _user: isAdmin
      params:
        showAdminPanel: true
```

### Error Handling

```yaml
events:
  onClick:
    - id: saveData
      type: Request
      params:
        requestId: save
      onError:
        - id: showError
          type: Message
          params:
            content: Save failed
            type: error
```

### Action Chains

```yaml
events:
  onClick:
    - id: validate
      type: Validate
    - id: save
      type: Request
      params:
        requestId: save
    - id: success
      type: Message
      params:
        content: Saved!
    - id: navigate
      type: Link
      params:
        pageId: list
```

## Design Decisions

### Why Sequential Execution?

Actions run in order because:
- Predictable behavior
- Dependencies between actions
- Easy to reason about
- Error handling at each step

### Why Not Async by Default?

Sequential execution prevents:
- Race conditions
- Unpredictable state
- Complex debugging
- User confusion

Parallel execution can be achieved with multiple events or custom endpoints.
