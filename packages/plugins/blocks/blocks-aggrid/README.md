# Lowdefy Blocks for Ag-Grid

This repository provides blocks for [AG Grid](https://www.ag-grid.com/), a feature rich javascript grid and table library.

The implementation of these blocks is a minimal wrapper for the [ag-grid-community](https://www.npmjs.com/package/ag-grid-community) package, on AG Grid v33. This means you write normal AG Grid config to create tables.

See the [AG Grid docs](https://www.ag-grid.com/react-data-grid/) for the table settings API.

## Blocks

Each grid is available as a `display` block and as an `input` block. The display blocks render data; the input blocks additionally hold the table data as the block's value.

### Block types

Display blocks:

- `AgGridLowdefy` — themed from the app's antd design tokens. Recommended for Lowdefy apps.
- `AgGridAlpine`
- `AgGridBalham`
- `AgGridMaterial`

Input blocks:

- `AgGridLowdefyInput` — themed from the app's antd design tokens. Recommended for Lowdefy apps.
- `AgGridInputAlpine`
- `AgGridInputBalham`
- `AgGridInputMaterial`

## Themes

All eight blocks render through [AG Grid's Theming API](https://www.ag-grid.com/react-data-grid/theming/). No block imports an AG Grid stylesheet and no block uses `theme="legacy"`.

**`AgGridLowdefy` is the recommended grid for Lowdefy apps.** It adopts the app's antd theme tokens — primary colour, surfaces, fonts and radius — and follows light/dark mode automatically, with no configuration. It takes a `size` property (`small | middle | large`, default `middle`) matching antd Table's densities, which sets row and header height to 36 / 44 / 54 pixels.

`AgGridBalham`, `AgGridAlpine` and `AgGridMaterial` remain first-class built-ins for users who want those looks, and are kept indefinitely with the same API. On v33 they render AG Grid's prebuilt Theming API equivalents of those themes (`themeBalham` / `themeAlpine` / `themeMaterial`) with the same antd colour mapping applied as theme parameters, so they look very close to before but are no longer pixel-identical.

### Adopting `AgGridLowdefy`

To adopt, change `type: AgGridBalham` to `type: AgGridLowdefy` (or `type: AgGridInputBalham` to `type: AgGridLowdefyInput`). Every property carries over unchanged, and the grid will deliberately look different afterwards — that is the point. This is a visual opt-in, not a migration.

### `size` and explicit heights

A `rowHeight` or `headerHeight` grid option overrides what `size` sets — use one or the other, not both. `size` sets the theme parameters `rowHeight` and `headerHeight`, and an AG Grid grid option always beats a theme parameter, so `size: large` together with `rowHeight: 30` gives 30 pixel rows under a 54 pixel header.

### `themeParams`

All eight blocks take a `themeParams` object property: [AG Grid theming parameter](https://www.ag-grid.com/react-data-grid/theming-parameters/) names merged onto the block's own theme, for retinting a single grid.

```yaml
- id: my_table
  type: AgGridLowdefy
  properties:
    themeParams:
      headerBackgroundColor: '#1a1a2e'
      headerTextColor: '#e0e0ff'
      borderColor: var(--ant-color-border)
```

Values are CSS strings and may reference antd tokens. Neither Lowdefy nor AG Grid validates parameter names, so a misspelled key is a silent no-op — check spelling against AG Grid's theming parameter reference.

### Events

##### All Blocks

- `onCellClick`: Trigger event when a cell is clicked and pass the following to `_event`:
  - `cell: object`: Cell data object.
  - `colId: string`: Column id of the clicked cell.
  - `index: number`: Data index of the clicked row as per provided data array.
  - `row: object`: Row data object.
  - `rowIndex: number`: List index of the clicked row, changes with data sorting or filtering.
  - `selected: object[]`: List of selected row objects.
- `onFilterChanged`: Trigger event when the filter changes and pass the following to `_event`:
  - `rows: object[]`: List of row objects matched by the filter.
  - `filter: object`: An object of objects where each key is the row being filtered.
- `onRowClick`: Trigger event when a row is clicked and pass the following to `_event`:
  - `index: number`: Data index of the clicked row as per provided data array.
  - `row: object`: Row data object.
  - `rowIndex: number`: List index of the clicked row, changes with data sorting or filtering.
  - `selected: object[]`: List of selected row objects.
- `onRowSelected`: Trigger event when a row is selected and pass the following to `_event`:
  - `index: number`: Data index of the clicked row as per provided data array.
  - `row: object`: Row data object.
  - `rowIndex: number`: List index of the clicked row, changes with data sorting or filtering.
  - `selected: object[]`: List of selected row objects.
- `onSelectionChanged`: Triggered when the selected rows are changed and pass the following to `_event`:
  - `selected: object[]`: List of selected row objects.
- `onSortChanged`: Trigger event when the sort changes and pass the following to `_event`:
  - `rows: object[]`: List of row objects matched by the filter.
  - `sort: object[]`: List of rows which are being sorted.

##### Input Blocks

- `onCellValueChanged`: Triggered when a cell value is changed on the grid. The following is passed to the action `_event`:
  - `field: string`: The field name of the changed cell.
  - `index: number`: Data index of the clicked row as per provided data array.
  - `newRowData: object[]`: The table data with the change applied.
  - `newValue: any`: The updated cell value.
  - `oldValue: any`: The cell value before the update was made.
  - `rowData: object`: The row data after the cell value has been changed.
  - `rowIndex: number`: List index of the clicked row, changes with data sorting or filtering.
- `onRowDragEnd`: Triggered when a row is dragged to another position in the grid. The following is passed to the action `_event`:
  - `fromData: object`: Row data of the row selection which to moved.
  - `fromIndex: number`: Array index of the row selection which to moved.
  - `newRowData: object[]`: The table data with the change applied.
  - `toData: object`: Row data of the row to which the selection will be moved.
  - `toIndex: number`: Array index of the row to which the selection will be moved.

### Methods

- `exportDataAsCsv`: When called, table data will be downloaded in csv format.
- `sizeColumnsToFit`: When called, size table column widths to fit all columns to table width.
- `autoSize`: When called, auto size columns. The following can be passed as the first argument of `args`.
      - `skipHeader: boolean`: Do not consider header content width when auto-sizing columns.
      - `columnIds: string[]`: List of `colId`s for which to calculate auto-size when called.
- `setFilterModel`: When called, apply filter model to table. See https://www.ag-grid.com/javascript-data-grid/filter-api/ for model details.
- `setQuickFilter`: When called, pass a quick filter text into the grid for filtering. See https://www.ag-grid.com/javascript-data-grid/filter-quick/ for details.

### AgGridAlpine Example

```yaml
name: my-app
lowdefy: 3.12.3
pages:
  - id: dashboard
    type: PageHeaderMenu
    blocks:
      - id: my_table
        type: AgGridAlpine
        properties:
          rowData:
            - title: One
              year: 2010
              viewerReviews: 30
            - title: Two
              year: 2011
              viewerReviews: 20
          defaultColDef:
            sortable: true
            resizable: true
            filter: true
          columnDefs:
            - headerName: Title
              field: title
              width: 350
            - headerName: Year
              field: year
              width: 100
            - headerName: Viewer Reviews
              field: viewerReviews
              width: 160
              type: numericColumn
```

### AgGridAlpine valueFormatter: \_function Example

```yaml
name: my-app
lowdefy: 3.12.3
pages:
  - id: dashboard
    type: PageHeaderMenu
    blocks:
      - id: my_table
        type: AgGridAlpine
        properties:
          rowData:
            - title: One
              year: 2010
              total: 300.21
            - title: Two
              year: 2011
              total: 1230.9495
          defaultColDef:
            sortable: true
            resizable: true
            filter: true
          columnDefs:
            - headerName: Title
              field: title
              width: 350
            - headerName: Year
              field: year
              width: 100
            - headerName: Total
              field: total
              width: 160
              type: numericColumn
              valueFormatter:
                _function:
                  __intl.numberFormat:
                    on:
                      __args: 0.value
                    options:
                      style: 'currency'
                      currency: 'EUR'
```

### AgGridAlpine onRowClick Example

```yaml
name: my-app
lowdefy: 3.12.3
pages:
  - id: dashboard
    type: PageHeaderMenu
    blocks:
      - id: my_table
        type: AgGridAlpine
        properties:
          rowData:
            - title: One
              year: 2010
              viewerReviews: 30
            - title: Two
              year: 2011
              viewerReviews: 20
          defaultColDef:
            sortable: true
            resizable: true
            filter: true
          columnDefs:
            - headerName: Title
              field: title
              width: 350
            - headerName: Year
              field: year
              width: 100
            - headerName: Viewer Reviews
              field: viewerReviews
              width: 160
              type: numericColumn
        events:
          onRowClick:
            - id: set_selected
              type: SetState
              params:
                selected_row: # Update 'selected' in state with the event data.
                  _event: row
      - id: selection
        type: Title
        properties:
          level: 4
          content:
            _if: # Show the event data in a title, or call to action.
              test:
                _eq:
                  - _state: selected_row
                  - null
              then: 'Click to select a row.'
              else:
                _string.concat:
                  - 'Title: '
                  - _state: selected_row.title
                  - ', Year: '
                  - _state: selected_row.year
```

### AgGridAlpine onCellClick Example

```yaml
name: my-app
lowdefy: 3.12.3
pages:
  - id: dashboard
    type: PageHeaderMenu
    blocks:
      - id: my_table
        type: AgGridAlpine
        properties:
          rowData:
            - title: One
              year: 2010
              viewerReviews: 30
            - title: Two
              year: 2011
              viewerReviews: 20
          defaultColDef:
            sortable: true
            resizable: true
            filter: true
          columnDefs:
            - headerName: Title
              field: title
              width: 350
            - headerName: Year
              field: year
              width: 100
            - headerName: Viewer Reviews
              field: viewerReviews
              width: 160
              type: numericColumn
        events:
          onCellClick:
            - id: set_selected
              type: SetState
              params:
                selected_cell: # Update 'selected_cell' in state with the event cell data.
                  _event: cell
      - id: selection
        type: Title
        properties:
          level: 4
          content:
            _if: # Show the event data in a title, or call to action.
              test:
                _eq:
                  - _state: selected_cell.column
                  - title
              then:
                _string.concat:
                  - 'Title: '
                  - _state: selected_cell.value
              else: 'Select a movie title.'
```

### AgGridAlpine onRowSelected Example

```yaml
name: my-app
lowdefy: 4.0.0-rc.5
pages:
  - id: dashboard
    type: PageHeaderMenu
    blocks:
      - id: my_table
        type: AgGridAlpine
        properties:
          rowData:
            - title: One
              year: 2010
              viewerReviews: 30
            - title: Two
              year: 2011
              viewerReviews: 20
          defaultColDef:
            sortable: true
            resizable: true
            filter: true
          rowSelection:
            mode: multiRow
            enableClickSelection: true
            checkboxes: true
          columnDefs:
            - headerName: Title
              field: title
              width: 350
            - headerName: Year
              field: year
              width: 100
            - headerName: Viewer Reviews
              field: viewerReviews
              width: 160
              type: numericColumn
        events:
          onRowSelected:
            - id: set_selected
              type: SetState
              params:
                selected_row: # Update 'selected' in state with the event data.
                  _event: row
                all_selected:
                  _event: selected
      - id: selection
        type: Title
        properties:
          level: 4
          content:
            _if: # Show the event data in a title, or call to action.
              test:
                _eq:
                  - _state: selected_row
                  - null
              then: 'Click to select a row.'
              else:
                _string.concat:
                  - 'Last Selected - Title: '
                  - _state: selected_row.title
                  - ', Year: '
                  - _state: selected_row.year
      - id: all_selected
        type: Title
        properties:
          level: 4
          content:
            _if: # Show the event data in a title, or call to action.
              test:
                _eq:
                  - _state: all_selected
                  - null
              then: 'Select rows.'
              else:
                _string.concat:
                  - 'Total Selected: '
                  - _array.length:
                      _state: all_selected
```

### AgGridAlpine onSelectionChanged Example

```yaml
name: my-app
lowdefy: 4.0.0-rc.5
pages:
  - id: dashboard
    type: PageHeaderMenu
    blocks:
      - id: my_table
        type: AgGridAlpine
        properties:
          rowData:
            - title: One
              year: 2010
              viewerReviews: 30
            - title: Two
              year: 2011
              viewerReviews: 20
          defaultColDef:
            sortable: true
            resizable: true
            filter: true
          rowSelection:
            mode: multiRow
            enableClickSelection: true
            checkboxes: true
            headerCheckbox: true
          columnDefs:
            - headerName: Title
              field: title
              width: 350
            - headerName: Year
              field: year
              width: 100
            - headerName: Viewer Reviews
              field: viewerReviews
              width: 160
              type: numericColumn
        events:
          onSelectionChanged:
            - id: set_selected
              type: SetState
              params:
                all_selected:
                  _event: selected
      - id: all_selected
        type: Title
        properties:
          level: 4
          content:
            _if: # Show the event data in a title, or call to action.
              test:
                _eq:
                  - _state: all_selected
                  - null
              then: 'Select rows.'
              else:
                _string.concat:
                  - 'Total Selected: '
                  - _array.length:
                      _state: all_selected
```

### AgGridAlpine editable cells Example

```yaml
name: my-app
lowdefy: 4.0.0-rc.5
pages:
  - id: dashboard
    type: PageHeaderMenu
    blocks:
      - id: Download
        type: Button
        events:
          onClick:
            - id: download
              type: CallMethod
              params:
                blockId: table
                method: exportDataAsCsv
      - id: table
        type: AgGridAlpine
        properties:
          rowData:
            - a: zero
              b: 000
              c: AA
            - a: one
              b: 111
              c: BB
            - a: two
              b: 222
              c: CC
          columnDefs:
            - field: 'a'
            - field: 'b'
            - field: 'c'
```

### AgGridInputAlpine onRowDragMove Example

```yaml
name: my-app
lowdefy: 4.0.0-rc.5
pages:
  - id: dashboard
    type: PageHeaderMenu
    events:
      onInit:
        - id: new
          type: SetState
          params:
            table:
              - a: zero
                b: 000
                c: AA
              - a: one
                b: 111
                c: BB
              - a: two
                b: 222
                c: CC
    blocks:
      - id: table
        type: AgGridInputAlpine
        properties:
          columnDefs:
            - field: 'a'
              rowDrag: true
            - field: 'b'
            - field: 'c'
            - field: 'd'
          defaultColDef:
            width: 170
            sortable: true
            filter: true
```

### AgGridInputAlpine editable cells Example

```yaml
name: my-app
lowdefy: 4.0.0-rc.5
pages:
  - id: dashboard
    type: PageHeaderMenu
    events:
      onInit:
        - id: new
          type: SetState
          params:
            table:
              - a: zero
                b: 000
                c: AA
              - a: one
                b: 111
                c: BB
              - a: two
                b: 222
                c: CC
    blocks:
      - id: table
        type: AgGridInputAlpine
        properties:
          columnDefs:
            - field: 'a'
            - field: 'b'
            - field: 'c'
              cellEditor: 'agSelectCellEditor'
              cellEditorParams:
                values: ['AA', 'BB', 'CC', 'DD']
          defaultColDef:
            width: 170
            sortable: true
            filter: true
            editable: true
```
