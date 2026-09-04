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
drs_size_small:
  _state: drs_size_small
drs_size_default:
  _state: drs_size_default
drs_size_large:
  _state: drs_size_large
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
```

```yaml
drs_variant_outlined:
  _state: drs_variant_outlined
drs_variant_filled:
  _state: drs_variant_filled
drs_variant_borderless:
  _state: drs_variant_borderless
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
drs_format_iso:
  _state: drs_format_iso
drs_format_slash:
  _state: drs_format_slash
drs_format_us:
  _state: drs_format_us
drs_format_long:
  _state: drs_format_long
drs_format_dot:
  _state: drs_format_dot
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
drs_ph_default:
  _state: drs_ph_default
drs_ph_custom:
  _state: drs_ph_custom
drs_ph_hotel:
  _state: drs_ph_hotel
drs_ph_project:
  _state: drs_ph_project
drs_ph_report:
  _state: drs_ph_report
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
drs_sep_tilde:
  _state: drs_sep_tilde
drs_sep_dash:
  _state: drs_sep_dash
drs_sep_to:
  _state: drs_sep_to
drs_sep_arrow:
  _state: drs_sep_arrow
drs_sep_pipe:
  _state: drs_sep_pipe
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
    suffixIcon: AiOutlineClockCircle
    label:
      disabled: true
- id: drs_icon_schedule
  type: DateRangeSelector
  properties:
    title: Schedule Icon
    suffixIcon: AiOutlineSchedule
    label:
      disabled: true
- id: drs_icon_custom_color
  type: DateRangeSelector
  properties:
    title: Custom Color Icon
    suffixIcon:
      name: AiOutlineCalendar
      color: "#1677ff"
    label:
      disabled: true
- id: drs_icon_heart
  type: DateRangeSelector
  properties:
    title: Heart Icon
    suffixIcon:
      name: AiOutlineHeart
      color: "#ff4d4f"
    label:
      disabled: true
```

```yaml
drs_icon_default:
  _state: drs_icon_default
drs_icon_clock:
  _state: drs_icon_clock
drs_icon_schedule:
  _state: drs_icon_schedule
drs_icon_custom_color:
  _state: drs_icon_custom_color
drs_icon_heart:
  _state: drs_icon_heart
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
drs_dis_default:
  _state: drs_dis_default
drs_dis_outlined:
  _state: drs_dis_outlined
drs_dis_filled:
  _state: drs_dis_filled
drs_dis_borderless:
  _state: drs_dis_borderless
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
drs_dd_min:
  _state: drs_dd_min
drs_dd_range:
  _state: drs_dd_range
drs_dd_specific:
  _state: drs_dd_specific
drs_dd_ranges:
  _state: drs_dd_ranges
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
drs_presets_relative:
  _state: drs_presets_relative
drs_presets_to_date:
  _state: drs_presets_to_date
drs_presets_fixed:
  _state: drs_presets_fixed
drs_presets_html_label:
  _state: drs_presets_html_label
drs_presets_disabled_dates:
  _state: drs_presets_disabled_dates
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
drs_label_default:
  _state: drs_label_default
drs_label_colon_off:
  _state: drs_label_colon_off
drs_label_right:
  _state: drs_label_right
drs_label_inline:
  _state: drs_label_inline
drs_label_extra:
  _state: drs_label_extra
drs_label_extra_html:
  _state: drs_label_extra_html
drs_label_hidden:
  _state: drs_label_hidden
drs_label_allow_clear:
  _state: drs_label_allow_clear
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
drs_label_inline_4:
  _state: drs_label_inline_4
drs_label_inline_8:
  _state: drs_label_inline_8
drs_label_inline_12:
  _state: drs_label_inline_12
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
drs_html_bold:
  _state: drs_html_bold
drs_html_color:
  _state: drs_html_color
drs_html_italic:
  _state: drs_html_italic
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
    .element: null
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
drs_style_width:
  _state: drs_style_width
drs_style_narrow:
  _state: drs_style_narrow
drs_style_element:
  _state: drs_style_element
drs_style_label:
  _state: drs_style_label
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
drs_class_rounded:
  _state: drs_class_rounded
drs_class_border:
  _state: drs_class_border
drs_class_shadow:
  _state: drs_class_shadow
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
drs_theme_primary:
  _state: drs_theme_primary
drs_theme_radius:
  _state: drs_theme_radius
drs_theme_bg:
  _state: drs_theme_bg
drs_theme_brand:
  _state: drs_theme_brand
drs_theme_cell_range:
  _state: drs_theme_cell_range
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
    suffixIcon: AiOutlineSchedule
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
      name: AiOutlineCalendar
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
      name: AiOutlineHeart
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
      name: AiOutlineFlag
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
drs_combo_hotel:
  _state: drs_combo_hotel
drs_combo_minimal:
  _state: drs_combo_minimal
drs_combo_restricted:
  _state: drs_combo_restricted
drs_combo_themed:
  _state: drs_combo_themed
drs_combo_contract:
  _state: drs_combo_contract
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
        icon: AiOutlineFileText
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
applied2_report_card:
  _state: applied2_report_card
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
        icon: AiOutlineSend
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

```yaml
applied3_vacation_card:
  _state: applied3_vacation_card
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
| `format` | string | - | Format in which to parse the date value, eg. "DD MMMM YYYY" will parse a date value of 1999-12-31 as "31 December 1999". The format has to conform to dayjs formats. Defaults to the active locale's date format, or "YYYY-MM-DD" when no locale is configured. |
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
| `placeholder` | array | - | Placeholder text inside the block before user types input. When unset, antd uses the localized default from ConfigProvider locale. |
| `presets` | array | - | Shortcuts listed next to the calendar to quickly select a date range. Presets are re-evaluated every time the block config is evaluated, so operator based values like "_date: now" stay current. A preset is offered on the same terms as the calendar cells: a range that starts or ends on a date disabledDates disables is narrowed to the dates it may select, so a "Last 7 days" shortcut still selects the allowed part of the last 7 days. A shortcut with nothing it may select is listed as disabled. |
| `presets.$.label` | string | - | Text shown for the shortcut - supports html. |
| `presets.$.value` | array | - | The start and end date of the range. A date string, a timestamp, or a _date object. Dates are read as UTC, the same as the block value, so a fixed date like "2026-01-01" resolves to the same day in every timezone. A date relative to now is an instant, not a calendar date, so end a _dayjs chain with a format step to pin it to the local calendar: "_dayjs: [now, {subtract: [7, days]}, {format: YYYY-MM-DD}]". Without the format step the chain resolves to an instant, which can select the day before or after the current one, depending on the browser timezone and the time of day. |
| `separator` | string | `"~"` | Separator symbol shown between start and end date inputs. |
| `size` | string | `"default"` | Size of the block. Enum: `small`, `default`, `large`. |
| `suffixIcon` | string \| object | `"AiOutlineCalendar"` | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon on right-hand side of the date picker. |
| `title` | string | - | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design date-picker tokens](https://ant.design/components/date-picker#design-token). |
| `theme.cellHeight` | number | `24` | Height of a calendar cell. |
| `theme.cellWidth` | number | `36` | Width of a calendar cell. |
| `theme.cellHoverBg` | string | - | Background color of a calendar cell on hover. |
| `theme.cellActiveWithRangeBg` | string | - | Background color of cells within the selected range. |
| `theme.cellHoverWithRangeBg` | string | - | Background color of cells within range on hover. |
| `theme.cellBgDisabled` | string | - | Background color of disabled cells. |
| `theme.cellRangeBorderColor` | string | - | Border color of range selection cells. |
| `theme.timeColumnWidth` | number | `56` | Width of the time panel column. |
| `theme.timeColumnHeight` | number | `224` | Height of the time panel column. |
| `theme.timeCellHeight` | number | `28` | Height of a time cell in the time panel. |
| `theme.addonBg` | string | - | Background color for the addon area. |
| `theme.hoverBorderColor` | string | - | Border color on hover. |
| `theme.activeBorderColor` | string | - | Border color when active. |
| `theme.activeShadow` | string | - | Shadow effect when active. |
| `theme.paddingBlock` | number | `4` | Vertical padding of the input. |
| `theme.paddingBlockSM` | number | `0` | Vertical padding for small size. |
| `theme.paddingBlockLG` | number | `7` | Vertical padding for large size. |
| `theme.paddingInline` | number | `11` | Horizontal padding of the input. |
| `theme.paddingInlineSM` | number | `7` | Horizontal padding for small size. |
| `theme.paddingInlineLG` | number | `11` | Horizontal padding for large size. |
| `theme.zIndexPopup` | number | `1050` | Z-index of the picker popup. |
| `theme.borderRadius` | number | `6` | Border radius of the input. |
| `theme.controlHeight` | number | `32` | Height of the input. |
| `theme.controlHeightLG` | number | `40` | Height for large size. |
| `theme.controlHeightSM` | number | `24` | Height for small size. |
| `theme.fontSize` | number | `14` | Font size. |
| `theme.lineWidth` | number | `1` | Border width. |
| `theme.colorPrimary` | string | - | Primary color override. |
| `theme.colorBgContainer` | string | - | Background color of the input. |
| `theme.colorText` | string | - | Text color. |
| `theme.colorBorder` | string | - | Border color. |
| `theme.colorTextPlaceholder` | string | - | Placeholder text color. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | `{ value: array }` | Trigger actions when selection is changed. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The DateRangeSelector element. |
| `/label` | The DateRangeSelector label. |
| `/extra` | The DateRangeSelector extra content. |
| `/feedback` | The DateRangeSelector validation feedback. |
| `/popup` | The DateRangeSelector popup. |
| `/suffixIcon` | The suffix icon in the DateRangeSelector. |

No slots defined.
