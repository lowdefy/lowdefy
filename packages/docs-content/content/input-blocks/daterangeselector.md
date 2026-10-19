# DateRangeSelector

Date range picker for selecting start and end dates.

```yaml
- id: drs_size_small
  type: DateRangeSelector
  properties:
    title: Small
    size: small
- id: drs_size_default
  type: DateRangeSelector
  properties:
    title: Default
- id: drs_size_large
  type: DateRangeSelector
  properties:
    title: Large
    size: large
```

```yaml
- id: drs_variant_outlined
  type: DateRangeSelector
  properties:
    title: Outlined (default)
    variant: outlined
    label:
      disabled: true
- id: drs_variant_filled
  type: DateRangeSelector
  properties:
    title: Filled
    variant: filled
    label:
      disabled: true
- id: drs_variant_borderless
  type: DateRangeSelector
  properties:
    title: Borderless
    variant: borderless
    label:
      disabled: true
- id: drs_variant_underlined
  type: DateRangeSelector
  properties:
    title: Underlined
    variant: underlined
    label:
      disabled: true
```

```yaml
- id: drs_format_iso
  type: DateRangeSelector
  properties:
    title: YYYY-MM-DD (ISO)
    format: YYYY-MM-DD
    label:
      disabled: true
- id: drs_format_slash
  type: DateRangeSelector
  properties:
    title: DD/MM/YYYY
    format: DD/MM/YYYY
    label:
      disabled: true
- id: drs_format_us
  type: DateRangeSelector
  properties:
    title: MM/DD/YYYY (US)
    format: MM/DD/YYYY
    label:
      disabled: true
- id: drs_format_long
  type: DateRangeSelector
  properties:
    title: DD MMMM YYYY
    format: DD MMMM YYYY
    label:
      disabled: true
- id: drs_format_dot
  type: DateRangeSelector
  properties:
    title: DD.MM.YYYY
    format: DD.MM.YYYY
    label:
      disabled: true
```

```yaml
- id: drs_ph_default
  type: DateRangeSelector
  properties:
    title: Default Placeholders
    label:
      disabled: true
- id: drs_ph_custom
  type: DateRangeSelector
  properties:
    title: Custom Placeholders
    placeholder:
      - From
      - To
    label:
      disabled: true
- id: drs_ph_hotel
  type: DateRangeSelector
  properties:
    title: Hotel Booking
    placeholder:
      - Check-in date
      - Check-out date
    label:
      disabled: true
- id: drs_ph_project
  type: DateRangeSelector
  properties:
    title: Project Timeline
    placeholder:
      - Start date
      - End date
    label:
      disabled: true
- id: drs_ph_report
  type: DateRangeSelector
  properties:
    title: Report Period
    placeholder:
      - Period start
      - Period end
    label:
      disabled: true
```

```yaml
- id: drs_sep_tilde
  type: DateRangeSelector
  properties:
    title: Tilde (default)
    separator: "~"
    label:
      disabled: true
- id: drs_sep_dash
  type: DateRangeSelector
  properties:
    title: Dash
    separator: "-"
    label:
      disabled: true
- id: drs_sep_to
  type: DateRangeSelector
  properties:
    title: Text "to"
    separator: to
    label:
      disabled: true
- id: drs_sep_arrow
  type: DateRangeSelector
  properties:
    title: Arrow
    separator: →
    label:
      disabled: true
- id: drs_sep_pipe
  type: DateRangeSelector
  properties:
    title: Pipe
    separator: "|"
    label:
      disabled: true
```

```yaml
- id: drs_icon_default
  type: DateRangeSelector
  properties:
    title: Default Calendar Icon
    label:
      disabled: true
- id: drs_icon_clock
  type: DateRangeSelector
  properties:
    title: Clock Icon
    suffixIcon: clock
    label:
      disabled: true
- id: drs_icon_schedule
  type: DateRangeSelector
  properties:
    title: Schedule Icon
    suffixIcon: CalendarDays
    label:
      disabled: true
- id: drs_icon_custom_color
  type: DateRangeSelector
  properties:
    title: Custom Color Icon
    suffixIcon:
      name: calendar
      color: "#1677ff"
    label:
      disabled: true
- id: drs_icon_heart
  type: DateRangeSelector
  properties:
    title: Heart Icon
    suffixIcon:
      name: heart
      color: "#ff4d4f"
    label:
      disabled: true
```

```yaml
- id: drs_prefix_icon
  type: DateRangeSelector
  properties:
    title: Prefix Icon
    prefixIcon: clock
    suffixIcon:
      name: calendar
      color: "#8c8c8c"
- id: drs_prefix_text
  type: DateRangeSelector
  properties:
    title: Prefix Text
    prefix: "From:"
- id: drs_placement
  type: DateRangeSelector
  properties:
    title: Popup Opens Top Right
    placement: topRight
- id: drs_read_only
  type: DateRangeSelector
  properties:
    title: Pick From Calendar Only
    inputReadOnly: true
    label:
      extra: The input is read-only, so touch devices do not open the keyboard.
```

```yaml
- id: drs_open_end
  type: DateRangeSelector
  properties:
    title: Start Date, Optional End
    allowEmpty:
      - false
      - true
    label:
      extra: Leave the end date empty for an ongoing range.
- id: drs_fixed_start
  type: DateRangeSelector
  properties:
    title: Fixed Start Date
    disabled:
      - true
      - false
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          drs_fixed_start:
            - _date: 2026-01-01
            - _date: 2026-01-31
- id: drs_show_week
  type: DateRangeSelector
  properties:
    title: Show Week Numbers
    showWeek: true
```

```yaml
- id: drs_dis_default
  type: DateRangeSelector
  properties:
    title: Disabled
    disabled: true
    label:
      disabled: true
- id: drs_dis_outlined
  type: DateRangeSelector
  properties:
    title: Disabled Outlined
    disabled: true
    variant: outlined
    label:
      disabled: true
- id: drs_dis_filled
  type: DateRangeSelector
  properties:
    title: Disabled Filled
    disabled: true
    variant: filled
    label:
      disabled: true
- id: drs_dis_borderless
  type: DateRangeSelector
  properties:
    title: Disabled Borderless
    disabled: true
    variant: borderless
    label:
      disabled: true
```

```yaml
- id: drs_dd_min
  type: DateRangeSelector
  properties:
    title: Min Date (2024-01-01)
    disabledDates:
      min: 2024-01-01
    label:
      disabled: true
- id: drs_dd_range
  type: DateRangeSelector
  properties:
    title: Min & Max (2024 only)
    disabledDates:
      min: 2024-01-01
      max: 2024-12-31
    label:
      disabled: true
- id: drs_dd_specific
  type: DateRangeSelector
  properties:
    title: Specific Dates Disabled
    disabledDates:
      dates:
        - 2026-03-15
        - 2026-03-20
        - 2026-03-25
    label:
      disabled: true
- id: drs_dd_ranges
  type: DateRangeSelector
  properties:
    title: Date Ranges Disabled
    disabledDates:
      ranges:
        - - 2026-03-10
          - 2026-03-14
        - - 2026-03-20
          - 2026-03-24
    label:
      disabled: true
```

```yaml
- id: drs_presets_relative
  type: DateRangeSelector
  properties:
    title: Relative Ranges
    label:
      extra: Shortcuts are listed to the left of the calendar.
    presets:
      - label: Last 7 Days
        value:
          - _dayjs:
              - now
              - subtract:
                  - 7
                  - days
              - format: YYYY-MM-DD
          - _dayjs:
              - now
              - format: YYYY-MM-DD
      - label: Last 14 Days
        value:
          - _dayjs:
              - now
              - subtract:
                  - 14
                  - days
              - format: YYYY-MM-DD
          - _dayjs:
              - now
              - format: YYYY-MM-DD
      - label: Last 30 Days
        value:
          - _dayjs:
              - now
              - subtract:
                  - 30
                  - days
              - format: YYYY-MM-DD
          - _dayjs:
              - now
              - format: YYYY-MM-DD
      - label: Last 90 Days
        value:
          - _dayjs:
              - now
              - subtract:
                  - 90
                  - days
              - format: YYYY-MM-DD
          - _dayjs:
              - now
              - format: YYYY-MM-DD
- id: drs_presets_to_date
  type: DateRangeSelector
  properties:
    title: Period To Date
    label:
      disabled: true
    presets:
      - label: Week to date
        value:
          - _dayjs:
              - now
              - startOf: week
              - format: YYYY-MM-DD
          - _dayjs:
              - now
              - format: YYYY-MM-DD
      - label: Month to date
        value:
          - _dayjs:
              - now
              - startOf: month
              - format: YYYY-MM-DD
          - _dayjs:
              - now
              - format: YYYY-MM-DD
      - label: Year to date
        value:
          - _dayjs:
              - now
              - startOf: year
              - format: YYYY-MM-DD
          - _dayjs:
              - now
              - format: YYYY-MM-DD
- id: drs_presets_fixed
  type: DateRangeSelector
  properties:
    title: Fixed Ranges
    label:
      disabled: true
    presets:
      - label: 2026 Q1
        value:
          - 2026-01-01
          - 2026-03-31
      - label: 2026 Q2
        value:
          - 2026-04-01
          - 2026-06-30
      - label: 2026 Q3
        value:
          - 2026-07-01
          - 2026-09-30
      - label: 2026 Q4
        value:
          - 2026-10-01
          - 2026-12-31
- id: drs_presets_html_label
  type: DateRangeSelector
  properties:
    title: Html Labels
    label:
      disabled: true
    presets:
      - label: <b>Today</b>
        value:
          - _dayjs:
              - now
              - format: YYYY-MM-DD
          - _dayjs:
              - now
              - format: YYYY-MM-DD
      - label: '<span style="color: #1677ff">This month</span>'
        value:
          - _dayjs:
              - now
              - startOf: month
              - format: YYYY-MM-DD
          - _dayjs:
              - now
              - endOf: month
              - format: YYYY-MM-DD
- id: drs_presets_disabled_dates
  type: DateRangeSelector
  properties:
    title: Presets And Disabled Dates
    label:
      extra: Future dates are disabled. "Last 7 days" selects the allowed part of the
        range, and "Next 7 days" has nothing to select, so it is listed as
        disabled.
    disabledDates:
      min: 2026-01-01
      max:
        _dayjs:
          - now
          - format: YYYY-MM-DD
    presets:
      - label: Last 7 days
        value:
          - _dayjs:
              - now
              - subtract:
                  - 7
                  - days
              - format: YYYY-MM-DD
          - _dayjs:
              - now
              - add:
                  - 7
                  - days
              - format: YYYY-MM-DD
      - label: Next 7 days
        value:
          - _dayjs:
              - now
              - add:
                  - 1
                  - day
              - format: YYYY-MM-DD
          - _dayjs:
              - now
              - add:
                  - 7
                  - days
              - format: YYYY-MM-DD
```

```yaml
- id: drs_label_default
  type: DateRangeSelector
  properties:
    title: Default Label
- id: drs_label_colon_off
  type: DateRangeSelector
  properties:
    title: No Colon
    label:
      colon: false
- id: drs_label_right
  type: DateRangeSelector
  properties:
    title: Align Right
    label:
      align: right
- id: drs_label_inline
  type: DateRangeSelector
  properties:
    title: Inline Label
    label:
      inline: true
      span: 8
- id: drs_label_extra
  type: DateRangeSelector
  properties:
    title: Travel Dates
    label:
      extra: Select your departure and return dates.
    placeholder:
      - Departure
      - Return
- id: drs_label_extra_html
  type: DateRangeSelector
  properties:
    title: Contract Period
    label:
      extra: Choose the <b>start</b> and <b>end</b> dates for the contract.
    placeholder:
      - Contract start
      - Contract end
- id: drs_label_hidden
  type: DateRangeSelector
  properties:
    title: Hidden Label
    label:
      disabled: true
    placeholder:
      - Start
      - End
- id: drs_label_allow_clear
  type: DateRangeSelector
  properties:
    title: No Clear Button
    allowClear: false
```

```yaml
- id: drs_label_inline_4
  type: DateRangeSelector
  properties:
    title: Span 4
    label:
      inline: true
      span: 4
- id: drs_label_inline_8
  type: DateRangeSelector
  properties:
    title: Span 8
    label:
      inline: true
      span: 8
- id: drs_label_inline_12
  type: DateRangeSelector
  properties:
    title: Span 12
    label:
      inline: true
      span: 12
```

```yaml
- id: drs_html_bold
  type: DateRangeSelector
  properties:
    title: <b>Bold</b> date range selector
    label:
      disabled: true
- id: drs_html_color
  type: DateRangeSelector
  properties:
    title: '<span style="color: #1677ff">Blue</span> date range selector'
    label:
      disabled: true
- id: drs_html_italic
  type: DateRangeSelector
  properties:
    title: <i>Italic</i> date range selector
    label:
      disabled: true
```

```yaml
- id: drs_style_width
  type: DateRangeSelector
  style:
    width: 500
  properties:
    title: Fixed Width (500px)
    label:
      disabled: true
- id: drs_style_narrow
  type: DateRangeSelector
  style:
    width: 350
  properties:
    title: Narrow Width (350px)
    label:
      disabled: true
- id: drs_style_element
  type: DateRangeSelector
  style:
    .element:
      backgroundColor: var(--ant-color-primary-bg)
  properties:
    title: Custom Background
    label:
      disabled: true
- id: drs_style_label
  type: DateRangeSelector
  style:
    .label:
      color: "#531dab"
      fontWeight: bold
  properties:
    title: Styled Label
```

```yaml
- id: drs_class_rounded
  type: DateRangeSelector
  class: rounded-lg shadow-sm
  properties:
    title: Rounded with Shadow
    label:
      disabled: true
- id: drs_class_border
  type: DateRangeSelector
  class: border-2 border-border
  properties:
    title: Blue Border
    label:
      disabled: true
- id: drs_class_shadow
  type: DateRangeSelector
  class: shadow-md
  properties:
    title: Medium Shadow
    label:
      disabled: true
```

```yaml
- id: drs_theme_primary
  type: DateRangeSelector
  properties:
    title: Custom Primary Color
    label:
      disabled: true
    theme:
      colorPrimary: "#722ed1"
- id: drs_theme_radius
  type: DateRangeSelector
  properties:
    title: Large Border Radius
    label:
      disabled: true
    theme:
      borderRadius: 16
- id: drs_theme_bg
  type: DateRangeSelector
  properties:
    title: Custom Background
    variant: filled
    label:
      disabled: true
- id: drs_theme_brand
  type: DateRangeSelector
  properties:
    title: Brand Purple
    label:
      disabled: true
    theme:
      colorPrimary: "#722ed1"
      colorBorder: "#d3adf7"
- id: drs_theme_cell_range
  type: DateRangeSelector
  properties:
    title: Green Range Background
    label:
      disabled: true
    theme:
      colorPrimary: "#52c41a"
```

```yaml
- id: drs_combo_hotel
  type: DateRangeSelector
  properties:
    title: Hotel Booking
    placeholder:
      - Check-in date
      - Check-out date
    format: DD MMMM YYYY
    size: large
    separator: →
    suffixIcon: CalendarDays
    allowClear: true
    label:
      extra: Select your check-in and check-out dates.
      colon: false
- id: drs_combo_minimal
  type: DateRangeSelector
  properties:
    title: Date Range
    variant: borderless
    size: small
    allowClear: false
    format: DD/MM/YYYY
    separator: "-"
    placeholder:
      - From
      - To
    label:
      disabled: true
- id: drs_combo_restricted
  type: DateRangeSelector
  properties:
    title: Event Registration
    placeholder:
      - Event start
      - Event end
    format: DD MMM YYYY
    suffixIcon:
      name: calendar
      color: "#1677ff"
    disabledDates:
      min: 2026-01-01
      max: 2026-12-31
    label:
      extra: Only dates in 2026 are available.
- id: drs_combo_themed
  type: DateRangeSelector
  properties:
    title: Themed Picker
    variant: filled
    size: large
    format: DD MMMM YYYY
    separator: →
    placeholder:
      - Start date
      - End date
    suffixIcon:
      name: heart
      color: "#eb2f96"
    label:
      disabled: true
    theme:
      colorPrimary: "#eb2f96"
      borderRadius: 20
      controlHeightLG: 48
      fontSize: 16
- id: drs_combo_contract
  type: DateRangeSelector
  properties:
    title: Contract Period
    placeholder:
      - Contract start
      - Contract end
    format: DD MMM YYYY
    separator: to
    variant: outlined
    size: large
    suffixIcon:
      name: Flag
      color: "#722ed1"
    label:
      extra: Specify the <b>full duration</b> of the contract.
      inline: true
      span: 6
    theme:
      colorPrimary: "#722ed1"
      borderRadius: 8
      activeShadow: 0 0 0 3px rgba(114, 46, 209, 0.12)
```

```yaml
- id: applied2_report_card
  type: Card
  properties:
    title: Generate Report
  blocks:
    - id: applied2_report_date_range
      type: DateRangeSelector
      properties:
        title: Report Period
        placeholder:
          - Start date
          - End date
        format: DD MMM YYYY
        separator: →
        size: large
        label:
          extra: Select the date range for your report.
    - id: applied2_report_type
      type: Selector
      properties:
        title: Report Type
        placeholder: Select report type...
        options:
          - label: Financial Summary
            value: financial
          - label: Sales Overview
            value: sales
          - label: Inventory Report
            value: inventory
          - label: Employee Performance
            value: performance
    - id: applied2_report_format
      type: Selector
      properties:
        title: Output Format
        placeholder: Select format...
        options:
          - label: PDF
            value: pdf
          - label: Excel
            value: xlsx
          - label: CSV
            value: csv
    - id: applied2_report_generate_btn
      type: Button
      properties:
        title: Generate Report
        icon: document
        type: primary
        size: large
        block: true
      events:
        onClick:
          - id: generate_report_action
            type: DisplayMessage
            params:
              content: Report generation started. You will be notified when it is ready.
              duration: 3
```

```yaml
- id: applied3_vacation_card
  type: Card
  properties:
    title: Request Vacation
  blocks:
    - id: applied3_vacation_dates
      type: DateRangeSelector
      properties:
        title: Vacation Dates
        placeholder:
          - Leave date
          - Return date
        format: DD MMM YYYY
        separator: →
        size: large
        disabledDates:
          min: 2026-03-14
        label:
          extra: Select the first and last day of your vacation.
      events:
        onChange:
          - id: vacation_dates_changed
            type: DisplayMessage
            params:
              content: Vacation dates updated.
              duration: 2
    - id: applied3_vacation_notes
      type: TextArea
      properties:
        title: Notes
        placeholder: Any additional details for your manager...
        rows: 3
    - id: applied3_vacation_submit_btn
      type: Button
      properties:
        title: Submit Request
        icon: send
        type: primary
        size: large
        block: true
      events:
        onClick:
          - id: vacation_validate_action
            type: Validate
            params: applied3_vacation_dates
          - id: vacation_submit_message
            type: DisplayMessage
            params:
              content: Vacation request submitted for approval.
              duration: 3
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `allowClear` | boolean | `true` | Allow the user to clear their input. |
| `allowEmpty` | array | `[false,false]` | Allow the start or the end date to be left empty, for an open-ended range. An empty date is null in the block value. |
| `autoFocus` | boolean | `false` | Autofocus to the block on page load. |
| `bordered` | boolean | `true` | Deprecated - use variant: 'borderless'. Whether or not the input has a border style. |
| `disabled` | boolean \| array | - | Disable the block if true. An array of two booleans disables only the start or the end input, eg. [true, false] to fix the start date. A disabled input needs a value, or allowEmpty for that input. |
| `variant` | string | `"outlined"` | Variant style of the input. Use 'borderless' instead of bordered: false. Enum: `outlined`, `filled`, `borderless`, `underlined`. |
| `disabledDates` | object | - | Disable specific dates so that they can not be chosen. |
| `disabledDates.min` | string \| object | - | Disable all dates less than the minimum date. Can be a date string or a _date object. |
| `disabledDates.max` | string \| object | - | Disable all dates greater than the maximum date. Can be a date string or a _date object. |
| `disabledDates.dates` | array | - | Array of specific dates to disable. |
| `disabledDates.ranges` | array | - | Array of date ranges to disable. A range is an object with a from and a to date, or an array of the two dates. |
| `disabledDates.ranges.$.from` | string \| object | - | Start of the disabled range. |
| `disabledDates.ranges.$.to` | string \| object | - | End of the disabled range. |
| `format` | string | - | Format in which to parse the date value, eg. "DD MMMM YYYY" will parse a date value of 1999-12-31 as "31 December 1999". The format has to conform to dayjs formats. Defaults to the active locale's date format, or "YYYY-MM-DD" when no locale is configured. |
| `inputReadOnly` | boolean | `false` | Make the text input read-only, so a date can only be chosen from the calendar. This also stops the on-screen keyboard opening on touch devices. |
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
| `placeholder` | array | - | Placeholder text inside the block before user types input. When unset, antd uses the localized default from ConfigProvider locale. |
| `placement` | string | `"bottomLeft"` | Position of the calendar popup relative to the input. Enum: `bottomLeft`, `bottomRight`, `topLeft`, `topRight`. |
| `prefix` | string | - | Prefix text shown before the date in the input, priority over prefixIcon. |
| `prefixIcon` | string \| object | - | Icon name (a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`) or properties of an Icon block to customize icon on the left-hand side of the date picker. |
| `prefixIcon.name` | string | - | Icon name: a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`. |
| `prefixIcon.color` | string | - | Icon color. |
| `prefixIcon.size` | string \| number | - | Size of the icon. Defaults to `theme.icons.size`. |
| `prefixIcon.rotate` | number | - | Number of degrees to rotate the icon. |
| `prefixIcon.spin` | boolean | - | Continuously spin the icon with animation. |
| `prefixIcon.strokeWidth` | number | - | Stroke width of the icon lines, in pixels of the 24px icon grid. Defaults to `theme.icons.strokeWidth` (2). |
| `prefixIcon.nonScalingStroke` | boolean | - | Keep the stroke width constant at any icon size. Defaults to `theme.icons.nonScalingStroke`. |
| `prefixIcon.title` | string | - | Icon hover title for accessibility. An empty string marks the icon as decorative. |
| `prefixIcon.disableLoadingIcon` | boolean | - | While loading after the icon has been clicked, don't render the loading icon. |
| `presets` | array | - | Shortcuts listed next to the calendar to quickly select a date range. Presets are re-evaluated every time the block config is evaluated, so operator based values like "_date: now" stay current. A preset is offered on the same terms as the calendar cells: a range that starts or ends on a date disabledDates disables is narrowed to the dates it may select, so a "Last 7 days" shortcut still selects the allowed part of the last 7 days. A shortcut with nothing it may select is listed as disabled. |
| `presets.$.label` | string | - | Text shown for the shortcut - supports html. |
| `presets.$.value` | array | - | The start and end date of the range. A date string, a timestamp, or a _date object. Dates are read as UTC, the same as the block value, so a fixed date like "2026-01-01" resolves to the same day in every timezone. A date relative to now is an instant, not a calendar date, so end a _dayjs chain with a format step to pin it to the local calendar: "_dayjs: [now, {subtract: [7, days]}, {format: YYYY-MM-DD}]". Without the format step the chain resolves to an instant, which can select the day before or after the current one, depending on the browser timezone and the time of day. |
| `separator` | string | `"~"` | Separator symbol shown between start and end date inputs. |
| `showWeek` | boolean | `false` | Show the week number of each row in the calendar. |
| `size` | string | `"default"` | Size of the block. Enum: `small`, `default`, `large`. |
| `suffixIcon` | string \| object | `"calendar"` | Icon name (a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`) or properties of an Icon block to customize icon on right-hand side of the date picker. |
| `suffixIcon.name` | string | - | Icon name: a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`. |
| `suffixIcon.color` | string | - | Icon color. |
| `suffixIcon.size` | string \| number | - | Size of the icon. Defaults to `theme.icons.size`. |
| `suffixIcon.rotate` | number | - | Number of degrees to rotate the icon. |
| `suffixIcon.spin` | boolean | - | Continuously spin the icon with animation. |
| `suffixIcon.strokeWidth` | number | - | Stroke width of the icon lines, in pixels of the 24px icon grid. Defaults to `theme.icons.strokeWidth` (2). |
| `suffixIcon.nonScalingStroke` | boolean | - | Keep the stroke width constant at any icon size. Defaults to `theme.icons.nonScalingStroke`. |
| `suffixIcon.title` | string | - | Icon hover title for accessibility. An empty string marks the icon as decorative. |
| `suffixIcon.disableLoadingIcon` | boolean | - | While loading after the icon has been clicked, don't render the loading icon. |
| `title` | string | - | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design date-picker tokens](https://ant.design/components/date-picker#design-token). |
| `theme.activeBg` | string | `"#ffffff"` | Background color of the input when the picker is active/focused. |
| `theme.activeBorderColor` | string | - | Border color when the picker is active/focused. |
| `theme.activeShadow` | string | `"0 0 0 2px rgba(5,145,255,0.1)"` | Shadow effect when the picker is active/focused. |
| `theme.borderRadius` | number | `6` | Border radius of the picker input. |
| `theme.borderRadiusLG` | number | `8` | Border radius for the large picker and popup panel. |
| `theme.borderRadiusSM` | number | `4` | Border radius for the small picker. |
| `theme.cellActiveWithRangeBg` | string | `"#e6f4ff"` | Background color of cells within the selected range. |
| `theme.cellBgDisabled` | string | `"rgba(0,0,0,0.04)"` | Background color of disabled cells. |
| `theme.cellHeight` | number | `24` | Height of a calendar cell. |
| `theme.cellHoverBg` | string | `"rgba(0, 0, 0, 0.04)"` | Background color of a calendar cell on hover. |
| `theme.cellHoverWithRangeBg` | string | `"#cbe0fd"` | Background color of cells within range on hover. |
| `theme.cellRangeBorderColor` | string | `"#82b4f9"` | Border color of range selection cells. |
| `theme.cellWidth` | number | `36` | Width of a calendar cell. |
| `theme.colorBgContainer` | string | - | Background color of the picker input. |
| `theme.colorBorder` | string | - | Border color of the picker input. |
| `theme.colorPrimary` | string | - | Primary color used for the selected date and active states. |
| `theme.colorText` | string | - | Text color of the picker input and calendar cells. |
| `theme.colorTextPlaceholder` | string | - | Color of the placeholder text. |
| `theme.controlHeight` | number | `32` | Height of the picker input. |
| `theme.controlHeightLG` | number | `40` | Height of the large picker input. |
| `theme.controlHeightSM` | number | `24` | Height of the small picker input. |
| `theme.errorActiveShadow` | string | `"0 0 0 2px rgba(255,38,5,0.06)"` | Shadow effect when the picker has error status and is focused. |
| `theme.fontSize` | number | `14` | Font size of the picker input. |
| `theme.fontSizeLG` | number | `16` | Font size for the large picker. |
| `theme.fontSizeSM` | number | `14` | Font size for the small picker. |
| `theme.hoverBg` | string | `"#ffffff"` | Background color of the input when hovering over the picker. |
| `theme.hoverBorderColor` | string | - | Border color when hovering over the picker. |
| `theme.lineWidth` | number | `1` | Border width of the picker input. |
| `theme.paddingBlock` | number | `4` | Vertical padding for the default size picker. |
| `theme.paddingBlockLG` | number | `7` | Vertical padding for the large size picker. |
| `theme.paddingBlockSM` | number | `0` | Vertical padding for the small size picker. |
| `theme.paddingInline` | number | `11` | Horizontal padding for the default size picker. |
| `theme.paddingInlineLG` | number | `11` | Horizontal padding for the large size picker. |
| `theme.paddingInlineSM` | number | `7` | Horizontal padding for the small size picker. |
| `theme.presetsMaxWidth` | number | `200` | Maximum width of the presets list next to the calendar. |
| `theme.presetsWidth` | number | `120` | Width of the presets list next to the calendar. |
| `theme.timeCellHeight` | number | `28` | Height of a time cell in the time panel. |
| `theme.timeColumnHeight` | number | `224` | Height of the time panel column. |
| `theme.timeColumnWidth` | number | `56` | Width of the time panel column. |
| `theme.warningActiveShadow` | string | `"0 0 0 2px rgba(255,215,5,0.1)"` | Shadow effect when the picker has warning status and is focused. |
| `theme.withoutTimeCellHeight` | number | `66` | Height of the cells of the month, week, quarter, year and decade panels. |
| `theme.zIndexPopup` | number | `1050` | Z-index of the picker popup layer. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onBlur` | `{ range }` | Trigger actions when the picker loses focus. |
| `onClear` | \- | Trigger actions when the clear button is clicked. |
| `onFocus` | `{ range }` | Trigger actions when the picker gets focus. |
| `onOpenChange` | `{ open }` | Trigger actions when the calendar popup opens or closes. |
| `onChange` | `{ value }` | Trigger actions when selection is changed. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The DateRangeSelector element. |
| `/label` | The DateRangeSelector label. |
| `/extra` | The DateRangeSelector extra content. |
| `/feedback` | The DateRangeSelector validation feedback. |
| `/popup` | The DateRangeSelector popup. |
| `/prefixIcon` | The prefix icon in the DateRangeSelector. |
| `/suffixIcon` | The suffix icon in the DateRangeSelector. |

No slots defined.
