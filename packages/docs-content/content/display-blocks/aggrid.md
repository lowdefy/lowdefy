# AgGrid

AG Grid data table with sorting, filtering, and row selection. Four display blocks share one property schema and differ only in appearance: AgGridLowdefy, AgGridAlpine, AgGridBalham and AgGridMaterial, each with an input counterpart. AgGridLowdefy is the recommended grid for Lowdefy apps - it is themed from the app antd design tokens, follows light and dark mode automatically, and takes a size property matching antd Table densities. To adopt it, change `type: AgGridBalham` to `type: AgGridLowdefy`; every property carries over unchanged and the grid will deliberately look different afterwards.

## Choosing a grid

Four display blocks share one implementation and one property schema. They differ only in how they look:

| Block | Look |
| --- | --- |
| `AgGridLowdefy` | Themed from the app's antd design tokens. **Recommended for Lowdefy apps.** |
| `AgGridAlpine` | AG Grid's Alpine theme, recoloured with the app's antd tokens. |
| `AgGridBalham` | AG Grid's Balham theme, recoloured with the app's antd tokens. Compact. |
| `AgGridMaterial` | AG Grid's Material theme, recoloured with the app's antd tokens. |

Each has an input counterpart that holds the table data as the block's value: `AgGridLowdefyInput`, `AgGridInputAlpine`, `AgGridInputBalham` and `AgGridInputMaterial`.

**To adopt `AgGridLowdefy`, change `type: AgGridBalham` to `type: AgGridLowdefy`.** Every property carries over unchanged, and the grid will deliberately look different afterwards — that is the point. It is a visual opt-in, so there is nothing to migrate and no codemod to run. The Balham, Alpine and Material blocks are kept indefinitely.

## Row density — the `size` property

`AgGridLowdefy` and `AgGridLowdefyInput` take a `size` property, mirroring antd Table:

| `size` | Row and header height |
| --- | --- |
| `small` | 36px |
| `middle` (default) | 44px |
| `large` | 54px |

`size` changes spacing and heights only — colours and font size are identical across sizes.

Two things to watch:

- **A `rowHeight` or `headerHeight` grid option overrides what `size` sets.** Both are AG Grid grid options that pass straight through to the grid, and a grid option beats a theme parameter. So `size: large` together with `rowHeight: 30` gives 30px rows under a 54px header. Use one or the other, not both.
- **There are two `size` vocabularies.** The block-level `size` takes `small | middle | large`, mirroring antd Table. The `cell.size` keys — on button cells and selector cells — take `small | default | large`, mirroring antd Button and Select. So `size: default` and `cell.size: middle` are both invalid. A bad block-level `size` logs a one-time browser console warning and falls back to `middle`; a bad `cell.size` is silent.

The three original theme blocks have a fixed density, so they do not take `size`.

## Retinting one grid — the `themeParams` property

Every AgGrid block takes a `themeParams` object: [AG Grid theming parameter](https://www.ag-grid.com/react-data-grid/theming-parameters/) names, merged onto that block's own theme. This is the recommended way to override the theme of a single grid.

```yaml
- id: custom_theme
  type: AgGridLowdefy
  properties:
    themeParams:
      headerBackgroundColor: '#1a1a2e'
      headerTextColor: '#e0e0ff'
      selectedRowBackgroundColor: rgba(108, 99, 255, 0.2)
      rowHoverColor: rgba(108, 99, 255, 0.1)
      borderColor: '#2a2a4a'
```

Values are CSS strings, so they may reference the app's antd tokens — `borderColor: var(--ant-color-primary)` keeps the override following the app's theme and dark mode. See AG Grid's theming parameter reference for the full list of names; Lowdefy does not reproduce it.

> **A misspelled parameter name is a silent no-op.** Neither Lowdefy nor AG Grid validates parameter names — AG Grid infers a value type from the name and emits a CSS variable nothing reads. There is no warning, at build time or at run time, so check spelling against AG Grid's reference.

### Overriding `--ag-*` variables through `style`

Setting AG Grid's `--ag-*` CSS variables in a block's `style` **still works** — AG Grid deliberately honours `--ag-*` declared on an ancestor element. Existing apps using that technique need no change.

The one thing that did change: AG Grid v33 renamed or folded away a number of the v32 `--ag-*` variables, and an override naming one of those now does nothing. The variables used in the example above map to parameters like this:

| `style` key (v32 `--ag-*`) | `themeParams` key |
| --- | --- |
| `--ag-header-background-color` | `headerBackgroundColor` |
| `--ag-header-foreground-color` | `headerTextColor` |
| `--ag-selected-row-background-color` | `selectedRowBackgroundColor` |
| `--ag-row-hover-color` | `rowHoverColor` |
| `--ag-border-color` | `borderColor` |

Four of those five variable names still work as-is. `--ag-header-foreground-color` is the exception: v33 renamed it to `--ag-header-text-color`, so an app still setting the old name gets no header text colour and no warning. Move it to `themeParams.headerTextColor`.

## Themes follow the app

All AgGrid blocks take their colours from the app's antd design tokens, so a grid follows the app's theme and its light/dark mode with no configuration and no per-grid dark variant. There is no `AgGridLowdefyDark` block, and none is needed.

## Row selection

`rowSelection` takes AG Grid's object form:

```yaml
rowSelection:
  mode: multiRow # or singleRow
  enableClickSelection: true
  checkboxes: true
  headerCheckbox: true
```

The older string form (`rowSelection: multiple` / `single`) still works but logs a deprecation warning. If you migrate it, **set `enableClickSelection: true`**: the string form enables click-to-select by default and the object form does not, so a bare `{ mode: singleRow }` silently stops clicking a row from selecting it, and `onRowSelected` / `onSelectionChanged` stop firing.

Migrate the column-level checkbox flags in the same edit — `checkboxSelection` and `headerCheckboxSelection` on a `columnDefs` entry become `rowSelection.checkboxes` and `rowSelection.headerCheckbox`.

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

```yaml
- id: lowdefy_size_small
  type: AgGridLowdefy
  properties:
    size: small
    height: 220
    defaultColDef:
      flex: 1
    columnDefs:
      - field: name
        headerName: Name
      - field: role
        headerName: Role
      - field: country
        headerName: Country
    rowData:
      - name: Alice Johnson
        role: Developer
        country: United States
      - name: Bob Smith
        role: Designer
        country: United Kingdom
      - name: Charlie Lee
        role: Manager
        country: Japan
- id: lowdefy_size_middle
  type: AgGridLowdefy
  properties:
    size: middle
    height: 220
    defaultColDef:
      flex: 1
    columnDefs:
      - field: name
        headerName: Name
      - field: role
        headerName: Role
      - field: country
        headerName: Country
    rowData:
      - name: Alice Johnson
        role: Developer
        country: United States
      - name: Bob Smith
        role: Designer
        country: United Kingdom
      - name: Charlie Lee
        role: Manager
        country: Japan
- id: lowdefy_size_large
  type: AgGridLowdefy
  properties:
    size: large
    height: 220
    defaultColDef:
      flex: 1
    columnDefs:
      - field: name
        headerName: Name
      - field: role
        headerName: Role
      - field: country
        headerName: Country
    rowData:
      - name: Alice Johnson
        role: Developer
        country: United States
      - name: Bob Smith
        role: Designer
        country: United Kingdom
      - name: Charlie Lee
        role: Manager
        country: Japan
```

```yaml
- id: custom_theme
  type: AgGridLowdefy
  properties:
    themeParams:
      headerBackgroundColor: "#1a1a2e"
      headerTextColor: "#e0e0ff"
      selectedRowBackgroundColor: rgba(108, 99, 255, 0.2)
      rowHoverColor: rgba(108, 99, 255, 0.1)
      borderColor: "#2a2a4a"
    height: 300
    columnDefs:
      - field: name
        headerName: Name
      - field: role
        headerName: Role
      - field: department
        headerName: Department
      - field: status
        headerName: Status
        width: 120
    rowData:
      - name: Alice Johnson
        role: Developer
        department: Engineering
        status: Active
      - name: Bob Smith
        role: Designer
        department: Design
        status: Active
      - name: Charlie Lee
        role: Manager
        department: Sales
        status: On Leave
      - name: Diana Patel
        role: Analyst
        department: Finance
        status: Active
      - name: Erik Johansson
        role: DevOps
        department: Engineering
        status: Active
```

```yaml
- id: lowdefy_column_features
  type: AgGridLowdefy
  properties:
    height: 300
    columnDefs:
      - field: id
        headerName: ID
        width: 80
        pinned: left
        sortable: true
      - field: product
        headerName: Product Name
        flex: 2
        sortable: true
        filter: true
      - field: category
        headerName: Category
        flex: 1
        sortable: true
        filter: true
      - field: price
        headerName: Price ($)
        width: 120
        sortable: true
        resizable: true
      - field: stock
        headerName: Stock
        width: 100
        sortable: true
      - field: rating
        headerName: Rating
        width: 100
        sortable: true
    rowData:
      - id: 1
        product: Wireless Keyboard
        category: Electronics
        price: 49.99
        stock: 230
        rating: 4.5
      - id: 2
        product: Standing Desk
        category: Furniture
        price: 399
        stock: 45
        rating: 4.8
      - id: 3
        product: USB-C Hub
        category: Electronics
        price: 29.99
        stock: 520
        rating: 4.2
      - id: 4
        product: Ergonomic Chair
        category: Furniture
        price: 289
        stock: 78
        rating: 4.6
      - id: 5
        product: Webcam HD
        category: Electronics
        price: 79.99
        stock: 310
        rating: 4
```

```yaml
- id: lowdefy_default_col_def
  type: AgGridLowdefy
  properties:
    height: 300
    defaultColDef:
      sortable: true
      filter: true
      resizable: true
      flex: 1
    columnDefs:
      - field: employee
        headerName: Employee
      - field: department
        headerName: Department
      - field: title
        headerName: Job Title
      - field: location
        headerName: Office
      - field: startDate
        headerName: Start Date
    rowData:
      - employee: Sarah Chen
        department: Engineering
        title: Senior Developer
        location: San Francisco
        startDate: 2019-03-15
      - employee: James Wilson
        department: Marketing
        title: Campaign Manager
        location: New York
        startDate: 2020-07-01
      - employee: Maria Garcia
        department: Engineering
        title: Tech Lead
        location: Austin
        startDate: 2018-11-20
      - employee: David Kim
        department: Sales
        title: Account Executive
        location: Chicago
        startDate: 2021-01-10
      - employee: Emily Brown
        department: Design
        title: UX Designer
        location: San Francisco
        startDate: 2020-09-05
```

```yaml
- id: lowdefy_row_selection
  type: AgGridLowdefy
  properties:
    height: 300
    rowSelection:
      mode: multiRow
      checkboxes: false
      headerCheckbox: false
      enableClickSelection: true
    defaultColDef:
      sortable: true
      flex: 1
    columnDefs:
      - field: task
        headerName: Task
        flex: 2
      - field: assignee
        headerName: Assignee
      - field: priority
        headerName: Priority
        width: 120
      - field: status
        headerName: Status
        width: 120
    rowData:
      - task: Design login page
        assignee: Alice
        priority: High
        status: Done
      - task: Implement API endpoints
        assignee: Bob
        priority: High
        status: In Progress
      - task: Write unit tests
        assignee: Charlie
        priority: Medium
        status: To Do
      - task: Update documentation
        assignee: Diana
        priority: Low
        status: To Do
      - task: Code review PR
        assignee: Erik
        priority: Medium
        status: In Progress
```

```yaml
- id: lowdefy_pagination
  type: AgGridLowdefy
  properties:
    height: 350
    pagination: true
    paginationPageSize: 5
    defaultColDef:
      sortable: true
      filter: true
      flex: 1
    columnDefs:
      - field: orderId
        headerName: Order ID
        width: 120
      - field: customer
        headerName: Customer
      - field: product
        headerName: Product
      - field: quantity
        headerName: Qty
        width: 80
      - field: total
        headerName: Total ($)
        width: 110
      - field: status
        headerName: Status
        width: 120
    rowData:
      - orderId: ORD-201
        customer: Acme Corp
        product: Widget Pro
        quantity: 50
        total: 2499.5
        status: Shipped
      - orderId: ORD-202
        customer: Globex Inc
        product: Gadget X
        quantity: 25
        total: 1249.75
        status: Processing
      - orderId: ORD-203
        customer: Initech
        product: Widget Pro
        quantity: 100
        total: 4999
        status: Delivered
      - orderId: ORD-204
        customer: Umbrella Ltd
        product: Connector A
        quantity: 200
        total: 1998
        status: Shipped
      - orderId: ORD-205
        customer: Stark Ind
        product: Gadget X
        quantity: 10
        total: 499.9
        status: Processing
      - orderId: ORD-206
        customer: Wayne Ent
        product: Widget Pro
        quantity: 75
        total: 3749.25
        status: Delivered
      - orderId: ORD-207
        customer: Oscorp
        product: Connector A
        quantity: 150
        total: 1498.5
        status: Shipped
      - orderId: ORD-208
        customer: LexCorp
        product: Gadget X
        quantity: 30
        total: 1499.7
        status: Processing
```

```yaml
- id: lowdefy_events_row_click
  type: AgGridLowdefy
  properties:
    height: 300
    defaultColDef:
      sortable: true
      flex: 1
    columnDefs:
      - field: name
        headerName: Name
      - field: role
        headerName: Role
      - field: department
        headerName: Department
      - field: status
        headerName: Status
        width: 120
    rowData:
      - name: Alice Johnson
        role: Developer
        department: Engineering
        status: Active
      - name: Bob Smith
        role: Designer
        department: Design
        status: Active
      - name: Charlie Lee
        role: Manager
        department: Sales
        status: On Leave
      - name: Diana Patel
        role: Analyst
        department: Finance
        status: Active
      - name: Erik Johansson
        role: DevOps
        department: Engineering
        status: Active
  events:
    onRowClick:
      - id: row_click_message
        type: DisplayMessage
        params:
          content:
            _nunjucks:
              on:
                _event: row
              template: "Clicked: {{ name }} ({{ role }}, {{ department }})"
          duration: 3
    onCellClick:
      - id: cell_click_message
        type: DisplayMessage
        params:
          status: info
          content:
            _nunjucks:
              on:
                name:
                  _event: cell.column
                value:
                  _event: cell.value
              template: "Cell: {{ name }} = {{ value }}"
          duration: 3
- id: lowdefy_events_row_selected
  type: AgGridLowdefy
  properties:
    height: 300
    rowSelection:
      mode: multiRow
      checkboxes: false
      headerCheckbox: false
      enableClickSelection: true
    defaultColDef:
      sortable: true
      flex: 1
    columnDefs:
      - field: task
        headerName: Task
        flex: 2
      - field: assignee
        headerName: Assignee
      - field: priority
        headerName: Priority
        width: 120
    rowData:
      - task: Design login page
        assignee: Alice
        priority: High
      - task: Implement API
        assignee: Bob
        priority: High
      - task: Write tests
        assignee: Charlie
        priority: Medium
      - task: Update docs
        assignee: Diana
        priority: Low
      - task: Code review
        assignee: Erik
        priority: Medium
  events:
    onRowSelected:
      - id: row_selected_message
        type: DisplayMessage
        params:
          status: success
          content:
            _nunjucks:
              on:
                row:
                  _event: row.task
                count:
                  _event: selected.length
              template: Selected "{{ row }}" ({{ count }} total selected)
          duration: 3
```

```yaml
- id: lowdefy_events_row_click
  type: AgGridLowdefy
  properties:
    height: 300
    defaultColDef:
      sortable: true
      flex: 1
    columnDefs:
      - field: name
        headerName: Name
      - field: role
        headerName: Role
      - field: department
        headerName: Department
      - field: status
        headerName: Status
        width: 120
    rowData:
      - name: Alice Johnson
        role: Developer
        department: Engineering
        status: Active
      - name: Bob Smith
        role: Designer
        department: Design
        status: Active
      - name: Charlie Lee
        role: Manager
        department: Sales
        status: On Leave
      - name: Diana Patel
        role: Analyst
        department: Finance
        status: Active
      - name: Erik Johansson
        role: DevOps
        department: Engineering
        status: Active
  events:
    onRowClick:
      - id: row_click_message
        type: DisplayMessage
        params:
          content:
            _nunjucks:
              on:
                _event: row
              template: "Clicked: {{ name }} ({{ role }}, {{ department }})"
          duration: 3
    onCellClick:
      - id: cell_click_message
        type: DisplayMessage
        params:
          status: info
          content:
            _nunjucks:
              on:
                name:
                  _event: cell.column
                value:
                  _event: cell.value
              template: "Cell: {{ name }} = {{ value }}"
          duration: 3
- id: lowdefy_events_row_selected
  type: AgGridLowdefy
  properties:
    height: 300
    rowSelection:
      mode: multiRow
      checkboxes: false
      headerCheckbox: false
      enableClickSelection: true
    defaultColDef:
      sortable: true
      flex: 1
    columnDefs:
      - field: task
        headerName: Task
        flex: 2
      - field: assignee
        headerName: Assignee
      - field: priority
        headerName: Priority
        width: 120
    rowData:
      - task: Design login page
        assignee: Alice
        priority: High
      - task: Implement API
        assignee: Bob
        priority: High
      - task: Write tests
        assignee: Charlie
        priority: Medium
      - task: Update docs
        assignee: Diana
        priority: Low
      - task: Code review
        assignee: Erik
        priority: Medium
  events:
    onRowSelected:
      - id: row_selected_message
        type: DisplayMessage
        params:
          status: success
          content:
            _nunjucks:
              on:
                row:
                  _event: row.task
                count:
                  _event: selected.length
              template: Selected "{{ row }}" ({{ count }} total selected)
          duration: 3
```

```yaml
- id: lowdefy_styled_columns
  type: AgGridLowdefy
  properties:
    height: 300
    defaultColDef:
      sortable: true
      flex: 1
    columnDefs:
      - field: metric
        headerName: Metric
        flex: 2
        cellStyle:
          fontWeight: bold
      - field: q1
        headerName: Q1
        cellStyle:
          backgroundColor: var(--ant-blue-1)
          textAlign: right
      - field: q2
        headerName: Q2
        cellStyle:
          backgroundColor: var(--ant-green-1)
          textAlign: right
      - field: q3
        headerName: Q3
        cellStyle:
          backgroundColor: var(--ant-orange-1)
          textAlign: right
      - field: q4
        headerName: Q4
        cellStyle:
          backgroundColor: var(--ant-red-1)
          textAlign: right
    rowData:
      - metric: Revenue ($K)
        q1: 1250
        q2: 1380
        q3: 1520
        q4: 1690
      - metric: New Customers
        q1: 145
        q2: 162
        q3: 178
        q4: 201
      - metric: Churn Rate (%)
        q1: 3.2
        q2: 2.8
        q3: 2.5
        q4: 2.1
      - metric: NPS Score
        q1: 42
        q2: 45
        q3: 48
        q4: 52
```

```yaml
- id: lowdefy_cell_types_demo
  type: AgGridLowdefy
  properties:
    height: 360
    defaultColDef:
      resizable: true
      flex: 1
    columnDefs:
      - headerName: Status
        field: status
        width: 130
        cell:
          type: tag
          colorMap:
            Active: green
            Blocked: red
            Pending: blue
            On Leave: orange
      - headerName: Assignee
        field: name
        minWidth: 220
        cell:
          type: avatar
          nameField: name
          srcField: picture
          idField: id
      - headerName: Created
        field: created_at
        width: 170
        cell:
          type: date
      - headerName: Last seen
        field: last_seen
        width: 150
        cell:
          type: date
          relative: true
      - headerName: Verified
        field: verified
        width: 110
        cell:
          type: boolean
      - headerName: Progress
        field: completion
        width: 130
        cell:
          type: progress
    rowData:
      - id: u1
        name: Alice Johnson
        picture: https://i.pravatar.cc/80?img=1
        status: Active
        created_at: 2025-11-14T09:30:00Z
        last_seen: 2026-04-17T11:45:00Z
        verified: true
        completion: 92
      - id: u2
        name: Bob Smith
        status: On Leave
        created_at: 2025-09-02T14:10:00Z
        last_seen: 2026-04-10T08:15:00Z
        verified: true
        completion: 68
      - id: u3
        name: Charlie Lee
        picture: https://i.pravatar.cc/80?img=5
        status: Blocked
        created_at: 2026-01-20T18:00:00Z
        last_seen: 2026-04-17T07:22:00Z
        verified: false
        completion: 22
      - id: u4
        name: Diana Patel
        status: Pending
        created_at: null
        last_seen: null
        verified: null
        completion: null
```

```yaml
- id: lowdefy_linked_cells_demo
  type: AgGridLowdefy
  properties:
    height: 240
    defaultColDef:
      resizable: true
      flex: 1
    columnDefs:
      - headerName: Task ID
        field: _id
        width: 140
        cell:
          type: link
          pageId: tasks-view
          urlQuery:
            _id: _id
      - headerName: Assignee
        field: assignee
        cell:
          type: avatar
          nameField: assignee
          idField: _id
          link:
            pageId: user
            urlQuery:
              userId: _id
      - headerName: Priority
        field: priority
        width: 120
        cell:
          type: tag
          colorMap:
            High: red
            Medium: orange
            Low: default
    rowData:
      - _id: TSK-001
        assignee: Alice Johnson
        priority: High
      - _id: TSK-002
        assignee: Bob Smith
        priority: Medium
      - _id: TSK-003
        assignee: Charlie Lee
        priority: Low
  events:
    onCellLink:
      - id: navigate
        type: Link
        params:
          _event: link
```

```yaml
- id: lowdefy_linked_cells_demo
  type: AgGridLowdefy
  properties:
    height: 240
    defaultColDef:
      resizable: true
      flex: 1
    columnDefs:
      - headerName: Task ID
        field: _id
        width: 140
        cell:
          type: link
          pageId: tasks-view
          urlQuery:
            _id: _id
      - headerName: Assignee
        field: assignee
        cell:
          type: avatar
          nameField: assignee
          idField: _id
          link:
            pageId: user
            urlQuery:
              userId: _id
      - headerName: Priority
        field: priority
        width: 120
        cell:
          type: tag
          colorMap:
            High: red
            Medium: orange
            Low: default
    rowData:
      - _id: TSK-001
        assignee: Alice Johnson
        priority: High
      - _id: TSK-002
        assignee: Bob Smith
        priority: Medium
      - _id: TSK-003
        assignee: Charlie Lee
        priority: Low
  events:
    onCellLink:
      - id: navigate
        type: Link
        params:
          _event: link
```

```yaml
- id: lowdefy_ellipsis_demo
  type: AgGridLowdefy
  properties:
    height: 280
    defaultColDef:
      resizable: true
    columnDefs:
      - headerName: Code
        field: code
        width: 100
      - headerName: Title
        field: title
        minWidth: 220
      - headerName: Description
        field: description
        flex: 1
        ellipsis: 2
    rowData:
      - code: A-01
        title: Main switchboard
        description: Drafted the main switchboard layout and circuit schedule across
          three floors. Awaiting sign-off from the project engineer before
          ordering long-lead parts.
      - code: A-02
        title: East wing HVAC
        description: Balancing HVAC loads across the east wing. Waiting on updated
          ductwork drawings from the architect and a revised thermal model from
          the mechanical team.
      - code: A-03
        title: Utility connections
        description: Blocked on the utility connection survey — main was not where the
          drawings said it would be, which has cascaded to the trenching
          schedule.
```

```yaml
- id: lowdefy_number_demo
  type: AgGridLowdefy
  properties:
    height: 320
    defaultColDef:
      resizable: true
    columnDefs:
      - headerName: Account
        field: account
        width: 180
      - headerName: Revenue (USD)
        field: revenue
        width: 150
        cell:
          type: number
          format: currency
          currency: USD
          decimals: 0
      - headerName: EUR
        field: revenue_eur
        width: 150
        cell:
          type: number
          format: currency
          currency: EUR
          locale: de-DE
          decimals: 2
      - headerName: Δ vs budget
        field: delta
        width: 160
        cell:
          type: number
          format: currency
          currency: USD
          decimals: 2
          negative: parentheses
          signColor: true
      - headerName: Margin
        field: margin
        width: 110
        cell:
          type: number
          format: percent
          decimals: 1
      - headerName: Impressions
        field: impressions
        width: 130
        cell:
          type: number
          format: compact
      - headerName: Ratio
        field: ratio
        width: 110
        cell:
          type: number
          decimals: 3
    rowData:
      - account: Acme Corp
        revenue: 1245000
        revenue_eur: 1125750.5
        delta: 12500
        margin: 0.184
        impressions: 12340
        ratio: 1.234
      - account: Globex
        revenue: 825500
        revenue_eur: 745600.25
        delta: -44250.5
        margin: 0.072
        impressions: 1050000
        ratio: 0.876
      - account: Stark Ind.
        revenue: 4820000
        revenue_eur: 4350750
        delta: -125000
        margin: -0.033
        impressions: 85400000
        ratio: 2.12
      - account: Wayne Ent.
        revenue: 3150000
        revenue_eur: 2845300
        delta: 87500
        margin: 0.221
        impressions: 524000
        ratio: 0.948
```

```yaml
- id: lowdefy_loading_demo_switch
  type: Switch
  properties:
    title: Toggle loading overlay
- id: lowdefy_loading_demo_grid
  type: AgGridLowdefy
  loading:
    _state: lowdefy_loading_demo_switch
  properties:
    height: 260
    defaultColDef:
      flex: 1
    columnDefs:
      - field: name
        headerName: Name
      - field: role
        headerName: Role
    rowData:
      - name: Alice Johnson
        role: Developer
      - name: Bob Smith
        role: Designer
      - name: Charlie Lee
        role: Manager
```

```yaml
- id: lowdefy_loading_demo_switch
  type: Switch
  properties:
    title: Toggle loading overlay
- id: lowdefy_loading_demo_grid
  type: AgGridLowdefy
  loading:
    _state: lowdefy_loading_demo_switch
  properties:
    height: 260
    defaultColDef:
      flex: 1
    columnDefs:
      - field: name
        headerName: Name
      - field: role
        headerName: Role
    rowData:
      - name: Alice Johnson
        role: Developer
      - name: Bob Smith
        role: Designer
      - name: Charlie Lee
        role: Manager
```

```yaml
- id: lowdefy_tag_array_demo
  type: AgGridLowdefy
  properties:
    height: 240
    defaultColDef:
      resizable: true
      flex: 1
    columnDefs:
      - headerName: User
        field: name
        minWidth: 180
      - headerName: Roles
        field: roles
        minWidth: 260
        cell:
          type: tag
          colorMap:
            admin: red
            editor: blue
            viewer: green
            billing: orange
          default: default
    rowData:
      - name: Alice Johnson
        roles:
          - admin
          - editor
      - name: Bob Smith
        roles:
          - viewer
      - name: Charlie Lee
        roles:
          - editor
          - billing
          - viewer
      - name: Diana Patel
        roles: []
      - name: Chan Maarten
        roles: null
```

```yaml
- id: lowdefy_tag_seeded_demo
  type: AgGridLowdefy
  properties:
    height: 300
    defaultColDef:
      resizable: true
      flex: 1
    columnDefs:
      - headerName: Project
        field: project
        minWidth: 160
      - headerName: Tags
        field: tags
        minWidth: 320
        cell:
          type: tag
    rowData:
      - project: Storefront
        tags:
          - frontend
          - react
          - typescript
      - project: API gateway
        tags:
          - backend
          - node
          - typescript
      - project: ML pipeline
        tags:
          - python
          - airflow
          - backend
      - project: Mobile app
        tags:
          - frontend
          - react
          - mobile
      - project: Design system
        tags:
          - frontend
          - design
```

```yaml
- id: lowdefy_buttons_cell_demo
  type: AgGridLowdefy
  properties:
    height: 260
    defaultColDef:
      resizable: true
      flex: 1
    columnDefs:
      - headerName: Task
        field: name
      - headerName: Status
        field: status
        width: 120
        cell:
          type: tag
          colorMap:
            Open: blue
            Locked: red
            Archived: default
      - headerName: Actions
        field: _id
        width: 220
        cell:
          type: buttons
          buttons:
            - eventName: onEditClick
              title: Edit
              icon: AiOutlineEdit
              type: primary
            - eventName: onDeleteClick
              title: Delete
              icon: AiOutlineDelete
              danger: true
              disabledField: locked
              hiddenField: archived
    rowData:
      - _id: TSK-001
        name: Wire main switchboard
        status: Open
        locked: false
        archived: false
      - _id: TSK-002
        name: HVAC balancing
        status: Locked
        locked: true
        archived: false
      - _id: TSK-003
        name: Utility connections
        status: Archived
        locked: false
        archived: true
  events:
    onEditClick:
      - id: edit_msg
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - "Edit "
              - _event: row._id
    onDeleteClick:
      - id: delete_msg
        type: DisplayMessage
        params:
          status: warning
          content:
            _string.concat:
              - "Delete "
              - _event: row.name
```

```yaml
- id: lowdefy_buttons_cell_demo
  type: AgGridLowdefy
  properties:
    height: 260
    defaultColDef:
      resizable: true
      flex: 1
    columnDefs:
      - headerName: Task
        field: name
      - headerName: Status
        field: status
        width: 120
        cell:
          type: tag
          colorMap:
            Open: blue
            Locked: red
            Archived: default
      - headerName: Actions
        field: _id
        width: 220
        cell:
          type: buttons
          buttons:
            - eventName: onEditClick
              title: Edit
              icon: AiOutlineEdit
              type: primary
            - eventName: onDeleteClick
              title: Delete
              icon: AiOutlineDelete
              danger: true
              disabledField: locked
              hiddenField: archived
    rowData:
      - _id: TSK-001
        name: Wire main switchboard
        status: Open
        locked: false
        archived: false
      - _id: TSK-002
        name: HVAC balancing
        status: Locked
        locked: true
        archived: false
      - _id: TSK-003
        name: Utility connections
        status: Archived
        locked: false
        archived: true
  events:
    onEditClick:
      - id: edit_msg
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - "Edit "
              - _event: row._id
    onDeleteClick:
      - id: delete_msg
        type: DisplayMessage
        params:
          status: warning
          content:
            _string.concat:
              - "Delete "
              - _event: row.name
```

```yaml
- id: lowdefy_selector_cell_demo
  type: AgGridLowdefy
  properties:
    height: 280
    defaultColDef:
      resizable: true
    columnDefs:
      - headerName: Task
        field: name
        flex: 1
      - headerName: Priority
        field: priority
        width: 200
        cell:
          type: selector
          eventName: onPriorityChange
          options:
            - label: Low
              value: low
              color: green
            - label: Medium
              value: medium
              color: orange
            - label: High
              value: high
              color: red
      - headerName: Labels
        field: labels
        width: 340
        cell:
          type: multipleSelector
          eventName: onLabelsChange
          placeholder: Add labels
          options:
            - bug
            - feature
            - docs
            - urgent
    rowData:
      - id: r1
        name: Wire main switchboard
        priority:
          _state:
            key: sel_priority.r1
            default: high
        labels:
          _state:
            key: sel_labels.r1
            default:
              - urgent
      - id: r2
        name: HVAC balancing
        priority:
          _state:
            key: sel_priority.r2
            default: medium
        labels:
          _state:
            key: sel_labels.r2
            default: []
      - id: r3
        name: Utility connections
        priority:
          _state:
            key: sel_priority.r3
            default: low
        labels:
          _state:
            key: sel_labels.r3
            default:
              - docs
              - feature
  events:
    onPriorityChange:
      - id: persist_priority
        type: SetState
        params:
          sel_priority:
            _object.assign:
              - _state: sel_priority
              - _object.fromEntries:
                  - - _event: row.id
                    - _event: newValue
    onLabelsChange:
      - id: persist_labels
        type: SetState
        params:
          sel_labels:
            _object.assign:
              - _state: sel_labels
              - _object.fromEntries:
                  - - _event: row.id
                    - _event: newValue
```

```yaml
- id: lowdefy_selector_cell_demo
  type: AgGridLowdefy
  properties:
    height: 280
    defaultColDef:
      resizable: true
    columnDefs:
      - headerName: Task
        field: name
        flex: 1
      - headerName: Priority
        field: priority
        width: 200
        cell:
          type: selector
          eventName: onPriorityChange
          options:
            - label: Low
              value: low
              color: green
            - label: Medium
              value: medium
              color: orange
            - label: High
              value: high
              color: red
      - headerName: Labels
        field: labels
        width: 340
        cell:
          type: multipleSelector
          eventName: onLabelsChange
          placeholder: Add labels
          options:
            - bug
            - feature
            - docs
            - urgent
    rowData:
      - id: r1
        name: Wire main switchboard
        priority:
          _state:
            key: sel_priority.r1
            default: high
        labels:
          _state:
            key: sel_labels.r1
            default:
              - urgent
      - id: r2
        name: HVAC balancing
        priority:
          _state:
            key: sel_priority.r2
            default: medium
        labels:
          _state:
            key: sel_labels.r2
            default: []
      - id: r3
        name: Utility connections
        priority:
          _state:
            key: sel_priority.r3
            default: low
        labels:
          _state:
            key: sel_labels.r3
            default:
              - docs
              - feature
  events:
    onPriorityChange:
      - id: persist_priority
        type: SetState
        params:
          sel_priority:
            _object.assign:
              - _state: sel_priority
              - _object.fromEntries:
                  - - _event: row.id
                    - _event: newValue
    onLabelsChange:
      - id: persist_labels
        type: SetState
        params:
          sel_labels:
            _object.assign:
              - _state: sel_labels
              - _object.fromEntries:
                  - - _event: row.id
                    - _event: newValue
```

```yaml
- id: lowdefy_input_cell_demo
  type: AgGridLowdefy
  properties:
    height: 260
    defaultColDef:
      resizable: true
    rowData:
      - id: t1
        name:
          _state:
            key: inp_name.t1
            default: Wire main switchboard
        active:
          _state:
            key: inp_active.t1
            default: true
        notes:
          _state:
            key: inp_notes.t1
            default: Awaiting sign-off from the project engineer.
      - id: t2
        name:
          _state:
            key: inp_name.t2
            default: HVAC balancing
        active:
          _state:
            key: inp_active.t2
            default: false
        notes:
          _state:
            key: inp_notes.t2
            default: Waiting on updated ductwork drawings.
    columnDefs:
      - headerName: Task
        field: name
        width: 260
        cell:
          type: textInput
          eventName: onNameChange
          placeholder: Task name
      - headerName: Active
        field: active
        width: 110
        cell:
          type: switch
          eventName: onActiveChange
          checkedText: on
          uncheckedText: off
      - headerName: Notes
        field: notes
        flex: 1
        cell:
          type: paragraphInput
          eventName: onNotesChange
          ellipsis:
            rows: 2
  events:
    onNameChange:
      - id: persist_name
        type: SetState
        params:
          inp_name:
            _object.assign:
              - _state: inp_name
              - _object.fromEntries:
                  - - _event: row.id
                    - _event: newValue
    onActiveChange:
      - id: persist_active
        type: SetState
        params:
          inp_active:
            _object.assign:
              - _state: inp_active
              - _object.fromEntries:
                  - - _event: row.id
                    - _event: newValue
    onNotesChange:
      - id: persist_notes
        type: SetState
        params:
          inp_notes:
            _object.assign:
              - _state: inp_notes
              - _object.fromEntries:
                  - - _event: row.id
                    - _event: newValue
```

```yaml
- id: lowdefy_input_cell_demo
  type: AgGridLowdefy
  properties:
    height: 260
    defaultColDef:
      resizable: true
    rowData:
      - id: t1
        name:
          _state:
            key: inp_name.t1
            default: Wire main switchboard
        active:
          _state:
            key: inp_active.t1
            default: true
        notes:
          _state:
            key: inp_notes.t1
            default: Awaiting sign-off from the project engineer.
      - id: t2
        name:
          _state:
            key: inp_name.t2
            default: HVAC balancing
        active:
          _state:
            key: inp_active.t2
            default: false
        notes:
          _state:
            key: inp_notes.t2
            default: Waiting on updated ductwork drawings.
    columnDefs:
      - headerName: Task
        field: name
        width: 260
        cell:
          type: textInput
          eventName: onNameChange
          placeholder: Task name
      - headerName: Active
        field: active
        width: 110
        cell:
          type: switch
          eventName: onActiveChange
          checkedText: on
          uncheckedText: off
      - headerName: Notes
        field: notes
        flex: 1
        cell:
          type: paragraphInput
          eventName: onNotesChange
          ellipsis:
            rows: 2
  events:
    onNameChange:
      - id: persist_name
        type: SetState
        params:
          inp_name:
            _object.assign:
              - _state: inp_name
              - _object.fromEntries:
                  - - _event: row.id
                    - _event: newValue
    onActiveChange:
      - id: persist_active
        type: SetState
        params:
          inp_active:
            _object.assign:
              - _state: inp_active
              - _object.fromEntries:
                  - - _event: row.id
                    - _event: newValue
    onNotesChange:
      - id: persist_notes
        type: SetState
        params:
          inp_notes:
            _object.assign:
              - _state: inp_notes
              - _object.fromEntries:
                  - - _event: row.id
                    - _event: newValue
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | string | `"middle"` | Row density, mirroring antd Table sizes. `small` is compact, `middle` (the Lowdefy default) matches antd Table's `middle`, `large` matches antd Table's default density. Changes spacing and row/header height only — colours and font size are identical across sizes. Enum: `small`, `middle`, `large`. |
| `themeParams` | object | - | AG Grid Theming API parameters merged onto this block's theme, for per-grid overrides. Keys are AG Grid param names, e.g. `headerBackgroundColor`, `rowHoverColor`, `borderColor`. Values are CSS strings and may reference antd tokens, e.g. `var(--ant-color-primary)`. An unrecognised param name has no effect — neither Lowdefy nor AG Grid validates the names — so check spelling against AG Grid's theming parameter reference. |
| `height` | number \| string | `"auto"` | Specify table height explicitly, in pixel. |
| `rowData` | array | - | The list of data to display on the table. |
| `rowId` | string | - | The data field to use in `getRowId` which results in Row Selection being maintained across Row Data changes (assuming the Row exists in both sets). See Ag Grid docs for more details (https://www.ag-grid.com/react-data-grid/data-update-row-data/). |
| `enableBrowserTooltips` | boolean | `false` | Set to `true` to use the browser native `title` attribute tooltips instead of AG Grid's styled tooltip component. |
| `suppressCellFocus` | boolean | `true` | When `true` (default), clicking a cell does not draw the AG Grid cell-focus border. Set to `false` to enable spreadsheet-style cell focus and keyboard navigation. |
| `tooltipShowDelay` | number | `2000` | The delay in milliseconds before a tooltip is shown. Not applied when `enableBrowserTooltips` is `true`. |
| `tooltipHideDelay` | number | `10000` | The delay in milliseconds before a tooltip is hidden. Not applied when `enableBrowserTooltips` is `true`. |
| `defaultColDef` | object | - | Column properties which get applied to all columns. See all (https://www.ag-grid.com/javascript-data-grid/column-properties/). |
| `columnDefs` | array | - | A list of properties for each column. |
| `columnDefs.$.field` | string | - | The field of the row object to get the cell's data from. Deep references into a row object is supported via dot notation, i.e 'address.firstLine'. |
| `columnDefs.$.headerName` | string | - | The name to render in the column header. If not specified and field is specified, the field name will be used as the header name. |
| `columnDefs.$.filter` | boolean | `false` | Filter component to use for this column. Set to true to use the default filter. |
| `columnDefs.$.sortable` | boolean | `false` | Set to true to allow sorting on this column. |
| `columnDefs.$.resizable` | boolean | `false` | Set to true to allow this column should be resized. |
| `columnDefs.$.width` | number | - | Initial width in pixels for the cell. |
| `columnDefs.$.cellStyle` | object | - | An object of css values returning an object of css values for a particular cell. |
| `columnDefs.$.cellRenderer` | object | - | Provide your own cell Renderer function (using the `_function` operator) for this column's cells. |
| `columnDefs.$.valueFormatter` | object \| string | - | A function (using the `_function` operator) or expression to format a value, should return a string. Not used for CSV export or copy to clipboard, only for UI cell rendering. |
| `columnDefs.$.tooltipField` | string | - | The field of the row object to read the tooltip value from. When set, hovering a cell shows a tooltip with that value using the grid's default tooltip component. |
| `columnDefs.$.tooltipValueGetter` | object | - | Provide a function (using the `_function` operator) that returns the tooltip value for a cell. Overrides `tooltipField`. |
| `columnDefs.$.tooltipComponent` | object | - | Provide a custom tooltip component. See AG Grid tooltip component docs (https://www.ag-grid.com/react-data-grid/component-tooltip/). |
| `columnDefs.$.ellipsis` | number | - | Line-clamp count for long text. Automatically enables `wrapText` and `autoHeight` and applies the `.lf-ellipsis-N` class (1–6). |
| `columnDefs.$.cell` | object | - | Built-in cell renderer. Takes precedence over `cellRenderer` when `type` is set. Field-valued keys (e.g. `nameField`, `srcField`, `urlQuery.*`) are row-data paths. |
| `columnDefs.$.cell.type` | string | - | The built-in renderer to use. Enum: `tag`, `avatar`, `link`, `date`, `boolean`, `progress`, `number`, `buttons`, `menu`, `selector`, `multipleSelector`, `switch`, `textInput`, `paragraphInput`. |
| `columnDefs.$.cell.colorMap` | object | - | Tag: map of cell value → color (antd tag color name or hex). Used when `cell.type: tag`. The cell value may be a single string or an array of strings; arrays render one tag per item. If neither `colorMap`, `colorFrom`, nor `default` is set, tag values are auto-coloured from a stable hash for consistency across rows. |
| `columnDefs.$.cell.colorFrom` | string | - | Tag: row-data path to a color value. Takes precedence over `colorMap`. |
| `columnDefs.$.cell.default` | string | - | Tag: fallback color for values not in `colorMap`. |
| `columnDefs.$.cell.nameField` | string | - | Avatar: row-data path for the name label. |
| `columnDefs.$.cell.srcField` | string | - | Avatar: row-data path for the image src (optional). |
| `columnDefs.$.cell.idField` | string | - | Avatar: row-data path for an id used to seed initials colour. |
| `columnDefs.$.cell.shape` | string | - | Avatar shape. Defaults to `circle`. Enum: `circle`, `square`. |
| `columnDefs.$.cell.link` | object | - | Avatar/Link: navigation config. Emits `onCellLink` on click. `pageId`/`href`/`back`/`home`/`newTab` are literal; `urlQuery` values are row-data paths. |
| `columnDefs.$.cell.pageId` | string | - | Link: target page id (literal). |
| `columnDefs.$.cell.href` | string | - | Link: literal href (overrides `pageId`). |
| `columnDefs.$.cell.back` | boolean | - | Link: navigate back. |
| `columnDefs.$.cell.home` | boolean | - | Link: navigate home. |
| `columnDefs.$.cell.newTab` | boolean | - | Link: open in a new tab. |
| `columnDefs.$.cell.urlQuery` | object | - | Link: query params. Each value is a row-data path. |
| `columnDefs.$.cell.labelField` | string | - | Link: row-data path for the visible label (falls back to cell value). |
| `columnDefs.$.cell.format` | string | - | Number: `number` (default), `currency`, `percent`, or `compact` (K/M/B). Date: dayjs format string (default `YYYY-MM-DD HH:mm`). |
| `columnDefs.$.cell.relative` | boolean | - | Date: render as relative time (e.g. "3 hours ago"). |
| `columnDefs.$.cell.trueLabel` | string | - | Boolean: label when truthy. |
| `columnDefs.$.cell.falseLabel` | string | - | Boolean: label when falsy. |
| `columnDefs.$.cell.trueColor` | string | - | Boolean: CSS colour when truthy. |
| `columnDefs.$.cell.falseColor` | string | - | Boolean: CSS colour when falsy. |
| `columnDefs.$.cell.thresholds` | array | - | Progress: threshold values (ascending). Each threshold defines where the next colour starts. |
| `columnDefs.$.cell.colors` | array | - | Progress: colour per bucket (length = thresholds.length + 1). |
| `columnDefs.$.cell.suffix` | string | - | Number/Progress: literal suffix appended after the formatted value. Default `%` for progress. |
| `columnDefs.$.cell.nullLabel` | string | - | Progress: label when value is null. Default `None`. |
| `columnDefs.$.cell.locale` | string | - | Number: BCP 47 locale for `Intl.NumberFormat` (e.g. `en-US`, `de-DE`). Defaults to browser. |
| `columnDefs.$.cell.currency` | string | - | Number: ISO 4217 currency code when `format: currency`. Default `USD`. |
| `columnDefs.$.cell.currencyDisplay` | string | - | Number: currency display style when `format: currency`. Enum: `symbol`, `narrowSymbol`, `code`, `name`. |
| `columnDefs.$.cell.decimals` | number | - | Number: fixed number of fraction digits (sets both `minimumFractionDigits` and `maximumFractionDigits`). |
| `columnDefs.$.cell.minDecimals` | number | - | Number: `Intl.NumberFormat` `minimumFractionDigits`. |
| `columnDefs.$.cell.maxDecimals` | number | - | Number: `Intl.NumberFormat` `maximumFractionDigits`. |
| `columnDefs.$.cell.notation` | string | - | Number: `Intl.NumberFormat` notation. `compact` format sets this automatically. Enum: `standard`, `scientific`, `engineering`, `compact`. |
| `columnDefs.$.cell.useGrouping` | boolean | `true` | Number: include thousands separators. |
| `columnDefs.$.cell.negative` | string | `"minus"` | Number: how to render negative numbers — `minus` (default) or `parentheses` for accounting. Enum: `minus`, `parentheses`. |
| `columnDefs.$.cell.signColor` | boolean | `false` | Number: when true, positives use `positiveColor` (default success token), negatives use `negativeColor` (default error token). |
| `columnDefs.$.cell.positiveColor` | string | - | Number: CSS colour when value > 0 (requires `signColor: true`). |
| `columnDefs.$.cell.negativeColor` | string | - | Number: CSS colour when value < 0 (requires `signColor: true`). |
| `columnDefs.$.cell.zeroColor` | string | - | Number: CSS colour when value === 0 (requires `signColor: true`). |
| `columnDefs.$.cell.color` | string | - | Number: CSS colour applied to all values (overridden by `signColor`). |
| `columnDefs.$.cell.prefix` | string | - | Number: literal prefix (e.g. `Δ `, `~`). |
| `columnDefs.$.cell.align` | string | - | Cell horizontal alignment. Defaults to `right` for `cell.type: number`. Sets `cellStyle.justifyContent` and `ag-*-aligned-header` on the header. Enum: `left`, `center`, `right`. |
| `columnDefs.$.cell.buttons` | array | - | Buttons cell: list of buttons rendered per row. Each button triggers its own block-level event (declared in `events:`). Per-button properties mirror the `Button` block schema. `*Field` variants (`titleField`, `iconField`, `disabledField`, `hiddenField`) are row-data paths. |
| `columnDefs.$.cell.buttons.$.eventName` | string | - | Block-level event name to trigger on click. |
| `columnDefs.$.cell.buttons.$.title` | string | - | Title text on the button - supports html. |
| `columnDefs.$.cell.buttons.$.titleField` | string | - | Row-data path for the title. |
| `columnDefs.$.cell.buttons.$.icon` | string \| object | - | Name of a React-Icon or Icon block config. |
| `columnDefs.$.cell.buttons.$.iconField` | string | - | Row-data path for the icon name or config. |
| `columnDefs.$.cell.buttons.$.type` | string | - | antd Button type. Enum: `primary`, `default`, `dashed`, `link`, `text`. |
| `columnDefs.$.cell.buttons.$.variant` | string | - | antd Button variant. Takes precedence over `type` when set. Enum: `solid`, `outlined`, `dashed`, `filled`, `text`, `link`. |
| `columnDefs.$.cell.buttons.$.color` | string | - | Button color (antd preset or hex). |
| `columnDefs.$.cell.buttons.$.size` | string | `"small"` | Button size. Defaults to `small` inside cells. Enum: `small`, `default`, `large`. |
| `columnDefs.$.cell.buttons.$.shape` | string | `"square"` |  Enum: `circle`, `round`, `square`. |
| `columnDefs.$.cell.buttons.$.danger` | boolean | `false` |  |
| `columnDefs.$.cell.buttons.$.ghost` | boolean | `false` |  |
| `columnDefs.$.cell.buttons.$.hideTitle` | boolean | `false` | Hide the button's title (icon-only). |
| `columnDefs.$.cell.buttons.$.disabled` | boolean | `false` |  |
| `columnDefs.$.cell.buttons.$.disabledField` | string | - | Row-data path → boolean. |
| `columnDefs.$.cell.buttons.$.hidden` | boolean | `false` | Hide the button entirely. |
| `columnDefs.$.cell.buttons.$.hiddenField` | string | - | Row-data path → boolean. |
| `columnDefs.$.cell.items` | array | - | Menu cell: items in the row action menu, rendered in a dropdown behind a single trigger button. Each item triggers its own block-level event (declared in `events:`). `*Field` variants (`titleField`, `iconField`, `disabledField`, `hiddenField`) are row-data paths. A hidden item is dropped, not disabled — a row on which every item is hidden renders no trigger at all. |
| `columnDefs.$.cell.items.$.eventName` | string | - | Block-level event name to trigger on click. Event payload is `{ row, value, item: { eventName, title }, itemIndex }`. |
| `columnDefs.$.cell.items.$.title` | string | - | Item label - supports html. |
| `columnDefs.$.cell.items.$.titleField` | string | - | Row-data path for the label. |
| `columnDefs.$.cell.items.$.icon` | string \| object | - | Name of a React-Icon or Icon block config. |
| `columnDefs.$.cell.items.$.iconField` | string | - | Row-data path for the icon name or config. |
| `columnDefs.$.cell.items.$.danger` | boolean | `false` | Render the item in the danger colour. |
| `columnDefs.$.cell.items.$.disabled` | boolean | `false` |  |
| `columnDefs.$.cell.items.$.disabledField` | string | - | Row-data path → boolean. |
| `columnDefs.$.cell.items.$.hidden` | boolean | `false` | Hide the item entirely. |
| `columnDefs.$.cell.items.$.hiddenField` | string | - | Row-data path → boolean. |
| `columnDefs.$.cell.icon` | string \| object | `"AiOutlineMore"` | Menu cell: the trigger icon. Name of a React-Icon or Icon block config. The trigger is icon-only. |
| `columnDefs.$.cell.placement` | string | `"bottomRight"` | Menu cell: where the dropdown opens relative to its trigger. Enum: `bottomLeft`, `bottom`, `bottomRight`, `topLeft`, `top`, `topRight`. |
| `columnDefs.$.cell.options` | array | - | Selector / Multiple selector cell: dropdown options. An array of primitives, or objects mirroring the `Selector` block options: `{ label, value, disabled, color, filterString, style }`. `label` supports html. |
| `columnDefs.$.cell.valueKey` | string | - | Selector / Multiple selector: field on each option object to use as its value. Defaults to `value`. |
| `columnDefs.$.cell.primaryKey` | string | - | Selector / Multiple selector: field used to match the cell value to an option (identity key for object values). |
| `columnDefs.$.cell.eventName` | string | - | Selector / Multiple selector: block-level event triggered on change. Event payload is `{ row, value, newValue }` (`newValue` is an array for `multipleSelector`). |
| `columnDefs.$.cell.placeholder` | string | - | Selector / Multiple selector: placeholder text when empty. |
| `columnDefs.$.cell.allowClear` | boolean | `true` | Selector / Multiple selector: show a clear button. |
| `columnDefs.$.cell.showSearch` | boolean | `true` | Selector / Multiple selector: allow typing to filter options. |
| `columnDefs.$.cell.size` | string | `"small"` | Selector / Multiple selector: input size. Defaults to `small` inside cells. Enum: `small`, `default`, `large`. |
| `columnDefs.$.cell.disabled` | boolean | `false` | Selector / Multiple selector: disable the input. |
| `columnDefs.$.cell.variant` | string | - | Selector / Multiple selector: visual variant. `solid` fills the control (single) or tags (multiple) with the selected option colour. Enum: `outlined`, `filled`, `borderless`, `solid`. |
| `columnDefs.$.cell.bordered` | boolean | - | Selector / Multiple selector: set false for a borderless control. Deprecated alias of `variant: borderless`. |
| `columnDefs.$.cell.showArrow` | boolean | - | Selector / Multiple selector: show the dropdown arrow. |
| `columnDefs.$.cell.autoFocus` | boolean | `false` | Selector / Multiple selector: focus the control on mount. |
| `columnDefs.$.cell.maxTagCount` | number \| string | - | Multiple selector: max tags shown before collapsing (a number, or "responsive"). |
| `columnDefs.$.cell.autoClearSearchValue` | boolean | - | Multiple selector: clear the search box after each selection. |
| `columnDefs.$.cell.checkedText` | string | - | Switch: label shown inside the switch when on. |
| `columnDefs.$.cell.uncheckedText` | string | - | Switch: label shown inside the switch when off. |
| `columnDefs.$.cell.checkedIcon` | string \| object | - | Switch: icon shown when on (React-Icon name or Icon block config). |
| `columnDefs.$.cell.uncheckedIcon` | string \| object | - | Switch: icon shown when off (React-Icon name or Icon block config). |
| `columnDefs.$.cell.inputType` | string | - | Text input: the HTML input type (e.g. `text`, `email`, `number`, `password`). Named `inputType` to avoid clashing with `cell.type`. |
| `columnDefs.$.cell.maxLength` | number | - | Text input / Paragraph input: maximum number of characters. |
| `columnDefs.$.cell.showCount` | boolean | - | Text input: show the character count. |
| `columnDefs.$.cell.editable` | boolean | `true` | Paragraph input: set false to render read-only text with no edit pencil. |
| `columnDefs.$.cell.autoSize` | boolean \| object | - | Paragraph input: auto-size the inline edit textarea. |
| `columnDefs.$.cell.editTooltip` | boolean \| string | - | Paragraph input: tooltip on the edit pencil. |
| `columnDefs.$.cell.copyable` | boolean \| object | - | Paragraph input: show a copy-to-clipboard button. |
| `columnDefs.$.cell.ellipsis` | boolean \| object | - | Paragraph input: truncate with an ellipsis (e.g. `{ rows: 2, expandable: true }`). |
| `columnDefs.$.cell.code` | boolean | - | Paragraph input: render as inline code. |
| `columnDefs.$.cell.strong` | boolean | - | Paragraph input: bold text. |
| `columnDefs.$.cell.italic` | boolean | - | Paragraph input: italic text. |
| `columnDefs.$.cell.underline` | boolean | - | Paragraph input: underlined text. |
| `columnDefs.$.cell.delete` | boolean | - | Paragraph input: strikethrough text. |
| `columnDefs.$.cell.mark` | boolean | - | Paragraph input: highlighted text. |
| `columnDefs.$.cell.textType` | string | - | Paragraph input: antd Typography semantic colour. Enum: `secondary`, `success`, `warning`, `danger`. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onCellClick` | `{ cell: object, colId: string, row: object, rowIndex: integer, selected: array }` | Trigger event when a cell is clicked. |
| `onFilterChanged` | `{ rows: array, filter: object }` | Trigger event when the filter changes. |
| `onRowClick` | `{ row: object, selected: array, rowIndex: integer }` | Trigger event when a row is clicked. |
| `onRowSelected` | `{ row: object, rowIndex: integer, selected: array }` | Trigger event when a row is selected. |
| `onSelectionChanged` | `{ selected: array }` | Triggered when the selected rows are changed. |
| `onSortChanged` | `{ rows: array, sort: array }` | Trigger event when the sort changes. |
| `onCellLink` | `{ link: object, row: object, value: any }` | Triggered when a built-in `cell.type: link` (or avatar with `link`) cell is clicked. Wire to a `Link` action with `params: { _event: link }` to navigate. |
| `onCellButton` | `{ row: object, value: any, button: object, buttonIndex: integer }` | Documentation reference — the actual event name fired is the `eventName` string declared on each `cell.buttons[]` entry. Wire any number of named events on the block (e.g. `onApprove`, `onDelete`). |
| `onCellMenuItem` | `{ row: object, value: any, item: object, itemIndex: integer }` | Documentation reference — the actual event name fired is the `eventName` string declared on each `cell.items[]` entry of a `cell.type: menu` cell. Wire any number of named events on the block (e.g. `onRename`, `onDelete`). |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The AgGridLowdefy element. |

No slots defined.
