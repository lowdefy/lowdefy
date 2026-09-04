# RadioSelector

Radio group for selecting a single option.

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
- id: basic_string_options
  type: RadioSelector
  properties:
    title: Shirt Size
    options:
      - XS
      - S
      - M
      - L
      - XL
- id: basic_number_options
  type: RadioSelector
  properties:
    title: Quantity
    options:
      - 1
      - 2
      - 5
      - 10
      - 25
- id: basic_boolean_options
  type: RadioSelector
  properties:
    title: Agreement
    options:
      - label: Yes
        value: true
      - label: No
        value: false
```

```yaml
basic_label_value:
  _state: basic_label_value
basic_string_options:
  _state: basic_string_options
basic_number_options:
  _state: basic_number_options
basic_boolean_options:
  _state: basic_boolean_options
```

```yaml
- id: horizontal_default
  type: RadioSelector
  properties:
    title: Horizontal (Default)
    direction: horizontal
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
      - label: Option D
        value: d
- id: horizontal_many
  type: RadioSelector
  properties:
    title: Many Horizontal Options (Wrapping)
    direction: horizontal
    wrap: true
    options:
      - Monday
      - Tuesday
      - Wednesday
      - Thursday
      - Friday
      - Saturday
      - Sunday
```

```yaml
horizontal_default:
  _state: horizontal_default
horizontal_many:
  _state: horizontal_many
```

```yaml
- id: vertical_radio
  type: RadioSelector
  properties:
    title: Vertical Layout
    direction: vertical
    options:
      - label: Express Shipping (1-2 days)
        value: express
      - label: Standard Shipping (5-7 days)
        value: standard
      - label: Economy Shipping (10-14 days)
        value: economy
- id: vertical_with_disabled
  type: RadioSelector
  properties:
    title: Subscription Plan
    direction: vertical
    options:
      - label: Free Tier
        value: free
      - label: Pro ($9/mo)
        value: pro
      - label: Enterprise (Contact Sales)
        value: enterprise
        disabled: true
```

```yaml
vertical_radio:
  _state: vertical_radio
vertical_with_disabled:
  _state: vertical_with_disabled
```

```yaml
- id: wrap_enabled
  type: RadioSelector
  properties:
    title: Wrap Enabled (Default)
    direction: horizontal
    wrap: true
    options:
      - January
      - February
      - March
      - April
      - May
      - June
      - July
      - August
      - September
      - October
      - November
      - December
- id: wrap_disabled
  type: RadioSelector
  properties:
    title: Wrap Disabled
    direction: horizontal
    wrap: false
    options:
      - January
      - February
      - March
      - April
      - May
      - June
      - July
      - August
      - September
      - October
      - November
      - December
```

```yaml
wrap_enabled:
  _state: wrap_enabled
wrap_disabled:
  _state: wrap_disabled
```

```yaml
- id: align_start
  type: RadioSelector
  properties:
    title: Start Alignment (Default)
    align: start
    direction: vertical
    options:
      - Apple
      - Banana
      - Cherry
- id: align_center
  type: RadioSelector
  properties:
    title: Center Alignment
    align: center
    direction: vertical
    options:
      - Apple
      - Banana
      - Cherry
- id: align_end
  type: RadioSelector
  properties:
    title: End Alignment
    align: end
    direction: vertical
    options:
      - Apple
      - Banana
      - Cherry
- id: align_baseline
  type: RadioSelector
  properties:
    title: Baseline Alignment
    align: baseline
    direction: horizontal
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
  type: RadioSelector
  properties:
    title: Green
    color: "#52c41a"
    options:
      - label: Approved
        value: approved
      - label: Pending
        value: pending
      - label: Rejected
        value: rejected
- id: color_orange
  type: RadioSelector
  properties:
    title: Orange
    color: "#fa8c16"
    options:
      - label: Low
        value: low
      - label: Medium
        value: medium
      - label: High
        value: high
- id: color_purple
  type: RadioSelector
  properties:
    title: Purple
    color: "#722ed1"
    options:
      - label: Bronze
        value: bronze
      - label: Silver
        value: silver
      - label: Gold
        value: gold
- id: color_red
  type: RadioSelector
  properties:
    title: Red
    color: "#f5222d"
    options:
      - label: Critical
        value: critical
      - label: Warning
        value: warning
      - label: Info
        value: info
- id: color_hex_custom
  type: RadioSelector
  properties:
    title: Custom Hex (#e64980)
    color: "#e64980"
    options:
      - label: Option 1
        value: opt1
      - label: Option 2
        value: opt2
      - label: Option 3
        value: opt3
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
  type: RadioSelector
  properties:
    title: All Options Disabled
    disabled: true
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
- id: disabled_vertical
  type: RadioSelector
  properties:
    title: Disabled Vertical
    disabled: true
    direction: vertical
    options:
      - label: Small
        value: small
      - label: Medium
        value: medium
      - label: Large
        value: large
```

```yaml
disabled_all:
  _state: disabled_all
disabled_vertical:
  _state: disabled_vertical
```

```yaml
- id: disabled_single_option
  type: RadioSelector
  properties:
    title: One Disabled Option
    options:
      - label: Available
        value: available
      - label: Out of Stock
        value: out_of_stock
        disabled: true
      - label: In Stock
        value: in_stock
- id: disabled_multiple_options
  type: RadioSelector
  properties:
    title: Multiple Disabled Options
    options:
      - label: Standard
        value: standard
      - label: Premium (Sold Out)
        value: premium
        disabled: true
      - label: Enterprise (Coming Soon)
        value: enterprise
        disabled: true
      - label: Basic
        value: basic
```

```yaml
disabled_single_option:
  _state: disabled_single_option
disabled_multiple_options:
  _state: disabled_multiple_options
```

```yaml
- id: styled_options
  type: RadioSelector
  properties:
    title: Custom Option Styles
    options:
      - label: <b>Bold Label</b>
        value: bold
        style:
          fontWeight: bold
      - label: Highlighted
        value: highlighted
        style:
          padding: 2px 8px
          borderRadius: 4
      - label: Italic
        value: italic
        style:
          fontStyle: italic
- id: styled_colored_labels
  type: RadioSelector
  properties:
    title: Colored Labels
    options:
      - label: '<span style="color: #52c41a;">Success</span>'
        value: success
      - label: '<span style="color: #faad14;">Warning</span>'
        value: warning
      - label: '<span style="color: #ff4d4f;">Error</span>'
        value: error
      - label: '<span style="color: #1677ff;">Info</span>'
        value: info
- id: styled_vertical_cards
  type: RadioSelector
  properties:
    title: Styled Vertical Options
    direction: vertical
    options:
      - label: Free Plan
        value: free
        style:
          padding: 4px 12px
          borderRadius: 6
          marginBottom: 4
      - label: Pro Plan
        value: pro
        style:
          padding: 4px 12px
          borderRadius: 6
          marginBottom: 4
      - label: Enterprise Plan
        value: enterprise
        style:
          padding: 4px 12px
          borderRadius: 6
```

```yaml
styled_options:
  _state: styled_options
styled_colored_labels:
  _state: styled_colored_labels
styled_vertical_cards:
  _state: styled_vertical_cards
```

```yaml
- id: html_bold_labels
  type: RadioSelector
  properties:
    title: HTML in Labels
    options:
      - label: <b>Important</b> option
        value: important
      - label: Normal option
        value: normal
      - label: <i>Italic</i> option
        value: italic
- id: html_rich_labels
  type: RadioSelector
  properties:
    title: Rich HTML Labels
    direction: vertical
    options:
      - label: <b>Starter</b> &mdash; Basic features for individuals
        value: starter
      - label: <b>Professional</b> &mdash; Advanced features for teams
        value: professional
      - label: <b>Enterprise</b> &mdash; Custom solutions for organizations
        value: enterprise
```

```yaml
html_bold_labels:
  _state: html_bold_labels
html_rich_labels:
  _state: html_rich_labels
```

```yaml
- id: label_default
  type: RadioSelector
  properties:
    title: Default Label
    options:
      - Yes
      - No
      - Maybe
- id: label_with_extra
  type: RadioSelector
  properties:
    title: Label with Extra
    label:
      extra: Select the option that best describes your preference.
    options:
      - label: Strongly Agree
        value: strongly_agree
      - label: Agree
        value: agree
      - label: Neutral
        value: neutral
      - label: Disagree
        value: disagree
- id: label_colon_false
  type: RadioSelector
  properties:
    title: Label Without Colon
    label:
      colon: false
    options:
      - Option A
      - Option B
      - Option C
- id: label_inline
  type: RadioSelector
  properties:
    title: Inline Label
    label:
      inline: true
      span: 8
    options:
      - label: Left
        value: left
      - label: Center
        value: center
      - label: Right
        value: right
- id: label_right_align
  type: RadioSelector
  properties:
    title: Right Aligned Label
    label:
      inline: true
      span: 8
      align: right
    options:
      - label: Small
        value: sm
      - label: Medium
        value: md
      - label: Large
        value: lg
```

```yaml
label_default:
  _state: label_default
label_with_extra:
  _state: label_with_extra
label_colon_false:
  _state: label_colon_false
label_inline:
  _state: label_inline
label_right_align:
  _state: label_right_align
```

```yaml
- id: no_label_radio
  type: RadioSelector
  properties:
    label:
      disabled: true
    options:
      - label: Yes
        value: true
      - label: No
        value: false
      - label: Maybe
        value: maybe
- id: no_label_vertical
  type: RadioSelector
  properties:
    label:
      disabled: true
    direction: vertical
    options:
      - label: Daily digest
        value: daily
      - label: Weekly summary
        value: weekly
      - label: No emails
        value: none
```

```yaml
no_label_radio:
  _state: no_label_radio
no_label_vertical:
  _state: no_label_vertical
```

```yaml
- id: style_border
  type: RadioSelector
  style:
    .element:
      border: 1px solid
      borderRadius: 8
      padding: 16
  properties:
    title: Bordered Container
    label:
      disabled: true
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
- id: style_background
  type: RadioSelector
  style:
    .element:
      padding: 12
      borderRadius: 6
  properties:
    title: Custom Background
    label:
      disabled: true
    options:
      - label: React
        value: react
      - label: Vue
        value: vue
      - label: Angular
        value: angular
- id: class_override
  type: RadioSelector
  class: p-4 rounded-lg shadow-sm border
  properties:
    title: With Tailwind Class
    label:
      disabled: true
    options:
      - label: Light Mode
        value: light
      - label: Dark Mode
        value: dark
      - label: System
        value: system
```

```yaml
style_border:
  _state: style_border
style_background:
  _state: style_background
class_override:
  _state: class_override
```

```yaml
- id: theme_large_radio
  type: RadioSelector
  properties:
    title: Large Radio Buttons
    theme:
      radioSize: 20
      dotSize: 10
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
- id: theme_custom_colors
  type: RadioSelector
  properties:
    title: Custom Theme Colors
    theme:
      colorPrimary: "#722ed1"
      colorBorder: "#d3adf7"
    options:
      - label: Purple A
        value: a
      - label: Purple B
        value: b
      - label: Purple C
        value: c
- id: theme_spacing
  type: RadioSelector
  properties:
    title: Wide Spacing
    theme:
      wrapperMarginInlineEnd: 24
    options:
      - label: Spaced A
        value: a
      - label: Spaced B
        value: b
      - label: Spaced C
        value: c
- id: theme_combined
  type: RadioSelector
  properties:
    title: Combined Token Overrides
    theme:
      radioSize: 22
      dotSize: 12
      colorPrimary: "#eb2f96"
      wrapperMarginInlineEnd: 20
    options:
      - label: Pink A
        value: a
      - label: Pink B
        value: b
      - label: Pink C
        value: c
- id: theme_green
  type: RadioSelector
  properties:
    title: Green Theme
    direction: vertical
    theme:
      colorPrimary: "#52c41a"
      radioSize: 18
      dotSize: 8
    options:
      - label: Approved
        value: approved
      - label: Pending Review
        value: pending
      - label: Rejected
        value: rejected
```

```yaml
theme_large_radio:
  _state: theme_large_radio
theme_custom_colors:
  _state: theme_custom_colors
theme_spacing:
  _state: theme_spacing
theme_combined:
  _state: theme_combined
theme_green:
  _state: theme_green
```

```yaml
- id: object_values
  type: RadioSelector
  properties:
    title: Object Values
    direction: vertical
    options:
      - label: Admin (Full Access)
        value:
          role: admin
          level: 3
      - label: Editor (Read/Write)
        value:
          role: editor
          level: 2
      - label: Viewer (Read Only)
        value:
          role: viewer
          level: 1
- id: mixed_disabled_styled
  type: RadioSelector
  properties:
    title: Mixed Disabled and Styled
    direction: vertical
    options:
      - label: <b>Recommended:</b> Standard Plan
        value: standard
        style:
          padding: 4px 12px
          borderRadius: 4
      - label: Basic Plan
        value: basic
      - label: Legacy Plan (Discontinued)
        value: legacy
        disabled: true
        style:
          textDecoration: line-through
```

```yaml
object_values:
  _state: object_values
mixed_disabled_styled:
  _state: mixed_disabled_styled
```

```yaml
- id: example_payment
  type: RadioSelector
  properties:
    title: Payment Method
    direction: vertical
    options:
      - label: <b>Credit Card</b> &mdash; Visa, Mastercard, Amex
        value: credit_card
      - label: <b>PayPal</b> &mdash; Pay with your PayPal account
        value: paypal
      - label: <b>Bank Transfer</b> &mdash; Direct bank payment
        value: bank_transfer
      - label: <b>Crypto</b> &mdash; Bitcoin, Ethereum
        value: crypto
        disabled: true
- id: example_frequency
  type: RadioSelector
  properties:
    title: Notification Frequency
    color: "#1677ff"
    options:
      - label: Instant
        value: instant
      - label: Hourly
        value: hourly
      - label: Daily
        value: daily
      - label: Weekly
        value: weekly
      - label: Never
        value: never
- id: example_rating
  type: RadioSelector
  properties:
    title: Satisfaction Rating
    direction: horizontal
    color: "#faad14"
    options:
      - label: "&#x2B50; 1"
        value: 1
      - label: "&#x2B50; 2"
        value: 2
      - label: "&#x2B50; 3"
        value: 3
      - label: "&#x2B50; 4"
        value: 4
      - label: "&#x2B50; 5"
        value: 5
- id: example_priority
  type: RadioSelector
  properties:
    title: Task Priority
    direction: vertical
    options:
      - label: '<span style="color: #ff4d4f;">&#x1F534; Critical</span>'
        value: critical
      - label: '<span style="color: #fa8c16;">&#x1F7E0; High</span>'
        value: high
      - label: '<span style="color: #faad14;">&#x1F7E1; Medium</span>'
        value: medium
      - label: '<span style="color: #52c41a;">&#x1F7E2; Low</span>'
        value: low
```

```yaml
example_payment:
  _state: example_payment
example_frequency:
  _state: example_frequency
example_rating:
  _state: example_rating
example_priority:
  _state: example_priority
```

```yaml
- id: radio_per_option_color
  type: RadioSelector
  properties:
    title: Selected dot + label in its option color
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
radio_per_option_color:
  _state: radio_per_option_color
```

```yaml
- id: data_radio_selector
  type: RadioSelector
  properties:
    title: Notify by
    data:
      - id: 1
        name: Email
      - id: 2
        name: SMS
      - id: 3
        name: Push
    html: "{{ item.name }}"
    valueKey: id
```

```yaml
data_radio_selector:
  _state: data_radio_selector
```

```yaml
- id: radio_columns_two
  type: RadioSelector
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
- id: radio_columns_responsive
  type: RadioSelector
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
- id: radio_columns_gutter
  type: RadioSelector
  properties:
    title: Wider gutter
    columns: 2
    gutter:
      - 24
      - 12
    options:
      - Read only
      - Read and write
      - Administer
      - No access
- id: radio_columns_per_option_color
  type: RadioSelector
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
radio_columns_two:
  _state: radio_columns_two
radio_columns_responsive:
  _state: radio_columns_responsive
radio_columns_gutter:
  _state: radio_columns_gutter
radio_columns_per_option_color:
  _state: radio_columns_per_option_color
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `align` | string | `"start"` | Align options. Ignored when 'columns' is set. Enum: `start`, `end`, `center`, `baseline`. |
| `color` | string | - | Selected radio color. |
| `columns` | integer \| object | - | Number of columns to lay the options out in, or a responsive breakpoint object. Use a count that divides 24 evenly. |
| `disabled` | boolean | `false` | Disable the block if true. |
| `direction` | string | `"horizontal"` | List options horizontally or vertical. Ignored when 'columns' is set. Enum: `horizontal`, `vertical`. |
| `gutter` | number \| array | - | Gap between options in the grid. Number or [horizontal, vertical] array. Applies when 'columns' is set. |
| `wrap` | boolean | `true` | Specifies wrapping of options. Applies when 'direction' is 'horizontal'. Ignored when 'columns' is set. |
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
| `size` | string | `"default"` | Size of the block label. Enum: `small`, `default`, `large`. |
| `title` | string | - | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design radio tokens](https://ant.design/components/radio#design-token). |
| `theme.radioSize` | number | `16` | Size of the radio button circle. |
| `theme.dotSize` | number | `6` | Size of the inner dot indicator. |
| `theme.dotColorDisabled` | string | `"rgba(0, 0, 0, 0.25)"` | Dot color when the radio is disabled. |
| `theme.colorPrimary` | string | - | Primary color for the selected radio button. |
| `theme.colorBorder` | string | - | Border color of the radio button circle. |
| `theme.colorBgContainer` | string | - | Background color of the radio button circle. |
| `theme.wrapperMarginInlineEnd` | number | `8` | Right margin of the radio wrapper. |
| `theme.radioColor` | string | `"#fff"` | Color of the radio indicator dot when selected. |
| `theme.radioBgColor` | string | - | Background color of the radio circle when selected. |
| `theme.buttonBg` | string | `"#ffffff"` | Background color for button-style radio. |
| `theme.buttonCheckedBg` | string | `"#ffffff"` | Background color for checked button-style radio. |
| `theme.buttonColor` | string | `"rgba(0, 0, 0, 0.88)"` | Text color for button-style radio. |
| `theme.buttonPaddingInline` | number | `15` | Horizontal padding for button-style radio. |
| `theme.buttonCheckedBgDisabled` | string | `"rgba(0, 0, 0, 0.15)"` | Background color for disabled checked button-style radio. |
| `theme.buttonCheckedColorDisabled` | string | `"rgba(0, 0, 0, 0.25)"` | Text color for disabled checked button-style radio. |
| `theme.buttonSolidCheckedColor` | string | `"#fff"` | Text color for solid button-style radio when checked. |
| `theme.buttonSolidCheckedBg` | string | - | Background color for solid button-style radio when checked. |
| `theme.buttonSolidCheckedHoverBg` | string | - | Hover background for solid button-style radio when checked. |
| `theme.buttonSolidCheckedActiveBg` | string | - | Active background for solid button-style radio when checked. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | `{ value: any }` | Trigger action when selection is changed. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The RadioSelector element. |
| `/label` | The RadioSelector label. |
| `/extra` | The RadioSelector extra content. |
| `/feedback` | The RadioSelector validation feedback. |

No slots defined.
