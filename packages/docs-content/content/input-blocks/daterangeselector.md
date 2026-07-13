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
| `disabledDates.ranges` | array | - | Array of date ranges to disable. |
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
| `/suffixIcon` | The suffix icon in the DateRangeSelector. |

No slots defined.
