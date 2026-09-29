---
'@lowdefy/blocks-aggrid': patch
---

ag-grid block fixes:

- Editing a cell in an input grid (`AgGridInput*`, `AgGridLowdefyInput`) that is sorted or filtered no longer overwrites another row. The edit used the row's displayed position as its position in the value, so a second row could receive the new value.
- Icons show in `buttons` and `menu` cells in the input grids. The input grids now pass `components` to their cells, as the display grids do.
- After a row drag in an input grid, the grid is fed the new order directly instead of the old rows.
- `quickFilterValue` works: it shows only rows with a cell containing the text, and it can be bound to state. Before, the property was read but did nothing.
- Event handlers read the current render's `events` instead of those from the first render.
