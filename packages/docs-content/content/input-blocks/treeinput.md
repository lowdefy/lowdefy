# TreeInput

Inline tree with nested options and checkboxes. (Renamed from `TreeSelector`.)

Selected: —

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
tree_basic:
  _state: tree_basic
tree_basic_display:
  _state: tree_basic_display
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
tree_line:
  _state: tree_line
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
tree_options:
  _state: tree_options
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
| `checkable` | boolean | `false` | Show checkboxes on the tree nodes. |
| `showLine` | boolean | `false` | Show a connecting line if true. |
| `selectable` | boolean | `true` | Selectable if true. |
| `defaultExpandAll` | boolean | `false` | Expand all tree nodes by default. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design tree-select tokens](https://ant.design/components/tree-select#design-token). |
| `theme.nodeSelectedBg` | string | - | Background color of selected tree node. |
| `theme.nodeHoverBg` | string | - | Background color of hovered tree node. |
| `theme.titleHeight` | number | `24` | Height of tree node title. |
| `theme.clearBg` | string | - | Background color of clear button. |
| `theme.selectorBg` | string | - | Background color of the selector. |
| `theme.hoverBorderColor` | string | - | Border color when hovered. |
| `theme.activeBorderColor` | string | - | Border color when active/focused. |
| `theme.activeOutlineColor` | string | - | Outline color when active/focused. |
| `theme.optionSelectedBg` | string | - | Background of selected option. |
| `theme.optionSelectedColor` | string | - | Text color of selected option. |
| `theme.optionSelectedFontWeight` | string | - | Font weight of selected option. |
| `theme.optionActiveBg` | string | - | Background of active (hovered) option. |
| `theme.optionFontSize` | number | `14` | Font size of options. |
| `theme.optionHeight` | number | `32` | Height of each option. |
| `theme.optionLineHeight` | string | - | Line height of options. |
| `theme.optionPadding` | string | - | Padding of options. |
| `theme.multipleSelectorBgDisabled` | string | - | Background when disabled in multiple mode. |
| `theme.multipleItemBg` | string | - | Background of tag items in multiple mode. |
| `theme.multipleItemBorderColor` | string | - | Border color of tag items. |
| `theme.multipleItemHeight` | number | `24` | Height of tag items. |
| `theme.multipleItemHeightSM` | number | `16` | Height of tag items (small). |
| `theme.multipleItemHeightLG` | number | `32` | Height of tag items (large). |
| `theme.zIndexPopup` | number | `1050` | z-index of the dropdown. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | `{ value: any }` | Trigger action when selection is changed. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The TreeInput element. |

No slots defined.
