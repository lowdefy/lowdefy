---
'@lowdefy/blocks-table': minor
---

feat(blocks-table): `rowSelection.selectable` limits row selection to rows that pass a condition

A `Table` or `TableInput` with `rowSelection` can now offer a checkbox only on some rows, as AgGrid's `isRowSelectable` does. Set `rowSelection.selectable` to a table condition (`{ key, op, value }`, or `and` / `or` lists). A row that fails it shows a disabled checkbox and cannot be selected by click, the header checkbox, a group checkbox or `selectAllMatching`, and the header checkbox reads checked when every selectable row is selected. In server mode the condition applies to the rows loaded in the browser.
