# TableInput

The Table for editing a list of rows in a form, such as the line items of an invoice or the ingredients of a recipe. Rows come from `data` and are never written: the block value is the changes made to them, `{ updated, added, removed, moved?, order? }`, which a `MongoDBTableChanges` request saves in one bulk write. It has every Table property, plus "+ Add row", row deletion, undo and redo, and paste from a spreadsheet.

## When to use TableInput

`TableInput` is the [Table](/Table) for rows that belong to a form: the lines of an invoice, the ingredients of a recipe, the contacts on an account. The user edits, adds, deletes, reorders and pastes rows, and one request saves everything they changed.

Use `Table` instead when each edit should save at once (a CRM record list, where `onCellEdit` saves one cell), and `TableLight` when nothing is edited.

`TableInput` takes every `Table` property: columns and cell types, sorting, filters, search, grouping, selection, `rowLink`, row buttons and the rest work the same. It reads client `data` only (no server mode), and its view and selection are internal to the block rather than part of its value. Unlike `Table` it has no slots (no toolbar, bulk action or empty slot blocks): use `emptyText` for its empty state. Row events carry the row's `index` in `data`, and `null` for a row added in the table.

## The value is the changes, not the rows

`data` is never written. The block value holds only what changed since `data`, keyed by row key:

```yaml
updated: # changed fields of existing rows, keyed by the column field (a dot path)
  flour:
    qty: 450
    details.note: strong
added: # new rows, each with a new temporary rowKey
  - rowKey: 3f2c9a61-...
    ingredient: Yeast
    qty: 7
removed: # keys of deleted data rows
  - salt
moved: # with rowDrag.positionField: the new positions of moved rows
  water: 1536
order: [salt, flour, water] # with rowDrag and no positionField: every row key after a move
```

- No changes is `{ updated: {}, added: [], removed: [] }`, the initial value.
- An edit back to the original value drops out of `updated`. Deleting an added row just removes it from `added`.
- The table shows `data` with the changes applied, and only touched rows re-render, so a long list keeps a small page state.
- `onChange` fires with `{ value, cause, rowKey, skipped }`: `cause` is `edit`, `add`, `delete`, `move`, `paste`, `undo` or `redo`, and `skipped` lists the pasted cells that could not be written.
- `SetState` on the block id sets the changes, and `resetChanges` clears them with the undo history.

Rows need a key: `rowKey` (default `_id`, then `id`). A row added in the table shows its temporary key in that field. A `default` on the key column is ignored, so added rows never share a key; the key the saved row gets comes back in the save response's `insertedKeys`.

## Editing

Mark columns `editable: true`, or `editable: { when: <condition> }` to allow it per row. The editor comes from the type:

| Types                           | Editor                      |
| ------------------------------- | --------------------------- |
| `text`, `email`, `phone`, `url` | text input                  |
| `number`, `currency`, `percent` | number input                |
| `date`, `datetime`              | date picker                 |
| `boolean`                       | switch                      |
| `tag`, `status`                 | select from `options`       |
| `tags`                          | multi-select from `options` |
| `rating`                        | stars                       |

Other types (`link`, `avatar`, `people`, `relation`, `html`, `json`, `image`, `progress`, `buttons`, `menu`) are never editable.

Enter, F2, a double-click or typing opens the editor (typing starts with that character). Enter commits, Tab and Shift+Tab commit and open the next or previous editable cell, leaving the editor commits, and Esc cancels.

`validate: [{ pass: <condition>, message }]` and `required: true` check an edit before it commits: a failing check keeps the editor open with the message. Leaves without `key` test the cell value, leaves with `key` read the edited row. Cells of changed and added rows that fail are marked in the table. Lowdefy block validation (`validate` and `required` on the block itself) runs on the value, the changes, not on the rows.

## Adding, deleting and moving rows

```yaml
- id: lines
  type: TableInput
  properties:
    data:
      _request: get_invoice.0.lines
    addRow: true # a "+ Add row" row under the table
    addRowText: Add line
    rowActions:
      delete: true # a delete button on every row
    deleteRows: true # Delete or Backspace deletes the focused row
    rowDrag:
      positionField: position
    defaultView:
      sort:
        - key: position
    columns:
      - key: description
        editable: true
        required: true
      - key: qty
        type: number
        editable: true
        default: 1
      - key: price
        type: currency
        editable: true
        default: 0
        aggregate: sum
```

- "+ Add row" appends a row with each column's `default` (and, with a `positionField`, a position after the last row, across every page with `pagination`) and opens its first editable cell.
- `rowDrag` adds a drag handle, and Alt+Shift+Up/Down moves the focused row. With `positionField`, a move gives only the moved row a new position, the midpoint of its new neighbours, so saving it writes one field. When there is no room left between two positions (a gap under 1e-6) the list is renumbered in steps of 1024 and every changed position is recorded. Without a `positionField`, the full key `order` is recorded instead.
- Moves are blocked while the table is sorted by anything but the position field ascending, filtered or grouped; the handle's tooltip says why.

## Undo, redo and paste

- Cmd/Ctrl+Z undoes and Cmd/Ctrl+Shift+Z or Ctrl+Y redoes, over the last 100 changes.
- Cmd/Ctrl+V pastes tab-separated text (not with `keyboard: false`), as a spreadsheet copies it, over the cells from the focused one: down the displayed rows and across the visible columns. Each value is coerced to the column type and validated. Cells that are not editable, fail validation or fall outside the table are skipped and reported in `onChange` `skipped`; paste never adds rows.
- Cmd/Ctrl+C copies the selected rows, or the focused cell, as tab-separated displayed text, also with `keyboard: false`.

## Loading states

TableInput loads like [`Table`](/TableGuide#loading-states): skeleton rows under the real header while `loading` is true and `data` has no rows (also while its code loads), the rows and a progress bar under the header while a refetch runs (the rows stay even while `_request` returns null), and "No rows" (`emptyText`) when there are none. The changes in its value stay through a refetch: they apply by row key to whatever rows `data` holds.

## Saving

`MongoDBTableChanges` saves the value in one request. Pass the value as the payload and list the columns it may write in `fields`, keyed by the column `field` (the changeset keys; `MongoDBTableQuery` keys its `fields` by column `key` instead):

```yaml
requests:
  - id: save_lines
    type: MongoDBTableChanges
    connectionId: invoices
    payload:
      invoice_id:
        _url_query: id
      changes:
        _state: lines
    properties:
      array: # the rows are items of an array in one document
        documentId:
          _payload: invoice_id
        path: lines
      filter:
        org_id:
          _user: organization.id
      positionField: position
      fields:
        description:
          type: text
        qty:
          type: number
        price:
          type: currency
      changes:
        _payload: changes
```

Then check the response, refetch `data` and call `resetChanges`. `unmatchedKeys` lists the rows the changes named that matched nothing (deleted by someone else, or outside the `filter`): nothing was written for them, so treat a non-empty list as a failed save:

```yaml
- id: save
  type: Button
  properties:
    title: Save
  events:
    onClick:
      - id: save_lines
        type: Request
        params: save_lines
      - id: check_saved
        type: Throw
        params:
          throw:
            _gt:
              - _array.length:
                  _if_none:
                    - _request: save_lines.unmatchedKeys
                    - []
              - 0
          message: Some lines were changed or removed by someone else. Reload and try again.
      - id: refetch
        type: Request
        params: get_invoice
      - id: reset
        type: CallMethod
        params:
          blockId: lines
          method: resetChanges
```

Leave out `array` when every row is its own document (collection mode). New rows are stamped with the `filter`'s equality conditions (such as `org_id`), and `insertDefaults` sets other values they start with, such as the creator; `fields` can never write a `filter` or `insertDefaults` field, and row values never override `insertDefaults`. Only `fields` can be written, values are coerced to their type, and the base `filter` scopes every operation. The [Table guide](/Table) has complete array and collection mode pages, and [MongoDBTableChanges](/MongoDB) the full reference.

Any other save path works too: the value is plain data, so a request can read `_payload: changes.updated`, `changes.added` and `changes.removed` and write them however the backend needs.

```yaml
- id: contacts_input
  type: TableInput
  properties:
    columns:
      - key: name
        editable: true
        required: true
      - key: email
        type: email
        width: 220
        editable: true
      - key: role
        type: tag
        editable: true
        options:
          - Buyer
          - Champion
          - Finance
      - key: active
        type: boolean
        width: 100
        editable: true
    data:
      - _id: c1
        name: Ada Lovelace
        email: ada@example.com
        role: Champion
        active: true
      - _id: c2
        name: Grace Hopper
        email: grace@example.com
        role: Buyer
        active: false
```

```yaml
- id: invoice_lines
  type: TableInput
  properties:
    addRow: true
    addRowText: Add line
    rowActions:
      delete: true
    columns:
      - key: description
        width: 260
        editable: true
        validate:
          - pass:
              op: notEmpty
            message: Describe the line.
      - key: qty
        type: number
        width: 100
        editable: true
        default: 1
        validate:
          - pass:
              op: gt
              value: 0
            message: The quantity must be more than 0.
      - key: price
        type: currency
        width: 140
        editable: true
        default: 0
        aggregate: sum
    data:
      - _id: l1
        description: Design workshop
        qty: 1
        price: 1800
      - _id: l2
        description: Implementation days
        qty: 5
        price: 950
```

```yaml
- id: recipe_steps
  type: TableInput
  properties:
    addRow: true
    rowDrag:
      positionField: position
    defaultView:
      sort:
        - key: position
    columns:
      - key: step
        width: 280
        editable: true
      - key: position
        type: number
        width: 110
    data:
      - _id: s1
        step: Mix the flour and water
        position: 1024
      - _id: s2
        step: Rest for an hour
        position: 2048
      - _id: s3
        step: Bake at 250°C
        position: 3072
```

```yaml
- id: ingredients_input
  type: TableInput
  properties:
    rowKey: id
    deleteRows: true
    columns:
      - key: ingredient
        editable: true
      - key: grams
        type: number
        editable: true
    data:
      - id: flour
        ingredient: Flour
        grams: 500
      - id: salt
        ingredient: Salt
        grams: 10
- id: ingredients_reset
  type: Button
  properties:
    title: Reset changes
    size: small
  events:
    onClick:
      - id: ingredients_reset_call
        type: CallMethod
        params:
          blockId: ingredients_input
          method: resetChanges
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `columns` | array \| null | - | The columns, in default order. |
| `defaultColumn` | object | - | Defaults applied to every column. |
| `defaultColumn.sortable` | boolean | `true` | Sort by clicking the header (Shift+click adds to a multi-sort). Defaults to `defaultColumn.sortable` (true). |
| `defaultColumn.filterable` | boolean | `true` | Offer the column in filters: the header menu "Filter…" item and the filter builder. |
| `defaultColumn.resizable` | boolean | `true` | Resize the column by dragging the right edge of its header. |
| `defaultColumn.groupable` | boolean | `false` | Allow grouping rows by this column (view `group`, the `setGroup` method, the header menu). Default false. |
| `defaultColumn.editable` | boolean \| object | `false` | Edit cells of this column: `true`, or `{ when: Condition }` to allow it per row. The editor comes from the type: text, email, phone and url edit as text; number, currency and percent as a number; date and datetime with a date picker; boolean with a switch; tag and status select from `options`; tags select several; rating with stars. Enter, F2, double-click or typing opens it; Enter, Tab or leaving commits; Esc cancels. Table fires onCellEdit; TableInput writes its value. |
| `defaultColumn.editable.when` | object | - | Condition tested against the row (and the cell value, for leaves without `key`) that decides whether the cell is editable. |
| `defaultColumn.width` | number | - | Column width in pixels. Default 160. |
| `defaultColumn.minWidth` | number | - | Minimum width in pixels when resizing. Default 48. |
| `defaultColumn.maxWidth` | number | - | Maximum width in pixels when resizing. |
| `defaultColumn.ellipsis` | integer \| boolean | - | Clamp the text to this many lines (`true` is one) with an ellipsis; the full text shows on hover. More than one line makes rows as tall as their content. |
| `defaultColumn.wrap` | boolean | `false` | Wrap long text; rows grow to fit (measured row heights, which turn column virtualisation off). Text stays on one line by default. |
| `data` | array | - | The rows to edit. They are never written: the changes are the block value, shown over the rows. |
| `rowKey` | string | - | Dot path to the unique row key. Defaults to `_id`, then `id`. Changes are recorded by key, so rows need a key. A row added in the table shows its temporary key in this field (default `_id` when the data uses it, else `id`). |
| `rowVersionField` | string | - | Dot path to a field that changes whenever a row changes (for example `updated.timestamp`). When set, rows are compared by key and this field instead of by content; a row without it is compared by content. |
| `user` | object | - | The user object for `$user` values in filters, `rules`, `rowRules` and button `hidden`/`disabled` conditions, usually `{ _user: true }`. Blocks do not see the session, so conditions read `$user` from this property. |
| `defaultView` | object | - | The initial and reset view. Parts missing from the table value fall back to this, then to the column defaults. |
| `defaultView.columns` | array | - | Column order, widths, pinning and visibility. |
| `defaultView.columns.$.key` | string | - |  |
| `defaultView.columns.$.width` | number | - |  |
| `defaultView.columns.$.pinned` | string | - | Pin the column to the start or end, where it stays visible while scrolling. Enum: `start`, `end`. |
| `defaultView.columns.$.hidden` | boolean | - |  |
| `defaultView.sort` | array | - | Sort order: `[{ key, desc }]`. |
| `defaultView.sort.$.key` | string | - |  |
| `defaultView.sort.$.desc` | boolean | - |  |
| `defaultView.filter` | object \| null | - | Filter condition: `{ and: [...] }` / `{ or: [...] }` groups of `{ key, op, value }` leaves. Operators depend on the column type; `{ $user: path }` values read the `user` property. |
| `defaultView.search` | string \| null | - | Search text: rows match when every word appears (case-insensitive) in the display text of the searched columns. |
| `defaultView.group` | array | - | Group rows by these columns, outermost first: `[{ key }]`. Only columns with `groupable: true` group; groups follow the sort on their column, else option order, else first appearance, and empty values group as "(Empty)" last. |
| `defaultView.group.$.key` | string | - |  |
| `defaultView.collapsedGroups` | array | - | Keys of collapsed groups: the JSON of the group value path, for example `["lead"]` or `["EMEA","Ada"]` (empty values are `null`). |
| `defaultView.aggregates` | object | - | Aggregates by column key, for example `{ amount: sum, deals: count }`, over the columns' own `aggregate`. `null` turns a column default off. Group headers show them under their columns. |
| `defaultView.density` | string | - | Row density: compact 32px, default 40px, comfortable 52px rows. Defaults to `size`. Enum: `compact`, `default`, `comfortable`. |
| `defaultView.wrap` | boolean | - | Wrap the text of text-like columns (text, email, phone, url, link, html, relation) that set no `wrap` or `ellipsis` of their own; rows grow to their content. The toolbar density control has a Wrap toggle. |
| `defaultView.pageSize` | integer | - | Rows per page when pagination is on. Defaults to the `pageSize` property. |
| `rowSelection` | object | - | Turn on row selection. The selection is the `selected` part of the table value. |
| `rowSelection.type` | string | `"checkbox"` | Multiple (checkbox) or single (radio) selection. Enum: `checkbox`, `radio`. |
| `rowSelection.preserve` | boolean | `false` | Keep selected keys of rows that leave `data`. Always on in server mode. |
| `rowSelection.cascade` | boolean | `false` | In a tree, selecting or clearing a row also selects or clears all its descendants. |
| `tree` | object | - | Show rows as a tree (client data only): rows are indented under their parent with an expand chevron in the first column, Right and Left expand and collapse, sorting sorts within each level and a filter keeps the ancestors of matching rows. The expanded row keys are the `expanded` part of the table value. Give exactly one of `childrenField` or `parentField`. |
| `tree.childrenField` | string | - | Dot path to each row's child rows (nested data). |
| `tree.parentField` | string | - | Dot path to the row key of each row's parent (flat data). Rows whose parent is not in `data` are roots. |
| `tree.lazy` | boolean | `false` | Load children on demand: rows whose `hasChildrenField` is true show a chevron before their children are loaded, expanding a row fires `onRowExpand` with `needsChildren: true` until its children are in `data`, and the app adds them (for example a request whose result is merged into the data with `parentField` set). |
| `tree.hasChildrenField` | string | `"hasChildren"` | With `lazy`, the field that marks rows with children that are not loaded yet. |
| `tree.indent` | number | `20` | Indent per level in pixels. |
| `expandable` | object | - | Expandable rows: a chevron in the first column opens a detail row below the row, as high as its content. The expanded row keys are the `expanded` part of the table value. |
| `expandable.template` | string | - | Nunjucks HTML for the detail row, rendered with `row` and `rowKey`. Output is escaped: use `\| safe` to insert HTML from a field. The HTML is sanitised. |
| `expandable.rowExpandable` | object | - | Which rows can expand. |
| `expandable.rowExpandable.when` | object | - | A condition (`{ key, op, value }`, or `and` / `or` lists) tested against the row. |
| `rowLink` | object | - | Make rows links. A plain click navigates, Cmd/Ctrl or middle click opens a new tab, and Enter on a focused row follows it. Values in `urlQuery` are row paths. |
| `rowLink.pageId` | string | - | The page to open. |
| `rowLink.href` | string | - | A URL to open instead of a page. |
| `rowLink.urlQuery` | object | - | Query parameters; each value is a path in the row, like `{ _id: _id }`. |
| `rowLink.input` | object | - | Input for the page. |
| `rowLink.newTab` | boolean | - | Always open in a new tab. |
| `rowRules` | array | - | Conditional row formatting: `[{ when, className, style, color }]`, where `when` conditions name columns by `key`. |
| `size` | string | `"default"` | Row density: compact 32px, default 40px, comfortable 52px rows. The view starts at this density (`view.density` overrides it). Enum: `compact`, `default`, `comfortable`. |
| `bordered` | boolean | `false` | Draw borders between cells. |
| `height` | number \| string | - | A fixed table height (px number or CSS size); the rows scroll under a sticky header and the summary row stays in view. Without it the table grows with its rows up to `maxHeight`. |
| `maxHeight` | number \| string | `600` | Maximum height when `height` is not set. |
| `rowHeight` | number | - | Row height in pixels. Overrides the density height. |
| `virtual` | - | `"auto"` | Virtualise rows and columns. `auto` virtualises rows above 200 and columns above 20 or when the table is wider than twice its viewport. Enum: `auto`, `true`, `false`. |
| `stickyHeader` | boolean | `true` | Keep the header visible while the table scrolls. |
| `rowDrag` | boolean \| object | - | Reorder rows by dragging a handle in a leading column, or with Alt+Shift+ArrowUp/Down on a focused row. Not available while the table is sorted (except ascending by the position field), filtered or grouped, in a tree or in server mode; the handle is disabled with a tooltip saying why. Table fires onRowMove; TableInput records the move in its value. `true`, or `{ positionField }` for fractional positions. |
| `rowDrag.positionField` | string | - | Dot path of a numeric position field the rows are ordered by. A move gives only the moved row a new position: the midpoint of its new neighbours (a neighbour ∓ 1024 at the ends), renumbering the list in steps of 1024 only when there is no room left. |
| `headerMenu` | boolean | `true` | Show the column menu button in each header (on hover or focus): sort, filter, pin, freeze, autosize, hide and the column manager. |
| `reorderable` | boolean | `true` | Reorder columns by dragging their headers. |
| `keyboard` | boolean \| object | `true` | Keyboard navigation between cells. Grid roles stay on when off, and so do Ctrl/Cmd+C copy and the keys of a focused group header. An object turns it on with options. |
| `keyboard.next` | boolean | `false` | After a row button, menu item or single-key action completes, move focus to the next row (queue and triage lists). |
| `toolbar` | boolean \| object | `false` | The toolbar above the table. `true` turns on every item; an object turns on the listed items. |
| `toolbar.views` | boolean | `false` | Saved view tabs (needs `views`), with the unsaved changes strip. |
| `toolbar.search` | boolean | `false` | A search box that writes `view.search` (Cmd/Ctrl+F focuses it while the table has focus). |
| `toolbar.quickFilters` | array | - | Column keys to show as quick filter chips. Columns with `options` get a checkbox list (an `in` condition); others open the column filter. |
| `toolbar.filter` | boolean | `false` | A Filter button that edits the whole `view.filter`. |
| `toolbar.sort` | boolean | `false` | A Sort button to add, remove, reorder and flip sort levels. |
| `toolbar.group` | boolean | `false` | A Group button to pick and order group levels (groupable columns). |
| `toolbar.columns` | boolean | `false` | A Columns button that opens the column manager. |
| `toolbar.density` | boolean | `false` | A compact / default / comfortable density toggle, with a Wrap toggle for `view.wrap`. |
| `toolbar.export` | boolean | `false` | An Export button that downloads the view as CSV. |
| `views` | array \| null | - | Saved views, from any source (often a request). Selecting a tab loads its view; changes show an unsaved changes strip with Save, Save as and Discard. |
| `activeView` | string \| number \| object \| null | - | The id of the active saved view (an ObjectId id matches by its hex). Defaults to the first view. Changing it selects that view. |
| `persist` | object | - | Keep the user's view between visits. Off by default. The selection is never persisted. |
| `persist.key` | string | - | Storage key (localStorage) or query parameter name (url). |
| `persist.storage` | string | `"local"` | `local` keeps the view in localStorage (none in a private window or with blocked storage); `url` writes a compact encoding to the query string, replacing history. Enum: `local`, `url`. |
| `emptyText` | string | `"No rows"` | What to show when there are no rows - supports html. |
| `loading` | boolean | `false` | Show the loading state: skeleton rows without data, a progress bar with it. |
| `pagination` | boolean | `false` | Show the rows in pages of `pageSize` with a pager below the table. Off by default, unlike TableLight: the Table scrolls any number of rows virtually. `true` means what it means on TableLight: pages, with the pager always shown. |
| `pageSize` | integer | `50` | Rows per page when `pagination` is on (`view.pageSize` overrides it). |
| `providers` | array | - | The enrichment providers columns can call (`kind: enrichment`), the catalogue the add-column picker offers. Each maps, on the server, to the app's `enrich_{id}` endpoint, so a column only calls what the app exposes. |
| `providers.$.id` | string | - | The provider id, the column `provider`. |
| `providers.$.title` | string | - | The name in the picker. |
| `providers.$.description` | string | - | A line under the name in the picker. |
| `providers.$.icon` | - | - | An icon for the provider. |
| `providers.$.inputs` | array | - | The inputs, `[{ key, title, type, required }]`, mapped to columns or literals in the picker. |
| `providers.$.outputs` | array | - | Paths in the result a column can show, `[{ path, title, type }]`; the picker sets the column type from it. |
| `providers.$.cost` | number | - | The cost of one call, for the app to show. |
| `addColumn` | boolean \| object | - | Show a "+" at the end of the header that opens the add-column picker (onColumnAdd). `true` offers every kind; `{ kinds: [...] }` only those (`input`, `formula`, `enrichment`, `ai`, `extract`). |
| `addColumn.kinds` | array | - | The column kinds the picker offers. |
| `addRow` | boolean | `false` | Show a "+ Add row" row under the table. A new row gets each column `default` (and, with `rowDrag.positionField`, a position after the last row), and opens its first editable cell. |
| `addRowText` | string | `"Add row"` | Text of the add-row row. |
| `inputFieldPrefix` | string | - | Where user-defined input columns added in the picker or by a CSV import keep their values: under this path, then the column key (with `values`, a `notes` column stores at `values.notes`, so a column can never name another field of the row). The column is sent with that `field`, and onRowAdd / onImport values sit at it. Without it, at the key. |
| `importCsv` | boolean | `false` | Show an Import button in the toolbar: a CSV file is parsed in the browser, its headers mapped to input columns (or new text columns), and the rows sent through onImport in batches of 500. |
| `summary` | boolean | `true` | Show the summary footer when any aggregate is in effect: a column `aggregate`, or one the view sets in `view.aggregates`. `false` hides it. |
| `deleteRows` | boolean | `false` | Delete the focused row with the Delete or Backspace key. |
| `rowActions` | object | - | Row controls shown in a leading column. |
| `rowActions.delete` | boolean | `false` | A delete button on every row. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | `{ value, cause, rowKey, skipped }` | Trigger when the changes change through the table: a cell edit, an added, deleted or moved row, a paste, or an undo or redo. |
| `onSelectionChange` | `{ selected, rows }` | Trigger when the row selection changes. "Select all matching" in the bulk bar (and, in server mode, the header checkbox) selects every row the view matches as `{ all: true, except, filter, search }`: every row matching that filter and search except the `except` keys, so a request can resolve it from the value alone. Changing the filter or search clears such a selection. |
| `onRowExpand` | `{ row, rowKey, expanded, needsChildren }` | Trigger when a tree row or an expandable row is expanded or collapsed. With `tree.lazy`, load the row's children here when `needsChildren` is true (skip the load action otherwise) and add them to `data`. |
| `onExport` | `{ view, filename, formatted }` | Server mode: trigger when `exportCsv` is called. The browser only holds the loaded blocks, so produce the file from the view, for example with a request and a download action. |
| `onRowClick` | `{ row, rowKey, index }` | Trigger when a row is clicked, or activated with Enter. Clicks on buttons, links, menus and `data-event` elements in a cell, and clicks that end a text selection, do not trigger it. With `rowLink`, a plain click runs onRowClick instead of following the link. |
| `onRowDoubleClick` | `{ row, rowKey, index }` | Trigger when a row is double clicked. |
| `onCellClick` | `{ row, rowKey, column, value }` | Trigger actions when a cell is clicked. Clicks on controls in the cell do not trigger it. |
| `onViewSelect` | `{ id }` | Trigger when a saved view tab is selected, after its view loads. |
| `onViewSave` | `{ view, id, title, shared }` | Trigger when the user saves the current view: Save (with the active view `id`) or Save as (no `id`, a new view). The app stores views; update `views` (and `activeView`) with the result. |
| `onViewDelete` | `{ id }` | Trigger when the user deletes a saved view from its tab menu. |
| `onColumnAdd` | `{ column, position }` | Trigger when a column is added: the add-column picker (`addColumn`), Duplicate or Insert left / right in a user-defined column's header menu, or "Add as column" in the cell details panel. The picker stays open, pending, while the event runs, and shows the error when the actions fail. Store the column and add it to `columns`. |
| `onColumnUpdate` | `{ column, previous }` | Trigger when a user-defined column is renamed (inline in its header) or edited (the picker). The rename or picker shows it pending while the event runs and the error when it fails. |
| `onColumnDelete` | `{ column }` | Trigger when a user-defined column is deleted from its header menu, after the confirmation. The dialog stays open, pending, while the event runs. |
| `onColumnRun` | `{ column, mode, selection }` | Trigger to run an enrichment or ai column: Run in its header menu (all rows, empty cells, errors or stale cells) or "Run selected" in the bulk bar. Enqueue the cells, for example with MongoDBEnrichmentEnqueue; their states then show in the cells. |
| `onRowRun` | `{ row, rowKey, columns }` | Trigger when a row's run button is clicked (the trailing column, shown on hover): run every enrichment and ai column of the row. |
| `onCellRun` | `{ row, rowKey, column }` | Trigger when one cell is rerun: Rerun in the cell details panel, or the rerun button of a stale cell. |
| `onRowAdd` | `{ values }` | Trigger when a row is added with "+ New row" (`addRow`). The row shows at the end of the table, marked saving, while the event runs; after it the row comes from `data` (add it there, for example by refetching). When the actions fail, the row goes and the editor shows the error with the values kept. |
| `onImport` | `{ rows, newColumns, batchIndex, batchCount, total }` | Trigger for each batch of rows a CSV import sends (`importCsv`), 500 rows at a time, each awaited before the next; a failed batch stops the import and shows its error. Insert the rows, for example with MongoDBInsertMany, and create `newColumns` once. |
| `onCellLink` | `{ link, row, value }` | Triggered when a link, avatar link or relation cell is clicked. The link navigates by itself; this event is for anything else to do. |
| `onCellButton` | `{ row, rowKey, value, button, buttonIndex }` | Documentation reference - the event fired is the `eventName` of each button in a `buttons` cell. Define any number of named events on the block, such as `onEdit`. |
| `onCellMenuItem` | `{ row, rowKey, value, item, itemIndex }` | Documentation reference - the event fired is the `eventName` of each item in a `menu` cell. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The table root element. |
| `/header` | The header row group. |
| `/row` | Every body row. |

No slots defined.
