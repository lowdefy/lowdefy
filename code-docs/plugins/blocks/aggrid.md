# @lowdefy/blocks-aggrid

[AG Grid](https://www.ag-grid.com/documentation/) integration for Lowdefy. Provides enterprise-grade data grid functionality.

## Overview

AG Grid is a powerful JavaScript data grid with:
- Virtual scrolling (millions of rows)
- Column sorting, filtering, grouping
- Cell editing
- Row selection
- Excel-like features

## Block

| Block | Purpose |
|-------|---------|
| `AgGridAlpine` | AG Grid with Alpine theme |

## Basic Usage

```yaml
- id: dataGrid
  type: AgGridAlpine
  properties:
    rowData:
      _request: getData
    columnDefs:
      - field: name
        headerName: Name
        sortable: true
        filter: true
      - field: email
        headerName: Email
      - field: status
        headerName: Status
        cellRenderer: StatusRenderer
```

## Key Properties

| Property | Purpose |
|----------|---------|
| `rowData` | Array of row objects |
| `columnDefs` | Column definitions |
| `defaultColDef` | Default column settings |
| `pagination` | Enable pagination |
| `rowSelection` | 'single' or 'multiple' |

## Column Definition

```yaml
columnDefs:
  - field: name           # Data field
    headerName: Name      # Display name
    sortable: true        # Enable sort
    filter: true          # Enable filter
    editable: true        # Enable editing
    width: 150            # Column width
    pinned: left          # Pin column
    cellRenderer: name    # Custom renderer
```

## Events

```yaml
events:
  onRowClick:
    - id: selectRow
      type: SetState
      params:
        selectedRow:
          _event: data
  onCellValueChanged:
    - id: saveChange
      type: Request
```

## Design Decisions

### Why AG Grid?

- Industry-standard data grid
- Handles large datasets efficiently
- Rich feature set out of the box
- Good documentation

### Why Separate Package?

AG Grid is large (~500KB). Separating it:
- Keeps core bundle small
- Only loads when needed
- Optional dependency
