---
name: lowdefy-list-pages
description: Use when building a page that lists records from a request — filters bound to state, a row link with urlQuery, an empty state and a loading skeleton.
kind: recipe
lowdefyVersion: 5.5.1
---

# List pages

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `concepts/lists`, `concepts/connections-and-requests`, `list-blocks/list`, `actions/link`, `operators/_request`, `operators/_url_query`, `display-blocks/skeleton`.

### Blocks

`lowdefy_get_schema` with kind `blocks`, then `lowdefy_get_examples` for usage yaml: `List` (`@lowdefy/blocks-basic`), `Card` (`@lowdefy/blocks-antd`), `Result` (`@lowdefy/blocks-antd`), `Skeleton` (`@lowdefy/blocks-loaders`).

### Operators

`lowdefy_get_schema` with kind `operators`: `_request` (`@lowdefy/operators-js`), `_state` (`@lowdefy/operators-js`), `_url_query` (`@lowdefy/operators-js`), `_if` (`@lowdefy/operators-js`).

### Actions

`lowdefy_get_schema` with kind `actions`: `Request` (`@lowdefy/actions-core`), `Link` (`@lowdefy/actions-core`).

### Requests

`lowdefy_get_schema` with kind `requests`: `MongoDBFind` (`@lowdefy/connection-mongodb`).
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
