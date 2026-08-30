---
name: lowdefy-events
description: Use when wiring user interaction to behaviour — which event names a block fires, ordering actions, reading the event payload, async actions and error handling in an action chain.
---

# Events and actions

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### Events and Actions

`/lowdefy-docs/content/concepts/events-and-actions`

Blocks can define _events_ which the block can trigger when something happens on the page, like a button being clicked, an input's value being modified or a page being loaded. Some examples are `onClick` on a [`Button`](/Button) or `onMount` on a [`PageHeaderMenu`](/PageHeaderMenu) block.

#### _event

`/lowdefy-docs/content/operators/_event`

The `_event` operator gets a value from the `event` object. The `event` object is a data object provided to an [`action`](/events-and-actions) by an [`event`](/events-and-actions). This object is also available to a [`request or connection`](/connections-and-requests) called by the [`Request`](/Request) action.

#### _actions

`/lowdefy-docs/content/operators/_actions`

The `_actions` operator returns the response value for a preceding action in the same event list.

#### SetState

`/lowdefy-docs/content/actions/setstate`

The `SetState` action sets values in `state`. It takes an object as parameters, and sets each of those values to the `state` object. This is useful if you want to initialize `state`, set a flag after an action has executed (eg. to disable a button), or to set the result of a request to state.

### Operators

Live schema: `lowdefy_get_schema` with kind `operators`.

#### _event

Provided by `@lowdefy/operators-js`.

**Form 1** — string: Dot-notation path to value in event object.

**Form 2** — integer: Index to access in event object.

**Form 3** — `true`: Return all event data.

**Form 4** — object

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `key` | string \\| integer |  |  |  |
| `default` | any |  |  | Default value if key does not exist. |
| `all` | boolean |  |  | Return all event data. |

#### _actions

Provided by `@lowdefy/operators-js`.

**Form 1** — string: Dot-notation path to value in actions object.

**Form 2** — integer: Index to access in actions object.

**Form 3** — `true`: Return all actions data.

**Form 4** — object

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `key` | string \\| integer |  |  |  |
| `default` | any |  |  | Default value if key does not exist. |
| `all` | boolean |  |  | Return all actions data. |

### Actions

Live schema: `lowdefy_get_schema` with kind `actions`.

#### SetState

Provided by `@lowdefy/actions-core`.

Accepts object: Key-value pairs to set in the page state.

#### Request

Provided by `@lowdefy/actions-core`.

**Form 1** — string: Shorthand for a single requestId.

**Form 2** — array: An array of requestIds to call.

**Form 3** — object: Request parameters.

#### Link

Provided by `@lowdefy/actions-core`.

**Form 1** — string: Shorthand for pageId.

**Form 2** — object: Link parameters.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `pageId` | string |  |  | The pageId to link to. |
| `url` | string |  |  | An external URL to link to. |
| `newWindow` | boolean |  |  | Open the link in a new window. |
| `urlQuery` | object |  |  | URL query parameters. |
| `input` | object |  |  | Input to pass to the linked page. |

#### DisplayMessage

Provided by `@lowdefy/actions-core`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `status` | `"success"`, `"error"`, `"info"`, `"warning"`, `"loading"` |  |  | The message status type. |
| `content` | string |  |  | The message content to display. |
| `duration` | number |  |  | Duration in seconds before the message disappears. Set to 0 for persistent. |
<!-- generated:reference:end -->

## Recipe

Must cover: event names are validated at build (an unknown event is an error), `onInit`/`onInitAsync`/`onMount` order, `_event` payload per event, `_actions` to read a previous action result, `try`/`catch` chains, `skip`, and `messages` on actions.
