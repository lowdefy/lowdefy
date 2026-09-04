# Events and Actions

Blocks can define _events_ which the block can trigger when something happens on the page, like a button being clicked, an input's value being modified or a page being loaded. Some examples are `onClick` on a [`Button`](/Button) or `onMount` on a [`PageHeaderMenu`](/PageHeaderMenu) block.

All blocks implement `onMount` and `onMountAsync` events. These are useful for triggering actions when a block is mounted. For the `onMount` event, the block only mounts when the event action chain is completed, however, for the `onMountAsync` event, the block will mount as soon as possible while the event actions completes execution.

_Actions_ are tasks that can be executed, like calling a request, linking to a new page or changing a value in state. An array of actions can be defined for an event on a block. If that event gets triggered, those actions will execute sequentially.

The chain of actions will stop executing if the action raises a break condition, or if the action throws an unexpected error.

If a break condition was raised, the user will be shown an error message and no further actions will execute. If an unexpected error is thrown, the app will show an error screen and the error will be logged. To handle errors and break conditions, a `catch` action chain can be defined on the event to handle the error, as described below.

Actions which are `async: true` are an exception to the sequential rule of the actions chain. These actions will be executed asynchronously and the next actions in the chain will not wait for them to finish. If any `async: true` action throws an error, the chain will not be stopped and the event will still be completed successfully.

Each action has an `id`, unique to that action chain, and a `type` field which are required.

Actions can have a `params` field for specifying input parameters when executing the action. Operators used in action `params` will be evaluated right before the action is executed. Some events might have data relating to that event, such as what the new value of an input is, or the row that was clicked in a table. The `event` object can be used in the action using the [`_event`](/_event) operator. Some actions also return values which can be passed to succeeding actions in the same action chain using the [`_actions`](/_actions) operator.

Actions can also have a `skip` field. Operators in the `skip` field will be evaluated before an action is executed, and if the evaluated result is `true`, that action is skipped and the next action is executed.

## Action Schema

The schema for a Lowdefy action is:

- `id: string`: __Required__ - An identifier for the action. It must be unique within the action chain it is defined in.
- `type: string`: __Required__ - The action type to be used. It must be a valid action type.
- `skip: boolean`: The test that determines whether the action will be skipped or not. This is usually written as operators which evaluates to a `true` or `false`. __Operators are evaluated__.
- `async: boolean`: This determines whether the action will be evaluated asynchronously. Operators are __not__ evaluated on `async`.
- `messages: object`:  __Operators are evaluated__.
  -  `error: boolean | string`: If `boolean`, whether an error message should be displayed if the action throws an error. Error messages are shown by default. If a `string`, the error message to show to the user.
  -  `loading: boolean | string`: If `boolean`, whether a loading message should be displayed while the action is executing. Loading messages are not shown by default. If a `string`, the loading message to show to the user.
  -  `success: boolean | string`: If `boolean`, whether a success message should be displayed if the action completes successfully. Success messages are not shown by default. If a `string`, the success message to show to the user.
- `params: object`: The input passed to the action. __Operators are evaluated__.

###### Events and actions definition example:
```yaml
- id: block_with_actions
  type: Block
  properties:
    # ...
  events:
    onEvent1:
      - id: action1
        type: ActionType1
        skip:
          # Operator expression that returns true if action should be skipped.
        params:
          # ...
      - id: action2
        type: ActionType2
    onEvent2:
      - id: action3
        type: ActionType3
        params:
          # ...
```
## The actions object

When events are triggered, each completed action writes its response to the actions object under the action id object key. Thus all following actions in a event action list have access to the responses of all preceding actions in the same event list through the [`_actions`](/_actions) operator.

## The event object

When events are triggered, they can provide a data object describing the event (e.g. a description of the clicked item or uploaded file). This data object can be accessed using the [`_event`](/_event) operator in an action definition.

The schema for passing actions to Lowdefy events is:
```
  (eventName: (action | control)[])
  (eventName: {
    shortcut?: string | string[],
    debounce?: {
      ms?: number,
      immediate?: boolean,
    },
    try: (action | control)[],
    catch?: (action | control)[],
  })
```

## Catching action errors

If one action in the chain of event actions fails by throwing an error, the actions in the list following the failed action will not be executed. To handle any errors thrown by an action, Lowdefy event actions can be provided as lists of `try` and `catch` actions.

###### Event try catch actions example for dealing with action errors:
```yaml
- id: block_with_actions
  type: Block
  properties:
    # ...
  events:
    onEvent1:
      try:
        - id: action1
          type: ActionType1
          params:
            # ...
        - id: action2
          type: ActionType2
      catch:
        - id: unsuccessful
          type: ActionType1
          params:
            # ...
```

## Control flow in action lists

An item in an action list is either an action (`id` and `type`) or a control. Action lists support the routine controls [`:if`](/:if), [`:switch`](/:switch) and [`:return`](/:return):

- [`:if`](/:if): Evaluates a condition and executes the `:then` action list if the result is truthy, else the optional `:else` action list.
- [`:switch`](/:switch): Evaluates `:case` conditions in order and executes the `:then` action list of the first truthy case — later cases are never evaluated. If no case matches, the optional `:default` action list is executed.
- [`:return`](/:return): Ends the whole event successfully. No further actions execute — not even in enclosing lists — and the event's `catch` actions do not run. A `:return` inside a `catch` list ends the remaining catch actions the same way, but the event keeps its error result.

Branch lists are action lists themselves, so controls can nest, and controls can be used in both `try` and `catch` action lists.

###### Control flow example:
```yaml
events:
  onClick:
    - id: validate
      type: Validate
    - :if:
        _not:
          _state: skip_reopen
      :then:
        - id: reopen_ticket
          type: Request
          params: reopen_ticket
        - id: redirect
          type: Link
          params:
            pageId: ticket-view
      :else:
        - id: show_blocked
          type: DisplayMessage
          params:
            content: Ticket cannot be reopened.
            status: warning
```

Actions inside branches are ordinary actions — `skip`, `messages`, `async` and error behavior are unchanged. Actions the event does not execute for a control-flow reason — actions in an untaken branch, in an unmatched case, or after a `:return` — are recorded as skipped, so [`_actions`](/_actions) lookups like `_actions: my_action.skipped` keep working.

### When to use which

- `skip` gates a single action.
- `:if` gates a group of consecutive actions with one condition.
- `:switch` replaces a chain of nested `:if`s over mutually exclusive alternatives.
- `:return` ends the event early — replacing the workaround of throwing an error in a `try` list.

Deep control nesting in an event is a sign the logic belongs in an [API routine](/lowdefy-api).

### Routine controls in events

The control grammar is shared with [API routines](/lowdefy-api): where a control exists on both sides, the syntax and semantics match.

| Routine control | In events | Client answer |
| --- | --- | --- |
| `:if` | Yes | Same syntax and semantics as in routines. |
| `:switch` | Yes | First truthy `:case` wins; later cases are never evaluated; `:default` optional. |
| `:return` | Yes | Ends the event successfully — replaces the early-`Throw` workaround. |
| `:for`, `:parallel_for` | No | Loops belong in routines; move the iteration into an API endpoint. |
| `:parallel` | No | Parallelism belongs in routines; for fire-and-forget on the client, actions already take `async: true`. |
| `:try` / `:catch` / `:finally` | No | Events already scope errors with `try` / `catch` action lists. |
| `:set_state` | Already an action | [`SetState`](/SetState). Step-like controls exist server-side only because routines have no actions. |
| `:throw` | Already an action | [`Throw`](/Throw). |
| `:reject` | No client meaning | It maps a routine to a 4xx response; on the client, `Throw` covers aborts. |
| `:log` | No | Server logging concern; no client counterpart planned. |

## Debouncing events

Event debouncing can be turned on by setting the `debounce` field on event objects. If `debounce.immediate` is `true`, leading edge debouncing or throttling will apply, else it will be debounced as trailing edge.

To control the debounce delay, set `debounce.ms` to the number of milliseconds to delay. The default delay is 300 milliseconds. If an event is triggered within that time, the event will not be triggered again. See [debounce vs throttling](https://redd.one/blog/debounce-vs-throttle) for a more detailed explanation.

###### Event trailing edge debouncing example:
```yaml
- id: block_with_actions
  type: Block
  properties:
    # ...
  events:
    onEvent1:
      debounce:
        ms: 1000
      try:
        - id: action1
          type: ActionType1
          params:
            # ...
        - id: action2
          type: ActionType2
```

###### Event throttling or leading edge debouncing example:
```yaml
- id: block_with_actions
  type: Block
  properties:
    # ...
  events:
    onEvent1:
      debounce:
        ms: 1000
        immediate: true
      try:
        - id: action1
          type: ActionType1
          params:
            # ...
        - id: action2
          type: ActionType2
```

## Keyboard Shortcuts

Events can be triggered by keyboard shortcuts. Add a `shortcut` property to an event to bind a key combination — when pressed, the event fires as if the user clicked the block. See the [Keyboard Shortcuts](/keyboard-shortcuts) page for the full shortcut format, common shortcuts, recipes, and more.

```yaml
events:
  onClick:
    shortcut: mod+K
    try:
      - id: open_search
        type: SetState
        params:
          searchOpen: true
```

## Page initialization events

The first blocks on a page, usually a [`container`](/container) type block, can define `onInit` and `onInitAsync` events. All blocks have `onMount` and `onMountAsync` events, that can be used to initialize the page or blocks.

The `onInit` event is triggered the first time a page is loaded. This event blocks page render, in other words, the page __will__ remain in a loading state, rendering only the progress bar, until all the actions have completed execution. It can be used to set up [`state`](/page-and-app-state). Actions that take a long time to execute, like `Request`, should be used sparingly here for a better user experience.

The `onInitAsync` event is triggered the first time a page loaded, but does not block page render. In other words, the page __will not__ remain in a loading state until all the actions have completed execution. This is a good place to execute non-blocking tasks or requests that might take longer to execute.

The `onMount` event is triggered every time a block is rendered on a page. This event can be used on any block, and causes the block and it's children to render in their loading state. It typically executes actions that should be run each time a block is loaded, like checking if an id is present in the [url query parameters](/_url_query), or fetching data for [`Selector`](/Selector) options using a [`Request`](/Request) action.

The `onMountAsync` event is triggered every time a block is mounted, but does not render the block in loading.

## Event names are validated at build

Every block type documents the events it fires — the `onClick` on a [`Button`](/Button), the `onChange` on a [`TextInput`](/TextInput). The build checks each event name on a block against that list, so a misspelled `onClik` is a build error instead of an event that never fires:

```
Event "onClik" is not an event of block type "Button" at block "submit" on page "form".
Did you mean "onClick"? Block type "Button" has events: onClick. Every block also accepts
onMount and onMountAsync, and any event name that declares a shortcut.
```

The rules are:

- `onMount` and `onMountAsync` are accepted on every block.
- `onInit` and `onInitAsync` are accepted on the page's own block only — they never fire on a nested block. Move the event to the page, or use `onMount`.
- An event that declares a `shortcut` may use any name, since the shortcut binds the event by name regardless of the block type. `cmd_k_search: { shortcut: mod+K, try: [...] }` is valid on any block.
- A block type that declares no events in its meta is not checked. Custom and local plugin blocks that do not list their events keep working unchanged.
- A few block types fire event names authored in their own properties — a [`Tabs`](/Tabs) tab's `eventName`, an AgGrid cell button's `eventName`, a [`DropdownButton`](/DropdownButton) item's `eventName`. These types declare `dynamicEvents` in their meta and are not checked.

To suppress the check — for example on a custom block whose events the build cannot see — use the `events` check slug:

```yaml
events:
  onSomethingCustom:
    ~ignoreBuildChecks:
      - events
    try:
      - id: do_it
        type: SetState
        params:
          done: true
```

## Event payloads

A block declares the shape of the data it passes to an event in its meta, as a JSON Schema called the event `payload`. Inputs such as [`TextInput`](/TextInput) declare `{ value: string }` for `onChange`; [`AgGrid`](/AgGridAlpine) declares `{ row: object, rowIndex: integer, selected: array, … }` for `onRowClick`. Every block's Events table lists its payload shape in the "Event Data" column.

When a block declares a payload for an event, the build checks every [`_event`](/_event) path in that event's actions - in `try`, `catch`, `messages` and control branches - against it. A path the payload has no room for is a build error that names the payload keys and suggests the closest one:

```yaml
- id: email
  type: TextInput
  events:
    onChange:
      - id: store
        type: SetState
        params:
          email: { _event: value }   # resolves
          raw: { _event: valu }      # build error
```

```
_event "valu" in event "onChange" on block "email" (TextInput) is not in the event payload. Payload: value. Did you mean "value"?
```

Only literal paths are checked: `_event: true` (the whole event object), an integer key, and a key supplied by another operator are never judged. A path that goes below a payload property with no declared shape (for example a `row: object` with no `properties`) is accepted. An event whose block declares no payload is never checked - a custom block that documents its events as plain strings keeps working unchanged.

The check has the slug `event-payload`; `~ignoreBuildChecks: [event-payload]` on the action, event, block or any ancestor turns it off for a block whose plugin payload is wrong or incomplete (see [Lowdefy schema](/lowdefy-schema)). The dev server's `/lowdefy-docs/schema/blocks/{type}` route and the `lowdefy_get_schema` MCP tool return each event's payload schema under `meta.events`.

## Action types

The following actions can be used:

- [`CallMethod`](/CallMethod) - Call a method defined by another block.
- [`Link`](/Link) - Link to another page.
- [`Message`](/Message) - Show a message to the user.
- [`Notification`](/Notification) - Show a notification to the user.
- [`Request`](/Request) - Call a request.
- [`Reset`](/Reset) - Reset the page validation and `state`.
- [`ScrollTo`](/ScrollTo) - Scroll to a point on the page.
- [`SetGlobal`](/SetGlobal) - Set a value to the `global` variable object.
- [`SetState`](/SetState) - Set a value to the page `state`.
- [`Validate`](/Validate) - Validate the inputs on the page.

See additional action type available under the Actions tab in the menu.

## TLDR
- Events are triggered when something happens on a page, like clicking a button or loading a page.
- A list of actions are executed sequentially by a triggered event.
- If an action errors, the actions that follow are skipped.
- Actions that are `async: true` will not be executed sequentially nor stop the event if they error.
- Action errors can be handled by providing a list of `try` and `catch` actions to the event.
- Operators used in action `params` are evaluated right before the action is executed.
- The [`_actions`](/_actions) operator is available for sequential actions to use the values returned from preceding actions in the chain.
- Actions have a `skip` field that can be used to skip action execution.
- Action lists also support the [`:if`](/:if), [`:switch`](/:switch) and [`:return`](/:return) controls — `skip` gates one action, `:if` gates a group, `:switch` picks between alternatives, and `:return` ends the event early.
- Events support `shortcut` to bind keyboard shortcuts to the event. The shortcut fires the event when the key combination is pressed.
- The `onInit` event is triggered the first time a page is mounted and keeps the page in loading until all actions have finished.
- The `onInitAsync` event is triggered the first time a page is mounted and does not keep the page in loading.
- The `onMount` events is triggered the every time a block is mounted and keeps the block in loading until all actions have finished.
- The `onMountAsync` event is triggered the every time a block is mounted, after `onMount` has completed, and does not keep the block in loading.
- Event names are validated at build against the block type's declared events. `onMount`/`onMountAsync` are accepted everywhere, `onInit`/`onInitAsync` on the page's own block only, and an event with a `shortcut` may use any name. Suppress with `~ignoreBuildChecks: [events]`.
