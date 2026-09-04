# CheckboxSelector

Checkbox group for selecting multiple options.

```yaml
- id: basic_label_value
  type: CheckboxSelector
  properties:
    title: Select Toppings
    options:
      - label: Cheese
        value: cheese
      - label: Pepperoni
        value: pepperoni
      - label: Mushrooms
        value: mushrooms
      - label: Onions
        value: onions
      - label: Peppers
        value: peppers
- id: basic_string_options
  type: CheckboxSelector
  properties:
    title: Hobbies
    options:
      - Reading
      - Cooking
      - Hiking
      - Gaming
      - Music
```

```yaml
basic_label_value:
  _state: basic_label_value
basic_string_options:
  _state: basic_string_options
```

```yaml
- id: horizontal_default
  type: CheckboxSelector
  properties:
    title: Horizontal (Default)
    direction: horizontal
    options:
      - label: Frontend
        value: frontend
      - label: Backend
        value: backend
      - label: DevOps
        value: devops
      - label: Design
        value: design
      - label: QA
        value: qa
      - label: Product
        value: product
```

```yaml
horizontal_default:
  _state: horizontal_default
```

```yaml
- id: vertical_checkbox
  type: CheckboxSelector
  properties:
    title: Vertical Layout
    direction: vertical
    options:
      - label: Email notifications
        value: email
      - label: SMS notifications
        value: sms
      - label: Push notifications
        value: push
      - label: In-app notifications
        value: in_app
```

```yaml
vertical_checkbox:
  _state: vertical_checkbox
```

```yaml
- id: wrap_enabled
  type: CheckboxSelector
  properties:
    title: Wrap Enabled (Default)
    direction: horizontal
    wrap: true
    options:
      - JavaScript
      - TypeScript
      - Python
      - Go
      - Rust
      - Java
      - C++
      - Ruby
      - Swift
      - Kotlin
      - PHP
      - Scala
- id: wrap_disabled
  type: CheckboxSelector
  properties:
    title: Wrap Disabled
    direction: horizontal
    wrap: false
    options:
      - JavaScript
      - TypeScript
      - Python
      - Go
      - Rust
      - Java
      - C++
      - Ruby
```

```yaml
wrap_enabled:
  _state: wrap_enabled
wrap_disabled:
  _state: wrap_disabled
```

```yaml
- id: align_start
  type: CheckboxSelector
  properties:
    title: Start Alignment
    align: start
    options:
      - Apple
      - Banana
      - Cherry
- id: align_center
  type: CheckboxSelector
  properties:
    title: Center Alignment
    align: center
    options:
      - Apple
      - Banana
      - Cherry
- id: align_end
  type: CheckboxSelector
  properties:
    title: End Alignment
    align: end
    options:
      - Apple
      - Banana
      - Cherry
- id: align_baseline
  type: CheckboxSelector
  properties:
    title: Baseline Alignment
    align: baseline
    options:
      - Apple
      - Banana
      - Cherry
```

```yaml
align_start:
  _state: align_start
align_center:
  _state: align_center
align_end:
  _state: align_end
align_baseline:
  _state: align_baseline
```

```yaml
- id: color_green
  type: CheckboxSelector
  properties:
    title: Green Checkboxes
    color: "#52c41a"
    options:
      - label: Lettuce
        value: lettuce
      - label: Spinach
        value: spinach
      - label: Broccoli
        value: broccoli
- id: color_orange
  type: CheckboxSelector
  properties:
    title: Orange Checkboxes
    color: "#fa8c16"
    options:
      - label: Carrot
        value: carrot
      - label: Pumpkin
        value: pumpkin
      - label: Sweet Potato
        value: sweet_potato
- id: color_purple
  type: CheckboxSelector
  properties:
    title: Purple Checkboxes
    color: "#722ed1"
    options:
      - label: Eggplant
        value: eggplant
      - label: Grape
        value: grape
      - label: Plum
        value: plum
- id: color_red
  type: CheckboxSelector
  properties:
    title: Red Checkboxes
    color: "#f5222d"
    options:
      - label: Tomato
        value: tomato
      - label: Strawberry
        value: strawberry
      - label: Cherry
        value: cherry
- id: color_hex_custom
  type: CheckboxSelector
  properties:
    title: Custom Hex Color
    color: "#e64980"
    options:
      - label: Pink option A
        value: a
      - label: Pink option B
        value: b
      - label: Pink option C
        value: c
```

```yaml
color_green:
  _state: color_green
color_orange:
  _state: color_orange
color_purple:
  _state: color_purple
color_red:
  _state: color_red
color_hex_custom:
  _state: color_hex_custom
```

```yaml
- id: disabled_all
  type: CheckboxSelector
  properties:
    title: All Disabled
    disabled: true
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
```

```yaml
disabled_all:
  _state: disabled_all
```

```yaml
- id: disabled_some
  type: CheckboxSelector
  properties:
    title: Some Options Disabled
    options:
      - label: Available
        value: available
      - label: Sold Out
        value: sold_out
        disabled: true
      - label: In Stock
        value: in_stock
      - label: Backordered
        value: backordered
        disabled: true
      - label: Pre-order
        value: pre_order
```

```yaml
disabled_some:
  _state: disabled_some
```

```yaml
- id: styled_options
  type: CheckboxSelector
  properties:
    title: Options with Custom Styles
    options:
      - label: High Priority
        value: high
        style:
          color: "#f5222d"
          fontWeight: bold
      - label: Medium Priority
        value: medium
        style:
          color: "#fa8c16"
          fontWeight: 500
      - label: Low Priority
        value: low
        style:
          color: "#52c41a"
- id: styled_background
  type: CheckboxSelector
  properties:
    title: Options with Backgrounds
    options:
      - label: Success
        value: success
        style:
          padding: 2px 8px
          borderRadius: 4
      - label: Warning
        value: warning
        style:
          padding: 2px 8px
          borderRadius: 4
      - label: Error
        value: error
        style:
          padding: 2px 8px
          borderRadius: 4
```

```yaml
styled_options:
  _state: styled_options
styled_background:
  _state: styled_background
```

```yaml
- id: html_labels
  type: CheckboxSelector
  properties:
    title: HTML in Labels
    options:
      - label: <b>Bold</b> option
        value: bold
      - label: <i>Italic</i> option
        value: italic
      - label: '<span style="color: #1677ff">Blue</span> option'
        value: blue
      - label: Option with <code>code</code>
        value: code
```

```yaml
html_labels:
  _state: html_labels
```

```yaml
- id: number_options
  type: CheckboxSelector
  properties:
    title: Numeric Options
    options:
      - label: One
        value: 1
      - label: Two
        value: 2
      - label: Three
        value: 3
      - label: Four
        value: 4
- id: boolean_options
  type: CheckboxSelector
  properties:
    title: Boolean Options
    options:
      - label: Yes
        value: true
      - label: No
        value: false
```

```yaml
number_options:
  _state: number_options
boolean_options:
  _state: boolean_options
```

```yaml
- id: label_default
  type: CheckboxSelector
  properties:
    title: Default Label
    options:
      - Red
      - Green
      - Blue
- id: label_with_colon
  type: CheckboxSelector
  properties:
    title: Pick a Color
    label:
      colon: true
    options:
      - Red
      - Green
      - Blue
- id: label_no_colon
  type: CheckboxSelector
  properties:
    title: Pick a Color
    label:
      colon: false
    options:
      - Red
      - Green
      - Blue
- id: label_with_extra
  type: CheckboxSelector
  properties:
    title: Select Sizes
    label:
      extra: Select all sizes that apply.
    options:
      - Small
      - Medium
      - Large
      - Extra Large
- id: label_right_aligned
  type: CheckboxSelector
  properties:
    title: Right Aligned Label
    label:
      align: right
      inline: true
      span: 8
    options:
      - Option A
      - Option B
      - Option C
```

```yaml
label_default:
  _state: label_default
label_with_colon:
  _state: label_with_colon
label_no_colon:
  _state: label_no_colon
label_with_extra:
  _state: label_with_extra
label_right_aligned:
  _state: label_right_aligned
```

```yaml
- id: label_inline
  type: CheckboxSelector
  properties:
    title: Inline Label
    label:
      inline: true
      span: 6
    options:
      - Cat
      - Dog
      - Bird
- id: label_inline_wide
  type: CheckboxSelector
  properties:
    title: Wide Inline Label
    label:
      inline: true
      span: 10
    options:
      - Cat
      - Dog
      - Bird
```

```yaml
label_inline:
  _state: label_inline
label_inline_wide:
  _state: label_inline_wide
```

```yaml
- id: no_label
  type: CheckboxSelector
  properties:
    label:
      disabled: true
    options:
      - label: I agree to the Terms of Service
        value: tos
      - label: I want to receive marketing emails
        value: marketing
      - label: I agree to the Privacy Policy
        value: privacy
```

```yaml
no_label:
  _state: no_label
```

```yaml
- id: label_feedback_on
  type: CheckboxSelector
  properties:
    title: Feedback Enabled (Default)
    label:
      hasFeedback: true
    options:
      - Option A
      - Option B
      - Option C
- id: label_feedback_off
  type: CheckboxSelector
  properties:
    title: Feedback Disabled
    label:
      hasFeedback: false
    options:
      - Option A
      - Option B
      - Option C
```

```yaml
label_feedback_on:
  _state: label_feedback_on
label_feedback_off:
  _state: label_feedback_off
```

```yaml
- id: vertical_mixed_disabled
  type: CheckboxSelector
  properties:
    title: Feature Flags
    direction: vertical
    options:
      - label: Dark Mode
        value: dark_mode
      - label: Beta Features
        value: beta
      - label: Analytics (Coming Soon)
        value: analytics
        disabled: true
      - label: Custom Themes
        value: custom_themes
      - label: AI Assistant (Coming Soon)
        value: ai_assistant
        disabled: true
```

```yaml
vertical_mixed_disabled:
  _state: vertical_mixed_disabled
```

```yaml
- id: many_options_wrap
  type: CheckboxSelector
  properties:
    title: Select Countries
    direction: horizontal
    wrap: true
    options:
      - USA
      - Canada
      - Mexico
      - Brazil
      - UK
      - France
      - Germany
      - Italy
      - Spain
      - Japan
      - China
      - India
      - Australia
      - South Africa
      - Egypt
```

```yaml
many_options_wrap:
  _state: many_options_wrap
```

```yaml
- id: custom_style
  type: CheckboxSelector
  properties:
    title: Styled Container
    options:
      - Alpha
      - Beta
      - Gamma
  style:
    .element:
      padding: 12
      borderRadius: 8
      border: "1px solid #d9d9d9"
- id: custom_class
  type: CheckboxSelector
  class: p-4 bg-bg-layout rounded-lg
  properties:
    title: Tailwind Styled
    options:
      - Alpha
      - Beta
      - Gamma
```

```yaml
custom_style:
  _state: custom_style
custom_class:
  _state: custom_class
```

```yaml
- id: theme_large_checkbox
  type: CheckboxSelector
  properties:
    title: Large Checkbox (controlInteractiveSize)
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
    theme:
      controlInteractiveSize: 24
- id: theme_custom_colors
  type: CheckboxSelector
  properties:
    title: Custom Primary Color via Theme
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
    theme:
      colorPrimary: "#eb2f96"
- id: theme_custom_border
  type: CheckboxSelector
  properties:
    title: Custom Border via Theme
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
    theme:
      colorBorder: "#d48806"
      lineWidth: 2
      borderRadiusSM: 6
- id: theme_combined
  type: CheckboxSelector
  properties:
    title: Combined Token Overrides
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
    theme:
      colorPrimary: "#13c2c2"
      colorPrimaryHover: "#36cfc9"
      controlInteractiveSize: 20
      borderRadiusSM: 4
      fontSize: 16
- id: theme_font_size
  type: CheckboxSelector
  properties:
    title: Large Font Size
    options:
      - Option A
      - Option B
      - Option C
    theme:
      fontSize: 18
```

```yaml
theme_large_checkbox:
  _state: theme_large_checkbox
theme_custom_colors:
  _state: theme_custom_colors
theme_custom_border:
  _state: theme_custom_border
theme_combined:
  _state: theme_combined
theme_font_size:
  _state: theme_font_size
```

```yaml
- id: combo_green_vertical
  type: CheckboxSelector
  properties:
    title: Green Vertical
    color: "#52c41a"
    direction: vertical
    options:
      - label: Task 1
        value: task_1
      - label: Task 2
        value: task_2
      - label: Task 3
        value: task_3
- id: combo_purple_horizontal
  type: CheckboxSelector
  properties:
    title: Purple Horizontal
    color: "#722ed1"
    direction: horizontal
    options:
      - label: Tag A
        value: tag_a
      - label: Tag B
        value: tag_b
      - label: Tag C
        value: tag_c
      - label: Tag D
        value: tag_d
```

```yaml
combo_green_vertical:
  _state: combo_green_vertical
combo_purple_horizontal:
  _state: combo_purple_horizontal
```

```yaml
- id: example_permissions
  type: CheckboxSelector
  properties:
    title: User Permissions
    direction: vertical
    label:
      extra: Assign the appropriate permissions for this user role.
    options:
      - label: <b>Read</b> - View content
        value: read
      - label: <b>Write</b> - Create and edit content
        value: write
      - label: <b>Delete</b> - Remove content
        value: delete
        style:
          color: "#f5222d"
      - label: <b>Admin</b> - Full access
        value: admin
        style:
          color: "#fa8c16"
          fontWeight: bold
- id: example_newsletter
  type: CheckboxSelector
  properties:
    title: Newsletter Preferences
    direction: vertical
    color: "#1677ff"
    label:
      extra: Choose which newsletters you would like to receive.
    options:
      - label: Product Updates
        value: product
      - label: Engineering Blog
        value: engineering
      - label: Community Events
        value: community
      - label: Partner Offers
        value: partners
- id: example_survey
  type: CheckboxSelector
  properties:
    title: How did you hear about us?
    direction: vertical
    label:
      colon: false
    options:
      - Search Engine
      - Social Media
      - Friend or Colleague
      - Blog Post
      - Conference or Event
      - Other
```

```yaml
example_permissions:
  _state: example_permissions
example_newsletter:
  _state: example_newsletter
example_survey:
  _state: example_survey
```

```yaml
- id: checkbox_per_option_color
  type: CheckboxSelector
  properties:
    title: Each checked box in its option color
    options:
      - label: Low
        value: low
        color: "#16a34a"
      - label: Medium
        value: medium
        color: "#d97706"
      - label: High
        value: high
        color: "#dc2626"
```

```yaml
checkbox_per_option_color:
  _state: checkbox_per_option_color
```

```yaml
- id: data_checkbox_selector
  type: CheckboxSelector
  properties:
    title: Permissions
    data:
      - id: 1
        name: Read
      - id: 2
        name: Write
      - id: 3
        name: Admin
    html: "{{ item.name }}"
    valueKey: id
```

```yaml
data_checkbox_selector:
  _state: data_checkbox_selector
```

```yaml
- id: columns_two
  type: CheckboxSelector
  properties:
    title: Two columns
    columns: 2
    options:
      - Weekday mornings
      - Weekday afternoons
      - Weekday evenings
      - Weekend mornings
      - Weekend afternoons
      - Weekend evenings
- id: columns_four
  type: CheckboxSelector
  properties:
    title: Four columns
    columns: 4
    options:
      - January
      - February
      - March
      - April
      - May
      - June
      - July
      - August
- id: columns_responsive
  type: CheckboxSelector
  properties:
    title: One column below md, three from md up
    columns:
      xs: 1
      md: 3
    options:
      - Email
      - SMS
      - Push notification
      - Webhook
      - In-app message
      - Weekly digest
- id: columns_gutter
  type: CheckboxSelector
  properties:
    title: Wider gutter
    columns: 2
    gutter:
      - 24
      - 12
    options:
      - Read
      - Write
      - Delete
      - Administer
- id: columns_per_option_color
  type: CheckboxSelector
  properties:
    title: Coloured options in a grid
    columns: 2
    options:
      - label: Low
        value: low
        color: "#16a34a"
      - label: Medium
        value: medium
        color: "#d97706"
      - label: High
        value: high
        color: "#dc2626"
      - label: Critical
        value: critical
        color: "#7e22ce"
```

```yaml
columns_two:
  _state: columns_two
columns_four:
  _state: columns_four
columns_responsive:
  _state: columns_responsive
columns_gutter:
  _state: columns_gutter
columns_per_option_color:
  _state: columns_per_option_color
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `align` | string | `"start"` | Align options. Ignored when 'columns' is set. Enum: `start`, `end`, `center`, `baseline`. |
| `color` | string | - | Selected checkbox color. |
| `columns` | integer \| object | - | Number of columns to lay the options out in, or a responsive breakpoint object. Use a count that divides 24 evenly. |
| `disabled` | boolean | `false` | Disable the block if true. |
| `direction` | string | `"horizontal"` | List options horizontally or vertical. Ignored when 'columns' is set. Enum: `horizontal`, `vertical`. |
| `gutter` | number \| array | - | Gap between options in the grid. Number or [horizontal, vertical] array. Applies when 'columns' is set. |
| `wrap` | boolean | `true` | Specifies wrapping of options. Applies when 'direction' is 'horizontal'. Ignored when 'columns' is set. |
| `options` | array | `[]` | Options can either be an array of primitive values, on an array of label, value pairs - supports html. |
| `options.$.label` | string | - | Value label shown to user - supports html. |
| `options.$.value` | - | - | Option value. Can be of any type. |
| `options.$.disabled` | boolean | `false` | Disable the option if true. |
| `options.$.style` | object | - | Css style to apply to the option. |
| `options.$.color` | string | - | Color applied to this option when it is selected. Falls back to the block-level color when not set. |
| `data` | array | - | Alternative to `options`: an array of raw rows. Each row is rendered to a label with the `html` template, and `valueKey` selects which field becomes the value. Use this to drive a selector directly from data without building label/value pairs in your request. |
| `html` | string | - | Nunjucks template that renders each option label when using `data`. The context exposes `item` (the current row) and `index` (the zero-based row index). Ignored when `options` is used. |
| `valueKey` | string | - | Field used as the selected value. With `options` it names the value field (defaults to "value"). With `data` it names the field stored when an option is selected; omit it to store the whole row. Supports dotted paths (e.g. "user.id"). |
| `primaryKey` | string | - | Field used to match the current value (e.g. set with SetState) back to an option for highlighting. Defaults to `valueKey`. Set this when the stored value is the whole row but a single field (e.g. "id") uniquely identifies it. In the tree selectors it also serves as each node’s id, referenced by `parentKey`. Supports dotted paths. |
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
| `size` | string | `"default"` | Size of the block label. Enum: `small`, `default`, `large`. |
| `title` | string | - | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design checkbox tokens](https://ant.design/components/checkbox#design-token). |
| `theme.colorPrimary` | string | - | Primary color for checked checkboxes. |
| `theme.colorPrimaryHover` | string | - | Hover color for checked checkboxes. |
| `theme.colorBgContainer` | string | - | Background color for unchecked checkboxes. |
| `theme.colorBgContainerDisabled` | string | - | Background color for disabled checkboxes. |
| `theme.colorBorder` | string | - | Border color for unchecked checkboxes. |
| `theme.colorTextDisabled` | string | - | Text and checkmark color for disabled checkboxes. |
| `theme.controlInteractiveSize` | number | `16` | Size of the checkbox (width and height in pixels). |
| `theme.borderRadiusSM` | number | `4` | Border radius of the checkbox. |
| `theme.lineWidth` | number | `1` | Border width of the checkbox. |
| `theme.lineType` | string | `"solid"` | Border style of the checkbox. |
| `theme.fontSize` | number | `14` | Font size for checkbox labels. |
| `theme.marginXS` | number | `8` | Column gap on the checkbox group element. Does not space the options apart; set 'gutter' for a grid. |
| `theme.paddingXS` | number | `8` | Inline padding between the checkbox and its label text. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | `{ value: array }` | Trigger actions when selection is changed. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The CheckboxSelector element. |
| `/label` | The CheckboxSelector label. |
| `/extra` | The CheckboxSelector extra content. |
| `/feedback` | The CheckboxSelector validation feedback. |

No slots defined.
