# State Management Architecture

How Lowdefy manages page and application state.

## Overview

Lowdefy state management is:

- **Expression-based**: All data access through operators
- **Reactive**: Changes automatically trigger re-renders
- **Hierarchical**: Page state → global state → URL state
- **Two-way bound**: Input blocks auto-sync with state

## State Types

| Operator     | Source                      | Scope   | Mutable   |
| ------------ | --------------------------- | ------- | --------- |
| `_state`     | `context.state`             | Page    | Yes       |
| `_input`     | `lowdefy.inputs[contextId]` | Page    | Read-only |
| `_global`    | `lowdefy.lowdefyGlobal`     | App     | Read-only |
| `_url_query` | `window.location.search`    | Browser | External  |

## State Class

**File:** `packages/engine/src/State.js`

```javascript
class State {
  constructor(context) {
    this.context = context;
    this.frozenState = null;
    this.initialized = false;
  }

  set(field, value) {
    // Dot-notation path support
    set(this.context.state, field, value);
  }

  del(field) {
    // Remove field and clean empty parents
    unset(this.context.state, field);
  }

  freezeState() {
    // Called after onInit - snapshot for reset
    if (!this.initialized) {
      this.frozenState = serializeToString(this.context.state);
      this.initialized = true;
    }
  }

  resetState() {
    // Restore to frozen initial state
    Object.keys(this.context.state).forEach((key) => delete this.context.state[key]);
    const frozen = deserializeFromString(this.frozenState);
    Object.keys(frozen).forEach((key) => this.set(key, frozen[key]));
  }

  swapItems(field, from, to) {
    // Swap array items (for reordering)
  }

  removeItem(field, index) {
    // Remove array item at index
  }
}
```

## State Initialization

### Context Creation

**File:** `packages/engine/src/getContext.js`

```javascript
const ctx = {
  id,
  pageId: config.pageId,
  eventLog: [],
  jsMap,
  requests: {},
  state: {},              // Empty state object
  _internal: {
    lowdefy,
    rootBlock: config,
    parser: WebParser,
    State: new State(ctx),
    Actions: new Actions(ctx),
    Requests: new Requests(ctx),
    RootAreas: new Areas({...}),
    update: () => _internal.RootAreas.update()
  }
};
```

### Page Load Flow

```
getContext()
    ↓
RootAreas.init()
    ↓
Block.reset(initState)
    ↓
Input blocks: State.set(blockId, initValue)
    ↓
Block.evaluate()
    ↓
onInit event
    ↓
State.freezeState()  // Snapshot for reset
```

## State Operators

### \_state Operator

**File:** `packages/plugins/operators/operators-js/src/operators/shared/state.js`

```javascript
function _state({ arrayIndices, location, params, state }) {
  return getFromObject({
    arrayIndices,
    location,
    object: state,
    operator: '_state',
    params,
  });
}
```

**Usage:**

```yaml
# Simple access
value:
  _state: user.name

# With default
value:
  _state:
    key: user.name
    default: "Anonymous"
```

### \_input Operator

**File:** `packages/plugins/operators/operators-js/src/operators/client/input.js`

```javascript
function _input({ arrayIndices, input, location, params }) {
  return getFromObject({
    arrayIndices,
    location,
    object: input,
    operator: '_input',
    params,
  });
}
```

### \_global Operator

**File:** `packages/plugins/operators/operators-js/src/operators/client/global.js`

```javascript
function _global({ arrayIndices, location, lowdefyGlobal, params }) {
  return getFromObject({
    arrayIndices,
    location,
    object: lowdefyGlobal,
    operator: '_global',
    params,
  });
}
```

### \_url_query Operator

**File:** `packages/plugins/operators/operators-js/src/operators/client/url_query.js`

```javascript
function _url_query({ arrayIndices, globals, location, params }) {
  const { window } = globals;
  return getFromObject({
    arrayIndices,
    location,
    object: urlQuery.parse(window.location.search.slice(1)),
    operator: '_url_query',
    params,
  });
}
```

**Usage:**

```yaml
# URL: ?user=john&id=123
userId:
  _url_query: id # Returns "123"
```

## Input Block State Binding

### Block Initialization

**File:** `packages/engine/src/Block.js`

```javascript
_initInput = () => {
  this.setValue = (value) => {
    // Type enforcement
    this.value = type.enforceType(this.meta.valueType, value);

    // Store in state
    this.context._internal.State.set(this.blockId, this.value);

    // Mark for re-render
    this.update = true;
    this.context._internal.update();
  };
};
```

### Update Flow

```
User types in input
        ↓
Block component calls block.setValue(newValue)
        ↓
Type enforced via block metadata
        ↓
State.set(blockId, value)
        ↓
block.update = true
        ↓
context._internal.update()
        ↓
Areas.updateStateFromRoot()
        ↓
Block.evaluate() for all blocks
        ↓
React re-render
```

## Update Cycle

### Areas Update

**File:** `packages/engine/src/Areas.js`

```javascript
update = () => {
  this.updateStateFromRoot();
  this.renderBlocks();
};

updateStateFromRoot = () => {
  const repeat = this.recEval(true);
  this.updateState();

  // Re-evaluate if visibility changed (max 20 iterations)
  if (repeat && this.recCount < 20) {
    this.recCount += 1;
    this.updateStateFromRoot();
  }
};
```

### Block Evaluation

**File:** `packages/engine/src/Block.js`

```javascript
evaluate = (visibleParent, repeat) => {
  // Sync state value for input blocks
  if (this.isInput()) {
    const stateValue = get(this.context.state, this.blockId);
    this.value = type.isUndefined(stateValue) ? this.value : stateValue;
  }

  // Evaluate all expressions
  this.propertiesEval = this.parse(this.properties);
  this.styleEval = this.parse(this.style);
  this.visibleEval = this.parse(this.visible);

  // Mark for render if changed
  if (this.before !== after) {
    this.update = true;
  }
};
```

## State Updates

### SetState Action

**File:** `packages/engine/src/actions/createSetState.js`

```javascript
function createSetState({ arrayIndices, context }) {
  return function setState(params) {
    Object.keys(params).forEach((key) => {
      context._internal.State.set(applyArrayIndices(arrayIndices, key), params[key]);
    });
    context._internal.RootAreas.reset();
    context._internal.update();
  };
}
```

**Usage:**

```yaml
events:
  onClick:
    - id: setUser
      type: SetState
      params:
        user:
          name: John
          email: john@example.com
```

### Reset Action

**File:** `packages/engine/src/actions/createReset.js`

```javascript
function createReset({ context }) {
  return function reset() {
    context._internal.State.resetState();
    context._internal.RootAreas.reset(deserializeFromString(context._internal.State.frozenState));
  };
}
```

### List Block Operations

**File:** `packages/engine/src/Block.js`

```javascript
this.pushItem = () => {
  this.subAreas.push(
    this.newAreas({ arrayIndices: [...], initState: {} })
  );
  this.update = true;
  this.context._internal.update();
};

this.removeItem = (index) => {
  this.context._internal.State.removeItem(this.blockId, index);
  this.subAreas.splice(index, 1);
  // Re-index remaining items
  this.update = true;
  this.context._internal.update();
};
```

## State in Requests

### Payload Evaluation

**File:** `packages/engine/src/Requests.js`

```javascript
async callRequest({ actions, arrayIndices, blockId, event, requestId }) {
  const requestConfig = this.requestConfig[requestId];

  // Parse payload - resolves all operators including _state
  const { output: payload } = this.context._internal.parser.parse({
    actions,
    event,
    arrayIndices,
    input: requestConfig.payload,
    location: requestId,
  });

  return this.fetch({ payload, requestId, ... });
}
```

**Example:**

```yaml
requests:
  - id: saveUser
    type: MongoDBUpdateOne
    connectionId: mongodb
    payload:
      filter:
        _id:
          _state: selectedUserId
      update:
        $set:
          name:
            _state: form.name
          email:
            _state: form.email
```

## React Integration

### Block Component

**File:** `packages/client/src/block/Block.js`

```javascript
const Block = ({ block, Blocks, context, lowdefy, parentLoading }) => {
  const [updates, setUpdate] = useState(0);

  // Register updater in lowdefy context
  lowdefy._internal.updaters[block.id] = () => setUpdate(updates + 1);

  // Re-render when state changes trigger update
  return <CategorySwitch ... />;
};
```

### Update Trigger Chain

```
State.set() called
        ↓
context._internal.update()
        ↓
Areas.updateStateFromRoot()
        ↓
Block.evaluate() computes new values
        ↓
lowdefy._internal.updateBlock(blockId)
        ↓
lowdefy._internal.updaters[blockId]()
        ↓
React useState triggers re-render
```

## Helper Utilities

### get() - Deep Object Access

**File:** `packages/utils/helpers/src/get.js`

```javascript
get(object, 'user.profile.name', { default: null, copy: true });

// Supports:
// - Dot notation: 'a.b.c'
// - Array indices: 'items.0.name'
// - Default values
// - Deep copy option
```

### set() - Deep Object Assignment

**File:** `packages/utils/helpers/src/set.js`

```javascript
set(state, 'user.profile.name', 'John');

// Features:
// - Auto-creates intermediate objects
// - Handles array index paths
// - Prevents prototype pollution
```

### type.enforceType()

**File:** `packages/utils/helpers/src/type.js`

```javascript
type.enforceType('string', value);
type.enforceType('array', value);
type.enforceType('object', value);
```

## Example State Flow

**Scenario:** User enters name, triggers request

1. **User Input**

   - User types "John" in `text_input_1`

2. **setValue Called**

   - `block.setValue('John')`

3. **State Updated**

   - `State.set('text_input_1', 'John')`
   - `context.state['text_input_1'] = 'John'`

4. **Update Triggered**

   - `context._internal.update()`

5. **Evaluation**

   - All blocks re-evaluated
   - Request payload parsed:
     ```javascript
     {
       name: {
         _state: 'text_input_1';
       }
     }
     // Becomes: { name: 'John' }
     ```

6. **Request Made**

   - Payload sent to backend

7. **Response**

   - Stored in `context.requests[requestId]`

8. **Display**
   - Components access via `_request` operator

## Visibility and State Cleanup

When blocks become invisible:

- State for hidden input blocks is deleted
- Prevents stale data from accumulating
- Re-initializes when block becomes visible again

## Key Files

| Component            | File                                                                        |
| -------------------- | --------------------------------------------------------------------------- |
| State Class          | `packages/engine/src/State.js`                                              |
| Context Factory      | `packages/engine/src/getContext.js`                                         |
| Block Engine         | `packages/engine/src/Block.js`                                              |
| Areas Manager        | `packages/engine/src/Areas.js`                                              |
| SetState Action      | `packages/engine/src/actions/createSetState.js`                             |
| Reset Action         | `packages/engine/src/actions/createReset.js`                                |
| \_state Operator     | `packages/plugins/operators/operators-js/src/operators/shared/state.js`     |
| \_input Operator     | `packages/plugins/operators/operators-js/src/operators/client/input.js`     |
| \_global Operator    | `packages/plugins/operators/operators-js/src/operators/client/global.js`    |
| \_url_query Operator | `packages/plugins/operators/operators-js/src/operators/client/url_query.js` |
| React Block          | `packages/client/src/block/Block.js`                                        |

## Architectural Patterns

1. **Single Context State**: All page state in `context.state` with dot-notation keys
2. **Operator-Based Access**: All data access through operators
3. **Lazy Evaluation**: Properties re-evaluated on every state change
4. **Two-Way Binding**: Input blocks auto-sync via `setValue()`
5. **Hierarchical Updates**: Changes bubble through Areas → Blocks → React
6. **Type Safety**: Values type-enforced via block metadata
7. **Immutability in Transfer**: State serialized when crossing boundaries
8. **Visibility-Driven Cleanup**: Hidden blocks' state deleted automatically
