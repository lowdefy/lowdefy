## When to use TableInput

`TableInput` is the [Table](/Table) for rows that belong to a form: the lines of an invoice, the ingredients of a recipe, the contacts on an account. The user edits, adds, deletes, reorders and pastes rows, and one request saves everything they changed.

Use `Table` instead when each edit should save at once (a CRM record list, where `onCellEdit` saves one cell), and `TableLight` when nothing is edited.

`TableInput` takes every `Table` property: columns and cell types, sorting, filters, search, grouping, selection, `rowLink`, row buttons and the rest work the same. It reads client `data` only (no server mode), and its view and selection are internal to the block rather than part of its value. It has no slots yet: the `toolbarStart`, `toolbarEnd`, `bulkActions` and `empty` slots listed below are Table's and do not render on a `TableInput`; use `emptyText` for its empty state.

## The value is the changes, not the rows

`data` is never written. The block value holds only what changed since `data`, keyed by row key:

```yaml
updated: # changed fields of existing rows, keyed by the column field (a dot path)
  flour:
    qty: 450
    details.note: strong
added: # new rows, each with a temporary rowKey unless a column default gives the key
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

Rows need a key: `rowKey` (default `_id`, then `id`). A row added in the table shows its temporary key in that field.

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

- "+ Add row" appends a row with each column's `default` (and, with a `positionField`, a position after the last row) and opens its first editable cell.
- `rowDrag` adds a drag handle, and Alt+Shift+Up/Down moves the focused row. With `positionField`, a move gives only the moved row a new position, the midpoint of its new neighbours, so saving it writes one field. When there is no room left between two positions (a gap under 1e-6) the list is renumbered in steps of 1024 and every changed position is recorded. Without a `positionField`, the full key `order` is recorded instead.
- Moves are blocked while the table is sorted by anything but the position field ascending, filtered or grouped; the handle's tooltip says why.

## Undo, redo and paste

- Cmd/Ctrl+Z undoes and Cmd/Ctrl+Shift+Z or Ctrl+Y redoes, over the last 100 changes.
- Cmd/Ctrl+V pastes tab-separated text, as a spreadsheet copies it, over the cells from the focused one: down the displayed rows and across the visible columns. Each value is coerced to the column type and validated. Cells that are not editable, fail validation or fall outside the table are skipped and reported in `onChange` `skipped`; paste never adds rows.
- Cmd/Ctrl+C copies the selected rows, or the focused cell, as tab-separated displayed text.

## Saving

`MongoDBTableChanges` saves the value in one request. Pass the value as the payload and list the columns it may write in `fields`, keyed by the column `field`:

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

Then refetch `data` and call `resetChanges`:

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
      - id: refetch
        type: Request
        params: get_invoice
      - id: reset
        type: CallMethod
        params:
          blockId: lines
          method: resetChanges
```

Leave out `array` when every row is its own document (collection mode), and set tenant and ownership fields on new rows with `insertDefaults`. Only `fields` can be written, values are coerced to their type, and the base `filter` scopes every operation. The [Table guide](/Table) has complete array and collection mode pages, and [MongoDBTableChanges](/MongoDB) the full reference.

Any other save path works too: the value is plain data, so a request can read `_payload: changes.updated`, `changes.added` and `changes.removed` and write them however the backend needs.
