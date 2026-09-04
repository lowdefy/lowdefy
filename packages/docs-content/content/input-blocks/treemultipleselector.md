# TreeMultipleSelector

Searchable multiple-select tree dropdown (tags or checkboxes). Driven by flat `data`/`options` with `primaryKey`/`parentKey` for hierarchy.

```yaml
- id: basic_tree_multiple
  type: TreeMultipleSelector
  properties:
    title: Categories
    primaryKey: id
    parentKey: parentId
    valueKey: id
    html: "{{ item.label }}"
    treeDefaultExpandAll: true
    data:
      - id: 1
        label: Electronics
      - id: 2
        label: Phones
        parentId: 1
      - id: 3
        label: Laptops
        parentId: 1
      - id: 4
        label: Clothing
      - id: 5
        label: Shirts
        parentId: 4
      - id: 6
        label: Shoes
        parentId: 4
```

```yaml
basic_tree_multiple:
  _state: basic_tree_multiple
```

Selected:

```yaml
- id: checkable_tree_multiple
  type: TreeMultipleSelector
  properties:
    title: Permissions
    checkable: true
    showCheckedStrategy: SHOW_CHILD
    primaryKey: id
    parentKey: parentId
    valueKey: id
    html: "{{ item.label }}"
    treeDefaultExpandAll: true
    data:
      - id: 1
        label: Read
      - id: 2
        label: Write
      - id: 3
        label: Create
        parentId: 2
      - id: 4
        label: Update
        parentId: 2
      - id: 5
        label: Admin
  events:
    onChange:
      - id: capture
        type: SetState
        params:
          perms:
            _event: value
- id: checkable_tree_display
  type: Paragraph
  properties:
    content:
      _nunjucks:
        template: "Selected: {{ perms }}"
        on:
          _state: true
```

```yaml
- id: checkable_tree_multiple
  type: TreeMultipleSelector
  properties:
    title: Permissions
    checkable: true
    showCheckedStrategy: SHOW_CHILD
    primaryKey: id
    parentKey: parentId
    valueKey: id
    html: "{{ item.label }}"
    treeDefaultExpandAll: true
    data:
      - id: 1
        label: Read
      - id: 2
        label: Write
      - id: 3
        label: Create
        parentId: 2
      - id: 4
        label: Update
        parentId: 2
      - id: 5
        label: Admin
  events:
    onChange:
      - id: capture
        type: SetState
        params:
          perms:
            _event: value
- id: checkable_tree_display
  type: Paragraph
  properties:
    content:
      _nunjucks:
        template: "Selected: {{ perms }}"
        on:
          _state: true
```

```yaml
checkable_tree_multiple:
  _state: checkable_tree_multiple
checkable_tree_display:
  _state: checkable_tree_display
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
| `label` | object | - | Label properties. |
| `label.align` | string | `"left"` | Align label left or right when inline. Enum: `left`, `right`. |
| `label.colon` | boolean | `true` | Append label with colon. |
| `label.extra` | string | - | Extra text to display beneath the content - supports html. |
| `label.title` | string | - | Label title - supports html. |
| `label.tooltip` | string \| object | - | Help tooltip shown via an icon beside the label. A string sets the tooltip text (supports html), or an object to also customize the icon and color. Use the block's onTooltipClick event to respond to clicks on the icon. |
| `label.tooltip.title` | string | - | Tooltip text shown on hover - supports html. |
| `label.tooltip.icon` | string | `"AiOutlineQuestionCircle"` | Name of the icon to show beside the label. |
| `label.tooltip.color` | string | - | Color of the tooltip icon. |
| `label.span` | number | - | Label inline span. |
| `label.disabled` | boolean | `false` | Hide input label. |
| `label.hasFeedback` | boolean | `true` | Display feedback extra from validation, this does not disable validation. |
| `label.inline` | boolean | `false` | Render input and label inline. |
| `disabled` | boolean | `false` | Disable the block if true. |
| `autoFocus` | boolean | `false` | Autofocus to the block on page load. |
| `allowClear` | boolean | `true` | Allow the user to clear their input. |
| `bordered` | boolean | `true` | Whether or not the input has a border style. Deprecated, use variant instead. |
| `variant` | string | - | Input visual variant. When set, takes precedence over bordered. Enum: `outlined`, `filled`, `borderless`. |
| `size` | string | `"default"` | Size of the block. Enum: `small`, `default`, `large`. |
| `title` | string | - | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `placeholder` | string | `"Select items"` | Placeholder text inside the block before user types input. |
| `showSearch` | boolean | `true` | Make the tree searchable. |
| `treeDefaultExpandAll` | boolean | `false` | Expand all tree nodes by default. |
| `checkable` | boolean | `false` | Show checkboxes on the tree nodes instead of selectable tags. |
| `showCheckedStrategy` | string | `"SHOW_CHILD"` | How checked nodes are shown when `checkable` is true: SHOW_ALL (all checked), SHOW_PARENT (parent only), SHOW_CHILD (leaf children only). Enum: `SHOW_ALL`, `SHOW_PARENT`, `SHOW_CHILD`. |
| `maxTagCount` | number | - | Maximum number of selected tags shown before collapsing into a count. |
| `notFoundContent` | string | `"Not found"` | Content shown when no nodes match the search. |
| `suffixIcon` | string \| object | `"AiOutlineDown"` | Dropdown suffix icon. |
| `clearIcon` | string \| object | `"AiOutlineCloseCircle"` | Clear icon. |
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
| `onBlur` | \- | Trigger action when the selector loses focus. |
| `onChange` | `{ value: array }` | Trigger action when selection is changed. |
| `onFocus` | \- | Trigger action when the selector gains focus. |
| `onClear` | \- | Trigger action when the selector is cleared. |
| `onSearch` | `{ value: string }` | Trigger action when the search input changes. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The TreeMultipleSelector element. |
| `/label` | The TreeMultipleSelector label. |
| `/extra` | The TreeMultipleSelector extra content. |
| `/feedback` | The TreeMultipleSelector validation feedback. |
| `/suffixIcon` | The suffix icon in the TreeMultipleSelector. |
| `/clearIcon` | The clear icon in the TreeMultipleSelector. |

No slots defined.
