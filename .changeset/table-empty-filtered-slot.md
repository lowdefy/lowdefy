---
'@lowdefy/blocks-table': minor
---

feat(blocks-table): A Table's `emptyFiltered` slot replaces "No matching rows"

When a filter or search hid every row, the Table always showed "No matching rows" with Clear filters, before it looked at the `empty` slot. On a view whose filter is the point, such as a saved list, Clear filters throws the list away. Blocks in the new `emptyFiltered` slot now replace that state, for example "No deals match this view right now." with an Edit filter button. The `empty` slot keeps its meaning (no rows and no filter), and the wrapper keeps `data-lf-empty="filtered"` either way.
