---
'@lowdefy/blocks-aggrid': minor
---

feat(blocks-aggrid): Buttons cell renderer and ag-grid v32 update.

**New `cell.type: buttons` renderer** — render a list of action buttons in a column with each button firing its own block-level event with the row data on the payload. Per-button properties mirror the antd Button block (`title`, `icon`, `type`, `variant`, `color`, `size`, `shape`, `danger`, `ghost`, `hideTitle`, `disabled`) plus row-data-path variants (`titleField`, `iconField`, `disabledField`, `hiddenField`) for per-row state. Use this for inline Edit/Delete/Approve actions without `_if` dispatching.

**ag-grid updated to v32.3.9** — pulls in two majors of upstream fixes. The column header UX (hamburger column menu with filter popup) is preserved by default; opt into the new ag-grid v32 column menu via `columnMenu: 'new'` on the block.

**Cell focus suppressed by default** — `suppressCellFocus` now defaults to `true` so the keyboard focus outline doesn't visually compete with built-in cell renderers (tags, buttons, links). Override with `suppressCellFocus: false` if needed. Cell overflow is also clipped so flex-rendered content stays inside its column.
