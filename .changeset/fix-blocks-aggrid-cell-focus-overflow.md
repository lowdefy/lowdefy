---
'@lowdefy/blocks-aggrid': patch
---

fix(blocks-aggrid): Suppress cell focus by default and clip overflowing cell content.

The ag-grid cell focus outline visually competed with built-in cell renderers (buttons, links, tags), so `suppressCellFocus` now defaults to `true` and can still be overridden per grid. The antd cell wrapper also clips overflowing flex children so long text and inline cell components no longer blow out the cell width.
