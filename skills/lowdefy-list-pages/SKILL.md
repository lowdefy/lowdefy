---
name: lowdefy-list-pages
description: Use when building a page that lists records from a request — filters bound to state, a row link with urlQuery, an empty state and a loading skeleton.
---

# List pages

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### Lists

`/lowdefy-docs/content/concepts/lists`

List category blocks render multiple [`content areas`](/layout), based on data in the [`state`](/page-and-app-state) object.

#### Connections and Requests

`/lowdefy-docs/content/concepts/connections-and-requests`

In a Lowdefy app you can integrate with other services like API's or databases using `connections` and `requests`. Connections configure the settings to the external service, and often contain parameters like connection strings, urls and secrets like passwords or API keys. Requests are used to interact with the connection, such as inserting a data record, executing a query or calling an API end-point.

#### List

`/lowdefy-docs/content/list-blocks/list`

Flex-based list container that renders a template block for each item in an array. Supports column/row direction, wrapping, and scrolling. Use `CallMethod` with `pushItem`, `removeItem`, `moveItemUp`, and `moveItemDown` to manage items. Pair with `Validate` to validate inputs across all list rows.

#### Link

`/lowdefy-docs/content/actions/link`

The `Link` action is used to link a user to another page. An input can be passed to the next page using either the `urlQuery`, which is visible to the user, but persists if the browser is refreshed, or by using the `input` object, which is not visible to the user.

#### _request

`/lowdefy-docs/content/operators/_request`

The `_request` operator returns the response value of a request. If the request has not yet been called, or is still executing, the returned value is `null`. Dot notation and [block list indexes](/lists) are supported. A dot is always a separator unless it is escaped with `\.`, which makes it a literal character in the key — `a\.b` reads the key `a.b`; inside a double-quoted YAML string the escape must be written `\\.`. On an unescaped path each segment is tried as a plain key first, and a plain key that is present always wins: a nested `a.b.c` shadows a literal `a.b` key, and a present `a` blocks the literal key even when it holds a string or number rather than an object. A literal dotted key is only reached where the plain key is absent, so escape it to address one reliably. The leading segment of a `_request` path is the request id and is matched exactly, so the rule above applies to the part of the path after it. For more detailed information about a request, the [_request_details](/_request_details) operator can be used.

#### _url_query

`/lowdefy-docs/content/operators/_url_query`

The `_url_query` operator gets a value from the [`urlQuery`](/page-and-app-state) object. The `urlQuery` is a data object that is set as the [`https://en.wikipedia.org/wiki/Query_string`] of the app URL. It can be set when linking to a new page using the [`Link`](/link) action, and can be used to set data like a `id` when switching to a new page. Unlike `input`, the `urlQuery` is visible to the user, and can be modified by the user.

#### Skeleton

`/lowdefy-docs/content/display-blocks/skeleton`

Rectangular skeleton loading placeholder.

### Blocks

Live schema: `lowdefy_get_schema` with kind `blocks`.

#### List

Provided by `@lowdefy/blocks-basic`. Category: `list`, value type: `array`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `direction` | `"row"`, `"column"`, `"row-reverse"`, `"column-reverse"` |  |  | List content along a 'row' or down a 'column'. Applies the 'flex-direction' css property to the List block. |
| `wrap` | `"wrap"`, `"nowrap"`, `"wrap-reverse"` |  |  | Specifies wrapping style to be applied to List block as 'wrap', 'nowrap' or 'wrap-reverse'. Applies the 'flex-wrap' css property to the List block - defaults to 'wrap', requires List direction to be set. |
| `scroll` | boolean |  |  | Specifies whether scrolling should be applied to the List, can be true or false. Applies the 'overflow' css property to the List block - defaults to 'visible', requires List direction to be set. |

##### Events

- `onClick`: Trigger actions when the List is clicked.

##### Example

```yaml
- id: notes_header
  type: Box
  layout:
    justify: space-between
    align: center
  blocks:
    - id: notes_title
      type: Title
      layout:
        flex: 0 0 auto
      properties:
        content: Notes
        level: 4
    - id: notes_add
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Add Note
        icon: AiOutlinePlus
        color: primary
        variant: solid
        size: small
      events:
        onClick:
          - id: notes_push
            type: CallMethod
            params:
              blockId: notes
              method: pushItem
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

#### Result

Provided by `@lowdefy/blocks-antd`. Category: `container`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `icon` | string \\| object |  |  | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon to use as result image. |
| `status` | `"success"`, `"error"`, `"info"`, `"warning"`, `"404"`, `"403"`, `"500"` |  | `"info"` | Status of the result. Determines image and color. |
| `subTitle` | string |  |  | Result subtitle or secondary text - supports html. |
| `title` | string |  |  | Result title or primary text - supports html. |
| `theme` | object |  |  | Antd design token overrides for this block. See antd design tokens. |

##### Events

_No events._

##### Example

```yaml
- id: status_success
  type: Result
  properties:
    status: success
    title: Successfully Purchased Cloud Server
    subTitle: 'Order number: 2026-0342-8756-0028. Cloud server configuration takes 1-5 minutes, please wait.'
```

#### Skeleton

Provided by `@lowdefy/blocks-loaders`. Category: `display`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `height` | number \\| string |  |  | Height of the skeleton. |
| `width` | number \\| string |  |  | Width of the skeleton. |

##### Events

_No events._

##### Example

```yaml
- id: basic_line
  type: Skeleton
  layout:
    flex: 0 0 auto
  properties:
    width: 200
    height: 16
```

### Operators

Live schema: `lowdefy_get_schema` with kind `operators`.

#### _request

Provided by `@lowdefy/operators-js`.

Accepts string: Dot-notation path to request response data. First segment is the request ID, remaining segments access nested properties.

#### _state

Provided by `@lowdefy/operators-js`.

**Form 1** — string: Dot-notation path to value in state.

**Form 2** — integer: Index to access in state.

**Form 3** — `true`: Return all state.

**Form 4** — object

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `key` | string \\| integer |  |  |  |
| `default` | any |  |  | Default value if key does not exist. |
| `all` | boolean |  |  | Return all state. |

#### _url_query

Provided by `@lowdefy/operators-js`.

**Form 1** — string: Dot-notation path to value in URL query params.

**Form 2** — integer: Index to access in URL query params.

**Form 3** — `true`: Return all URL query params.

**Form 4** — object

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `key` | string \\| integer |  |  |  |
| `default` | any |  |  | Default value if key does not exist. |
| `all` | boolean |  |  | Return all URL query params. |

#### _if

Provided by `@lowdefy/operators-js`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `test` | boolean | yes |  | Boolean condition to evaluate. |
| `then` | any |  |  | Value returned when test is true. |
| `else` | any |  |  | Value returned when test is false. |

### Actions

Live schema: `lowdefy_get_schema` with kind `actions`.

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

### Requests

Live schema: `lowdefy_get_schema` with kind `requests`.

#### MongoDBFind

Provided by `@lowdefy/connection-mongodb` on connection `MongoDBCollection`. Connection access checked: read.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `query` | object | yes |  | A MongoDB query object |
| `options` | object |  |  | Optional settings. |
<!-- generated:reference:end -->

## Recipe

A list page is one request, one list block, filters in `state`, a row link, an empty state and a
skeleton. Build it in that order; each step is verifiable before the next.

**Superseded by:** `lowdefy_scaffold_page` writes the page skeleton (layout block, `onInitAsync`,
a placeholder request) — call it first and fill in the parts below instead of typing the frame.
`lowdefy_get_schema` and `lowdefy_get_examples` replace every property table in the Reference.

### 1. The request

One request per list, in `requests:` on the page. Filters never come from `_state` inside the
request — a request's `properties` are evaluated on the server with an **empty** `state`
(`packages/api/src/routes/request/callRequest.js` passes `state: {}`), so `_state` there is always
`null`. Everything the page wants to send goes through `payload`, and the request reads it with
`_payload`.

```yaml
requests:
  - id: list_orders
    type: MongoDBFind
    connectionId: orders
    payload:
      status:
        _state: filters.status
      search:
        _state: filters.search
    properties:
      query:
        # Drop a filter from the query when it is empty; lowdefy-filters has the full pattern.
        _object.assign:
          - {}
          - _if:
              test:
                _not:
                  _type:
                    type: empty
                    on:
                      _payload: status
              then:
                status:
                  _payload: status
              else: {}
      options:
        sort:
          created.at: -1
        limit: 50
        projection:
          _id: 1
          title: 1
          status: 1
          created: 1
```

Rules:

- Return only the columns the list renders (`projection`). A list page never needs the whole
  document; the detail page fetches that.
- Always `limit`. An unbounded find is a slow page waiting to happen; add `lowdefy-pagination`
  when a list can exceed one screen.
- Give the request the same name as the collection plus the verb: `list_orders`, not `get_data`.
- Test it before wiring blocks: `lowdefy_run_request` with `pageId`, `requestId` and a
  `payload`. Requests on a tenant-scoped or role-gated connection return **empty rows** for an
  anonymous caller — pass `user: { roles: [...] }` to run as the caller the page expects.

### 2. Load it

Run the request from the page's own block with `onInitAsync`, not `onInit`: the page renders
immediately and the skeletons (step 5) show while the request is in flight. `onInit`/`onInitAsync`
are valid on the page block only — putting them on a nested block is a build error.

```yaml
id: orders
type: PageSidebarLayout
events:
  onInitAsync:
    - id: load
      type: Request
      params: list_orders
```

Re-run the same `Request` from every filter's `onChange` (step 3). Do not copy response fields
into state to render them — read them with `_request` where they are used. State is for what the
user typed; `_request` is for what the server said. The one exception is the list block itself
(step 4), which needs an array in state to know how many rows to draw.

### 3. Filters bound to state

Filters are input blocks whose ids live under one key, `filters.*`, so the payload above is one
`_state: filters` and a "clear" button is one `SetState`. Each filter re-runs the request on
change.

```yaml
- id: filters.status
  type: Selector
  layout:
    span: 6
  properties:
    title: Status
    allowClear: true
    options:
      _ref: enums/order_status.yaml
  events:
    onChange:
      - id: reload
        type: Request
        params: list_orders
- id: filters.search
  type: TextInput
  layout:
    span: 12
  properties:
    title: Search
    allowClear: true
  events:
    onPressEnter:
      - id: reload
        type: Request
        params: list_orders
- id: clear_filters
  type: Button
  properties:
    title: Clear
    type: default
  events:
    onClick:
      - id: clear
        type: SetState
        params:
          filters: {}
      - id: reload
        type: Request
        params: list_orders
```

Trap: **`visible: false` deletes the block's value from `state`** (`packages/engine/src/Slots.js`
`updateState` removes every invisible input's key). A filter hidden behind an "advanced" toggle
loses its value the moment it is hidden, and the next request runs without it. Either keep the
filter visible, or store the value under a different key with `SetState` before hiding the block.

Unknown block properties, unknown event names and duplicate block ids are build errors in v8:
`lowdefy_build_status` will name them the moment the file is saved. Use `onPressEnter` on
`TextInput` — `onEnter` does not exist and the build says so.

### 4. The list block and the row link

Render rows with a `List` block over the request response. Every child block id carries a `$`
placeholder for the list index, and the row's data is read with `_request: list_orders.$.field`.

```yaml
- id: order_rows
  type: List
  properties:
    direction: vertical
  blocks:
    - id: order_rows.$.card
      type: Card
      properties:
        title:
          _request: list_orders.$.title
        size: small
      events:
        onClick:
          - id: open
            type: Link
            params:
              pageId: order
              urlQuery:
                id:
                  _request: list_orders.$._id
      blocks:
        - id: order_rows.$.status
          type: Tag
          properties:
            title:
              _request: list_orders.$.status
```

Rules:

- `List` takes its length from the array in `state` under its own id, so after every
  `Request` add `SetState` with `order_rows: { _request: list_orders }`. The row blocks still read
  their fields with `_request: list_orders.$.field` — `$` is replaced by the row index — so the
  state copy is only there for the row count, and display blocks inside the list hold no state
  of their own.
- The row link is `Link` with `pageId` and `urlQuery.id`. `urlQuery` is visible in the address
  bar and survives refresh; that is what a detail page wants. Use `input` only for values that
  must not appear in the URL.
- A `List` never gets `visible` bound to the response: an empty array simply renders nothing,
  which is why the next step exists.

For an AgGrid table instead of cards, see `lowdefy-aggrid-tables`; the request and filter parts
are identical.

### 5. Empty state and loading skeleton

Two states the response can be in, both explicit:

```yaml
- id: empty
  type: Result
  visible:
    _and:
      - _type:
          type: array
          on:
            _request: list_orders
      - _type:
          type: empty
          on:
            _request: list_orders
  properties:
    title: No orders match these filters
    status: info
```

`_request` is `null` while the request has not returned (and while it is loading without
`holdValue`), and `_type: empty` is true for `null` as well as `[]` — the `array` test is what
stops the empty state flashing before the first response. Do not write `_eq: [{ _request: x }, []]`:
`_eq` is strict identity and never matches two arrays. To test a loading flag use
`_request_details: list_orders.loading`.

For loading, give the list block a `skeleton` so the page keeps its shape while `onInitAsync`
runs. Skeleton blocks are not real blocks (no state, no events) and may only use types from
`@lowdefy/blocks-basic` and `@lowdefy/blocks-loaders`:

```yaml
- id: order_rows
  type: List
  skeleton:
    type: Box
    blocks:
      - type: Skeleton
        properties:
          height: 72
      - type: Skeleton
        properties:
          height: 72
```

Blocks are in loading until `onInit` completes and while their own `onMount` runs; `onInitAsync`
does **not** hold the page in loading, which is exactly why the list needs its own `skeleton`
rather than relying on the page's default behaviour. `lowdefy-loading-skeletons` covers sizing.

### 6. Verify

1. `lowdefy_build_status` — zero errors. In v8 a typo in an operator name (`_stat`), a duplicate
   block id, an unknown event or an undeclared block property is an error, not a warning.
2. `lowdefy_run_request` with an empty payload and with each filter set — rows come back and the
   `projection` holds.
3. `lowdefy_screenshot_page` for the page with no data (empty state) and with data; then
   `lowdefy_inspect_state` after typing a filter to confirm `filters.*` is where the payload
   expects it.
4. `lowdefy check` (or `lowdefy_check`) before committing — it applies the production rules
   without a build.

### Checklist

- Request has `projection`, `sort`, `limit`; filters arrive through `payload`, read by `_payload`.
- Loaded with `onInitAsync` on the page block; filters and clear button re-run the same request.
- Filter ids are `filters.*`; no filter is ever `visible: false` while its value matters.
- Row link is `Link` with `pageId` + `urlQuery.id` read from `_request: <id>.$._id`.
- `Result` empty state on `_type: array` and `_type: empty` of the response; list has a `skeleton`.
