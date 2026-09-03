---
name: lowdefy-detail-pages
description: Use when building a page that shows one record — reading the id from urlQuery, fetching it, a not-found state, a loading skeleton and links to edit.
---

# Detail pages

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### _url_query

`/lowdefy-docs/content/operators/_url_query`

The `_url_query` operator gets a value from the [`urlQuery`](/page-and-app-state) object. The `urlQuery` is a data object that is set as the [`https://en.wikipedia.org/wiki/Query_string`] of the app URL. It can be set when linking to a new page using the [`Link`](/link) action, and can be used to set data like a `id` when switching to a new page. Unlike `input`, the `urlQuery` is visible to the user, and can be modified by the user.

#### _request

`/lowdefy-docs/content/operators/_request`

The `_request` operator returns the response value of a request. If the request has not yet been called, or is still executing, the returned value is `null`. Dot notation and [block list indexes](/lists) are supported. A dot is always a separator unless it is escaped with `\.`, which makes it a literal character in the key — `a\.b` reads the key `a.b`; inside a double-quoted YAML string the escape must be written `\\.`. On an unescaped path each segment is tried as a plain key first, and a plain key that is present always wins: a nested `a.b.c` shadows a literal `a.b` key, and a present `a` blocks the literal key even when it holds a string or number rather than an object. A literal dotted key is only reached where the plain key is absent, so escape it to address one reliably. The leading segment of a `_request` path is the request id and is matched exactly, so the rule above applies to the part of the path after it. For more detailed information about a request, the [_request_details](/_request_details) operator can be used.

#### Link

`/lowdefy-docs/content/actions/link`

The `Link` action is used to link a user to another page. An input can be passed to the next page using either the `urlQuery`, which is visible to the user, but persists if the browser is refreshed, or by using the `input` object, which is not visible to the user.

#### Descriptions

`/lowdefy-docs/content/container-blocks/descriptions`

Description list with configurable layout and columns.

### Blocks

Live schema: `lowdefy_get_schema` with kind `blocks`.

#### Descriptions

Provided by `@lowdefy/blocks-antd`. Category: `container`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `bordered` | boolean |  | `false` | Render items in a table. |
| `colon` | boolean |  | `true` | Include a colon in item labels. |
| `column` | number \\| object |  | `3` |  |
| `itemOptions` | array |  |  |  |
| `items` | array \\| object |  |  |  |
| `layout` | `"horizontal"`, `"vertical"` |  | `"horizontal"` | Put values next to or below their labels. |
| `size` | `"default"`, `"small"` |  | `"default"` | Size of the block. |
| `title` | string |  |  | The title of the description block, placed at the top - supports html. |
| `theme` | object |  |  | Antd design token overrides for this block. See antd design tokens. |

##### Events

_No events._

##### Example

```yaml
- id: basic_array_items
  type: Descriptions
  properties:
    title: User Profile
    items:
      - label: Full Name
        value: Sarah Johnson
      - label: Email
        value: sarah.johnson@example.com
      - label: Phone
        value: +1 (555) 123-4567
      - label: Location
        value: San Francisco, CA
      - label: Role
        value: Senior Developer
      - label: Department
        value: Engineering
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

### Operators

Live schema: `lowdefy_get_schema` with kind `operators`.

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

#### _request

Provided by `@lowdefy/operators-js`.

Accepts string: Dot-notation path to request response data. First segment is the request ID, remaining segments access nested properties.

### Actions

Live schema: `lowdefy_get_schema` with kind `actions`.

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
<!-- generated:reference:end -->

## Recipe

Must cover: `_url_query: id` into `payload`, `onInitAsync` request, `Descriptions` items from `_request`, a `Result` not-found state when the request returns `null`, skeleton while loading, and an edit `Link` carrying `urlQuery`.
