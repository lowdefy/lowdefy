# MonthSelector

Month picker for selecting year and month.

```yaml
- id: month_size_small
  type: MonthSelector
  properties:
    title: Small
    size: small
- id: month_size_default
  type: MonthSelector
  properties:
    title: Default
- id: month_size_large
  type: MonthSelector
  properties:
    title: Large
    size: large
```

```yaml
month_size_small:
  _state: month_size_small
month_size_default:
  _state: month_size_default
month_size_large:
  _state: month_size_large
```

```yaml
- id: month_variant_outlined
  type: MonthSelector
  properties:
    title: Outlined (default)
    variant: outlined
    label:
      disabled: true
- id: month_variant_filled
  type: MonthSelector
  properties:
    title: Filled
    variant: filled
    label:
      disabled: true
- id: month_variant_borderless
  type: MonthSelector
  properties:
    title: Borderless
    variant: borderless
    label:
      disabled: true
```

```yaml
month_variant_outlined:
  _state: month_variant_outlined
month_variant_filled:
  _state: month_variant_filled
month_variant_borderless:
  _state: month_variant_borderless
```

```yaml
- id: month_format_default
  type: MonthSelector
  properties:
    title: YYYY-MM (default)
    format: YYYY-MM
    label:
      disabled: true
- id: month_format_long
  type: MonthSelector
  properties:
    title: MMMM YYYY
    format: MMMM YYYY
    label:
      disabled: true
- id: month_format_short
  type: MonthSelector
  properties:
    title: MMM YYYY
    format: MMM YYYY
    label:
      disabled: true
- id: month_format_numeric
  type: MonthSelector
  properties:
    title: MM/YYYY
    format: MM/YYYY
    label:
      disabled: true
- id: month_format_month_only
  type: MonthSelector
  properties:
    title: MMMM (Month Name Only)
    format: MMMM
    label:
      disabled: true
```

```yaml
month_format_default:
  _state: month_format_default
month_format_long:
  _state: month_format_long
month_format_short:
  _state: month_format_short
month_format_numeric:
  _state: month_format_numeric
month_format_month_only:
  _state: month_format_month_only
```

```yaml
- id: month_placeholder_default
  type: MonthSelector
  properties:
    title: Default Placeholder
    label:
      disabled: true
- id: month_placeholder_custom
  type: MonthSelector
  properties:
    title: Custom Placeholder
    placeholder: Pick a month...
    label:
      disabled: true
- id: month_placeholder_descriptive
  type: MonthSelector
  properties:
    title: Descriptive Placeholder
    placeholder: When did this start?
    label:
      disabled: true
- id: month_placeholder_format_hint
  type: MonthSelector
  properties:
    title: Format Hint Placeholder
    placeholder: e.g. January 2026
    format: MMMM YYYY
    label:
      disabled: true
```

```yaml
month_placeholder_default:
  _state: month_placeholder_default
month_placeholder_custom:
  _state: month_placeholder_custom
month_placeholder_descriptive:
  _state: month_placeholder_descriptive
month_placeholder_format_hint:
  _state: month_placeholder_format_hint
```

```yaml
- id: month_clear_enabled
  type: MonthSelector
  properties:
    title: Allow Clear (default)
    allowClear: true
    label:
      disabled: true
- id: month_clear_disabled
  type: MonthSelector
  properties:
    title: No Clear Button
    allowClear: false
    label:
      disabled: true
```

```yaml
month_clear_enabled:
  _state: month_clear_enabled
month_clear_disabled:
  _state: month_clear_disabled
```

```yaml
- id: month_today_enabled
  type: MonthSelector
  properties:
    title: Show Today (default)
    showToday: true
    label:
      disabled: true
- id: month_today_disabled
  type: MonthSelector
  properties:
    title: No Today Button
    showToday: false
    label:
      disabled: true
```

```yaml
month_today_enabled:
  _state: month_today_enabled
month_today_disabled:
  _state: month_today_disabled
```

```yaml
- id: month_icon_default
  type: MonthSelector
  properties:
    title: Default Calendar Icon
    label:
      disabled: true
- id: month_icon_clock
  type: MonthSelector
  properties:
    title: Clock Icon
    suffixIcon: AiOutlineClockCircle
    label:
      disabled: true
- id: month_icon_schedule
  type: MonthSelector
  properties:
    title: Schedule Icon
    suffixIcon: AiOutlineSchedule
    label:
      disabled: true
- id: month_icon_custom_color
  type: MonthSelector
  properties:
    title: Custom Color Icon
    suffixIcon:
      name: AiOutlineCalendar
      color: "#1677ff"
    label:
      disabled: true
- id: month_icon_heart
  type: MonthSelector
  properties:
    title: Heart Icon
    suffixIcon:
      name: AiOutlineHeart
      color: "#ff4d4f"
    label:
      disabled: true
```

```yaml
month_icon_default:
  _state: month_icon_default
month_icon_clock:
  _state: month_icon_clock
month_icon_schedule:
  _state: month_icon_schedule
month_icon_custom_color:
  _state: month_icon_custom_color
month_icon_heart:
  _state: month_icon_heart
```

```yaml
- id: month_disabled_default
  type: MonthSelector
  properties:
    title: Disabled
    disabled: true
    label:
      disabled: true
- id: month_disabled_outlined
  type: MonthSelector
  properties:
    title: Disabled Outlined
    disabled: true
    variant: outlined
    label:
      disabled: true
- id: month_disabled_filled
  type: MonthSelector
  properties:
    title: Disabled Filled
    disabled: true
    variant: filled
    label:
      disabled: true
- id: month_disabled_borderless
  type: MonthSelector
  properties:
    title: Disabled Borderless
    disabled: true
    variant: borderless
    label:
      disabled: true
```

```yaml
month_disabled_default:
  _state: month_disabled_default
month_disabled_outlined:
  _state: month_disabled_outlined
month_disabled_filled:
  _state: month_disabled_filled
month_disabled_borderless:
  _state: month_disabled_borderless
```

```yaml
- id: month_autofocus_off
  type: MonthSelector
  properties:
    title: No Auto Focus (default)
    autoFocus: false
    label:
      disabled: true
- id: month_autofocus_on
  type: MonthSelector
  properties:
    title: Auto Focus Enabled
    autoFocus: true
    label:
      disabled: true
```

```yaml
month_autofocus_off:
  _state: month_autofocus_off
month_autofocus_on:
  _state: month_autofocus_on
```

```yaml
- id: month_disabled_dates_min
  type: MonthSelector
  properties:
    title: Min Date (2024-01-01)
    disabledDates:
      min: 2024-01-01
    label:
      disabled: true
- id: month_disabled_dates_max
  type: MonthSelector
  properties:
    title: Max Date (2025-12-31)
    disabledDates:
      max: 2025-12-31
    label:
      disabled: true
- id: month_disabled_dates_range
  type: MonthSelector
  properties:
    title: Min & Max (2025 only)
    disabledDates:
      min: 2025-01-01
      max: 2025-12-31
    label:
      disabled: true
- id: month_disabled_specific
  type: MonthSelector
  properties:
    title: Specific Months Disabled
    disabledDates:
      dates:
        - 2026-03-01
        - 2026-06-01
        - 2026-12-01
    label:
      disabled: true
- id: month_disabled_date_ranges
  type: MonthSelector
  properties:
    title: Date Ranges Disabled
    disabledDates:
      ranges:
        - - 2026-04-01
          - 2026-06-30
        - - 2026-10-01
          - 2026-12-31
    label:
      disabled: true
```

```yaml
month_disabled_dates_min:
  _state: month_disabled_dates_min
month_disabled_dates_max:
  _state: month_disabled_dates_max
month_disabled_dates_range:
  _state: month_disabled_dates_range
month_disabled_specific:
  _state: month_disabled_specific
month_disabled_date_ranges:
  _state: month_disabled_date_ranges
```

```yaml
- id: ms_presets_relative
  type: MonthSelector
  properties:
    title: Relative Presets
    label:
      extra: Shortcuts are listed to the left of the calendar.
    presets:
      - label: This month
        value:
          _dayjs:
            - now
            - startOf: month
            - format: YYYY-MM-DD
      - label: Last month
        value:
          _dayjs:
            - now
            - subtract:
                - 1
                - month
            - format: YYYY-MM-DD
      - label: 3 months ago
        value:
          _dayjs:
            - now
            - subtract:
                - 3
                - months
            - format: YYYY-MM-DD
      - label: A year ago
        value:
          _dayjs:
            - now
            - subtract:
                - 1
                - year
            - format: YYYY-MM-DD
- id: ms_presets_fixed
  type: MonthSelector
  properties:
    title: Fixed Presets
    label:
      disabled: true
    presets:
      - label: Start of 2026
        value: 2026-01-01
      - label: Mid 2026
        value: 2026-07-01
      - label: End of 2026
        value: 2026-12-01
```

```yaml
- id: ms_presets_relative
  type: MonthSelector
  properties:
    title: Relative Presets
    label:
      extra: Shortcuts are listed to the left of the calendar.
    presets:
      - label: This month
        value:
          _dayjs:
            - now
            - startOf: month
            - format: YYYY-MM-DD
      - label: Last month
        value:
          _dayjs:
            - now
            - subtract:
                - 1
                - month
            - format: YYYY-MM-DD
      - label: 3 months ago
        value:
          _dayjs:
            - now
            - subtract:
                - 3
                - months
            - format: YYYY-MM-DD
      - label: A year ago
        value:
          _dayjs:
            - now
            - subtract:
                - 1
                - year
            - format: YYYY-MM-DD
- id: ms_presets_fixed
  type: MonthSelector
  properties:
    title: Fixed Presets
    label:
      disabled: true
    presets:
      - label: Start of 2026
        value: 2026-01-01
      - label: Mid 2026
        value: 2026-07-01
      - label: End of 2026
        value: 2026-12-01
```

```yaml
ms_presets_relative:
  _state: ms_presets_relative
ms_presets_fixed:
  _state: ms_presets_fixed
```

```yaml
- id: month_label_default
  type: MonthSelector
  properties:
    title: Default Label
- id: month_label_extra
  type: MonthSelector
  properties:
    title: Billing Month
    label:
      extra: Select the billing month for this invoice.
    placeholder: Select billing month
- id: month_label_inline_right
  type: MonthSelector
  properties:
    title: Inline Right-Aligned
    label:
      inline: true
      span: 8
      align: right
- id: month_label_hidden
  type: MonthSelector
  properties:
    title: Hidden Label
    label:
      disabled: true
    placeholder: No label shown
- id: month_label_feedback_on
  type: MonthSelector
  properties:
    title: With Feedback
    label:
      hasFeedback: true
  required: true
```

```yaml
month_label_default:
  _state: month_label_default
month_label_extra:
  _state: month_label_extra
month_label_inline_right:
  _state: month_label_inline_right
month_label_hidden:
  _state: month_label_hidden
month_label_feedback_on:
  _state: month_label_feedback_on
```

```yaml
- id: month_label_inline_4
  type: MonthSelector
  properties:
    title: Span 4
    label:
      inline: true
      span: 4
- id: month_label_inline_8
  type: MonthSelector
  properties:
    title: Span 8
    label:
      inline: true
      span: 8
- id: month_label_inline_12
  type: MonthSelector
  properties:
    title: Span 12
    label:
      inline: true
      span: 12
```

```yaml
month_label_inline_4:
  _state: month_label_inline_4
month_label_inline_8:
  _state: month_label_inline_8
month_label_inline_12:
  _state: month_label_inline_12
```

```yaml
- id: month_html_title_bold
  type: MonthSelector
  properties:
    title: <b>Bold</b> month selector
    label:
      disabled: true
- id: month_html_title_color
  type: MonthSelector
  properties:
    title: '<span style="color: #1677ff">Blue</span> month selector'
    label:
      disabled: true
- id: month_html_title_italic
  type: MonthSelector
  properties:
    title: <i>Italic</i> month selector
    label:
      disabled: true
```

```yaml
month_html_title_bold:
  _state: month_html_title_bold
month_html_title_color:
  _state: month_html_title_color
month_html_title_italic:
  _state: month_html_title_italic
```

```yaml
- id: month_style_width
  type: MonthSelector
  style:
    width: 300
  properties:
    title: Fixed Width (300px)
    label:
      disabled: true
- id: month_style_element
  type: MonthSelector
  style:
    .element: null
  properties:
    title: Custom Background
    label:
      disabled: true
- id: month_style_label
  type: MonthSelector
  style:
    .label:
      color: "#531dab"
      fontWeight: bold
  properties:
    title: Styled Label
```

```yaml
month_style_width:
  _state: month_style_width
month_style_element:
  _state: month_style_element
month_style_label:
  _state: month_style_label
```

```yaml
- id: month_class_rounded
  type: MonthSelector
  class: rounded-lg shadow-sm
  properties:
    title: Rounded with Shadow
    label:
      disabled: true
- id: month_class_border
  type: MonthSelector
  class: border-2 border-border
  properties:
    title: Blue Border
    label:
      disabled: true
```

```yaml
month_class_rounded:
  _state: month_class_rounded
month_class_border:
  _state: month_class_border
```

```yaml
- id: month_theme_primary_color
  type: MonthSelector
  properties:
    title: Custom Primary Color
    label:
      disabled: true
    theme:
      colorPrimary: "#722ed1"
- id: month_theme_large_radius
  type: MonthSelector
  properties:
    title: Large Border Radius
    label:
      disabled: true
    theme:
      borderRadius: 16
- id: month_theme_custom_bg
  type: MonthSelector
  properties:
    title: Custom Background
    variant: filled
    label:
      disabled: true
- id: month_theme_brand_color
  type: MonthSelector
  properties:
    title: Brand Purple
    label:
      disabled: true
    theme:
      colorPrimary: "#722ed1"
      colorBorder: "#d3adf7"
- id: month_theme_tall
  type: MonthSelector
  properties:
    title: Tall Input
    label:
      disabled: true
    theme:
      controlHeight: 48
      fontSize: 18
      borderRadius: 12
```

```yaml
month_theme_primary_color:
  _state: month_theme_primary_color
month_theme_large_radius:
  _state: month_theme_large_radius
month_theme_custom_bg:
  _state: month_theme_custom_bg
month_theme_brand_color:
  _state: month_theme_brand_color
month_theme_tall:
  _state: month_theme_tall
```

```yaml
- id: month_combined_full
  type: MonthSelector
  properties:
    title: Billing Period
    placeholder: Select billing month
    format: MMMM YYYY
    size: large
    suffixIcon: AiOutlineSchedule
    showToday: true
    allowClear: true
    label:
      extra: Choose the month for your billing cycle.
      colon: false
- id: month_combined_minimal
  type: MonthSelector
  properties:
    title: Month
    variant: borderless
    size: small
    allowClear: false
    showToday: false
    format: MM/YYYY
    placeholder: mm/yyyy
    label:
      disabled: true
- id: month_combined_restricted
  type: MonthSelector
  properties:
    title: Fiscal Year Month
    placeholder: Select fiscal month
    format: MMM YYYY
    suffixIcon:
      name: AiOutlineCalendar
      color: "#1677ff"
    disabledDates:
      min: 2026-01-01
      max: 2026-12-31
    label:
      extra: Only months in 2026 are available.
- id: month_combined_themed
  type: MonthSelector
  properties:
    title: Themed Picker
    variant: filled
    size: large
    format: MMMM YYYY
    placeholder: Choose a special month...
    suffixIcon:
      name: AiOutlineHeart
      color: "#eb2f96"
    label:
      disabled: true
    theme:
      colorPrimary: "#eb2f96"
      borderRadius: 20
      controlHeightLG: 48
      fontSize: 16
```

```yaml
month_combined_full:
  _state: month_combined_full
month_combined_minimal:
  _state: month_combined_minimal
month_combined_restricted:
  _state: month_combined_restricted
month_combined_themed:
  _state: month_combined_themed
```

```yaml
- id: applied2_budget_card
  type: Card
  properties:
    title: Monthly Budget Entry
  blocks:
    - id: applied2_budget_month
      type: MonthSelector
      properties:
        title: Budget Month
        placeholder: Select month
        format: MMMM YYYY
        size: large
        suffixIcon: AiOutlineCalendar
        label:
          extra: Choose the month for this budget entry.
    - id: applied2_budget_category
      type: Selector
      properties:
        title: Category
        placeholder: Select budget category...
        options:
          - label: Rent & Utilities
            value: rent
          - label: Groceries
            value: groceries
          - label: Transportation
            value: transport
          - label: Entertainment
            value: entertainment
          - label: Savings
            value: savings
          - label: Healthcare
            value: healthcare
    - id: applied2_budget_amount
      type: NumberInput
      properties:
        title: Amount
        placeholder: Enter amount
        label:
          extra: Enter the budgeted amount for this category.
    - id: applied2_budget_save_btn
      type: Button
      properties:
        title: Save Budget Entry
        icon: AiOutlineSave
        type: primary
        size: large
        block: true
      events:
        onClick:
          - id: save_budget_action
            type: DisplayMessage
            params:
              content: Budget entry saved successfully.
              duration: 3
```

```yaml
applied2_budget_card:
  _state: applied2_budget_card
```

```yaml
- id: applied3_billing_card
  type: Card
  properties:
    title: Subscription Billing Setup
  blocks:
    - id: applied3_billing_month
      type: MonthSelector
      properties:
        title: Billing Start Month
        placeholder: Select start month
        format: MMMM YYYY
        size: large
        suffixIcon: AiOutlineCalendar
        label:
          extra: Choose when the subscription billing begins.
        disabledDates:
          min: 2026-03-01
      events:
        onChange:
          - id: billing_month_change
            type: SetState
            params:
              billingMonthSelected: true
    - id: applied3_billing_plan
      type: Selector
      properties:
        title: Plan Type
        placeholder: Select a plan...
        options:
          - label: Basic - $9/mo
            value: basic
          - label: Professional - $29/mo
            value: professional
          - label: Enterprise - $99/mo
            value: enterprise
    - id: applied3_billing_confirm_btn
      type: Button
      properties:
        title: Confirm Subscription
        icon: AiOutlineCreditCard
        type: primary
        size: large
        block: true
      events:
        onClick:
          - id: confirm_billing_action
            type: DisplayMessage
            params:
              content: Subscription billing confirmed.
              duration: 3
```

```yaml
applied3_billing_card:
  _state: applied3_billing_card
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `allowClear` | boolean | `true` | Allow the user to clear their input. |
| `autoFocus` | boolean | `false` | Autofocus to the block on page load. |
| `bordered` | boolean | `true` | Deprecated - use variant: 'borderless'. Whether or not the input has a border style. |
| `disabled` | boolean | `false` | Disable the block if true. |
| `variant` | string | `"outlined"` | Variant style of the input. Use 'borderless' instead of bordered: false. Enum: `outlined`, `filled`, `borderless`. |
| `disabledDates` | object | - | Disable specific dates so that they can not be chosen. |
| `disabledDates.min` | string \| object | - | Disable all dates less than the minimum date. Can be a date string or a _date object. |
| `disabledDates.max` | string \| object | - | Disable all dates greater than the maximum date. Can be a date string or a _date object. |
| `disabledDates.dates` | array | - | Array of specific dates to disable. |
| `disabledDates.ranges` | array | - | Array of date ranges to disable. A range is an object with a from and a to date, or an array of the two dates. |
| `disabledDates.ranges.$.from` | string \| object | - | Start of the disabled range. |
| `disabledDates.ranges.$.to` | string \| object | - | End of the disabled range. |
| `format` | string | - | Format in which to format the date value, eg. "MMMM YYYY" will format a date value of 1999-12-31 as "December 1999". The format has to conform to dayjs formats. Defaults to the active locale's month format, or "YYYY-MM" when no locale is configured. |
| `placeholder` | string | - | Placeholder text inside the block before user types input. |
| `presets` | array | - | Shortcuts listed next to the calendar to quickly select a month. Presets are re-evaluated every time the block config is evaluated, so operator based values like "_date: now" stay current. A preset is offered on the same terms as the calendar cells: a shortcut with nothing it may select is listed as disabled. |
| `presets.$.label` | string | - | Text shown for the shortcut - supports html. |
| `presets.$.value` | string \| number \| object | - | A date string, a timestamp, or a _date object. Dates are read as UTC, the same as the block value, so a fixed date like "2026-01-01" resolves to the same month in every timezone. A date relative to now is an instant, not a calendar date, so end a _dayjs chain with a format step to pin it to the local calendar: "_dayjs: [now, {startOf: month}, {format: YYYY-MM-DD}]". Without the format step the chain resolves to an instant, which can select the month before or after the current one, depending on the browser timezone and the time of day. |
| `showToday` | boolean | `true` | Shows a button to easily select the current date if true. |
| `size` | string | `"default"` | Size of the block. Enum: `small`, `default`, `large`. |
| `suffixIcon` | string \| object | `"AiOutlineCalendar"` | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon on right-hand side of the date picker. |
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
| `title` | string | - | Month selector label title - supports html. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design date-picker tokens](https://ant.design/components/date-picker#design-token). |
| `theme.activeBorderColor` | string | - | Border color when the picker is active/focused. |
| `theme.activeShadow` | string | - | Shadow effect when the picker is active/focused. |
| `theme.hoverBorderColor` | string | - | Border color when hovering over the picker. |
| `theme.cellHeight` | number | `24` | Height of a calendar cell. |
| `theme.cellWidth` | number | `36` | Width of a calendar cell. |
| `theme.cellHoverBg` | string | `"rgba(0, 0, 0, 0.04)"` | Background color of a calendar cell on hover. |
| `theme.cellActiveWithRangeBg` | string | `"#e6f4ff"` | Background color of active cell within a range selection. |
| `theme.cellHoverWithRangeBg` | string | - | Background color of cells within range on hover. |
| `theme.cellBgDisabled` | string | - | Background color of disabled cells. |
| `theme.cellRangeBorderColor` | string | - | Border color of range selection cells. |
| `theme.addonBg` | string | `"rgba(0, 0, 0, 0.02)"` | Background color of the footer addon area. |
| `theme.zIndexPopup` | number | `1050` | Z-index of the picker popup layer. |
| `theme.paddingBlock` | number | `4` | Vertical padding for the default size picker. |
| `theme.paddingBlockSM` | number | `0` | Vertical padding for the small size picker. |
| `theme.paddingBlockLG` | number | `7` | Vertical padding for the large size picker. |
| `theme.paddingInline` | number | `11` | Horizontal padding for the default size picker. |
| `theme.paddingInlineSM` | number | `7` | Horizontal padding for the small size picker. |
| `theme.paddingInlineLG` | number | `11` | Horizontal padding for the large size picker. |
| `theme.borderRadius` | number | `6` | Border radius of the picker input. |
| `theme.borderRadiusSM` | number | `4` | Border radius for the small picker. |
| `theme.borderRadiusLG` | number | `8` | Border radius for the large picker and popup panel. |
| `theme.controlHeight` | number | `32` | Height of the picker input. |
| `theme.controlHeightSM` | number | `24` | Height of the small picker input. |
| `theme.controlHeightLG` | number | `40` | Height of the large picker input. |
| `theme.fontSize` | number | `14` | Font size of the picker input. |
| `theme.fontSizeSM` | number | `14` | Font size for the small picker. |
| `theme.fontSizeLG` | number | `16` | Font size for the large picker. |
| `theme.lineWidth` | number | `1` | Border width of the picker input. |
| `theme.colorPrimary` | string | - | Primary color used for selected month and active states. |
| `theme.colorBgContainer` | string | - | Background color of the picker input. |
| `theme.colorText` | string | - | Text color of the picker input and calendar cells. |
| `theme.colorBorder` | string | - | Border color of the picker input. |
| `theme.colorTextPlaceholder` | string | - | Color of the placeholder text. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | `{ value: any }` | Trigger actions when selection is changed. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The MonthSelector element. |
| `/label` | The MonthSelector label. |
| `/extra` | The MonthSelector extra content. |
| `/feedback` | The MonthSelector validation feedback. |
| `/popup` | The MonthSelector popup. |
| `/suffixIcon` | The suffix icon in the MonthSelector. |

No slots defined.
