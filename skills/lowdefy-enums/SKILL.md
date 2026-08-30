---
name: lowdefy-enums
description: Use when a field takes one of a fixed set of values — defining the enum once, rendering selectors from it, and mapping values to labels and colours.
---

# Enums

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### Selector

`/lowdefy-docs/content/input-blocks/selector`

Dropdown selector with search, clear, and custom icons.

#### RadioSelector

`/lowdefy-docs/content/input-blocks/radioselector`

Radio group for selecting a single option.

#### _switch

`/lowdefy-docs/content/operators/_switch`

The `_switch` operator evaluates an array of conditions and returns the `then` argument of the first item for which the `if` argument evaluates to `true`. If no condition evaluates to `true`, the value of the `default` argument is returned.

#### _get

`/lowdefy-docs/content/operators/_get`

The `_get` operator gets a value from the object or array specified in `from`. If the `key` is not found, the provided `default`, or `null` if not specified, are returned.

### Blocks

Live schema: `lowdefy_get_schema` with kind `blocks`.

#### Selector

Provided by `@lowdefy/blocks-antd`. Category: `input`, value type: `any`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `allowClear` | boolean |  | `true` | Allow the user to clear the selected value, sets the value to null. |
| `autoFocus` | boolean |  | `false` | Autofocus to the block on page load. |
| `bordered` | boolean |  | `true` | Whether or not the selector has a border style. Deprecated, use variant instead. |
| `clearIcon` | string \\| object |  | `"AiOutlineCloseCircle"` | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon at far right position of the selector, shown when user is given option to clear input. |
| `label` | object |  |  | Label properties. |
| `disabled` | boolean |  | `false` | Disable the block if true. |
| `data` | array |  |  | Alternative to `options`: an array of raw rows. Each row is rendered to a label with the `html` template, and `valueKey` selects which field becomes the value. Use this to drive a selector directly from data without building label/value pairs in your request. |
| `html` | string |  |  | Nunjucks template that renders each option label when using `data`. The context exposes `item` (the current row) and `index` (the zero-based row index). Ignored when `options` is used. |
| `valueKey` | string |  |  | Field used as the selected value. With `options` it names the value field (defaults to "value"). With `data` it names the field stored when an option is selected; omit it to store the whole row. Supports dotted paths (e.g. "user.id"). |
| `primaryKey` | string |  |  | Field used to match the current value (e.g. set with SetState) back to an option for highlighting. Defaults to `valueKey`. Set this when the stored value is the whole row but a single field (e.g. "id") uniquely identifies it. In the tree selectors it also serves as each node’s id, referenced by `parentKey`. Supports dotted paths. |
| `options` | array \\| array \\| array \\| array |  | `[]` |  |
| `placeholder` | string |  | `"Select item"` | Placeholder text inside the block before user selects input. |
| `loadingPlaceholder` | string |  | `"Loading"` | Placeholder text to show in options while the block is loading. |
| `notFoundContent` | string |  | `"not Found"` | Placeholder text to show when list of options are empty. |
| `showArrow` | boolean |  | `true` | Show the suffix icon at the drop-down position of the selector. |
| `showSearch` | boolean |  | `true` | Make the selector options searchable. |
| `size` | `"small"`, `"default"`, `"large"` |  | `"default"` | Size of the block. |
| `suffixIcon` | string \\| object |  | `"AiOutlineDown"` | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon at the drop-down position of the selector. |
| `title` | string |  |  | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `variant` | `"solid"`, `"outlined"`, `"filled"`, `"borderless"` |  |  | Input variant. `solid` fills the whole input with the selected option color; `outlined` colors its border/text. `filled`/`borderless` are the antd input styles. |
| `theme` | object |  |  | Antd design token overrides for this block. See antd design tokens. |

##### Events

- `onBlur`: Trigger action event occurs when selector loses focus.
- `onChange`: Trigger action when selection is changed. Event payload: `value`.
- `onFocus`: Trigger action when selector gets focus.
- `onClear`: Trigger action when selector is cleared.
- `onSearch`: Trigger actions when input is changed. Event payload: `value`.
- `onTooltipClick`: Trigger actions when the tooltip icon is clicked.

##### Example

```yaml
- id: basic_selector
  type: Selector
  properties:
    title: Favorite Fruit
    options:
      - label: Apple
        value: apple
      - label: Banana
        value: banana
      - label: Cherry
        value: cherry
      - label: Dragonfruit
        value: dragonfruit
      - label: Elderberry
        value: elderberry
```

#### RadioSelector

Provided by `@lowdefy/blocks-antd`. Category: `input`, value type: `any`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `align` | `"start"`, `"end"`, `"center"`, `"baseline"` |  | `"start"` | Align options. Ignored when 'columns' is set. |
| `color` | string |  |  | Selected radio color. |
| `columns` | integer \\| object |  |  | Number of columns to lay the options out in, or a responsive breakpoint object. Use a count that divides 24 evenly. |
| `disabled` | boolean |  | `false` | Disable the block if true. |
| `direction` | `"horizontal"`, `"vertical"` |  | `"horizontal"` | List options horizontally or vertical. Ignored when 'columns' is set. |
| `gutter` | number \\| array |  |  | Gap between options in the grid. Number or [horizontal, vertical] array. Applies when 'columns' is set. |
| `wrap` | boolean |  | `true` | Specifies wrapping of options. Applies when 'direction' is 'horizontal'. Ignored when 'columns' is set. |
| `label` | object |  |  | Label properties. |
| `options` | array \\| array \\| array \\| array |  | `[]` |  |
| `data` | array |  |  | Alternative to `options`: an array of raw rows. Each row is rendered to a label with the `html` template, and `valueKey` selects which field becomes the value. Use this to drive a selector directly from data without building label/value pairs in your request. |
| `html` | string |  |  | Nunjucks template that renders each option label when using `data`. The context exposes `item` (the current row) and `index` (the zero-based row index). Ignored when `options` is used. |
| `valueKey` | string |  |  | Field used as the selected value. With `options` it names the value field (defaults to "value"). With `data` it names the field stored when an option is selected; omit it to store the whole row. Supports dotted paths (e.g. "user.id"). |
| `primaryKey` | string |  |  | Field used to match the current value (e.g. set with SetState) back to an option for highlighting. Defaults to `valueKey`. Set this when the stored value is the whole row but a single field (e.g. "id") uniquely identifies it. In the tree selectors it also serves as each node’s id, referenced by `parentKey`. Supports dotted paths. |
| `title` | string |  |  | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `theme` | object |  |  | Antd design token overrides for this block. See antd design tokens. |

##### Events

- `onChange`: Trigger action when selection is changed. Event payload: `value`.
- `onTooltipClick`: Trigger actions when the tooltip icon is clicked.

##### Example

```yaml
- id: basic_label_value
  type: RadioSelector
  properties:
    title: Favorite Color
    options:
      - label: Red
        value: red
      - label: Green
        value: green
      - label: Blue
        value: blue
      - label: Yellow
        value: yellow
```

#### Tag

Provided by `@lowdefy/blocks-antd`. Category: `display`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `closable` | boolean |  | `false` | Allow tag to be closed. |
| `color` | string |  |  | Color of the Tag. Preset options are success, processing, error, warning, default, blue, cyan, geekblue, gold, green, lime, magenta, orange, purple, red, volcano, or alternatively any hex color. |
| `title` | string |  |  | Content title of tag - supports html. |
| `icon` | string \\| object |  |  | Name of an Ant Design Icon or properties of an Icon block to customize alert icon. |
| `theme` | object |  |  | Antd design token overrides for this block. See antd design tokens. |

##### Events

- `onClick`: Called when Tag is clicked. Renders a shortcut badge when a shortcut is configured.
- `onClose`: Called when Tag close icon is clicked.

##### Example

```yaml
- id: title_simple
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: Feature
```

### Operators

Live schema: `lowdefy_get_schema` with kind `operators`.

#### _switch

Provided by `@lowdefy/operators-js`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `branches` | array | yes |  | Array of conditional branches. |
| `default` | any |  |  | Value returned when no branch matches. |

#### _get

Provided by `@lowdefy/operators-js`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `from` | any | yes |  | Object or array to get value from. |
| `key` | string |  |  | Dot-notation path to the value. |
| `default` | any |  |  | Default value if key does not exist. |
| `all` | boolean |  |  | Return all matching values. |
<!-- generated:reference:end -->

## Recipe

Must cover: one `enums/<name>.yaml` file loaded with `_ref`, `options` with `{ value, label }`, `_get` on a lookup object for labels, `_switch` for colours, and validating a saved value is in the enum.
