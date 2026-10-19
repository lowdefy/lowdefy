# DateSelector

Date picker with configurable format and disabled dates.

```yaml
- id: size_small
  type: DateSelector
  properties:
    title: Small
    size: small
- id: size_default
  type: DateSelector
  properties:
    title: Default
- id: size_large
  type: DateSelector
  properties:
    title: Large
    size: large
```

```yaml
- id: variant_outlined
  type: DateSelector
  properties:
    title: Outlined (default)
    variant: outlined
    label:
      disabled: true
- id: variant_filled
  type: DateSelector
  properties:
    title: Filled
    variant: filled
    label:
      disabled: true
- id: variant_borderless
  type: DateSelector
  properties:
    title: Borderless
    variant: borderless
    label:
      disabled: true
- id: variant_underlined
  type: DateSelector
  properties:
    title: Underlined
    variant: underlined
    label:
      disabled: true
```

```yaml
- id: format_iso
  type: DateSelector
  properties:
    title: YYYY-MM-DD (ISO)
    format: YYYY-MM-DD
    label:
      disabled: true
- id: format_slash
  type: DateSelector
  properties:
    title: DD/MM/YYYY
    format: DD/MM/YYYY
    label:
      disabled: true
- id: format_us
  type: DateSelector
  properties:
    title: MM/DD/YYYY (US)
    format: MM/DD/YYYY
    label:
      disabled: true
- id: format_long
  type: DateSelector
  properties:
    title: DD MMMM YYYY
    format: DD MMMM YYYY
    label:
      disabled: true
- id: format_dot
  type: DateSelector
  properties:
    title: DD.MM.YYYY
    format: DD.MM.YYYY
    label:
      disabled: true
```

```yaml
- id: placeholder_default
  type: DateSelector
  properties:
    title: Default Placeholder
    label:
      disabled: true
- id: placeholder_custom
  type: DateSelector
  properties:
    title: Custom Placeholder
    placeholder: Pick a date...
    label:
      disabled: true
- id: placeholder_descriptive
  type: DateSelector
  properties:
    title: Descriptive Placeholder
    placeholder: When did this happen?
    label:
      disabled: true
```

```yaml
- id: clear_enabled
  type: DateSelector
  properties:
    title: Allow Clear (default)
    allowClear: true
    label:
      disabled: true
- id: clear_disabled
  type: DateSelector
  properties:
    title: No Clear Button
    allowClear: false
    label:
      disabled: true
```

```yaml
- id: today_enabled
  type: DateSelector
  properties:
    title: Show Today (default)
    showToday: true
    label:
      disabled: true
- id: today_disabled
  type: DateSelector
  properties:
    title: No Today Button
    showToday: false
    label:
      disabled: true
```

```yaml
- id: icon_default
  type: DateSelector
  properties:
    title: Default Calendar Icon
    label:
      disabled: true
- id: icon_clock
  type: DateSelector
  properties:
    title: Clock Icon
    suffixIcon: clock
    label:
      disabled: true
- id: icon_schedule
  type: DateSelector
  properties:
    title: Schedule Icon
    suffixIcon: CalendarDays
    label:
      disabled: true
- id: icon_custom_color
  type: DateSelector
  properties:
    title: Custom Color Icon
    suffixIcon:
      name: calendar
      color: "#1677ff"
    label:
      disabled: true
- id: icon_heart
  type: DateSelector
  properties:
    title: Heart Icon
    suffixIcon:
      name: heart
      color: "#ff4d4f"
    label:
      disabled: true
```

```yaml
- id: ds_prefix_icon
  type: DateSelector
  properties:
    title: Prefix Icon
    prefixIcon: clock
    suffixIcon:
      name: calendar
      color: "#8c8c8c"
- id: ds_prefix_text
  type: DateSelector
  properties:
    title: Prefix Text
    prefix: "From:"
- id: ds_placement
  type: DateSelector
  properties:
    title: Popup Opens Top Right
    placement: topRight
- id: ds_read_only
  type: DateSelector
  properties:
    title: Pick From Calendar Only
    inputReadOnly: true
    label:
      extra: The input is read-only, so touch devices do not open the keyboard.
```

```yaml
- id: ds_show_week
  type: DateSelector
  properties:
    title: Show Week Numbers
    showWeek: true
```

```yaml
- id: disabled_default
  type: DateSelector
  properties:
    title: Disabled
    disabled: true
    label:
      disabled: true
- id: disabled_outlined
  type: DateSelector
  properties:
    title: Disabled Outlined
    disabled: true
    variant: outlined
    label:
      disabled: true
- id: disabled_filled
  type: DateSelector
  properties:
    title: Disabled Filled
    disabled: true
    variant: filled
    label:
      disabled: true
- id: disabled_borderless
  type: DateSelector
  properties:
    title: Disabled Borderless
    disabled: true
    variant: borderless
    label:
      disabled: true
```

```yaml
- id: autofocus_off
  type: DateSelector
  properties:
    title: No Auto Focus (default)
    autoFocus: false
    label:
      disabled: true
- id: autofocus_on
  type: DateSelector
  properties:
    title: Auto Focus Enabled
    autoFocus: true
    label:
      disabled: true
```

```yaml
- id: disabled_dates_min
  type: DateSelector
  properties:
    title: Min Date (2024-01-01)
    disabledDates:
      min: 2024-01-01
    label:
      disabled: true
- id: disabled_dates_max
  type: DateSelector
  properties:
    title: Max Date (2025-12-31)
    disabledDates:
      max: 2025-12-31
    label:
      disabled: true
- id: disabled_dates_range
  type: DateSelector
  properties:
    title: Min & Max (2024 only)
    disabledDates:
      min: 2024-01-01
      max: 2024-12-31
    label:
      disabled: true
- id: disabled_specific
  type: DateSelector
  properties:
    title: Specific Dates Disabled
    disabledDates:
      dates:
        - 2026-03-15
        - 2026-03-20
        - 2026-03-25
    label:
      disabled: true
- id: disabled_date_ranges
  type: DateSelector
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
- id: ds_presets_relative
  type: DateSelector
  properties:
    title: Relative Presets
    label:
      extra: Shortcuts are listed to the left of the calendar.
    presets:
      - label: Today
        value:
          _dayjs:
            - now
            - format: YYYY-MM-DD
      - label: Yesterday
        value:
          _dayjs:
            - now
            - subtract:
                - 1
                - day
            - format: YYYY-MM-DD
      - label: A week ago
        value:
          _dayjs:
            - now
            - subtract:
                - 1
                - week
            - format: YYYY-MM-DD
      - label: A month ago
        value:
          _dayjs:
            - now
            - subtract:
                - 1
                - month
            - format: YYYY-MM-DD
- id: ds_presets_boundaries
  type: DateSelector
  properties:
    title: Period Boundaries
    label:
      disabled: true
    presets:
      - label: Start of month
        value:
          _dayjs:
            - now
            - startOf: month
            - format: YYYY-MM-DD
      - label: End of month
        value:
          _dayjs:
            - now
            - endOf: month
            - format: YYYY-MM-DD
      - label: Start of year
        value:
          _dayjs:
            - now
            - startOf: year
            - format: YYYY-MM-DD
- id: ds_presets_fixed
  type: DateSelector
  properties:
    title: Fixed Presets
    label:
      disabled: true
    presets:
      - label: New Year's Day
        value: 2026-01-01
      - label: Midsummer
        value: 2026-06-21
      - label: Christmas
        value: 2026-12-25
```

```yaml
- id: label_default
  type: DateSelector
  properties:
    title: Default Label
- id: label_colon_off
  type: DateSelector
  properties:
    title: No Colon
    label:
      colon: false
- id: label_right
  type: DateSelector
  properties:
    title: Align Right
    label:
      align: right
- id: label_inline
  type: DateSelector
  properties:
    title: Inline Label
    label:
      inline: true
      span: 8
- id: label_extra
  type: DateSelector
  properties:
    title: Date of Birth
    label:
      extra: Enter your date of birth in the format YYYY-MM-DD.
    placeholder: Select your date of birth
- id: label_hidden
  type: DateSelector
  properties:
    title: Hidden Label
    label:
      disabled: true
    placeholder: No label shown
```

```yaml
- id: label_inline_4
  type: DateSelector
  properties:
    title: Span 4
    label:
      inline: true
      span: 4
- id: label_inline_8
  type: DateSelector
  properties:
    title: Span 8
    label:
      inline: true
      span: 8
- id: label_inline_12
  type: DateSelector
  properties:
    title: Span 12
    label:
      inline: true
      span: 12
```

```yaml
- id: html_title_bold
  type: DateSelector
  properties:
    title: <b>Bold</b> date selector
    label:
      disabled: true
- id: html_title_color
  type: DateSelector
  properties:
    title: '<span style="color: #1677ff">Blue</span> date selector'
    label:
      disabled: true
```

```yaml
- id: style_width
  type: DateSelector
  style:
    width: 300
  properties:
    title: Fixed Width (300px)
    label:
      disabled: true
- id: style_element
  type: DateSelector
  style:
    .element:
      backgroundColor: var(--ant-color-primary-bg)
  properties:
    title: Custom Background
    label:
      disabled: true
- id: style_label
  type: DateSelector
  style:
    .label:
      color: "#531dab"
      fontWeight: bold
  properties:
    title: Styled Label
```

```yaml
- id: class_rounded
  type: DateSelector
  class: rounded-lg shadow-sm
  properties:
    title: Rounded with Shadow
    label:
      disabled: true
- id: class_border
  type: DateSelector
  class: border-2 border-border
  properties:
    title: Blue Border
    label:
      disabled: true
```

```yaml
- id: theme_primary_color
  type: DateSelector
  properties:
    title: Custom Primary Color
    label:
      disabled: true
    theme:
      colorPrimary: "#722ed1"
- id: theme_large_radius
  type: DateSelector
  properties:
    title: Large Border Radius
    label:
      disabled: true
    theme:
      borderRadius: 16
- id: theme_custom_bg
  type: DateSelector
  properties:
    title: Custom Background
    variant: filled
    label:
      disabled: true
- id: theme_tall
  type: DateSelector
  properties:
    title: Tall Input
    label:
      disabled: true
    theme:
      controlHeight: 48
      fontSize: 18
      borderRadius: 12
- id: theme_brand_color
  type: DateSelector
  properties:
    title: Brand Purple
    label:
      disabled: true
    theme:
      colorPrimary: "#722ed1"
      colorBorder: "#d3adf7"
```

```yaml
- id: combined_full
  type: DateSelector
  properties:
    title: Appointment Date
    placeholder: Select appointment date
    format: DD MMMM YYYY
    size: large
    suffixIcon: CalendarDays
    showToday: true
    allowClear: true
    label:
      extra: Choose your preferred appointment date.
      colon: false
- id: combined_minimal
  type: DateSelector
  properties:
    title: Date
    variant: borderless
    size: small
    allowClear: false
    showToday: false
    format: DD/MM/YYYY
    placeholder: dd/mm/yyyy
    label:
      disabled: true
- id: combined_restricted
  type: DateSelector
  properties:
    title: Event Registration
    placeholder: Select event date
    format: DD MMM YYYY
    suffixIcon:
      name: calendar
      color: "#1677ff"
    disabledDates:
      min: 2026-01-01
      max: 2026-12-31
    label:
      extra: Only dates in 2026 are available.
- id: combined_themed
  type: DateSelector
  properties:
    title: Themed Picker
    variant: filled
    size: large
    format: DD MMMM YYYY
    placeholder: Choose a special date...
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
```

```yaml
- id: applied2_event_reg_card
  type: Card
  properties:
    title: Event Registration
  blocks:
    - id: applied2_event_date
      type: DateSelector
      properties:
        title: Event Date
        placeholder: Select event date
        format: DD MMMM YYYY
        size: large
        suffixIcon: calendar
        label:
          extra: Choose the date you would like to attend.
        disabledDates:
          min: 2026-04-01
          max: 2026-12-31
    - id: applied2_event_name
      type: TextInput
      properties:
        title: Full Name
        placeholder: Enter your full name
        prefixIcon: user
    - id: applied2_event_email
      type: TextInput
      properties:
        title: Email Address
        placeholder: you@example.com
        prefixIcon: mail
        label:
          extra: We will send your confirmation to this address.
    - id: applied2_event_register_btn
      type: Button
      properties:
        title: Register
        icon: check
        type: primary
        size: large
        block: true
      events:
        onClick:
          - id: register_action
            type: DisplayMessage
            params:
              content: Registration submitted successfully!
              duration: 3
```

```yaml
- id: applied3_profile_card
  type: Card
  properties:
    title: Profile Settings
  blocks:
    - id: applied3_display_name
      type: TextInput
      properties:
        title: Display Name
        placeholder: Enter your display name
        prefixIcon: user
    - id: applied3_date_of_birth
      type: DateSelector
      properties:
        title: Date of Birth
        placeholder: Select your date of birth
        format: DD MMMM YYYY
        suffixIcon: calendar
        label:
          extra: Used to verify your age.
        disabledDates:
          max: 2008-12-31
      events:
        onChange:
          - id: dob_changed_action
            type: SetState
            params:
              dob_updated: true
    - id: applied3_email
      type: TextInput
      properties:
        title: Email Address
        placeholder: you@example.com
        prefixIcon: mail
    - id: applied3_save_btn
      type: Button
      properties:
        title: Save Profile
        icon: save
        type: primary
        size: large
        block: true
      events:
        onClick:
          - id: save_profile_action
            type: DisplayMessage
            params:
              content: Profile saved successfully!
              duration: 3
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `allowClear` | boolean | `true` | Allow the user to clear their input. |
| `autoFocus` | boolean | `false` | Autofocus to the block on page load. |
| `bordered` | boolean | `true` | Deprecated - use variant: 'borderless'. Whether or not the input has a border style. |
| `disabled` | boolean | `false` | Disable the block if true. |
| `variant` | string | `"outlined"` | Variant style of the input. Use 'borderless' instead of bordered: false. Enum: `outlined`, `filled`, `borderless`, `underlined`. |
| `disabledDates` | object | - | Disable specific dates so that they can not be chosen. |
| `disabledDates.min` | string \| object | - | Disable all dates less than the minimum date. Can be a date string or a _date object. |
| `disabledDates.max` | string \| object | - | Disable all dates greater than the maximum date. Can be a date string or a _date object. |
| `disabledDates.dates` | array | - | Array of specific dates to disable. |
| `disabledDates.ranges` | array | - | Array of date ranges to disable. A range is an object with a from and a to date, or an array of the two dates. |
| `disabledDates.ranges.$.from` | string \| object | - | Start of the disabled range. |
| `disabledDates.ranges.$.to` | string \| object | - | End of the disabled range. |
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
| `format` | string | - | Format in which to parse the date value, eg. "DD MMMM YYYY" will parse a date value of 1999-12-31 as "31 December 1999". The format has to conform to dayjs formats. Defaults to the active locale's date format, or "YYYY-MM-DD" when no locale is configured. |
| `inputReadOnly` | boolean | `false` | Make the text input read-only, so a date can only be chosen from the calendar. This also stops the on-screen keyboard opening on touch devices. |
| `placeholder` | string | - | Placeholder text inside the block before user types input. |
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
| `presets` | array | - | Shortcuts listed next to the calendar to quickly select a date. Presets are re-evaluated every time the block config is evaluated, so operator based values like "_date: now" stay current. A preset is offered on the same terms as the calendar cells: a shortcut with nothing it may select is listed as disabled. |
| `presets.$.label` | string | - | Text shown for the shortcut - supports html. |
| `presets.$.value` | string \| number \| object | - | A date string, a timestamp, or a _date object. Dates are read as UTC, the same as the block value, so a fixed date like "2026-01-01" resolves to the same day in every timezone. A date relative to now is an instant, not a calendar date, so end a _dayjs chain with a format step to pin it to the local calendar: "_dayjs: [now, {format: YYYY-MM-DD}]". Without the format step the chain resolves to an instant, which can select the day before or after the current one, depending on the browser timezone and the time of day. |
| `showToday` | boolean | `true` | Shows a button to easily select the current date if true. |
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
| `onBlur` | \- | Trigger actions when the picker loses focus. |
| `onClear` | \- | Trigger actions when the clear button is clicked. |
| `onFocus` | \- | Trigger actions when the picker gets focus. |
| `onOpenChange` | `{ open }` | Trigger actions when the calendar popup opens or closes. |
| `onChange` | `{ value }` | Trigger actions when selection is changed. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The DateSelector element. |
| `/label` | The DateSelector label. |
| `/extra` | The DateSelector extra content. |
| `/feedback` | The DateSelector validation feedback. |
| `/popup` | The DateSelector popup. |
| `/prefixIcon` | The prefix icon in the DateSelector. |
| `/suffixIcon` | The suffix icon in the DateSelector. |

No slots defined.
