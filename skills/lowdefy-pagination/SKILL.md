---
name: lowdefy-pagination
description: Use when a list is too long for one request — page and size in state, `skip`/`limit` in the query, a total count, and the `Pagination` block.
---

# Pagination

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### Pagination

`/lowdefy-docs/content/input-blocks/pagination`

Pagination control with page size changer and quick jumper. Maintains `current`, `pageSize`, and `skip` in block state, making it easy to wire into database queries for server-side pagination. See the guide below for a full MongoDB + AgGrid example.

#### _request

`/lowdefy-docs/content/operators/_request`

The `_request` operator returns the response value of a request. If the request has not yet been called, or is still executing, the returned value is `null`. Dot notation and [block list indexes](/lists) are supported. A dot is always a separator unless it is escaped with `\.`, which makes it a literal character in the key — `a\.b` reads the key `a.b`; inside a double-quoted YAML string the escape must be written `\\.`. On an unescaped path each segment is tried as a plain key first, and a plain key that is present always wins: a nested `a.b.c` shadows a literal `a.b` key, and a present `a` blocks the literal key even when it holds a string or number rather than an object. A literal dotted key is only reached where the plain key is absent, so escape it to address one reliably. The leading segment of a `_request` path is the request id and is matched exactly, so the rule above applies to the part of the path after it. For more detailed information about a request, the [_request_details](/_request_details) operator can be used.

### Blocks

Live schema: `lowdefy_get_schema` with kind `blocks`.

#### Pagination

Provided by `@lowdefy/blocks-antd`. Category: `input`, value type: `object`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `total` | integer |  | `100` | Total number of items to be displayed in pagination. |
| `size` | `"small"`, `"default"` |  | `"default"` | Pagination element size. |
| `simple` | boolean |  | `false` | Use simplified pagination display. |
| `showTotal` | boolean \\| string \\| object |  | `false` | Show pagination total number and range if boolean, or define a custom string or function to display. |
| `showSizeChanger` | boolean |  | `false` | Determine whether to show page size select, it will be true when total > 50. |
| `showQuickJumper` | boolean |  | `false` | Determine whether you can jump to pages directly. |
| `pageSizeOptions` | array |  | `[10,20,30,40]` | Specify the page size changer options. |
| `hideOnSinglePage` | boolean |  | `false` | Hide pager on short list of a single page. |
| `disabled` | boolean |  | `false` | Disable pager. |
| `theme` | object |  |  | Antd design token overrides for this block. See antd design tokens. |

##### Events

- `onSizeChange`: Triggered when page size is changed. Event payload: `current`, `pageSize`, `skip`.
- `onChange`: Triggered when current page is changed. Event payload: `current`, `pageSize`, `skip`.

##### Example

```yaml
- id: size_default_label
  type: Markdown
  properties:
    content: '**Default size:**'
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

#### _product

Provided by `@lowdefy/operators-js`.

Accepts array: Array of numbers to multiply.

### Requests

Live schema: `lowdefy_get_schema` with kind `requests`.

#### MongoDBFind

Provided by `@lowdefy/connection-mongodb` on connection `MongoDBCollection`. Connection access checked: read.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `query` | object | yes |  | A MongoDB query object |
| `options` | object |  |  | Optional settings. |

#### MongoDBAggregation

Provided by `@lowdefy/connection-mongodb` on connection `MongoDBCollection`. Connection access checked: read.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `pipeline` | array | yes |  | Array containing all the aggregation framework commands for the execution. |
| `options` | object |  |  | Optional settings. |
<!-- generated:reference:end -->

## Recipe

Must cover: `page`/`pageSize` in state, `skip: (page - 1) * pageSize` via `_product`, `$facet` for rows and total in one request, `Pagination` `onChange` re-running the request, and resetting to page 1 when filters change.
