---
'@lowdefy/blocks-aggrid': patch
---

fix(blocks-aggrid): AgGrid columns accept named filters and components

The build warned `columnDefs.N.filter must be type "boolean"` on every AgGrid column whose `filter` named an AG Grid filter, such as `filter: agDateColumnFilter`, though the grid filtered correctly. `filter` now takes `true`, `false` or a provided filter name: `agTextColumnFilter`, `agNumberColumnFilter` or `agDateColumnFilter`. Any other name, such as a misspelt one or an Enterprise filter this block does not include, still warns. `cellRenderer` and `tooltipComponent` likewise accept the name of a registered component, such as the cell renderer `agAnimateShowChangeCellRenderer`.
