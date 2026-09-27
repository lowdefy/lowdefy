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
- id: check_strictly_tree_multiple
  type: TreeMultipleSelector
  properties:
    title: Folders (parents check on their own)
    checkable: true
    checkStrictly: true
    treeDefaultExpandAll: true
    primaryKey: id
    parentKey: parentId
    valueKey: id
    html: "{{ item.label }}"
    data:
      - id: 1
        label: Projects
      - id: 2
        label: Website
        parentId: 1
      - id: 3
        label: Mobile App
        parentId: 1
      - id: 4
        label: Archive
- id: max_count_tree_multiple
  type: TreeMultipleSelector
  properties:
    title: Pick Up to 2 Teams
    maxCount: 2
    maxTagCount: responsive
    treeDefaultExpandAll: true
    primaryKey: id
    parentKey: parentId
    valueKey: id
    html: "{{ item.label }}"
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
        label: Sales
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
| `label.xs` | object | - | Label width on extra small screens (below 576px) when the label is not inline. |
| `label.xs.span` | number | - | Label width in columns, out of 24. The content takes the remaining columns. |
| `label.sm` | object | - | Label width on small screens (576px and up) when the label is not inline. Also applies below 576px unless `xs` is set. |
| `label.sm.span` | number | - | Label width in columns, out of 24. The content takes the remaining columns. |
| `label.md` | object | - | Label width on medium screens (768px and up) when the label is not inline. Overrides `span`. |
| `label.md.span` | number | - | Label width in columns, out of 24. The content takes the remaining columns. |
| `label.lg` | object | - | Label width on large screens (992px and up) when the label is not inline. |
| `label.lg.span` | number | - | Label width in columns, out of 24. The content takes the remaining columns. |
| `label.xl` | object | - | Label width on extra large screens (1200px and up) when the label is not inline. |
| `label.xl.span` | number | - | Label width in columns, out of 24. The content takes the remaining columns. |
| `label.xxl` | object | - | Label width on extra extra large screens (1600px and up) when the label is not inline. |
| `label.xxl.span` | number | - | Label width in columns, out of 24. The content takes the remaining columns. |
| `label.align` | string | `"left"` | Align label left or right when inline. Enum: `left`, `right`. |
| `label.colon` | boolean | `true` | Append label with colon. |
| `label.extra` | string | - | Extra text to display beneath the content - supports html. |
| `label.title` | string | - | Label title - supports html. |
| `label.tooltip` | string \| object | - | Help tooltip shown via an icon beside the label. A string sets the tooltip text (supports html), or an object to also customize the icon and color. Use the block's onTooltipClick event to respond to clicks on the icon. |
| `label.tooltip.title` | string | - | Tooltip text shown on hover - supports html. |
| `label.tooltip.icon` | string | `"help"` | Icon name to show beside the label: a semantic name like `help`, a Lucide icon name like `CircleQuestionMark`, or a set-qualified name like `tabler:HelpCircle`. |
| `label.tooltip.color` | string | - | Color of the tooltip icon. |
| `label.span` | number | - | Label width in columns, out of 24, on medium screens (768px) and up when the label is not inline. The content takes the remaining columns. |
| `label.disabled` | boolean | `false` | Hide input label. |
| `label.hasFeedback` | boolean | `true` | Display feedback extra from validation, this does not disable validation. |
| `label.inline` | boolean | `false` | Render input and label inline. |
| `label.wrap` | boolean | `false` | Wrap long label text onto multiple lines when the label is inline. Labels above their input always wrap. |
| `disabled` | boolean | `false` | Disable the block if true. |
| `autoFocus` | boolean | `false` | Autofocus to the block on page load. |
| `allowClear` | boolean | `true` | Allow the user to clear their input. |
| `bordered` | boolean | `true` | Whether or not the input has a border style. Deprecated, use variant instead. |
| `variant` | string | - | Input visual variant. The deprecated bordered: false takes precedence and renders the input as 'borderless'. Enum: `outlined`, `filled`, `borderless`, `underlined`. |
| `size` | string | `"default"` | Size of the block. Enum: `small`, `default`, `large`. |
| `title` | string | - | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `listHeight` | number | `256` | Height of the dropdown list in pixels. |
| `placement` | string | `"bottomLeft"` | Position of the dropdown relative to the selector. Enum: `bottomLeft`, `bottomRight`, `topLeft`, `topRight`. |
| `popupMatchSelectWidth` | boolean \| number | `true` | Make the dropdown the same width as the selector. Set a number of pixels for a fixed dropdown width, or false to size the dropdown to its options (this also turns off virtual scrolling). |
| `prefix` | string | - | Text shown inside the selector before the selected value. |
| `prefixIcon` | string \| object | - | Icon name (a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`) or properties of an Icon block to show inside the selector before the selected value. Ignored when `prefix` is set. |
| `prefixIcon.name` | string | - | Icon name: a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`. |
| `prefixIcon.color` | string | - | Icon color. |
| `prefixIcon.size` | string \| number | - | Size of the icon. Defaults to `theme.icons.size`. |
| `prefixIcon.rotate` | number | - | Number of degrees to rotate the icon. |
| `prefixIcon.spin` | boolean | - | Continuously spin the icon with animation. |
| `prefixIcon.strokeWidth` | number | - | Stroke width of the icon lines, in pixels of the 24px icon grid. Defaults to `theme.icons.strokeWidth` (2). |
| `prefixIcon.nonScalingStroke` | boolean | - | Keep the stroke width constant at any icon size. Defaults to `theme.icons.nonScalingStroke`. |
| `prefixIcon.title` | string | - | Icon hover title for accessibility. An empty string marks the icon as decorative. |
| `prefixIcon.disableLoadingIcon` | boolean | - | While loading after the icon has been clicked, don't render the loading icon. |
| `virtual` | boolean | `true` | Only render the dropdown options in view. Set to false when options have very different heights, or so screen readers can reach every option. |
| `placeholder` | string | `"Select items"` | Placeholder text inside the block before user types input. |
| `showSearch` | boolean | `true` | Make the tree searchable. |
| `treeDefaultExpandAll` | boolean | `false` | Expand all tree nodes by default. |
| `treeExpandAction` | string | - | Expand or collapse a node by clicking or double-clicking its title. When not set, nodes only expand with the switcher. Enum: `click`, `doubleClick`. |
| `treeLine` | boolean | `false` | Show connecting lines between tree nodes. |
| `autoClearSearchValue` | boolean | `true` | Whether the current search will be cleared on selecting an item. |
| `checkable` | boolean | `false` | Show checkboxes on the tree nodes instead of selectable tags. |
| `checkStrictly` | boolean | `false` | When `checkable` is true, check nodes independently: checking a parent does not check its children, and checking every child does not check the parent. |
| `showCheckedStrategy` | string | `"SHOW_CHILD"` | How checked nodes are shown when `checkable` is true: SHOW_ALL (all checked), SHOW_PARENT (parent only), SHOW_CHILD (leaf children only). Enum: `SHOW_ALL`, `SHOW_PARENT`, `SHOW_CHILD`. |
| `maxCount` | number | - | Maximum number of options that can be selected. Once reached, the remaining options are disabled. |
| `maxTagCount` | number \| string | - | Maximum number of selected tags shown before the rest collapse into a count. Set to 'responsive' to fit as many tags as the input width allows. |
| `notFoundContent` | string | `"Not found"` | Content shown when no nodes match the search. |
| `suffixIcon` | string \| object | `"chevron-down"` | Dropdown suffix icon. |
| `suffixIcon.name` | string | - | Icon name: a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`. |
| `suffixIcon.color` | string | - | Icon color. |
| `suffixIcon.size` | string \| number | - | Size of the icon. Defaults to `theme.icons.size`. |
| `suffixIcon.rotate` | number | - | Number of degrees to rotate the icon. |
| `suffixIcon.spin` | boolean | - | Continuously spin the icon with animation. |
| `suffixIcon.strokeWidth` | number | - | Stroke width of the icon lines, in pixels of the 24px icon grid. Defaults to `theme.icons.strokeWidth` (2). |
| `suffixIcon.nonScalingStroke` | boolean | - | Keep the stroke width constant at any icon size. Defaults to `theme.icons.nonScalingStroke`. |
| `suffixIcon.title` | string | - | Icon hover title for accessibility. An empty string marks the icon as decorative. |
| `suffixIcon.disableLoadingIcon` | boolean | - | While loading after the icon has been clicked, don't render the loading icon. |
| `clearIcon` | string \| object | `"clear"` | Clear icon. |
| `clearIcon.name` | string | - | Icon name: a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`. |
| `clearIcon.color` | string | - | Icon color. |
| `clearIcon.size` | string \| number | - | Size of the icon. Defaults to `theme.icons.size`. |
| `clearIcon.rotate` | number | - | Number of degrees to rotate the icon. |
| `clearIcon.spin` | boolean | - | Continuously spin the icon with animation. |
| `clearIcon.strokeWidth` | number | - | Stroke width of the icon lines, in pixels of the 24px icon grid. Defaults to `theme.icons.strokeWidth` (2). |
| `clearIcon.nonScalingStroke` | boolean | - | Keep the stroke width constant at any icon size. Defaults to `theme.icons.nonScalingStroke`. |
| `clearIcon.title` | string | - | Icon hover title for accessibility. An empty string marks the icon as decorative. |
| `clearIcon.disableLoadingIcon` | boolean | - | While loading after the icon has been clicked, don't render the loading icon. |
| `removeIcon` | string \| object | `"close"` | Icon name (a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`) or properties of an Icon block to customize the remove icon on each selected tag. |
| `removeIcon.name` | string | - | Icon name: a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`. |
| `removeIcon.color` | string | - | Icon color. |
| `removeIcon.size` | string \| number | - | Size of the icon. Defaults to `theme.icons.size`. |
| `removeIcon.rotate` | number | - | Number of degrees to rotate the icon. |
| `removeIcon.spin` | boolean | - | Continuously spin the icon with animation. |
| `removeIcon.strokeWidth` | number | - | Stroke width of the icon lines, in pixels of the 24px icon grid. Defaults to `theme.icons.strokeWidth` (2). |
| `removeIcon.nonScalingStroke` | boolean | - | Keep the stroke width constant at any icon size. Defaults to `theme.icons.nonScalingStroke`. |
| `removeIcon.title` | string | - | Icon hover title for accessibility. An empty string marks the icon as decorative. |
| `removeIcon.disableLoadingIcon` | boolean | - | While loading after the icon has been clicked, don't render the loading icon. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design tree-select tokens](https://ant.design/components/tree-select#design-token). |
| `theme.indentSize` | number | `24` | Indent width of each tree level. |
| `theme.nodeHoverBg` | string | `"rgba(0, 0, 0, 0.04)"` | Background color of a hovered tree node. |
| `theme.nodeHoverColor` | string | `"rgba(0, 0, 0, 0.88)"` | Text color of a hovered tree node. |
| `theme.nodeSelectedBg` | string | `"#e6f4ff"` | Background color of the selected tree node. |
| `theme.nodeSelectedColor` | string | `"rgba(0, 0, 0, 0.88)"` | Text color of the selected tree node. |
| `theme.switcherSize` | number | `24` | Width of the expand/collapse switcher. |
| `theme.titleHeight` | number | `24` | Height of a tree node title. |
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
| `onChange` | `{ value }` | Trigger action when selection is changed. |
| `onFocus` | \- | Trigger action when the selector gains focus. |
| `onClear` | \- | Trigger action when the selector is cleared. |
| `onOpenChange` | `{ open }` | Trigger actions when the dropdown opens or closes. |
| `onSearch` | `{ value }` | Trigger action when the search input changes. |
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
| `/popup` | The TreeMultipleSelector dropdown popup. |
| `/prefixIcon` | The prefix icon in the TreeMultipleSelector. |
| `/removeIcon` | The remove icon on each selected tag in the TreeMultipleSelector. |
| `/selector` | The inner value/tag container of the TreeMultipleSelector (antd `content` semantic slot). |

No slots defined.
