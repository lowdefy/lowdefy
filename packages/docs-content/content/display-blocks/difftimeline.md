# DiffTimeline

`DiffTimeline` renders a diff as a vertical audit trail using Ant Design's `Timeline` component. Each change becomes a timeline entry with a colour-coded dot (green for added, red for removed, blue for changed) and a breadcrumb-style label that shows the full path to the changed field. Uses the same filtering, labelling, and per-path value formatters as `DiffList`.

```yaml
- id: diff_timeline_order
  type: DiffTimeline
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

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `before` | object \| array \| null | - | Previous state. An object or array; null / undefined is treated as empty so "newly created" records diff cleanly. |
| `after` | object \| array \| null | - | New state. An object or array; null / undefined is treated as empty so "deleted" records diff cleanly. |
| `maxDepth` | integer | `4` | Paths deeper than this collapse into a single "Changed" entry rendered as JSON. Defaults to 4. |
| `title` | string | - | Optional title rendered above the timeline. Supports html. |
| `emptyText` | string | `"No changes"` | Shown when there are no differences between before and after. |
| `showUnchanged` | boolean | `false` | Also emit muted timeline entries for unchanged leaf fields. |
| `collapseNested` | boolean | `true` | Render entirely-new or entirely-removed nested objects and arrays inside a collapsible panel. |
| `labels` | object | - | Map of dotted path to display label. |
| `hide` | array | - | Patterns to hide. Each entry is an exact dotted path, a `prefix.*` prefix match, or a `*.leaf` tail match. |
| `show` | array | - | Allowlist; same pattern syntax as `hide`. Applied before `hide`. |
| `format` | object | - | Per-path value formatter. Keys are dotted paths (with optional "prefix.*" or "*.leaf" globs); values describe how to render matched values. |
| `changeTypeLabels` | object | - | Override the tag labels for each change type. |
| `changeTypeLabels.added` | string | `"Added"` |  |
| `changeTypeLabels.removed` | string | `"Removed"` |  |
| `changeTypeLabels.changed` | string | `"Changed"` |  |
| `changeTypeLabels.unchanged` | string | `"Unchanged"` |  |
| `theme` | object | - | Antd Timeline design token overrides. See [antd design tokens](https://ant.design/components/timeline#design-token). See [Ant Design timeline tokens](https://ant.design/components/timeline#design-token). |

No events defined.

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The DiffTimeline wrapper element. |
| `/title` | The DiffTimeline title. |
| `/group` | The antd Timeline element. |

No slots defined.
