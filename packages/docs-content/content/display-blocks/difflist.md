# DiffList

`DiffList` renders a polished, user-friendly diff between a `before` and an `after` object as a grouped table of changes. Built on `microdiff` for the diff engine and antd primitives for rendering, it groups changes by top-level key, tags each row as Added / Removed / Changed, and supports per-path value formatters (`date`, `datetime`, `boolean`, `currency`, `enum`, `json`, `code`), humanised `labels`, and `hide` / `show` glob filtering. All colours come from antd's semantic tokens so dark mode and `theme` overrides work automatically.

```yaml
- id: diff_list_profile
  type: DiffList
  properties:
    title: Profile updated
    before:
      name: Sarah Johnson
      email: sarah@example.com
      role: member
      newsletterOptIn: true
      lastLoginAt: 2026-01-15T09:24:00Z
      address:
        street: 221B Baker Street
        city: London
        country: UK
    after:
      name: Sarah Johnson
      email: sarah.johnson@example.com
      role: admin
      newsletterOptIn: false
      lastLoginAt: 2026-04-17T14:05:00Z
      address:
        street: 221B Baker Street
        city: London
        country: United Kingdom
    labels:
      name: Full name
      email: Email address
      role: Role
      newsletterOptIn: Newsletter
      lastLoginAt: Last login
      address: Mailing address
      address.street: Street
      address.city: City
      address.country: Country
    format:
      lastLoginAt:
        type: datetime
        pattern: MMM D, YYYY HH:mm
      newsletterOptIn:
        type: boolean
      role:
        type: enum
        map:
          member:
            label: Member
            color: default
          admin:
            label: Administrator
            color: gold
```

```yaml
- id: diff_list_order
  type: DiffList
  properties:
    title: Order
    before:
      status: pending
      subtotal: 129.5
      tax: 10.36
      total: 139.86
      items:
        - Notebook (A5)
        - Pen (blue)
      internal:
        createdBy: sys
        traceId: abc-123
    after:
      status: paid
      subtotal: 129.5
      tax: 10.36
      total: 139.86
      items:
        - Notebook (A5)
        - Pen (blue)
        - Sticky notes
      internal:
        createdBy: sys
        traceId: abc-999
    hide:
      - internal.*
    labels:
      status: Status
      subtotal: Subtotal
      tax: Tax
      total: Total
      items: Line items
    format:
      subtotal:
        type: currency
        currency: USD
      tax:
        type: currency
        currency: USD
      total:
        type: currency
        currency: USD
      status:
        type: enum
        map:
          pending:
            label: Pending
            color: warning
          paid:
            label: Paid
            color: success
          cancelled:
            label: Cancelled
            color: error
```

```yaml
- id: diff_list_inventory
  type: DiffList
  properties:
    title: Inventory snapshot
    showUnchanged: true
    before:
      sku: WID-001
      name: Widget A
      quantity: 120
      reorderPoint: 40
      active: true
    after:
      sku: WID-001
      name: Widget A
      quantity: 38
      reorderPoint: 40
      active: true
    labels:
      sku: SKU
      name: Product
      quantity: Quantity on hand
      reorderPoint: Reorder point
      active: Active
    format:
      active:
        type: boolean
```

```yaml
- id: diff_list_empty
  type: DiffList
  properties:
    title: Settings saved
    emptyText: No changes since last save.
    before:
      theme: dark
      language: en
    after:
      theme: dark
      language: en
```

```yaml
- id: diff_list_orders_array
  type: DiffList
  properties:
    title: Orders updated
    before:
      orders:
        - id: ord_1
          total: 10
          name: Notebook
        - id: ord_2
          total: 5
          name: Pen
    after:
      orders:
        - id: ord_1
          total: 20
          name: Notebook
        - id: ord_2
          total: 5
          name: Pen
        - id: ord_3
          total: 99
          name: Stapler
    labels:
      orders: Orders
      orders.0.total: Total
    format:
      orders.*.total:
        type: currency
        currency: USD
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `before` | object \| array \| null | - | Previous state. An object or array; null / undefined is treated as empty so "newly created" records diff cleanly. |
| `after` | object \| array \| null | - | New state. An object or array; null / undefined is treated as empty so "deleted" records diff cleanly. |
| `maxDepth` | integer | `4` | Paths deeper than this collapse into a single "Changed" row rendered as JSON. Defaults to 4 (covers array-of-objects + one nested object + a leaf). Lower to compress deeply nested payloads. |
| `title` | string | - | Optional title rendered above the diff. Supports html. |
| `emptyText` | string | `"No changes"` | Shown when there are no differences between before and after. |
| `showUnchanged` | boolean | `false` | Also render unchanged leaf fields in a muted style. Useful for "everything at a glance" views. |
| `groupByRoot` | boolean | `true` | Group changes by their top-level key. When false, changes render as one flat list. |
| `collapseNested` | boolean | `true` | Render entirely-new or entirely-removed nested objects and arrays inside a collapsible panel. |
| `labels` | object | - | Map of dotted path to display label. Example: { "user.email": "Email address", "address": "Mailing address" }. |
| `hide` | array | - | Patterns to hide. Each entry is an exact dotted path (e.g. `user.email`), a `prefix.*` prefix match, or a `*.leaf` tail match. |
| `show` | array | - | Allowlist; same pattern syntax as `hide`. Applied before `hide`. |
| `format` | object | - | Per-path value formatter. Keys are dotted paths (with optional "prefix.*" or "*.leaf" globs); values describe how to render matched values. |
| `changeTypeLabels` | object | - | Override the tag labels for each change type. |
| `changeTypeLabels.added` | string | `"Added"` |  |
| `changeTypeLabels.removed` | string | `"Removed"` |  |
| `changeTypeLabels.changed` | string | `"Changed"` |  |
| `changeTypeLabels.unchanged` | string | `"Unchanged"` |  |
| `theme` | object | - | Antd Descriptions design token overrides. See [antd design tokens](https://ant.design/components/descriptions#design-token). See [Ant Design descriptions tokens](https://ant.design/components/descriptions#design-token). |

No events defined.

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The DiffList wrapper element. |
| `/title` | The DiffList title. |
| `/group` | A group panel wrapper around changes sharing a top-level key. |
| `/row` | A single change row label. |
| `/tag` | The change-type tag element (Added / Removed / Changed / Unchanged). |

No slots defined.
