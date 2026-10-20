---
'@lowdefy/blocks-aggrid': patch
---

fix(blocks-aggrid): AgGrid columns accept named filters and components

The build warned `columnDefs.N.filter must be type "boolean"` on every AgGrid column whose `filter` named an AG Grid filter, such as `filter: agDateColumnFilter`, though the grid filtered correctly. `filter` now takes `true`, `false` or a filter name (`agTextColumnFilter`, `agNumberColumnFilter`, `agDateColumnFilter`, or `agSetColumnFilter` with AG Grid Enterprise). `cellRenderer` and `tooltipComponent` likewise accept the name of a registered component, such as the cell renderer `agAnimateShowChangeCellRenderer`.
