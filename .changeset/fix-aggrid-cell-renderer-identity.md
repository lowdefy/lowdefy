---
'@lowdefy/blocks-aggrid': patch
---

fix(blocks-aggrid): Stop cells being destroyed on every render.

`processColDefs` built a fresh `cellRenderer` function for every column on every render. A cellRenderer is a React element type, so a new function is a different component: ag-grid's `CellCtrl.refreshCellRenderer` bails when `cellRendererClass !== componentClass` and the cell is recreated. Anything a cell was holding died with it — an open popup, the focus and half-typed value of a `selector`, `textInput` or `paragraphInput` cell — whenever anything else re-rendered the block, including a request finishing elsewhere on the page.

Each column now keeps one renderer adapter for its lifetime and the closure behind it is replaced in place, so ag-grid keeps the cell and the cell still renders the current config. Because cells are no longer recreated when a column definition changes — ag-grid refreshes body cells on data changes and does not listen for `colDefChanged` — the block now calls `refreshCells({ force: true })` when the authored `columnDefs` change, which re-renders the mounted cells in place. Function-valued column properties are compared by identity, since `JSON.stringify` cannot see them.

Both the display and input grids are fixed.
