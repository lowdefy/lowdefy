---
'@lowdefy/blocks-aggrid': patch
---

fix(blocks-aggrid): Keep a switch cell's write until `rowData` changes.

A display grid (AgGridAlpine, AgGridBalham, AgGridMaterial, AgGridLowdefy) compared a new `rowData` with the rows it held, which a switch cell had already written into. So any re-render with a newly evaluated `rowData`, including the one the switch's own event starts, put the old value back, and a switch clicked twice could lose its first write. The grid now compares the new `rowData` with the previous `rowData` as it arrived, so a write lasts until the block's `rowData` really changes.
