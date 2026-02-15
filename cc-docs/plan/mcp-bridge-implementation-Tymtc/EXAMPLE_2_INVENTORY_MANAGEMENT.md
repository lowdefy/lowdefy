# Example 2: Inventory Management with Approvals

A multi-page app where an agent monitors stock levels, creates purchase orders, and handles approvals — demonstrating list blocks, conditional visibility, multi-step workflows, and concurrent sessions.

---

## The Lowdefy App Config

```yaml
# lowdefy.yaml
lowdefy: 4.0.0
name: Warehouse Manager

auth:
  providers:
    - id: credentials
      type: CredentialsProvider
      properties:
        name: email
  pages:
    protected: true
    roles:
      warehouse: [stock_levels, create_purchase_order]
      manager: [stock_levels, create_purchase_order, pending_approvals]

connections:
  - id: warehouseDb
    type: MongoDBCollection
    properties:
      databaseUri:
        _secret: MONGODB_URI
      collection: inventory
      read: true
      write: true

  - id: ordersDb
    type: MongoDBCollection
    properties:
      databaseUri:
        _secret: MONGODB_URI
      collection: purchase_orders
      read: true
      write: true

mcp:
  enabled: true
  transport: stdio
  session:
    store:
      type: FilesystemSessionStore
      properties:
        directory: .lowdefy/sessions

pages:
  # ── Page 1: Stock Levels Dashboard ─────────────────
  - id: stock_levels
    type: PageSiderMenu
    properties:
      title: Stock Levels
    events:
      onMount:
        - id: load_inventory
          type: Request
          params: get_inventory
    areas:
      content:
        blocks:
          - id: summary_row
            type: Box
            layout:
              contentGutter: 16
            areas:
              content:
                blocks:
                  - id: total_items
                    type: Statistic
                    layout:
                      span: 6
                    properties:
                      title: Total Items
                      value:
                        _array.length:
                          _request: get_inventory

                  - id: low_stock_count
                    type: Statistic
                    layout:
                      span: 6
                    properties:
                      title: Low Stock Alerts
                      value:
                        _array.length:
                          _array.filter:
                            - _request: get_inventory
                            - _function:
                                _lt:
                                  - __args: 0.quantity
                                  - __args: 0.reorder_threshold
                      valueStyle:
                        color: '#cf1322'

          - id: search_box
            type: TextInput
            properties:
              title: Search Products
              placeholder: Search by name or SKU...
              allowClear: true

          - id: search_btn
            type: Button
            properties:
              title: Search
            events:
              onClick:
                - id: search
                  type: Request
                  params: get_inventory

          - id: inventory_table
            type: AgGridAlpine
            properties:
              theme: balham
              columnDefs:
                - headerName: SKU
                  field: sku
                  width: 120
                - headerName: Product
                  field: name
                  flex: 2
                - headerName: Category
                  field: category
                  width: 130
                - headerName: Qty
                  field: quantity
                  width: 80
                - headerName: Reorder At
                  field: reorder_threshold
                  width: 100
                - headerName: Unit Cost
                  field: unit_cost
                  width: 100
                - headerName: Status
                  field: stock_status
                  width: 100
              rowData:
                _request: get_inventory
            events:
              onRowClick:
                - id: select_product
                  type: SetGlobal
                  params:
                    selectedProduct:
                      _event: row

    requests:
      - id: get_inventory
        type: MongoDBFind
        connectionId: warehouseDb
        payload:
          _state: true
        properties:
          query:
            _if:
              test:
                _ne:
                  - _payload: search_box
                  - null
              then:
                name:
                  $regex:
                    _payload: search_box
                  $options: i
              else: {}
          options:
            sort:
              quantity: 1

  # ── Page 2: Create Purchase Order ──────────────────
  - id: create_purchase_order
    type: PageSiderMenu
    properties:
      title: Create Purchase Order
    areas:
      content:
        blocks:
          - id: po_header
            type: Card
            properties:
              title: Purchase Order Details
            areas:
              content:
                blocks:
                  - id: supplier
                    type: Selector
                    required: true
                    properties:
                      title: Supplier
                      options:
                        - label: Acme Supplies
                          value: acme
                        - label: Global Parts Co
                          value: global_parts
                        - label: QuickShip Wholesale
                          value: quickship

                  - id: delivery_date
                    type: DateSelector
                    required: true
                    properties:
                      title: Expected Delivery Date
                      format: YYYY-MM-DD
                      disabledDate:
                        min:
                          _date: now

                  - id: notes
                    type: TextArea
                    properties:
                      title: Notes
                      placeholder: Special instructions for this order...

          - id: line_items_card
            type: Card
            properties:
              title: Line Items
            areas:
              content:
                blocks:
                  - id: line_items
                    type: ControlledList
                    properties:
                      title: Order Items
                      addItemButton:
                        title: Add Item
                        icon: AiOutlinePlus
                    areas:
                      content:
                        blocks:
                          - id: line_items.$.sku
                            type: TextInput
                            required: true
                            layout:
                              span: 8
                            properties:
                              title: SKU

                          - id: line_items.$.product_name
                            type: TextInput
                            required: true
                            layout:
                              span: 8
                            properties:
                              title: Product Name

                          - id: line_items.$.quantity
                            type: NumberInput
                            required: true
                            layout:
                              span: 4
                            properties:
                              title: Qty
                              min: 1

                          - id: line_items.$.unit_cost
                            type: NumberInput
                            required: true
                            layout:
                              span: 4
                            properties:
                              title: Unit Cost
                              precision: 2
                              min: 0

          - id: total_display
            type: Statistic
            properties:
              title: Order Total
              prefix: R
              value:
                _sum:
                  _array.map:
                    - _state: line_items
                    - _function:
                        _product:
                          - _args: 0.quantity
                          - _args: 0.unit_cost

          - id: submit_po
            type: Button
            properties:
              title: Submit for Approval
              type: primary
              block: true
              icon: AiOutlineCheck
            events:
              onClick:
                - id: validate
                  type: Validate
                - id: save_po
                  type: Request
                  params: create_po
                  messages:
                    loading: Creating purchase order...
                    success: Purchase order submitted for approval!
                    error: Failed to create purchase order

    requests:
      - id: create_po
        type: MongoDBInsertOne
        connectionId: ordersDb
        payload:
          _state: true
        properties:
          doc:
            supplier:
              _payload: supplier
            delivery_date:
              _payload: delivery_date
            notes:
              _payload: notes
            line_items:
              _payload: line_items
            status: pending_approval
            total:
              _sum:
                _array.map:
                  - _payload: line_items
                  - _function:
                      _product:
                        - _args: 0.quantity
                        - _args: 0.unit_cost
            created_by:
              _user: name
            created_at:
              _date: now

  # ── Page 3: Pending Approvals (Manager Only) ───────
  - id: pending_approvals
    type: PageSiderMenu
    properties:
      title: Pending Approvals
    events:
      onMount:
        - id: load_pending
          type: Request
          params: get_pending_orders
    areas:
      content:
        blocks:
          - id: pending_table
            type: AgGridAlpine
            properties:
              columnDefs:
                - headerName: PO #
                  field: _id
                  width: 140
                - headerName: Supplier
                  field: supplier
                  width: 150
                - headerName: Items
                  field: item_count
                  width: 80
                - headerName: Total
                  field: total
                  width: 120
                - headerName: Created By
                  field: created_by
                  width: 150
                - headerName: Delivery
                  field: delivery_date
                  width: 120
              rowData:
                _request: get_pending_orders
            events:
              onRowClick:
                - id: select_order
                  type: SetState
                  params:
                    selected_order_id:
                      _event: row._id

          - id: approval_section
            type: Card
            visible:
              _ne:
                - _state: selected_order_id
                - null
            properties:
              title: Review Order
            areas:
              content:
                blocks:
                  - id: order_detail
                    type: Markdown
                    properties:
                      content:
                        _nunjucks:
                          template: |
                            **Supplier:** {{ supplier }}
                            **Delivery Date:** {{ delivery_date }}
                            **Notes:** {{ notes }}

                            | SKU | Product | Qty | Unit Cost | Line Total |
                            |-----|---------|-----|-----------|------------|
                            {% for item in line_items %}
                            | {{ item.sku }} | {{ item.product_name }} | {{ item.quantity }} | R{{ item.unit_cost }} | R{{ item.quantity * item.unit_cost }} |
                            {% endfor %}

                            **Total: R{{ total }}**
                          on:
                            _request: get_order_detail

                  - id: approve_btn
                    type: Button
                    properties:
                      title: Approve
                      type: primary
                      icon: AiOutlineCheck
                    events:
                      onClick:
                        - id: approve
                          type: Request
                          params: approve_order
                          messages:
                            success: Order approved!
                        - id: refresh
                          type: Request
                          params: get_pending_orders

                  - id: reject_btn
                    type: Button
                    properties:
                      title: Reject
                      type: default
                      danger: true
                      icon: AiOutlineClose
                    events:
                      onClick:
                        - id: reject
                          type: Request
                          params: reject_order
                          messages:
                            success: Order rejected.
                        - id: refresh_after_reject
                          type: Request
                          params: get_pending_orders

    requests:
      - id: get_pending_orders
        type: MongoDBFind
        connectionId: ordersDb
        properties:
          query:
            status: pending_approval
          options:
            sort:
              created_at: -1

      - id: get_order_detail
        type: MongoDBFindOne
        connectionId: ordersDb
        payload:
          _state: true
        properties:
          query:
            _id:
              _payload: selected_order_id

      - id: approve_order
        type: MongoDBUpdateOne
        connectionId: ordersDb
        payload:
          _state: true
        properties:
          filter:
            _id:
              _payload: selected_order_id
          update:
            $set:
              status: approved
              approved_by:
                _user: name
              approved_at:
                _date: now

      - id: reject_order
        type: MongoDBUpdateOne
        connectionId: ordersDb
        payload:
          _state: true
        properties:
          filter:
            _id:
              _payload: selected_order_id
          update:
            $set:
              status: rejected
              rejected_by:
                _user: name
              rejected_at:
                _date: now
```

---

## The Agent Conversation: Concurrent Sessions

Two agents (or the same agent handling two workstreams) interact with this app simultaneously.

### Session A: Warehouse worker restocking low items

```
Agent → session_create({
  name: "Restock low inventory",
  description: "Check stock levels, create PO for items below reorder threshold"
})
← { sessionId: "sess_wh01" }
```

```
Agent → navigate({ sessionId: "sess_wh01", pageId: "stock_levels" })

← {
  page: `
# Stock Levels

<container id="summary_row" type="Box">

<display id="total_items" type="Statistic">
Total Items
Value: 47
</display>

<display id="low_stock_count" type="Statistic" style="color:#cf1322">
Low Stock Alerts
Value: 5
</display>

</container>

<input id="search_box" type="TextInput" events=[onChange]>
Search Products — Placeholder: "Search by name or SKU..."
Current value: null
</input>

<button id="search_btn" events=[onClick]>
Search
</button>

<display id="inventory_table" type="AgGridAlpine" rows="47" events=[onRowClick]>
| SKU | Product | Category | Qty | Reorder At | Unit Cost | Status |
| --- | --- | --- | --- | --- | --- | --- |
| WH-001 | M8 Hex Bolts (100pk) | Fasteners | 3 | 20 | 45.00 | critical |
| WH-002 | Cable Ties 300mm | Electrical | 8 | 15 | 12.50 | low |
| WH-003 | Safety Goggles | PPE | 12 | 25 | 35.00 | low |
| WH-004 | Nitrile Gloves (Box) | PPE | 5 | 30 | 89.00 | critical |
| WH-005 | WD-40 400ml | Lubricants | 14 | 20 | 28.00 | low |
| WH-006 | Masking Tape 50mm | Adhesives | 120 | 30 | 8.50 | ok |
| WH-007 | 10mm Drill Bits (5pk) | Tools | 45 | 10 | 62.00 | ok |
| ... (40 more rows) |
</display>
  `,

  log: [
    { action: "onMount", success: true, requestResults: [
      { requestId: "get_inventory", success: true, response: [ /* 47 items sorted by qty */ ] }
    ]}
  ]
}
```

The agent sees the 5 low-stock items at the top (sorted by quantity ascending). Now it navigates to create a PO.

```
Agent → navigate({ sessionId: "sess_wh01", pageId: "create_purchase_order" })

← {
  page: `
# Create Purchase Order

<container id="po_header" type="Card">
## Purchase Order Details

<input id="supplier" type="Selector" required="true" events=[onChange]>
Supplier
Options: [acme (Acme Supplies), global_parts (Global Parts Co), quickship (QuickShip Wholesale)]
Current value: null
</input>

<input id="delivery_date" type="DateSelector" required="true" events=[onChange]>
Expected Delivery Date (YYYY-MM-DD)
Current value: null
</input>

<input id="notes" type="TextArea" events=[onChange]>
Notes — Placeholder: "Special instructions for this order..."
Current value: null
</input>

</container>

<container id="line_items_card" type="Card">
## Line Items

<list id="line_items" type="ControlledList" items="0" actions=[pushItem, removeItem, moveItemUp, moveItemDown]>
Order Items
(no items)
</list>

</container>

<display id="total_display" type="Statistic">
Order Total
R0
</display>

<button id="submit_po" events=[onClick]>
Submit for Approval [AiOutlineCheck]
</button>
  `,
  log: []
}
```

Now the agent fills the form and adds line items using list actions:

```
Agent → interact({
  sessionId: "sess_wh01",
  actions: [
    { type: "setValue", blockId: "supplier", value: "acme" },
    { type: "setValue", blockId: "delivery_date", value: "2024-01-22" },
    { type: "setValue", blockId: "notes", value: "URGENT: Critical stock items below threshold. Please expedite." },

    { type: "callMethod", blockId: "line_items", method: "pushItem" },
    { type: "setValue", blockId: "line_items.0.sku", value: "WH-001" },
    { type: "setValue", blockId: "line_items.0.product_name", value: "M8 Hex Bolts (100pk)" },
    { type: "setValue", blockId: "line_items.0.quantity", value: 50 },
    { type: "setValue", blockId: "line_items.0.unit_cost", value: 45.00 },

    { type: "callMethod", blockId: "line_items", method: "pushItem" },
    { type: "setValue", blockId: "line_items.1.sku", value: "WH-004" },
    { type: "setValue", blockId: "line_items.1.product_name", value: "Nitrile Gloves (Box)" },
    { type: "setValue", blockId: "line_items.1.quantity", value: 60 },
    { type: "setValue", blockId: "line_items.1.unit_cost", value: 89.00 },

    { type: "callMethod", blockId: "line_items", method: "pushItem" },
    { type: "setValue", blockId: "line_items.2.sku", value: "WH-003" },
    { type: "setValue", blockId: "line_items.2.product_name", value: "Safety Goggles" },
    { type: "setValue", blockId: "line_items.2.quantity", value: 30 },
    { type: "setValue", blockId: "line_items.2.unit_cost", value: 35.00 },

    { type: "triggerEvent", blockId: "submit_po", event: "onClick" }
  ]
})

← {
  page: `
# Create Purchase Order

<container id="po_header" type="Card">
## Purchase Order Details

<input id="supplier" type="Selector" required="true" events=[onChange]>
Supplier
Options: [acme (Acme Supplies), global_parts (Global Parts Co), quickship (QuickShip Wholesale)]
Current value: "acme"
</input>

<input id="delivery_date" type="DateSelector" required="true" events=[onChange]>
Expected Delivery Date (YYYY-MM-DD)
Current value: "2024-01-22"
</input>

<input id="notes" type="TextArea" events=[onChange]>
Notes — Placeholder: "Special instructions for this order..."
Current value: "URGENT: Critical stock items below threshold. Please expedite."
</input>

</container>

<container id="line_items_card" type="Card">
## Line Items

<list id="line_items" type="ControlledList" items="3" actions=[pushItem, removeItem, moveItemUp, moveItemDown]>
Order Items

[Item 0]
<input id="line_items.0.sku" type="TextInput" required="true">SKU — Current value: "WH-001"</input>
<input id="line_items.0.product_name" type="TextInput" required="true">Product Name — Current value: "M8 Hex Bolts (100pk)"</input>
<input id="line_items.0.quantity" type="NumberInput" required="true">Qty — Current value: 50</input>
<input id="line_items.0.unit_cost" type="NumberInput" required="true">Unit Cost — Current value: 45</input>

[Item 1]
<input id="line_items.1.sku" type="TextInput" required="true">SKU — Current value: "WH-004"</input>
<input id="line_items.1.product_name" type="TextInput" required="true">Product Name — Current value: "Nitrile Gloves (Box)"</input>
<input id="line_items.1.quantity" type="NumberInput" required="true">Qty — Current value: 60</input>
<input id="line_items.1.unit_cost" type="NumberInput" required="true">Unit Cost — Current value: 89</input>

[Item 2]
<input id="line_items.2.sku" type="TextInput" required="true">SKU — Current value: "WH-003"</input>
<input id="line_items.2.product_name" type="TextInput" required="true">Product Name — Current value: "Safety Goggles"</input>
<input id="line_items.2.quantity" type="NumberInput" required="true">Qty — Current value: 30</input>
<input id="line_items.2.unit_cost" type="NumberInput" required="true">Unit Cost — Current value: 35</input>

</list>

</container>

<display id="total_display" type="Statistic">
Order Total
R8,640.00
</display>

<button id="submit_po" events=[onClick]>
Submit for Approval [AiOutlineCheck]
</button>
  `,

  log: [
    { action: "setValue", blockId: "supplier", success: true },
    { action: "setValue", blockId: "delivery_date", success: true },
    { action: "setValue", blockId: "notes", success: true },
    { action: "callMethod", blockId: "line_items", method: "pushItem", success: true },
    { action: "setValue", blockId: "line_items.0.sku", success: true },
    { action: "setValue", blockId: "line_items.0.product_name", success: true },
    { action: "setValue", blockId: "line_items.0.quantity", success: true },
    { action: "setValue", blockId: "line_items.0.unit_cost", success: true },
    { action: "callMethod", blockId: "line_items", method: "pushItem", success: true },
    { action: "setValue", blockId: "line_items.1.sku", success: true },
    { action: "setValue", blockId: "line_items.1.product_name", success: true },
    { action: "setValue", blockId: "line_items.1.quantity", success: true },
    { action: "setValue", blockId: "line_items.1.unit_cost", success: true },
    { action: "callMethod", blockId: "line_items", method: "pushItem", success: true },
    { action: "setValue", blockId: "line_items.2.sku", success: true },
    { action: "setValue", blockId: "line_items.2.product_name", success: true },
    { action: "setValue", blockId: "line_items.2.quantity", success: true },
    { action: "setValue", blockId: "line_items.2.unit_cost", success: true },
    { action: "triggerEvent", blockId: "submit_po", event: "onClick", success: true,
      requestResults: [
        { requestId: "create_po", success: true, response: { insertedId: "po_2024_0042" } }
      ],
      messages: ["Purchase order submitted for approval!"]
    }
  ]
}
```

---

### Session B (concurrent): Manager approving orders

While session A is creating the PO, a manager agent is working in a separate session.

```
Agent → session_create({
  name: "PO approvals Jan 15",
  description: "Review and approve pending purchase orders for this week"
})
← { sessionId: "sess_mgr01" }
```

```
Agent → navigate({ sessionId: "sess_mgr01", pageId: "pending_approvals" })

← {
  page: `
# Pending Approvals

<display id="pending_table" type="AgGridAlpine" rows="3" events=[onRowClick]>
| PO # | Supplier | Items | Total | Created By | Delivery |
| --- | --- | --- | --- | --- | --- |
| po_2024_0040 | quickship | 2 | R1,250.00 | Sarah Chen | 2024-01-20 |
| po_2024_0041 | global_parts | 5 | R12,450.00 | James Wilson | 2024-01-25 |
| po_2024_0042 | acme | 3 | R8,640.00 | Warehouse Bot | 2024-01-22 |
</display>
  `,

  log: [
    { action: "onMount", success: true, requestResults: [
      { requestId: "get_pending_orders", success: true, response: [ /* 3 pending orders */ ] }
    ]}
  ]
}
```

Note: `po_2024_0042` is the order just created by Session A. The manager selects it:

```
Agent → interact({
  sessionId: "sess_mgr01",
  actions: [
    { type: "triggerEvent", blockId: "pending_table", event: "onRowClick",
      eventData: { row: { _id: "po_2024_0042", supplier: "acme", total: 8640 } }
    }
  ]
})

← {
  page: `
# Pending Approvals

<display id="pending_table" type="AgGridAlpine" rows="3" events=[onRowClick]>
| PO # | Supplier | Items | Total | Created By | Delivery |
| --- | --- | --- | --- | --- | --- |
| po_2024_0040 | quickship | 2 | R1,250.00 | Sarah Chen | 2024-01-20 |
| po_2024_0041 | global_parts | 5 | R12,450.00 | James Wilson | 2024-01-25 |
| po_2024_0042 | acme | 3 | R8,640.00 | Warehouse Bot | 2024-01-22 |
</display>

<container id="approval_section" type="Card">
## Review Order

<display id="order_detail" type="Markdown">
**Supplier:** acme
**Delivery Date:** 2024-01-22
**Notes:** URGENT: Critical stock items below threshold. Please expedite.

| SKU | Product | Qty | Unit Cost | Line Total |
|-----|---------|-----|-----------|------------|
| WH-001 | M8 Hex Bolts (100pk) | 50 | R45.00 | R2,250.00 |
| WH-004 | Nitrile Gloves (Box) | 60 | R89.00 | R5,340.00 |
| WH-003 | Safety Goggles | 30 | R35.00 | R1,050.00 |

**Total: R8,640.00**
</display>

<button id="approve_btn" events=[onClick]>
Approve [AiOutlineCheck]
</button>

<button id="reject_btn" events=[onClick]>
Reject [AiOutlineClose]
</button>

</container>
  `,

  log: [
    { action: "triggerEvent", blockId: "pending_table", event: "onRowClick", success: true },
    { note: "SetState: selected_order_id = po_2024_0042" },
    { note: "approval_section now visible (conditional block)" },
    { requestResults: [
      { requestId: "get_order_detail", success: true }
    ]}
  ]
}
```

The `approval_section` card appeared because `visible` evaluates to true now that `selected_order_id` is set. The agent approves:

```
Agent → interact({
  sessionId: "sess_mgr01",
  actions: [
    { type: "triggerEvent", blockId: "approve_btn", event: "onClick" }
  ]
})

← {
  page: `
# Pending Approvals

<display id="pending_table" type="AgGridAlpine" rows="2" events=[onRowClick]>
| PO # | Supplier | Items | Total | Created By | Delivery |
| --- | --- | --- | --- | --- | --- |
| po_2024_0040 | quickship | 2 | R1,250.00 | Sarah Chen | 2024-01-20 |
| po_2024_0041 | global_parts | 5 | R12,450.00 | James Wilson | 2024-01-25 |
</display>
  `,

  log: [
    { action: "triggerEvent", blockId: "approve_btn", event: "onClick", success: true,
      requestResults: [
        { requestId: "approve_order", success: true, response: { modifiedCount: 1 } },
        { requestId: "get_pending_orders", success: true, response: [ /* 2 remaining orders */ ] }
      ],
      messages: ["Order approved!"]
    }
  ]
}
```

The approved order disappears from the table. Two orders remain. The agent continues processing:

```
Agent → interact({
  sessionId: "sess_mgr01",
  actions: [
    { type: "triggerEvent", blockId: "pending_table", event: "onRowClick",
      eventData: { row: { _id: "po_2024_0041" } }
    }
  ]
})

← { ... order detail for po_2024_0041 appears ... }
```

```
Agent → interact({
  sessionId: "sess_mgr01",
  actions: [
    { type: "triggerEvent", blockId: "reject_btn", event: "onClick" }
  ]
})

← {
  page: `
# Pending Approvals

<display id="pending_table" type="AgGridAlpine" rows="1" events=[onRowClick]>
| PO # | Supplier | Items | Total | Created By | Delivery |
| --- | --- | --- | --- | --- | --- |
| po_2024_0040 | quickship | 2 | R1,250.00 | Sarah Chen | 2024-01-20 |
</display>
  `,

  log: [
    { action: "triggerEvent", blockId: "reject_btn", event: "onClick", success: true,
      requestResults: [
        { requestId: "reject_order", success: true, response: { modifiedCount: 1 } },
        { requestId: "get_pending_orders", success: true, response: [ /* 1 remaining */ ] }
      ],
      messages: ["Order rejected."]
    }
  ]
}
```

---

## Key Patterns Demonstrated

1. **ControlledList with array indices** — `line_items.0.sku`, `line_items.1.quantity`. Agent uses `pushItem` method to add rows, then sets values on indexed fields. The Engine manages array state natively.

2. **Conditional visibility** — `approval_section` only renders when `selected_order_id` is not null. The markdown output simply omits invisible blocks. Agent discovers the section after triggering `onRowClick`.

3. **Concurrent sessions** — Session A (warehouse) and Session B (manager) operate independently with separate state. Session A's PO creation shows up in Session B's query because they share the database, not state.

4. **Role-based page access** — `warehouse` role sees `stock_levels` and `create_purchase_order`. Only `manager` sees `pending_approvals`. The MCP server's `get_pages` tool returns only authorized pages.

5. **Computed display values** — `total_display` Statistic computes its value from `_sum` of `_array.map` over `line_items`. The markdown renders the computed result (`R8,640.00`), not the operator expression.

6. **callMethod action** — `pushItem` is a block method on ControlledList, not an event trigger. The agent calls it to add items to the list, which the Engine handles via `Block._initList()`.

7. **Event data passing** — `onRowClick` passes `_event: row` data. The agent includes `eventData` in the triggerEvent action so the event chain can access row data.

8. **Search with re-fetch** — Stock levels page has a search box that, when followed by clicking Search, re-fetches `get_inventory` with the search term in `_payload`. The MongoDB query uses `$regex` for text matching.

9. **Nunjucks templating** — Order detail uses `_nunjucks` operator to format a markdown table from request data. The `mcpRender` for Markdown blocks outputs the rendered template content directly.

10. **Multi-step approval workflow** — select row → review detail → approve/reject → table refreshes. State flows naturally through the Engine's event system without special MCP handling.
