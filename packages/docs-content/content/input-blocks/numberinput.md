# NumberInput

Numeric input with step controls, min/max limits, precision, and formatting.

```yaml
- id: basic_default
  type: NumberInput
  properties:
    title: Enter a Number
    placeholder: Type a number
- id: basic_with_value
  type: NumberInput
  properties:
    title: With Default Value
    placeholder: Has initial value
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          basic_with_value: 42
- id: basic_no_label
  type: NumberInput
  properties:
    label:
      disabled: true
    placeholder: No label shown
```

```yaml
[object Object]```

```yaml
- id: size_small
  type: NumberInput
  properties:
    title: Small
    size: small
    placeholder: Small
- id: size_default
  type: NumberInput
  properties:
    title: Default
    placeholder: Default
- id: size_large
  type: NumberInput
  properties:
    title: Large
    size: large
    placeholder: Large
```

```yaml
[object Object]```

```yaml
- id: min_max
  type: NumberInput
  properties:
    title: Range 1-100
    min: 1
    max: 100
    placeholder: 1 to 100
- id: min_only
  type: NumberInput
  properties:
    title: Min 0 (No Negatives)
    min: 0
    placeholder: Zero or above
- id: step_5
  type: NumberInput
  properties:
    title: Step 5
    min: 0
    max: 100
    step: 5
    placeholder: Increments of 5
- id: step_decimal
  type: NumberInput
  properties:
    title: Decimal Step 0.1
    min: 0
    max: 10
    step: 0.1
    precision: 1
    placeholder: Step 0.1
- id: step_negative
  type: NumberInput
  properties:
    title: Negative Range
    min: -100
    max: 100
    step: 5
    placeholder: -100 to 100
```

```yaml
[object Object]```

```yaml
- id: precision_0
  type: NumberInput
  properties:
    title: Integer Only (precision 0)
    precision: 0
    placeholder: No decimals
- id: precision_1
  type: NumberInput
  properties:
    title: 1 Decimal Place
    precision: 1
    placeholder: e.g. 3.1
- id: precision_2
  type: NumberInput
  properties:
    title: 2 Decimal Places
    precision: 2
    placeholder: e.g. 3.14
- id: precision_4
  type: NumberInput
  properties:
    title: 4 Decimal Places
    precision: 4
    placeholder: e.g. 1.2345
```

```yaml
[object Object]```

```yaml
- id: separator_default
  type: NumberInput
  properties:
    title: Default Separator (.)
    precision: 2
    placeholder: Uses period
- id: separator_comma
  type: NumberInput
  properties:
    title: Comma Separator
    decimalSeparator: ","
    precision: 2
    placeholder: Uses comma
```

```yaml
[object Object]```

```yaml
- id: controls_default
  type: NumberInput
  properties:
    title: With Controls (Default)
    controls: true
    placeholder: Has +/- buttons
- id: controls_off
  type: NumberInput
  properties:
    title: No Controls
    controls: false
    placeholder: No +/- buttons
- id: controls_with_step
  type: NumberInput
  properties:
    title: Controls with Step 5
    controls: true
    step: 5
    min: 0
    max: 100
    placeholder: Click +/- by 5
```

```yaml
[object Object]```

```yaml
- id: keyboard_enabled
  type: NumberInput
  properties:
    title: Keyboard Enabled (Default)
    keyboard: true
    placeholder: Use arrow keys
- id: keyboard_disabled
  type: NumberInput
  properties:
    title: Keyboard Disabled
    keyboard: false
    placeholder: Arrow keys do nothing
```

```yaml
[object Object]```

```yaml
- id: disabled_empty
  type: NumberInput
  properties:
    title: Disabled (Empty)
    disabled: true
    placeholder: Cannot edit
- id: disabled_with_value
  type: NumberInput
  properties:
    title: Disabled (With Value)
    disabled: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          disabled_with_value: 50
- id: disabled_controls
  type: NumberInput
  properties:
    title: Disabled With Controls
    disabled: true
    controls: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          disabled_controls: 25
```

```yaml
[object Object]```

```yaml
- id: borderless_empty
  type: NumberInput
  properties:
    title: Borderless
    bordered: false
    placeholder: No border style
- id: borderless_with_value
  type: NumberInput
  properties:
    title: Borderless With Value
    bordered: false
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          borderless_with_value: 99
```

```yaml
[object Object]```

```yaml
- id: placeholder_default
  type: NumberInput
  properties:
    title: Default Placeholder
    placeholder: Enter a number...
- id: placeholder_quantity
  type: NumberInput
  properties:
    title: Quantity
    placeholder: How many?
    min: 0
- id: placeholder_price
  type: NumberInput
  properties:
    title: Price
    placeholder: "0"
    precision: 2
    min: 0
- id: placeholder_percentage
  type: NumberInput
  properties:
    title: Percentage
    placeholder: 0-100
    min: 0
    max: 100
```

```yaml
[object Object]```

```yaml
- id: formatter_currency
  type: NumberInput
  properties:
    title: Currency Formatter
    placeholder: Enter amount
    min: 0
    precision: 2
    formatter:
      _function:
        __intl.numberFormat:
          on:
            __args: 0.value
          params:
            locale: en-US
            options:
              style: currency
              currency: USD
- id: formatter_percent
  type: NumberInput
  properties:
    title: Percentage Formatter
    placeholder: Enter percentage
    min: 0
    max: 100
    formatter:
      _function:
        __if:
          test:
            __ne:
              - __args: 0.value
              - null
          then:
            __string.concat:
              - __args: 0.value
              - "%"
          else: ""
```

```yaml
[object Object]```

```yaml
[object Object]```

*Note: autoFocus is best demonstrated on page load. Set `autoFocus: true` to focus the input when the page renders.*

```yaml
- id: autofocus_off
  type: NumberInput
  properties:
    title: Normal (No AutoFocus)
    autoFocus: false
    placeholder: Click to focus
- id: autofocus_note
  type: Markdown
  properties:
    content: "*Note: autoFocus is best demonstrated on page load. Set `autoFocus:
      true` to focus the input when the page renders.*"
```

```yaml
[object Object]```

```yaml
- id: label_default
  type: NumberInput
  properties:
    title: Default Label
    placeholder: Standard label
- id: label_no_colon
  type: NumberInput
  properties:
    title: No Colon
    placeholder: Label without colon
    label:
      colon: false
- id: label_right_align
  type: NumberInput
  properties:
    title: Right Aligned Label
    placeholder: Inline right label
    label:
      inline: true
      align: right
      span: 8
- id: label_extra
  type: NumberInput
  properties:
    title: With Extra Text
    placeholder: Has helper text below
    label:
      extra: Enter a value between 1 and 100.
- id: label_disabled
  type: NumberInput
  properties:
    placeholder: Label hidden entirely
    label:
      disabled: true
```

```yaml
[object Object]```

```yaml
- id: label_span_4
  type: NumberInput
  properties:
    title: Span 4
    placeholder: Narrow label
    label:
      inline: true
      span: 4
- id: label_span_8
  type: NumberInput
  properties:
    title: Span 8
    placeholder: Medium label
    label:
      inline: true
      span: 8
- id: label_span_12
  type: NumberInput
  properties:
    title: Span 12
    placeholder: Wide label
    label:
      inline: true
      span: 12
```

```yaml
[object Object]```

```yaml
- id: title_bold
  type: NumberInput
  properties:
    title: <b>Bold</b> Title
    placeholder: HTML bold label
- id: title_colored
  type: NumberInput
  properties:
    title: '<span style="color: #1677ff;">Blue</span> Title'
    placeholder: HTML colored label
- id: title_icon_html
  type: NumberInput
  properties:
    title: Quantity &#x1F4E6;
    placeholder: HTML entity in label
```

```yaml
[object Object]```

```yaml
- id: combined_price
  type: NumberInput
  properties:
    title: Product Price
    min: 0
    max: 99999
    step: 0.01
    precision: 2
    placeholder: "0"
    label:
      extra: Enter the product price in USD.
- id: combined_quantity
  type: NumberInput
  properties:
    title: Quantity
    min: 1
    max: 999
    step: 1
    precision: 0
    placeholder: Enter quantity
    size: large
- id: combined_percentage
  type: NumberInput
  properties:
    title: Discount (%)
    min: 0
    max: 100
    step: 0.5
    precision: 1
    placeholder: "0"
    size: small
    label:
      extra: Percentage discount to apply.
- id: combined_temperature
  type: NumberInput
  properties:
    title: Temperature
    min: -50
    max: 50
    step: 0.1
    precision: 1
    decimalSeparator: .
    placeholder: Celsius
- id: combined_borderless_disabled
  type: NumberInput
  properties:
    title: Read-Only Value
    disabled: true
    bordered: false
    precision: 5
    controls: false
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          combined_borderless_disabled: 3.14159
```

```yaml
[object Object]```

```yaml
- id: step_1
  type: NumberInput
  properties:
    title: Step 1 (Default)
    step: 1
    placeholder: Whole numbers
- id: step_0_5
  type: NumberInput
  properties:
    title: Step 0.5
    step: 0.5
    precision: 1
    placeholder: Half increments
- id: step_0_25
  type: NumberInput
  properties:
    title: Step 0.25
    step: 0.25
    precision: 2
    placeholder: Quarter increments
- id: step_100
  type: NumberInput
  properties:
    title: Step 100
    step: 100
    min: 0
    max: 10000
    placeholder: Hundreds
- id: step_0_001
  type: NumberInput
  properties:
    title: Step 0.001
    step: 0.001
    precision: 3
    placeholder: Thousandths
```

```yaml
[object Object]```

```yaml
- id: style_width
  type: NumberInput
  style:
    .element:
      width: 200px
  properties:
    title: Fixed Width (200px)
    placeholder: 200px wide
- id: style_background
  type: NumberInput
  style:
    .element: null
  properties:
    title: Custom Background
    placeholder: Light blue background
- id: style_border
  type: NumberInput
  style:
    .element:
      borderColor: "#52c41a"
      borderWidth: 2px
  properties:
    title: Custom Border
    placeholder: Green border
- id: style_font
  type: NumberInput
  style:
    .element:
      fontSize: 18px
      fontWeight: bold
  properties:
    title: Custom Font
    placeholder: Large bold text
- id: style_label
  type: NumberInput
  style:
    .label:
      color: "#722ed1"
      fontWeight: bold
  properties:
    title: Styled Label
    placeholder: Purple bold label
```

```yaml
[object Object]```

```yaml
- id: class_element
  type: NumberInput
  class:
    element: rounded-lg shadow-md
  properties:
    title: Rounded with Shadow
    placeholder: Tailwind classes
- id: class_label
  type: NumberInput
  class:
    label: text-blue-600 font-semibold
  properties:
    title: Blue Bold Label
    placeholder: Label class override
```

```yaml
[object Object]```

```yaml
- id: theme_colors
  type: NumberInput
  properties:
    title: Custom Colors
    placeholder: Blue focus, green hover
    theme:
      activeBorderColor: "#1677ff"
      hoverBorderColor: "#52c41a"
- id: theme_large_handles
  type: NumberInput
  properties:
    title: Large Handles
    placeholder: Wider +/- area
    theme:
      handleWidth: 30
      handleFontSize: 10
- id: theme_shadows
  type: NumberInput
  properties:
    title: Custom Active Shadow
    placeholder: Focus to see shadow
    theme:
      activeShadow: 0 0 0 3px rgba(22, 119, 255, 0.2)
- id: theme_handle_colors
  type: NumberInput
  properties:
    title: Colored Handles
    placeholder: Hover +/- to see color
    theme:
      handleHoverColor: "#eb2f96"
      handleBorderColor: "#d9d9d9"
- id: theme_small_pill
  type: NumberInput
  properties:
    title: Small Rounded
    size: small
    placeholder: Pill style
    theme:
      borderRadius: 16
```

```yaml
[object Object]```

```yaml
- id: use_age
  type: NumberInput
  properties:
    title: Age
    min: 0
    max: 150
    precision: 0
    step: 1
    placeholder: Enter age
    label:
      extra: Must be between 0 and 150.
- id: use_weight
  type: NumberInput
  properties:
    title: Weight (kg)
    min: 0
    max: 500
    precision: 1
    step: 0.1
    placeholder: e.g. 72.5
- id: use_rating
  type: NumberInput
  properties:
    title: Rating
    min: 1
    max: 5
    precision: 1
    step: 0.5
    placeholder: 1.0 - 5.0
    label:
      extra: Rate from 1 to 5 in half-star increments.
- id: use_latitude
  type: NumberInput
  properties:
    title: Latitude
    min: -90
    max: 90
    precision: 6
    step: 0.000001
    placeholder: e.g. 40.712776
    controls: false
- id: use_order_quantity
  type: NumberInput
  properties:
    title: Order Quantity
    min: 1
    max: 999
    precision: 0
    step: 1
    size: large
    placeholder: Qty
    label:
      inline: true
      span: 8
      align: right
```

```yaml
[object Object]```

**Inline Labels:**

**Stacked Labels:**

**No Labels (Compact):**

```yaml
- id: form_row_label
  type: Markdown
  properties:
    content: "**Inline Labels:**"
- id: form_inline_row
  type: Box
  layout:
    gap: 16
  blocks:
    - id: form_width
      type: NumberInput
      layout:
        flex: 1 1 0
      properties:
        title: Width
        min: 0
        precision: 0
        placeholder: px
        label:
          inline: true
          span: 10
    - id: form_height
      type: NumberInput
      layout:
        flex: 1 1 0
      properties:
        title: Height
        min: 0
        precision: 0
        placeholder: px
        label:
          inline: true
          span: 10
- id: form_stacked_label
  type: Markdown
  properties:
    content: "**Stacked Labels:**"
- id: form_stacked_row
  type: Box
  layout:
    gap: 16
  blocks:
    - id: form_min_price
      type: NumberInput
      layout:
        flex: 1 1 0
      properties:
        title: Min Price
        min: 0
        precision: 2
        placeholder: "0"
    - id: form_max_price
      type: NumberInput
      layout:
        flex: 1 1 0
      properties:
        title: Max Price
        min: 0
        precision: 2
        placeholder: "0"
- id: form_no_label_label
  type: Markdown
  properties:
    content: "**No Labels (Compact):**"
- id: form_no_label_row
  type: Box
  layout:
    gap: 8
  blocks:
    - id: form_x
      type: NumberInput
      layout:
        flex: 1 1 0
      properties:
        placeholder: X
        precision: 0
        label:
          disabled: true
    - id: form_y
      type: NumberInput
      layout:
        flex: 1 1 0
      properties:
        placeholder: Y
        precision: 0
        label:
          disabled: true
    - id: form_z
      type: NumberInput
      layout:
        flex: 1 1 0
      properties:
        placeholder: Z
        precision: 0
        label:
          disabled: true
```

```yaml
[object Object]```

*Validation status is controlled by the Lowdefy validation system. These examples show the visual appearance using theme tokens.*

```yaml
- id: warning_note
  type: Markdown
  properties:
    content: "*Validation status is controlled by the Lowdefy validation system.
      These examples show the visual appearance using theme tokens.*"
- id: theme_error_colors
  type: NumberInput
  properties:
    title: Error Shadow Theme
    placeholder: Custom error shadow
    theme:
      errorActiveShadow: 0 0 0 3px rgba(255, 77, 79, 0.3)
- id: theme_warning_colors
  type: NumberInput
  properties:
    title: Warning Shadow Theme
    placeholder: Custom warning shadow
    theme:
      warningActiveShadow: 0 0 0 3px rgba(250, 173, 20, 0.3)
```

```yaml
[object Object]```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `autoFocus` | boolean | `false` | Autofocus to the block on page load. |
| `bordered` | boolean | `true` | Whether or not the number input has a border style. Deprecated, use variant instead. |
| `controls` | boolean | `true` | Whether or not to show the +- controls. |
| `disabled` | boolean | `false` | Disable the block if true. |
| `formatter` | object | - | A function specifying the format of the value presented. |
| `keyboard` | boolean | `true` | If enabled, control input with keyboard up and down. |
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
| `min` | number | - | Minimum value allowed by the block. |
| `max` | number | - | Maximum value allowed by the block. |
| `parser` | object | - | A function specifying the value extracted from the formatter. |
| `placeholder` | string | - | Placeholder text inside the block to show message before user types input. |
| `decimalSeparator` | string | - | Separator between number and decimal places. Defaults to the active locale's decimal separator (e.g. "," for de-DE, "." for en-US), or "." when no locale is configured. |
| `precision` | integer | - | Precision (number of decimal places) allowed by the block. |
| `size` | string | `"default"` | Size of the block. Enum: `small`, `default`, `large`. |
| `step` | number | `1` | The number to which the current value is increased or decreased. It can be an integer or decimal. |
| `title` | string | - | Number input label title - supports html. |
| `variant` | string | - | Input visual variant. When set, takes precedence over bordered. Enum: `outlined`, `filled`, `borderless`. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design input-number tokens](https://ant.design/components/input-number#design-token). |
| `theme.activeBorderColor` | string | - | Border color when the input is active (focused). |
| `theme.activeShadow` | string | - | Box shadow when the input is active. |
| `theme.addonBg` | string | `"rgba(0,0,0,0.02)"` | Background color for addon areas. |
| `theme.activeBg` | string | `"#ffffff"` | Background color when the input is active. |
| `theme.controlWidth` | number | `90` | Default width of the InputNumber control. |
| `theme.errorActiveShadow` | string | - | Box shadow when the input is active in error status. |
| `theme.filledHandleBg` | string | `"#f0f0f0"` | Handle background color in filled variant. |
| `theme.handleActiveBg` | string | `"rgba(0,0,0,0.02)"` | Handle background color when active (pressed). |
| `theme.handleBg` | string | `"#ffffff"` | Default handle background color. |
| `theme.handleBorderColor` | string | `"#d9d9d9"` | Handle border color. |
| `theme.handleFontSize` | number | `7` | Font size of the handle icons (+/-). |
| `theme.handleHoverColor` | string | `"#1677ff"` | Handle icon color on hover. |
| `theme.handleOpacity` | number | `0` | Default opacity of the handles (0 means hidden until hover). |
| `theme.handleVisible` | string | `"auto"` | Handle visibility mode. |
| `theme.handleWidth` | number | `22` | Width of the spinner handles. |
| `theme.hoverBg` | string | `"#ffffff"` | Background color on hover. |
| `theme.hoverBorderColor` | string | - | Border color on hover. |
| `theme.inputFontSize` | number | `14` | Font size for the default size input. |
| `theme.inputFontSizeLG` | number | `16` | Font size for the large size input. |
| `theme.inputFontSizeSM` | number | `14` | Font size for the small size input. |
| `theme.paddingBlock` | number | `4` | Vertical padding for the default size. |
| `theme.paddingBlockLG` | number | `7` | Vertical padding for the large size. |
| `theme.paddingBlockSM` | number | `0` | Vertical padding for the small size. |
| `theme.paddingInline` | number | `11` | Horizontal padding for the default size. |
| `theme.paddingInlineLG` | number | `11` | Horizontal padding for the large size. |
| `theme.paddingInlineSM` | number | `7` | Horizontal padding for the small size. |
| `theme.warningActiveShadow` | string | - | Box shadow when the input is active in warning status. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onBlur` | \- | Trigger action event occurs when number input loses focus. |
| `onChange` | `{ value: number }` | Trigger action when number input is changed. |
| `onFocus` | \- | Trigger action when number input gets focus. |
| `onPressEnter` | \- | Trigger actions when input is focused and enter is pressed. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The NumberInput element. |
| `/label` | The NumberInput label. |
| `/extra` | The NumberInput extra content. |
| `/feedback` | The NumberInput validation feedback. |

No slots defined.
