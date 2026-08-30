---
name: lowdefy-status-fields
description: Use when showing a boolean or status value at a glance — tags, badges, switches, statistics, and consistent colour mapping.
---

# Status fields

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### Tag

`/lowdefy-docs/content/display-blocks/tag`

Tag with preset and custom colors, icons, and closable option.

#### Statistic

`/lowdefy-docs/content/display-blocks/statistic`

Statistic display with prefix, suffix, and formatting.

#### Switch

`/lowdefy-docs/content/input-blocks/switch`

Toggle switch with optional text and icon labels.

### Blocks

Live schema: `lowdefy_get_schema` with kind `blocks`.

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

#### Badge

Provided by `@lowdefy/blocks-antd`. Category: `container`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `color` | string |  |  | Customize Badge dot color. |
| `count` | number \\| string |  |  | Text to show in badge. |
| `dot` | boolean |  | `false` | Whether to display a red dot instead of count. |
| `size` | `"default"`, `"small"` |  | `"default"` | Sets the size of badge if count is set. |
| `icon` | string \\| object |  |  | Name of an React-Icon (See all icons) or properties of an Icon block to use an icon in badge. |
| `offset` | array |  |  | Set offset of the badge dot, array of numbers for x and y offset ([x,y]). |
| `overflowCount` | number |  | `99` | Max count to show |
| `showZero` | boolean |  | `false` | Whether to show badge when count is zero. |
| `status` | `"success"`, `"processing"`, `"default"`, `"error"`, `"warning"` |  | `null` | Set Badge as a status dot. |
| `text` | string |  |  | If status is set, text sets the display text of the status dot. |
| `title` | string |  |  | Text to show when hovering over the badge. |
| `theme` | object |  |  | Antd design token overrides for this block. See antd design tokens. |

##### Events

_No events._

##### Example

```yaml
- id: basic_count_5
  type: Badge
  layout:
    flex: 0 0 auto
  properties:
    count: 5
  blocks:
    - id: basic_count_5_child
      type: Avatar
      properties:
        shape: square
        content: U
```

#### Statistic

Provided by `@lowdefy/blocks-antd`. Category: `display`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `decimalSeparator` | string |  | `"."` | Decimal separator. |
| `groupSeparator` | string |  | `","` | Group separator. |
| `loading` | boolean |  | `false` | Control the loading status of Statistic. |
| `precision` | number |  |  | Number of decimals to display. |
| `prefix` | string |  |  | Prefix text, priority over prefixIcon. |
| `prefixIcon` | string \\| object |  |  | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon which prefix the statistic. |
| `suffix` | string |  |  | Suffix text, priority over suffixIcon. |
| `suffixIcon` | string \\| object |  |  | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon which suffix the statistic. |
| `title` | string |  |  | Title to describe the component - supports html. |
| `value` | number \\| string |  |  |  |
| `theme` | object |  |  | Antd design token overrides for this block. See antd design tokens. |

##### Events

_No events._

##### Example

```yaml
- id: value_number
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Active Users
    value: 112893
```

#### Switch

Provided by `@lowdefy/blocks-antd`. Category: `input`, value type: `boolean`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `autoFocus` | boolean |  | `false` | Autofocus to the block on page load. |
| `checkedIcon` | string \\| object |  | `"AiOutlineCheck"` | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon to shown when switch is checked (true). |
| `checkedText` | string |  |  | Text to shown when switch is checked (true). |
| `color` | string |  |  | Switch checked color. |
| `disabled` | boolean |  | `false` | Disable the block if true. |
| `label` | object |  |  | Label properties. |
| `size` | `"small"`, `"default"` |  | `"default"` | Size of the block. |
| `title` | string |  |  | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `uncheckedIcon` | string \\| object |  | `"AiOutlineClose"` | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon to shown when switch is unchecked (false). |
| `uncheckedText` | string |  |  | Text to shown when switch is not checked (false). |
| `theme` | object |  |  | Antd design token overrides for this block. See antd design tokens. |

##### Events

- `onChange`: Trigger action when switch is changed. Event payload: `value`.
- `onTooltipClick`: Trigger actions when the tooltip icon is clicked.

##### Example

```yaml
- id: basic_default
  type: Switch
  properties:
    title: Default Switch
    label:
      disabled: true
```

### Operators

Live schema: `lowdefy_get_schema` with kind `operators`.

#### _if

Provided by `@lowdefy/operators-js`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `test` | boolean | yes |  | Boolean condition to evaluate. |
| `then` | any |  |  | Value returned when test is true. |
| `else` | any |  |  | Value returned when test is false. |

#### _switch

Provided by `@lowdefy/operators-js`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `branches` | array | yes |  | Array of conditional branches. |
| `default` | any |  |  | Value returned when no branch matches. |
<!-- generated:reference:end -->

## Recipe

Must cover: `Tag` for enum values, `Badge` for counts, `Switch` for booleans (read-only with `disabled`), `Statistic` for numbers, and a shared colour mapping loaded with `_ref`.
