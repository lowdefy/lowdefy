---
'@lowdefy/blocks-aggrid': patch
---

fix(blocks-aggrid): Long cell text ends in an ellipsis

Text wider than its column was cut off mid-word in every AgGrid block. It now ends in "…" in plain
columns, `cellRenderer` columns (plain text, or HTML mixing elements and text), `link` cells and
checkbox or row-drag columns. Text nested deeper inside other cell types is still clipped without
"…".

A cell holding only text (no renderer) now lays out as a block instead of a flex container, so it
aligns with `text-align`. `cell.align` sets it, and a column's own `cellStyle.justifyContent` and
`cellStyle.alignItems` are mapped to `textAlign` and `alignContent`, so existing columns keep their
alignment. Flex alignment set through `cellClass` CSS or `defaultColDef.cellStyle` no longer applies
to plain-text cells; use `textAlign` there.
