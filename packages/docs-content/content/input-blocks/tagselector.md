# TagSelector

Single-select input rendered as a row of toggleable, colored tag pills.

```yaml
- id: basic_strings
  type: TagSelector
  properties:
    title: Domain
    options:
      - Ethics
      - Environment
      - Governance
      - Social
      - Data Privacy
```

```yaml
basic_strings:
  _state: basic_strings
```

```yaml
- id: label_value
  type: TagSelector
  properties:
    title: Status
    options:
      - label: Draft
        value: draft
      - label: In Review
        value: in_review
      - label: Published
        value: published
      - label: Archived
        value: archived
        disabled: true
```

```yaml
label_value:
  _state: label_value
```

```yaml
- id: explicit_colors
  type: TagSelector
  properties:
    title: Priority
    options:
      - label: Low
        value: low
        color: "#59A14F"
      - label: Medium
        value: medium
        color: "#EDC948"
      - label: High
        value: high
        color: "#E15759"
- id: single_accent
  type: TagSelector
  properties:
    title: Interest
    colored: false
    options:
      - Design
      - Engineering
      - Product
      - Research
```

```yaml
explicit_colors:
  _state: explicit_colors
single_accent:
  _state: single_accent
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `options` | array | - | Options to select from. Primitives, or { label, value, color, disabled } - an explicit color overrides the stable palette color. |
| `options.$.label` | string | - | Tag label. Defaults to the value. |
| `options.$.value` | - | - | Option value set as the selection when the tag is selected. |
| `options.$.color` | string | - | Explicit tag color (hex or CSS color). Overrides the stable palette color. |
| `options.$.disabled` | boolean | `false` | Disable this tag. |
| `colored` | boolean | `true` | Give each option a stable color (hash of its value over a fixed palette). false = single primary accent. |
| `disabled` | boolean | `false` | Disable the block if true. |
| `size` | string | `"default"` | Size of the block. Enum: `small`, `default`, `large`. |
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
| `title` | string | - | Title to describe the input component, if no title is specified the block id is displayed - supports html. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | `{ value: any }` | Trigger actions when the selection is changed. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The TagSelector tag row. |
| `/tag` | Each tag pill. |
| `/label` | The TagSelector label. |
| `/extra` | The TagSelector extra content. |
| `/feedback` | The TagSelector validation feedback. |

No slots defined.
