---
'@lowdefy/journey-headless': minor
---

feat(journey-headless): Headless runs click grid rows and cell controls by `rowKey` and `control`

A headless journey now answers `{ blockId, rowKey }` (with `column` and `control`) clicks and `expect.visible`/`hidden` on a `rowKey` on `AgGridAlpine`, `AgGridBalham`, `AgGridMaterial`, `AgGridLowdefy` and `Table`. A row click fires `onCellClick` then `onRowClick` on its first cell, in each grid's event shape, and `Table` follows `rowLink`; a cell's buttons, menu items and AgGrid switch fire their own events, with hidden and disabled controls resolved as the cell resolves them. A generated row key, a key no row has and a key several rows share fail the step. A grid whose shown rows can differ from its data (a sort, filter, pagination, selection, views, and for `Table` any property the stand-in does not model) marks the journey browser-only, naming the feature.
