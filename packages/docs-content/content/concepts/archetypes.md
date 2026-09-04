# Page archetypes

A **page archetype** is a framework-owned page `type` with a large, typed set of `props` that the build expands into ordinary blocks and requests. A list page is thirty lines with one way to be right instead of four hundred with hundreds of ways to be subtly wrong.

## Experimental

Archetypes are experimental and an app must opt in:

```yaml
# lowdefy.yaml
config:
  experimental:
    archetypes: true
```

The block tree an archetype expands to may change within a minor release until `lowdefy expand` and the archetype slots have settled. Building an archetype page without the flag is an error under the `archetype` check.

An archetype can only be a page's root `type`, and it reads the app's [`collections`](/collections) declaration for the field types it needs — so a column, filter or search field named on an archetype resolves its label, type and enum values from the schema, and a field that is not declared is a build error rather than a silently mistyped column.

## `ListPage`

Lists records from a collection: a request with `projection`, `sort` and `limit`, filters bound to state, a search box, a row link, an empty state and a loading skeleton — all generated.

```yaml
# pages/controls.yaml
id: controls
type: ListPage
props:
  collection: controls
  columns: [title, framework_id, status]
  filters: [framework_id, status]
  search: [title, description]
  rowLink: { pageId: control, urlQuery: { id: $_id } }
```

With `controls` declared under [`collections`](/collections), the build knows `status` is an enum of four values (rendered as a `Selector` filter and a `Tag` cell) and that `framework_id` is a plain field (a text filter). The `rowLink` `$_id` token becomes a read of the row's `_id` from the list response.

### Props

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `collection` | string | yes | Must be declared in `collections:`. |
| `connectionId` | string | no | Read connection; derived from the collection when exactly one reads it. |
| `columns` | array | no | Field names or `{ field, label, format, link }`. Defaults to every declared field. |
| `filters` | array | no | Field names or `{ field, label, widget }`; the widget is derived from the field type. |
| `search` | array | no | Fields matched by one search box with a case-insensitive regex. |
| `rowLink` | object | no | `{ pageId, url, urlQuery, input, newWindow }`; `$<field>` tokens read the row. |
| `sort` | object | no | MongoDB sort. Defaults to the collection's first declared `date` field descending, else `_id` descending. |
| `pageSize` | integer | no | A cap on the rows fetched. Defaults to `50`. There are no pagination controls yet, so rows beyond the cap are not reachable — narrow the result with `filters` or `search`. |
| `title` | string | no | Page heading. Defaults to the humanised collection name. |
| `emptyState` | object | no | `Result` block props shown when no rows match. |
| `actions` | array | no | Header action blocks, e.g. a New button. |
| `layout` | object | no | Root page-layout block `{ type, properties }`. Defaults to `Box`. |

The request payload carries every filter and the search box; the request reads them with `_payload` (a request's own `_state` is always empty server side). Empty filters are dropped from the query, and the search matches its fields with `$or` of `_regex`.

### Cells

Each column after the first is rendered as a labelled cell, with the label humanised from the field name and the value formatted from the field's declared type: an enum as a `Tag`, a `date` through `_intl.dateTimeFormat`, a `number` through `_intl.numberFormat`, a `boolean` as Yes/No, and anything else as text. A missing value renders as nothing rather than as `1970-01-01` or `0`.

Generated cell ids are namespaced `rows.$.cell_<field>`, so a collection field named `card`, `header`, `search` or `empty` can never collide with a generated block id.

### Loading, empty and error

The generated page renders all three states. The rows carry a loading skeleton; the empty `Result` is gated on the list request having **succeeded and returned nothing**; and a separate error `Result` carries the request's error message and a Retry button, gated on the request having failed. Both read the [`_request`](/_request) status form:

```yaml
visible:
  _get:
    key: empty
    from:
      _request:
        key: list
        status: true
```

An empty result is not a failure, and a failure is not an empty result — gating an empty state on the response value alone renders a blank page when the request fails.

### Slots

An archetype you cannot extend has to be deleted the first time it is 10% wrong. `ListPage` takes three block lists under `slots:`, placed at the obvious positions:

| Slot | Placed |
| --- | --- |
| `header` | After the title and the `actions` in the header row. |
| `rowActions` | In each row's card, after the cells (ids inside a row need the `rows.$.` prefix). |
| `footer` | After the list, the empty state and the error state. |

```yaml
id: controls
type: ListPage
props:
  collection: controls
slots:
  rowActions:
    blocks:
      - id: rows.$.edit
        type: Button
        properties:
          title: Edit
```

An archetype generates the page's `requests` and `events`, so the page may not declare its own — doing so is a build error rather than a silent overwrite. When you need a second request or your own `onInit`, expand the page first.

### `lowdefy expand`

The way out. `lowdefy expand <pageId>` writes the built page back into the config directory as ordinary config — build markers stripped, generated ids un-prefixed, slots back to `blocks:`/`areas:` and events back to their action lists:

```
lowdefy build
lowdefy expand controls
```

This writes `pages/controls.yaml`; point `pages:` at it with a `_ref` and delete the archetype declaration. The page is yours from then on: the archetype no longer owns it and will not update it. Pass `--yes` to overwrite an existing file, or `--output <path>` to write elsewhere.

## `DetailPage` and `EditPage`

The detail and edit archetypes follow the same shape and are documented as they land. `DetailPage` reads one document by a `urlQuery` id and renders a `Descriptions` view; `EditPage` renders a form and emits a save endpoint that inherits the page's auth.
