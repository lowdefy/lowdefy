---
name: lowdefy-aggrid-tables
description: Use when building a data table with AgGrid — column definitions, cell renderers, row click to a detail page, selection, and editable grids that write back to state.
---

# AgGrid tables

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### AgGrid

`/lowdefy-docs/content/display-blocks/aggrid`

AG Grid data table with sorting, filtering, and row selection. Four display blocks share one property schema and differ only in appearance: AgGridLowdefy, AgGridAlpine, AgGridBalham and AgGridMaterial, each with an input counterpart. AgGridLowdefy is the recommended grid for Lowdefy apps - it is themed from the app antd design tokens, follows light and dark mode automatically, and takes a size property matching antd Table densities. To adopt it, change `type: AgGridBalham` to `type: AgGridLowdefy`; every property carries over unchanged and the grid will deliberately look different afterwards.

### Blocks

Live schema: `lowdefy_get_schema` with kind `blocks`.

#### AgGridLowdefy

Provided by `@lowdefy/blocks-aggrid`. Category: `display`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `size` | `"small"`, `"middle"`, `"large"` |  | `"middle"` | Row density, mirroring antd Table sizes. `small` is compact, `middle` (the Lowdefy default) matches antd Table's `middle`, `large` matches antd Table's default density. Changes spacing and row/header height only — colours and font size are identical across sizes. |
| `themeParams` | object |  |  | AG Grid Theming API parameters merged onto this block's theme, for per-grid overrides. Keys are AG Grid param names, e.g. `headerBackgroundColor`, `rowHoverColor`, `borderColor`. Values are CSS strings and may reference antd tokens, e.g. `var(--ant-color-primary)`. An unrecognised param name has no effect — neither Lowdefy nor AG Grid validates the names — so check spelling against AG Grid's theming parameter reference. |
| `height` | number \\| string |  | `"auto"` | Specify table height explicitly, in pixel. |
| `rowData` | array |  |  | The list of data to display on the table. |
| `rowId` | string |  |  | The data field to use in `getRowId` which results in Row Selection being maintained across Row Data changes (assuming the Row exists in both sets). See Ag Grid docs for more details (https://www.ag-grid.com/react-data-grid/data-update-row-data/). |
| `enableBrowserTooltips` | boolean |  | `false` | Set to `true` to use the browser native `title` attribute tooltips instead of AG Grid's styled tooltip component. |
| `suppressCellFocus` | boolean |  | `true` | When `true` (default), clicking a cell does not draw the AG Grid cell-focus border. Set to `false` to enable spreadsheet-style cell focus and keyboard navigation. |
| `tooltipShowDelay` | number |  | `2000` | The delay in milliseconds before a tooltip is shown. Not applied when `enableBrowserTooltips` is `true`. |
| `tooltipHideDelay` | number |  | `10000` | The delay in milliseconds before a tooltip is hidden. Not applied when `enableBrowserTooltips` is `true`. |
| `defaultColDef` | object |  |  | Column properties which get applied to all columns. See all (https://www.ag-grid.com/javascript-data-grid/column-properties/). |
| `columnDefs` | array |  |  | A list of properties for each column. |

##### Events

- `onCellClick`: Trigger event when a cell is clicked. Event payload: `cell`, `colId`, `row`, `rowIndex`, `selected`.
- `onFilterChanged`: Trigger event when the filter changes. Event payload: `rows`, `filter`.
- `onRowClick`: Trigger event when a row is clicked. Event payload: `row`, `selected`, `rowIndex`.
- `onRowSelected`: Trigger event when a row is selected. Event payload: `row`, `rowIndex`, `selected`.
- `onSelectionChanged`: Triggered when the selected rows are changed. Event payload: `selected`.
- `onSortChanged`: Trigger event when the sort changes. Event payload: `rows`, `sort`.
- `onCellLink`: Triggered when a built-in `cell.type: link` (or avatar with `link`) cell is clicked. Wire to a `Link` action with `params: { _event: link }` to navigate. Event payload: `link`, `row`, `value`.
- `onCellButton`: Documentation reference — the actual event name fired is the `eventName` string declared on each `cell.buttons[]` entry. Wire any number of named events on the block (e.g. `onApprove`, `onDelete`). Event payload: `row`, `value`, `button`, `buttonIndex`.
- `onCellMenuItem`: Documentation reference — the actual event name fired is the `eventName` string declared on each `cell.items[]` entry of a `cell.type: menu` cell. Wire any number of named events on the block (e.g. `onRename`, `onDelete`). Event payload: `row`, `value`, `item`, `itemIndex`.

##### Example

```yaml
- id: lowdefy_basic_table
  type: AgGridLowdefy
  properties:
    height: 300
    columnDefs:
      - field: name
        headerName: Name
      - field: age
        headerName: Age
      - field: email
        headerName: Email
      - field: country
        headerName: Country
    rowData:
      - name: Alice Johnson
        age: 28
        email: alice@example.com
        country: United States
      - name: Bob Smith
        age: 35
        email: bob@example.com
        country: United Kingdom
      - name: Charlie Lee
        age: 42
        email: charlie@example.com
        country: Japan
      - name: Diana Patel
        age: 31
        email: diana@example.com
        country: India
      - name: Erik Johansson
        age: 26
        email: erik@example.com
        country: Sweden
      - name: Fatima Al-Rashid
        age: 39
        email: fatima@example.com
        country: UAE
```

#### AgGridLowdefyInput

Provided by `@lowdefy/blocks-aggrid`. Category: `input`, value type: `array`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `size` | `"small"`, `"middle"`, `"large"` |  | `"middle"` | Row density, mirroring antd Table sizes. `small` is compact, `middle` (the Lowdefy default) matches antd Table's `middle`, `large` matches antd Table's default density. Changes spacing and row/header height only — colours and font size are identical across sizes. |
| `themeParams` | object |  |  | AG Grid Theming API parameters merged onto this block's theme, for per-grid overrides. Keys are AG Grid param names, e.g. `headerBackgroundColor`, `rowHoverColor`, `borderColor`. Values are CSS strings and may reference antd tokens, e.g. `var(--ant-color-primary)`. An unrecognised param name has no effect — neither Lowdefy nor AG Grid validates the names — so check spelling against AG Grid's theming parameter reference. |
| `height` | number \\| string |  | `"auto"` | Specify table height explicitly, in pixel. |
| `rowData` | array |  |  | The list of data to display on the table. |
| `rowId` | string |  |  | The data field to use in `getRowId` which results in Row Selection being maintained across Row Data changes (assuming the Row exists in both sets). See Ag Grid docs for more details (https://www.ag-grid.com/react-data-grid/data-update-row-data/). |
| `enableBrowserTooltips` | boolean |  | `false` | Set to `true` to use the browser native `title` attribute tooltips instead of AG Grid's styled tooltip component. |
| `tooltipShowDelay` | number |  | `2000` | The delay in milliseconds before a tooltip is shown. Not applied when `enableBrowserTooltips` is `true`. |
| `tooltipHideDelay` | number |  | `10000` | The delay in milliseconds before a tooltip is hidden. Not applied when `enableBrowserTooltips` is `true`. |
| `defaultColDef` | object |  |  | Column properties which get applied to all columns. See all (https://www.ag-grid.com/javascript-data-grid/column-properties/). |
| `columnDefs` | array |  |  | A list of properties for each column. |

##### Events

- `onCellClick`: Trigger event when a cell is clicked. Event payload: `cell`, `colId`, `row`, `rowIndex`, `selected`.
- `onFilterChanged`: Trigger event when the filter changes. Event payload: `rows`, `filter`.
- `onRowClick`: Trigger event when a row is clicked. Event payload: `row`, `selected`, `rowIndex`.
- `onRowSelected`: Trigger event when a row is selected. Event payload: `row`, `rowIndex`, `selected`.
- `onSelectionChanged`: Triggered when the selected rows are changed. Event payload: `selected`.
- `onSortChanged`: Trigger event when the sort changes. Event payload: `rows`, `sort`.
- `onCellValueChanged`: Triggered when a cell value is changed on the grid. Event payload: `field`, `newRowData`, `newValue`, `oldValue`, `rowData`, `rowIndex`.
- `onRowDragEnd`: Triggered when a row is dragged to another position in the grid. Event payload: `fromData`, `toData`, `fromIndex`, `toIndex`, `newRowData`.
- `onCellLink`: Triggered when a built-in `cell.type: link` (or avatar with `link`) cell is clicked. Wire to a `Link` action with `params: { _event: link }` to navigate. Event payload: `link`, `row`, `value`.

##### Example

```yaml
- id: input_lowdefy_basic_editable
  type: AgGridLowdefyInput
  properties:
    height: 300
    defaultColDef:
      editable: true
      flex: 1
    columnDefs:
      - field: name
        headerName: Name
      - field: age
        headerName: Age
      - field: email
        headerName: Email
      - field: country
        headerName: Country
  events:
    onMount:
      - id: seed_basic_editable
        type: SetState
        params:
          input_lowdefy_basic_editable:
            - name: Alice Johnson
              age: 28
              email: alice@example.com
              country: United States
            - name: Bob Smith
              age: 35
              email: bob@example.com
              country: United Kingdom
            - name: Charlie Lee
              age: 42
              email: charlie@example.com
              country: Japan
            - name: Diana Patel
              age: 31
              email: diana@example.com
              country: India
            - name: Erik Johansson
              age: 26
              email: erik@example.com
              country: Sweden
```
<!-- generated:reference:end -->

## Recipe

Must cover: `rowData` from a request, `columnDefs` with `valueFormatter` and `cellRenderer`, `onRowClick` to a detail page, the Lowdefy theme, `AgGridLowdefyInput` for editable rows, and pagination/quick filter.
