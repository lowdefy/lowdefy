# TreeInput

Inline tree with nested options and checkboxes. (Renamed from `TreeSelector`.)

```yaml
- id: tree_basic
  type: TreeInput
  properties:
    primaryKey: id
    parentKey: parentId
    valueKey: id
    html: "{{ item.label }}"
    defaultExpandAll: true
    data:
      - id: 1
        label: Engineering
      - id: 2
        label: Frontend
        parentId: 1
      - id: 3
        label: Backend
        parentId: 1
      - id: 4
        label: Operations
      - id: 5
        label: SRE
        parentId: 4
  events:
    onChange:
      - id: capture
        type: SetState
        params:
          dept:
            _event: value
- id: tree_basic_display
  type: Paragraph
  properties:
    content:
      _nunjucks:
        template: 'Selected: {{ dept if dept != null else "—" }}'
        on:
          _state: true
```

```yaml
- id: tree_line
  type: TreeInput
  properties:
    showLine: true
    checkable: true
    primaryKey: id
    parentKey: parentId
    valueKey: id
    html: "{{ item.label }}"
    defaultExpandAll: true
    data:
      - id: 1
        label: Fruits
      - id: 2
        label: Apple
        parentId: 1
      - id: 3
        label: Banana
        parentId: 1
      - id: 4
        label: Vegetables
      - id: 5
        label: Carrot
        parentId: 4
```

```yaml
- id: tree_options
  type: TreeInput
  properties:
    primaryKey: value
    parentKey: parent
    defaultExpandAll: true
    options:
      - value: eng
        label: Engineering
      - value: fe
        label: Frontend
        parent: eng
      - value: be
        label: Backend
        parent: eng
      - value: ops
        label: Operations
```

```yaml
- id: tree_block_node
  type: TreeInput
  properties:
    blockNode: true
    height: 160
    defaultExpandAll: true
    primaryKey: id
    parentKey: parentId
    valueKey: id
    html: "{{ item.label }}"
    data:
      - id: 1
        label: Documents
      - id: 2
        label: Invoices
        parentId: 1
      - id: 3
        label: Receipts
        parentId: 1
      - id: 4
        label: Contracts
        parentId: 1
      - id: 5
        label: Photos
      - id: 6
        label: Holidays
        parentId: 5
      - id: 7
        label: Events
        parentId: 5
      - id: 8
        label: Music
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | array | - | Alternative to `options`: an array of raw rows. Each row is rendered to a label with the `html` template, and `valueKey` selects which field becomes the value. Use this to drive a selector directly from data without building label/value pairs in your request. |
| `html` | string | - | Nunjucks template that renders each option label when using `data`. The context exposes `item` (the current row) and `index` (the zero-based row index). Ignored when `options` is used. |
| `valueKey` | string | - | Field used as the selected value. With `options` it names the value field (defaults to "value"). With `data` it names the field stored when an option is selected; omit it to store the whole row. Supports dotted paths (e.g. "user.id"). |
| `primaryKey` | string | - | Field used to match the current value (e.g. set with SetState) back to an option for highlighting. Defaults to `valueKey`. Set this when the stored value is the whole row but a single field (e.g. "id") uniquely identifies it. In the tree selectors it also serves as each node’s id, referenced by `parentKey`. Supports dotted paths. |
| `parentKey` | string | - | Tree selectors only: names each row’s parent id. Build a flat `data`/`options` array where each row has a `primaryKey` (its own id) and a `parentKey` whose value equals the parent row’s `primaryKey`. Rows whose `parentKey` is empty or points at no row become tree roots. Supports dotted paths. |
| `options` | array | `[]` | Options can either be an array of primitive values, on an array of label, value pairs - supports html. |
| `options.$.label` | string | - | Value label shown to user - supports html. |
| `options.$.value` | - | - | Option value. Can be of any type. |
| `options.$.disabled` | boolean | `false` | Disable the option if true. |
| `options.$.style` | object | - | Css style to apply to the option. |
| `options.$.color` | string | - | Color applied to this option when it is selected. Falls back to the block-level color when not set. |
| `disabled` | boolean | `false` | Disable the block if true. |
| `blockNode` | boolean | `false` | Make each tree node fill the remaining width of the row, so the whole row is clickable and highlighted. |
| `checkable` | boolean | `false` | Show checkboxes on the tree nodes. |
| `showLine` | boolean | `false` | Show a connecting line if true. |
| `selectable` | boolean | `true` | Selectable if true. |
| `defaultExpandAll` | boolean | `false` | Expand all tree nodes by default. |
| `height` | number | - | Height of the tree in pixels. When set, the tree scrolls and only renders the nodes in view, for large trees. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design tree tokens](https://ant.design/components/tree#design-token). |
| `theme.indentSize` | number | `24` | Indent width of each tree level. |
| `theme.nodeHoverBg` | string | `"rgba(0, 0, 0, 0.04)"` | Background color of a hovered tree node. |
| `theme.nodeHoverColor` | string | `"rgba(0, 0, 0, 0.88)"` | Text color of a hovered tree node. |
| `theme.nodeSelectedBg` | string | `"#e6f4ff"` | Background color of the selected tree node. |
| `theme.nodeSelectedColor` | string | `"rgba(0, 0, 0, 0.88)"` | Text color of the selected tree node. |
| `theme.switcherSize` | number | `24` | Width of the expand/collapse switcher. |
| `theme.titleHeight` | number | `24` | Height of a tree node title. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | `{ value }` | Trigger action when selection is changed. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The TreeInput element. |
| `/item` | Each tree node row. |
| `/itemSwitcher` | The expand/collapse switcher of each tree node. |
| `/itemTitle` | The title of each tree node. |

No slots defined.
