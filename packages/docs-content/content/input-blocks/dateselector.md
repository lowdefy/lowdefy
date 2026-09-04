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
size_small:
  _state: size_small
size_default:
  _state: size_default
size_large:
  _state: size_large
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
```

```yaml
variant_outlined:
  _state: variant_outlined
variant_filled:
  _state: variant_filled
variant_borderless:
  _state: variant_borderless
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
format_iso:
  _state: format_iso
format_slash:
  _state: format_slash
format_us:
  _state: format_us
format_long:
  _state: format_long
format_dot:
  _state: format_dot
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
placeholder_default:
  _state: placeholder_default
placeholder_custom:
  _state: placeholder_custom
placeholder_descriptive:
  _state: placeholder_descriptive
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
clear_enabled:
  _state: clear_enabled
clear_disabled:
  _state: clear_disabled
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
today_enabled:
  _state: today_enabled
today_disabled:
  _state: today_disabled
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
    suffixIcon: AiOutlineClockCircle
    label:
      disabled: true
- id: icon_schedule
  type: DateSelector
  properties:
    title: Schedule Icon
    suffixIcon: AiOutlineSchedule
    label:
      disabled: true
- id: icon_custom_color
  type: DateSelector
  properties:
    title: Custom Color Icon
    suffixIcon:
      name: AiOutlineCalendar
      color: "#1677ff"
    label:
      disabled: true
- id: icon_heart
  type: DateSelector
  properties:
    title: Heart Icon
    suffixIcon:
      name: AiOutlineHeart
      color: "#ff4d4f"
    label:
      disabled: true
```

```yaml
icon_default:
  _state: icon_default
icon_clock:
  _state: icon_clock
icon_schedule:
  _state: icon_schedule
icon_custom_color:
  _state: icon_custom_color
icon_heart:
  _state: icon_heart
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
disabled_default:
  _state: disabled_default
disabled_outlined:
  _state: disabled_outlined
disabled_filled:
  _state: disabled_filled
disabled_borderless:
  _state: disabled_borderless
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
autofocus_off:
  _state: autofocus_off
autofocus_on:
  _state: autofocus_on
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
disabled_dates_min:
  _state: disabled_dates_min
disabled_dates_max:
  _state: disabled_dates_max
disabled_dates_range:
  _state: disabled_dates_range
disabled_specific:
  _state: disabled_specific
disabled_date_ranges:
  _state: disabled_date_ranges
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
ds_presets_relative:
  _state: ds_presets_relative
ds_presets_boundaries:
  _state: ds_presets_boundaries
ds_presets_fixed:
  _state: ds_presets_fixed
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
label_default:
  _state: label_default
label_colon_off:
  _state: label_colon_off
label_right:
  _state: label_right
label_inline:
  _state: label_inline
label_extra:
  _state: label_extra
label_hidden:
  _state: label_hidden
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
label_inline_4:
  _state: label_inline_4
label_inline_8:
  _state: label_inline_8
label_inline_12:
  _state: label_inline_12
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
html_title_bold:
  _state: html_title_bold
html_title_color:
  _state: html_title_color
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
    .element: null
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
style_width:
  _state: style_width
style_element:
  _state: style_element
style_label:
  _state: style_label
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
class_rounded:
  _state: class_rounded
class_border:
  _state: class_border
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
theme_primary_color:
  _state: theme_primary_color
theme_large_radius:
  _state: theme_large_radius
theme_custom_bg:
  _state: theme_custom_bg
theme_tall:
  _state: theme_tall
theme_brand_color:
  _state: theme_brand_color
```

```yaml
- id: combined_full
  type: DateSelector
  properties:
    title: Appointment Date
    placeholder: Select appointment date
    format: DD MMMM YYYY
    size: large
    suffixIcon: AiOutlineSchedule
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
      name: AiOutlineCalendar
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
combined_full:
  _state: combined_full
combined_minimal:
  _state: combined_minimal
combined_restricted:
  _state: combined_restricted
combined_themed:
  _state: combined_themed
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
        suffixIcon: AiOutlineCalendar
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
        prefixIcon: AiOutlineUser
    - id: applied2_event_email
      type: TextInput
      properties:
        title: Email Address
        placeholder: you@example.com
        prefixIcon: AiOutlineMail
        label:
          extra: We will send your confirmation to this address.
    - id: applied2_event_register_btn
      type: Button
      properties:
        title: Register
        icon: AiOutlineCheck
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
applied2_event_reg_card:
  _state: applied2_event_reg_card
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
        prefixIcon: AiOutlineUser
    - id: applied3_date_of_birth
      type: DateSelector
      properties:
        title: Date of Birth
        placeholder: Select your date of birth
        format: DD MMMM YYYY
        suffixIcon: AiOutlineCalendar
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
        prefixIcon: AiOutlineMail
    - id: applied3_save_btn
      type: Button
      properties:
        title: Save Profile
        icon: AiOutlineSave
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

```yaml
applied3_profile_card:
  _state: applied3_profile_card
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
| `format` | string | - | Format in which to parse the date value, eg. "DD MMMM YYYY" will parse a date value of 1999-12-31 as "31 December 1999". The format has to conform to dayjs formats. Defaults to the active locale's date format, or "YYYY-MM-DD" when no locale is configured. |
| `placeholder` | string | - | Placeholder text inside the block before user types input. |
| `presets` | array | - | Shortcuts listed next to the calendar to quickly select a date. Presets are re-evaluated every time the block config is evaluated, so operator based values like "_date: now" stay current. A preset is offered on the same terms as the calendar cells: a shortcut with nothing it may select is listed as disabled. |
| `presets.$.label` | string | - | Text shown for the shortcut - supports html. |
| `presets.$.value` | string \| number \| object | - | A date string, a timestamp, or a _date object. Dates are read as UTC, the same as the block value, so a fixed date like "2026-01-01" resolves to the same day in every timezone. A date relative to now is an instant, not a calendar date, so end a _dayjs chain with a format step to pin it to the local calendar: "_dayjs: [now, {format: YYYY-MM-DD}]". Without the format step the chain resolves to an instant, which can select the day before or after the current one, depending on the browser timezone and the time of day. |
| `showToday` | boolean | `true` | Shows a button to easily select the current date if true. |
| `size` | string | `"default"` | Size of the block. Enum: `small`, `default`, `large`. |
| `suffixIcon` | string \| object | `"AiOutlineCalendar"` | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon on right-hand side of the date picker. |
| `title` | string | - | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design date-picker tokens](https://ant.design/components/date-picker#design-token). |
| `theme.activeBorderColor` | string | - | Border color when the picker is active/focused. |
| `theme.hoverBorderColor` | string | - | Border color when hovering over the picker. |
| `theme.cellHoverBg` | string | `"rgba(0, 0, 0, 0.04)"` | Background color of calendar cell on hover. |
| `theme.cellActiveWithRangeBg` | string | `"#e6f4ff"` | Background color of active cell within a range selection. |
| `theme.addonBg` | string | `"rgba(0, 0, 0, 0.02)"` | Background color of the footer addon area. |
| `theme.zIndexPopup` | number | `1050` | Z-index of the date picker popup layer. |
| `theme.timeColumnHeight` | number | `224` | Height of the time picker column. |
| `theme.timeCellHeight` | number | `28` | Height of each cell in the time picker column. |
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
| `theme.colorPrimary` | string | - | Primary color used for selected date and active states. |
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
| `/element` | The DateSelector element. |
| `/label` | The DateSelector label. |
| `/extra` | The DateSelector extra content. |
| `/feedback` | The DateSelector validation feedback. |
| `/popup` | The DateSelector popup. |
| `/suffixIcon` | The suffix icon in the DateSelector. |

No slots defined.
