---
'@lowdefy/blocks-aggrid': major
---

feat(deps)!: Update AG Grid to 36.3.0

The AgGrid blocks move from AG Grid 33.3.2 to 36.3.0 (`ag-grid-community` and `ag-grid-react`). The grids keep their antd-based look in light and dark mode. What changes for app authors:

**Date filter values in `onFilterChanged`.** A date column filter now gives date-only values in the filter model, `dateFrom: '2024-01-15'` where it gave `'2024-01-15 00:00:00'`. This is every date filter except on a `cellDataType: dateTime` or `dateTimeString` column, which keep the time. Check any action that reads `_event: filter` and parses or compares the date. Note that a date-only ISO string parses as UTC midnight (`new Date('2024-01-15')`), where the old value parsed as local midnight. `setFilterModel` accepts both forms.

**Grid DOM.** AG Grid 36 renders the header, body and pinned columns in one scrolling container, and the theme classes sit on a wrapper above `.ag-root-wrapper`. App CSS or e2e tests that select these containers need updating:

- `.ag-body`, `.ag-body-viewport` → `.ag-grid-scrolling-container`
- `.ag-center-cols-container`, `.ag-center-cols-viewport` → `.ag-grid-scrolling-cells`
- `.ag-header-container`, `.ag-header-viewport` → `.ag-header`
- `.ag-pinned-left-cols-container` → `.ag-grid-scrolling-rows .ag-grid-pinned-left-cells` (and `right`)
- `.ag-floating-top`, `.ag-floating-bottom` → `.ag-grid-pinned-top-rows`, `.ag-grid-pinned-bottom-rows`
- `.ag-root-wrapper.ag-rtl` → `.ag-rtl .ag-root-wrapper`

A row with pinned columns is now one `.ag-row` element, where it was one per pinned and centre container, so a count of `.ag-row` elements now counts rows. The header background is painted on each `.ag-header-row`, not on `.ag-header`. `.ag-row[row-index]`, `.ag-cell[col-id]`, `.ag-header-cell` and the overlay classes are unchanged. AG Grid's [upgrade guide](https://www.ag-grid.com/react-data-grid/upgrading-to-ag-grid-36/) lists every renamed class.

**New in the grid UI**, from AG Grid 35 and 36:

- A filter that matches no rows shows a "No Matching Rows" overlay instead of an empty grid. Set `suppressOverlays: [noMatchingRows]` on the block to turn it off.
- The pagination bar has a page number input ("Page [1] of 2"). To show the page number as plain text again, set `paginationPanels: [pageSize, rowSummary, { type: pageSummary, suppressPageInput: true }]`.
- Filter text inputs have a clear button, and their search icon is 16px (was 12px), so the column filter popup is about 15px wider.
- Number and date range filters ("between") refuse a start value larger than the end value.
- A CSV export shows an "Exporting" overlay while it runs. Set `suppressOverlays: [exporting]` to turn it off.
- With managed row dragging, the drag handle shows as disabled rather than hidden while the grid is sorted or filtered.
- `colDef.suppressAutoSize` now also stops the column menu and a double-click on the column divider from auto-sizing the column.

**Development diagnostics.** AG Grid 36 no longer bundles its validation module, which explains a wrong grid option or column property in the console. The blocks enable it in development builds (`lowdefy dev`), with the messages in the console as before. Production builds log only an error number and a link to AG Grid's docs.

The theme keeps AG Grid 33 values where 36 changed a default: grid text inherits the page font weight (36 sets 400), the pagination bar is one row tall, and the page size and filter condition selects keep their 5px radius and height.
