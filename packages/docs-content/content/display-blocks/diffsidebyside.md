# DiffSideBySide

`DiffSideBySide` renders a before / after view of two objects as paired Ant Design `Descriptions` panels. The left column shows previous values (struck through for removed fields) and the right column shows the new values (highlighted for added or changed fields). Uses the same filtering, labelling, and per-path value formatters as `DiffList`.

```yaml
- id: diff_side_by_side_profile
  type: DiffSideBySide
  properties:
    title: Profile updated
    before:
      name: Sarah Johnson
      email: sarah@example.com
      role: member
    after:
      name: Sarah M. Johnson
      email: sarah.j@example.com
      role: admin
    labels:
      name: Full name
      email: Email address
      role: Role
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `before` | object \| array \| null | - | Previous state. An object or array; null / undefined is treated as empty so "newly created" records diff cleanly. |
| `after` | object \| array \| null | - | New state. An object or array; null / undefined is treated as empty so "deleted" records diff cleanly. |
| `maxDepth` | integer | `4` | Paths deeper than this collapse into a single "Changed" row rendered as JSON. Defaults to 4. |
| `title` | string | - | Optional title rendered above the diff. Supports html. |
| `emptyText` | string | `"No changes"` | Shown when there are no differences between before and after. |
| `showUnchanged` | boolean | `false` | Also render unchanged leaf fields in a muted style in both columns. |
| `groupByRoot` | boolean | `true` | Group changes by their top-level key. When false, changes render as one flat paired list. |
| `collapseNested` | boolean | `true` | Render entirely-new or entirely-removed nested objects and arrays inside a collapsible panel. |
| `labels` | object | - | Map of dotted path to display label. Example: { "user.email": "Email address" }. |
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
| `/element` | The DiffSideBySide wrapper element. |
| `/title` | The DiffSideBySide title. |
| `/group` | A paired Descriptions wrapper (one per side). |
| `/row` | A single row label within either side. |
| `/tag` | The change-type tag element. |

No slots defined.
