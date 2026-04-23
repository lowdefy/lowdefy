---
'@lowdefy/blocks-aggrid': minor
---

feat(blocks-aggrid): Declare tooltip properties in block schemas.

All six AgGrid variants (Alpine/Balham/Material for display and input) now declare `enableBrowserTooltips`, `tooltipShowDelay`, and `tooltipHideDelay` at the grid level and `tooltipField`, `tooltipValueGetter`, and `tooltipComponent` at the column level. These AG Grid props already worked — they were passed through via property spreading — but were not documented in the block schemas. Users can now discover and configure tooltips directly from the schema.
