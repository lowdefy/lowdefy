---
name: lowdefy-edit-pages
description: Use when building a create/edit form page — loading the record into state, validating, saving with a request, and navigating back with feedback.
---

# Edit pages

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### Request

`/lowdefy-docs/content/actions/request`

The `Request` action calls a request, or if used during an `onInit` event, calls those requests while a page loads. `Request` can be used to call all requests on a page, a list of requests, or a single request. The `Request` action is synchronous, actions defined after it will only run once all the called requests have returned.

#### Validate

`/lowdefy-docs/content/actions/validate`

The `Validate` action is used to validate a users input, usually before information is inserted into a database using a request. It is used in conjunction with the `required` and `validate` fields on input blocks. If the validation fails, the `Validate` action will fail, and this will stop the execution of actions that are defined after it.

#### SetState

`/lowdefy-docs/content/actions/setstate`

The `SetState` action sets values in `state`. It takes an object as parameters, and sets each of those values to the `state` object. This is useful if you want to initialize `state`, set a flag after an action has executed (eg. to disable a button), or to set the result of a request to state.

#### Reset

`/lowdefy-docs/content/actions/reset`

The `Reset` actions resets a page to the state it was in just after the `onInit` event was executed. This clears the user's inputs.

### Blocks

Live schema: `lowdefy_get_schema` with kind `blocks`.

#### Button

Provided by `@lowdefy/blocks-antd`. Category: `display`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `block` | boolean |  | `false` | Fit the button's span to its parent container span. |
| `color` | string |  |  | Button color. Preset values: default, primary, danger, blue, purple, cyan, green, magenta, pink, red, orange, yellow, volcano, geekblue, lime, gold. Also accepts custom hex color strings. |
| `danger` | boolean |  | `false` | Set button style to danger. |
| `disabled` | boolean |  | `false` | Disable the button if true. |
| `ghost` | boolean |  | `false` | Make the button's background transparent when true. |
| `hideTitle` | boolean |  | `false` | Hide the button's title. |
| `href` | string |  |  | The URL to redirect to when the button is clicked. Useful when used with a type link button. |
| `icon` | string \\| object |  |  | Name of an React-Icon (See all icons) or properties of an Icon block to use icon in button. |
| `shape` | `"circle"`, `"round"`, `"square"` |  | `"square"` | Shape of the button. |
| `size` | `"small"`, `"default"`, `"large"` |  | `"default"` | Size of the button. |
| `title` | string |  |  | Title text on the button - supports html. |
| `type` | `"primary"`, `"default"`, `"dashed"`, `"link"`, `"text"` |  | `"primary"` | Deprecated - use color and variant instead. The button type. |
| `variant` | `"solid"`, `"outlined"`, `"dashed"`, `"filled"`, `"text"`, `"link"` |  |  | Button visual variant. When set, takes precedence over type. |
| `theme` | object |  |  | Antd design token overrides for this block. See antd design tokens. |

##### Events

- `onClick`: Trigger action when button is clicked. Renders a shortcut badge when a shortcut is configured.

##### Example

```yaml
- id: variant_solid
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: solid
    color: primary
    variant: solid
```

#### Card

Provided by `@lowdefy/blocks-antd`. Category: `container`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `bordered` | boolean |  | `true` | Toggles rendering of the border around the card. |
| `hoverable` | boolean |  | `false` | Lift up when hovering card. |
| `inner` | boolean |  | `false` | Change the card style to inner. |
| `size` | `"default"`, `"small"` |  | `"default"` | Size of the card. |
| `title` | string |  |  | Title to show in the title area - supports html. Overwritten by blocks in the title content area. |
| `theme` | object |  |  | Antd design token overrides for this block. See antd design tokens. |

##### Events

- `onClick`: Trigger actions when the Card is clicked.

##### Example

```yaml
- id: basic_card
  type: Card
  properties:
    title: Card Title
  blocks:
    - id: basic_card_p1
      type: Paragraph
      properties:
        content: Cards provide a flexible and extensible content container with multiple variants. This is the default card with a simple title and body content.
    - id: basic_card_p2
      type: Paragraph
      properties:
        content: You can place any blocks inside the card body using the standard blocks key.
```

### Actions

Live schema: `lowdefy_get_schema` with kind `actions`.

#### Request

Provided by `@lowdefy/actions-core`.

**Form 1** — string: Shorthand for a single requestId.

**Form 2** — array: An array of requestIds to call.

**Form 3** — object: Request parameters.

#### Validate

Provided by `@lowdefy/actions-core`.

**Form 1** — string: Shorthand for a single blockId to validate.

**Form 2** — array: An array of blockIds to validate.

#### SetState

Provided by `@lowdefy/actions-core`.

Accepts object: Key-value pairs to set in the page state.

#### Reset

Provided by `@lowdefy/actions-core`.

_No schema._

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

### Requests

Live schema: `lowdefy_get_schema` with kind `requests`.

#### MongoDBFindOne

Provided by `@lowdefy/connection-mongodb` on connection `MongoDBCollection`. Connection access checked: read.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `query` | object | yes |  | A MongoDB query object |
| `options` | object |  |  | Optional settings. |

#### MongoDBUpdateOne

Provided by `@lowdefy/connection-mongodb` on connection `MongoDBCollection`. Connection access checked: write.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `filter` | object | yes |  | The filter used to select the document to update. |
| `update` | object \\| array | yes |  | The update operations to be applied to the document. |
| `options` | object |  |  | Optional settings. |
| `disableNoMatchError` | boolean |  |  | Do not throw an error when no document matches the filter. By default the request throws "No matching record to update." when nothing matched and upsert is not set. |
<!-- generated:reference:end -->

## Recipe

Must cover: load with `onInitAsync` then `SetState` from `_request`, block ids equal to field paths, `Validate` before the save `Request`, `$set` from `_state`, a `DisplayMessage` on success, `Link` back with `urlQuery`, and the create vs. edit switch on `_url_query`.
