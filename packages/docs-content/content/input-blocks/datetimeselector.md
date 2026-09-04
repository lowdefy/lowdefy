# DateTimeSelector

Combined date and time picker.

```yaml
- id: dts_size_small
  type: DateTimeSelector
  properties:
    title: Small
    size: small
- id: dts_size_default
  type: DateTimeSelector
  properties:
    title: Default
- id: dts_size_large
  type: DateTimeSelector
  properties:
    title: Large
    size: large
```

```yaml
dts_size_small:
  _state: dts_size_small
dts_size_default:
  _state: dts_size_default
dts_size_large:
  _state: dts_size_large
```

```yaml
- id: dts_variant_outlined
  type: DateTimeSelector
  properties:
    title: Outlined (default)
    variant: outlined
    label:
      disabled: true
- id: dts_variant_filled
  type: DateTimeSelector
  properties:
    title: Filled
    variant: filled
    label:
      disabled: true
- id: dts_variant_borderless
  type: DateTimeSelector
  properties:
    title: Borderless
    variant: borderless
    label:
      disabled: true
```

```yaml
dts_variant_outlined:
  _state: dts_variant_outlined
dts_variant_filled:
  _state: dts_variant_filled
dts_variant_borderless:
  _state: dts_variant_borderless
```

```yaml
- id: dts_tf_hours_minutes
  type: DateTimeSelector
  properties:
    title: Hours & Minutes (HH:mm)
    timeFormat: HH:mm
    format: YYYY-MM-DD HH:mm
    label:
      disabled: true
- id: dts_tf_with_seconds
  type: DateTimeSelector
  properties:
    title: With Seconds (HH:mm:ss)
    timeFormat: HH:mm:ss
    format: YYYY-MM-DD HH:mm:ss
    label:
      disabled: true
- id: dts_tf_hours_only
  type: DateTimeSelector
  properties:
    title: Hours Only (HH)
    timeFormat: HH
    format: YYYY-MM-DD HH
    label:
      disabled: true
```

```yaml
dts_tf_hours_minutes:
  _state: dts_tf_hours_minutes
dts_tf_with_seconds:
  _state: dts_tf_with_seconds
dts_tf_hours_only:
  _state: dts_tf_hours_only
```

```yaml
- id: dts_step_hour_2
  type: DateTimeSelector
  properties:
    title: 2-Hour Steps
    hourStep: 2
    label:
      disabled: true
- id: dts_step_minute_10
  type: DateTimeSelector
  properties:
    title: 10-Minute Steps
    minuteStep: 10
    label:
      disabled: true
- id: dts_step_minute_15
  type: DateTimeSelector
  properties:
    title: 15-Minute Steps
    minuteStep: 15
    label:
      disabled: true
- id: dts_step_minute_30
  type: DateTimeSelector
  properties:
    title: 30-Minute Steps
    minuteStep: 30
    label:
      disabled: true
- id: dts_step_second_10
  type: DateTimeSelector
  properties:
    title: 10-Second Steps
    timeFormat: HH:mm:ss
    format: YYYY-MM-DD HH:mm:ss
    secondStep: 10
    label:
      disabled: true
```

```yaml
dts_step_hour_2:
  _state: dts_step_hour_2
dts_step_minute_10:
  _state: dts_step_minute_10
dts_step_minute_15:
  _state: dts_step_minute_15
dts_step_minute_30:
  _state: dts_step_minute_30
dts_step_second_10:
  _state: dts_step_second_10
```

```yaml
- id: dts_fmt_iso
  type: DateTimeSelector
  properties:
    title: YYYY-MM-DD HH:mm (ISO)
    format: YYYY-MM-DD HH:mm
    label:
      disabled: true
- id: dts_fmt_slash
  type: DateTimeSelector
  properties:
    title: DD/MM/YYYY HH:mm
    format: DD/MM/YYYY HH:mm
    label:
      disabled: true
- id: dts_fmt_us
  type: DateTimeSelector
  properties:
    title: MM/DD/YYYY HH:mm (US)
    format: MM/DD/YYYY HH:mm
    label:
      disabled: true
- id: dts_fmt_long
  type: DateTimeSelector
  properties:
    title: DD MMMM YYYY HH:mm
    format: DD MMMM YYYY HH:mm
    label:
      disabled: true
- id: dts_fmt_dot
  type: DateTimeSelector
  properties:
    title: DD.MM.YYYY HH:mm
    format: DD.MM.YYYY HH:mm
    label:
      disabled: true
```

```yaml
dts_fmt_iso:
  _state: dts_fmt_iso
dts_fmt_slash:
  _state: dts_fmt_slash
dts_fmt_us:
  _state: dts_fmt_us
dts_fmt_long:
  _state: dts_fmt_long
dts_fmt_dot:
  _state: dts_fmt_dot
```

```yaml
- id: dts_ph_default
  type: DateTimeSelector
  properties:
    title: Default Placeholder
    label:
      disabled: true
- id: dts_ph_custom
  type: DateTimeSelector
  properties:
    title: Custom Placeholder
    placeholder: Choose date and time...
    label:
      disabled: true
- id: dts_ph_descriptive
  type: DateTimeSelector
  properties:
    title: Descriptive Placeholder
    placeholder: When did this event occur?
    label:
      disabled: true
- id: dts_ph_appointment
  type: DateTimeSelector
  properties:
    title: Appointment Placeholder
    placeholder: Select appointment date & time
    label:
      disabled: true
```

```yaml
dts_ph_default:
  _state: dts_ph_default
dts_ph_custom:
  _state: dts_ph_custom
dts_ph_descriptive:
  _state: dts_ph_descriptive
dts_ph_appointment:
  _state: dts_ph_appointment
```

```yaml
- id: dts_clear_enabled
  type: DateTimeSelector
  properties:
    title: Allow Clear (default)
    allowClear: true
    label:
      disabled: true
- id: dts_clear_disabled
  type: DateTimeSelector
  properties:
    title: No Clear Button
    allowClear: false
    label:
      disabled: true
```

```yaml
dts_clear_enabled:
  _state: dts_clear_enabled
dts_clear_disabled:
  _state: dts_clear_disabled
```

```yaml
- id: dts_today_enabled
  type: DateTimeSelector
  properties:
    title: Show Today (default)
    showToday: true
    label:
      disabled: true
- id: dts_today_disabled
  type: DateTimeSelector
  properties:
    title: No Today Button
    showToday: false
    label:
      disabled: true
- id: dts_now_enabled
  type: DateTimeSelector
  properties:
    title: Show Now (default)
    showNow: true
    label:
      disabled: true
- id: dts_now_disabled
  type: DateTimeSelector
  properties:
    title: No Now Button
    showNow: false
    label:
      disabled: true
- id: dts_both_disabled
  type: DateTimeSelector
  properties:
    title: No Today & No Now
    showToday: false
    showNow: false
    label:
      disabled: true
```

```yaml
dts_today_enabled:
  _state: dts_today_enabled
dts_today_disabled:
  _state: dts_today_disabled
dts_now_enabled:
  _state: dts_now_enabled
dts_now_disabled:
  _state: dts_now_disabled
dts_both_disabled:
  _state: dts_both_disabled
```

```yaml
- id: dts_utc_off
  type: DateTimeSelector
  properties:
    title: Local Time (default)
    selectUTC: false
    label:
      disabled: true
- id: dts_utc_on
  type: DateTimeSelector
  properties:
    title: UTC Mode
    selectUTC: true
    label:
      disabled: true
```

```yaml
dts_utc_off:
  _state: dts_utc_off
dts_utc_on:
  _state: dts_utc_on
```

```yaml
- id: dts_dis_outlined
  type: DateTimeSelector
  properties:
    title: Disabled Outlined
    disabled: true
    variant: outlined
    label:
      disabled: true
- id: dts_dis_filled
  type: DateTimeSelector
  properties:
    title: Disabled Filled
    disabled: true
    variant: filled
    label:
      disabled: true
- id: dts_dis_borderless
  type: DateTimeSelector
  properties:
    title: Disabled Borderless
    disabled: true
    variant: borderless
    label:
      disabled: true
- id: dts_dis_with_label
  type: DateTimeSelector
  properties:
    title: Disabled with Label
    disabled: true
```

```yaml
dts_dis_outlined:
  _state: dts_dis_outlined
dts_dis_filled:
  _state: dts_dis_filled
dts_dis_borderless:
  _state: dts_dis_borderless
dts_dis_with_label:
  _state: dts_dis_with_label
```

```yaml
- id: dts_icon_default
  type: DateTimeSelector
  properties:
    title: Default Calendar Icon
    label:
      disabled: true
- id: dts_icon_clock
  type: DateTimeSelector
  properties:
    title: Clock Icon
    suffixIcon: AiOutlineClockCircle
    label:
      disabled: true
- id: dts_icon_schedule
  type: DateTimeSelector
  properties:
    title: Schedule Icon
    suffixIcon: AiOutlineSchedule
    label:
      disabled: true
- id: dts_icon_custom_color
  type: DateTimeSelector
  properties:
    title: Custom Color Icon
    suffixIcon:
      name: AiOutlineCalendar
      color: "#1677ff"
    label:
      disabled: true
- id: dts_icon_heart
  type: DateTimeSelector
  properties:
    title: Heart Icon
    suffixIcon:
      name: AiOutlineHeart
      color: "#ff4d4f"
    label:
      disabled: true
```

```yaml
dts_icon_default:
  _state: dts_icon_default
dts_icon_clock:
  _state: dts_icon_clock
dts_icon_schedule:
  _state: dts_icon_schedule
dts_icon_custom_color:
  _state: dts_icon_custom_color
dts_icon_heart:
  _state: dts_icon_heart
```

```yaml
- id: dts_dd_min
  type: DateTimeSelector
  properties:
    title: Min Date (2024-01-01)
    disabledDates:
      min: 2024-01-01
    label:
      disabled: true
- id: dts_dd_range
  type: DateTimeSelector
  properties:
    title: Min & Max (2024 only)
    disabledDates:
      min: 2024-01-01
      max: 2024-12-31
    label:
      disabled: true
- id: dts_dd_specific
  type: DateTimeSelector
  properties:
    title: Specific Dates Disabled
    disabledDates:
      dates:
        - 2026-03-15
        - 2026-03-20
        - 2026-03-25
    label:
      disabled: true
- id: dts_dd_ranges
  type: DateTimeSelector
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
dts_dd_min:
  _state: dts_dd_min
dts_dd_range:
  _state: dts_dd_range
dts_dd_specific:
  _state: dts_dd_specific
dts_dd_ranges:
  _state: dts_dd_ranges
```

```yaml
- id: dts_presets_relative
  type: DateTimeSelector
  properties:
    title: Relative Presets
    label:
      extra: Shortcuts are listed to the left of the calendar.
    presets:
      - label: Now
        value:
          _date: now
      - label: An hour ago
        value:
          _dayjs:
            - now
            - subtract:
                - 1
                - hour
      - label: Yesterday
        value:
          _dayjs:
            - now
            - subtract:
                - 1
                - day
- id: dts_presets_start_of_day
  type: DateTimeSelector
  properties:
    title: Start of Day
    label:
      disabled: true
    presets:
      - label: Today 09:00
        value:
          _dayjs:
            - now
            - startOf: day
            - add:
                - 9
                - hours
      - label: Today 17:00
        value:
          _dayjs:
            - now
            - startOf: day
            - add:
                - 17
                - hours
- id: dts_presets_utc
  type: DateTimeSelector
  properties:
    title: UTC Presets
    selectUTC: true
    label:
      extra: With selectUTC, preset dates are read as UTC.
    presets:
      - label: Now (UTC)
        value:
          _date: now
      - label: Midnight UTC
        value:
          _dayjs:
            - now
            - utc
            - startOf: day
```

```yaml
- id: dts_presets_relative
  type: DateTimeSelector
  properties:
    title: Relative Presets
    label:
      extra: Shortcuts are listed to the left of the calendar.
    presets:
      - label: Now
        value:
          _date: now
      - label: An hour ago
        value:
          _dayjs:
            - now
            - subtract:
                - 1
                - hour
      - label: Yesterday
        value:
          _dayjs:
            - now
            - subtract:
                - 1
                - day
- id: dts_presets_start_of_day
  type: DateTimeSelector
  properties:
    title: Start of Day
    label:
      disabled: true
    presets:
      - label: Today 09:00
        value:
          _dayjs:
            - now
            - startOf: day
            - add:
                - 9
                - hours
      - label: Today 17:00
        value:
          _dayjs:
            - now
            - startOf: day
            - add:
                - 17
                - hours
- id: dts_presets_utc
  type: DateTimeSelector
  properties:
    title: UTC Presets
    selectUTC: true
    label:
      extra: With selectUTC, preset dates are read as UTC.
    presets:
      - label: Now (UTC)
        value:
          _date: now
      - label: Midnight UTC
        value:
          _dayjs:
            - now
            - utc
            - startOf: day
```

```yaml
dts_presets_relative:
  _state: dts_presets_relative
dts_presets_start_of_day:
  _state: dts_presets_start_of_day
dts_presets_utc:
  _state: dts_presets_utc
```

```yaml
- id: dts_lbl_default
  type: DateTimeSelector
  properties:
    title: Default Label
- id: dts_lbl_colon_off
  type: DateTimeSelector
  properties:
    title: No Colon
    label:
      colon: false
- id: dts_lbl_right
  type: DateTimeSelector
  properties:
    title: Align Right
    label:
      align: right
- id: dts_lbl_inline
  type: DateTimeSelector
  properties:
    title: Inline Label
    label:
      inline: true
      span: 8
- id: dts_lbl_extra
  type: DateTimeSelector
  properties:
    title: Appointment Time
    label:
      extra: Select the date and time for your appointment.
    placeholder: Select date & time
- id: dts_lbl_hidden
  type: DateTimeSelector
  properties:
    title: Hidden Label
    label:
      disabled: true
    placeholder: No label shown
```

```yaml
dts_lbl_default:
  _state: dts_lbl_default
dts_lbl_colon_off:
  _state: dts_lbl_colon_off
dts_lbl_right:
  _state: dts_lbl_right
dts_lbl_inline:
  _state: dts_lbl_inline
dts_lbl_extra:
  _state: dts_lbl_extra
dts_lbl_hidden:
  _state: dts_lbl_hidden
```

```yaml
- id: dts_lbl_span_4
  type: DateTimeSelector
  properties:
    title: Span 4
    label:
      inline: true
      span: 4
- id: dts_lbl_span_8
  type: DateTimeSelector
  properties:
    title: Span 8
    label:
      inline: true
      span: 8
- id: dts_lbl_span_12
  type: DateTimeSelector
  properties:
    title: Span 12
    label:
      inline: true
      span: 12
```

```yaml
dts_lbl_span_4:
  _state: dts_lbl_span_4
dts_lbl_span_8:
  _state: dts_lbl_span_8
dts_lbl_span_12:
  _state: dts_lbl_span_12
```

```yaml
- id: dts_style_width
  type: DateTimeSelector
  style:
    width: 400
  properties:
    title: Fixed Width (400px)
    label:
      disabled: true
- id: dts_style_element
  type: DateTimeSelector
  style:
    .element: null
  properties:
    title: Custom Background
    label:
      disabled: true
- id: dts_style_label
  type: DateTimeSelector
  style:
    .label:
      color: "#531dab"
      fontWeight: bold
  properties:
    title: Styled Label
```

```yaml
dts_style_width:
  _state: dts_style_width
dts_style_element:
  _state: dts_style_element
dts_style_label:
  _state: dts_style_label
```

```yaml
- id: dts_class_rounded
  type: DateTimeSelector
  class: rounded-lg shadow-sm
  properties:
    title: Rounded with Shadow
    label:
      disabled: true
- id: dts_class_border
  type: DateTimeSelector
  class: border-2 border-border
  properties:
    title: Blue Border
    label:
      disabled: true
```

```yaml
dts_class_rounded:
  _state: dts_class_rounded
dts_class_border:
  _state: dts_class_border
```

```yaml
- id: dts_theme_primary
  type: DateTimeSelector
  properties:
    title: Custom Primary Color
    label:
      disabled: true
    theme:
      colorPrimary: "#722ed1"
- id: dts_theme_radius
  type: DateTimeSelector
  properties:
    title: Large Border Radius
    label:
      disabled: true
    theme:
      borderRadius: 16
- id: dts_theme_bg
  type: DateTimeSelector
  properties:
    title: Custom Background
    variant: filled
    label:
      disabled: true
- id: dts_theme_tall
  type: DateTimeSelector
  properties:
    title: Tall Input
    label:
      disabled: true
    theme:
      controlHeight: 48
      fontSize: 18
      borderRadius: 12
- id: dts_theme_active_border
  type: DateTimeSelector
  properties:
    title: Custom Active Border
    label:
      disabled: true
    theme:
      activeBorderColor: "#fa8c16"
      hoverBorderColor: "#ffc069"
```

```yaml
dts_theme_primary:
  _state: dts_theme_primary
dts_theme_radius:
  _state: dts_theme_radius
dts_theme_bg:
  _state: dts_theme_bg
dts_theme_tall:
  _state: dts_theme_tall
dts_theme_active_border:
  _state: dts_theme_active_border
```

```yaml
- id: dts_combo_appointment
  type: DateTimeSelector
  properties:
    title: Appointment Date & Time
    placeholder: Select appointment date & time
    format: DD MMMM YYYY HH:mm
    size: large
    suffixIcon: AiOutlineSchedule
    showToday: true
    showNow: true
    allowClear: true
    minuteStep: 15
    label:
      extra: Choose your preferred appointment date and time.
      colon: false
- id: dts_combo_minimal
  type: DateTimeSelector
  properties:
    title: Date & Time
    variant: borderless
    size: small
    allowClear: false
    showToday: false
    showNow: false
    format: DD/MM/YYYY HH:mm
    placeholder: dd/mm/yyyy hh:mm
    label:
      disabled: true
- id: dts_combo_restricted
  type: DateTimeSelector
  properties:
    title: Event Registration
    placeholder: Select event date & time
    format: DD MMM YYYY HH:mm
    minuteStep: 30
    hourStep: 1
    suffixIcon:
      name: AiOutlineCalendar
      color: "#1677ff"
    disabledDates:
      min: 2026-01-01
      max: 2026-12-31
    label:
      extra: Only dates in 2026 are available. Times in 30-minute slots.
- id: dts_combo_utc_large
  type: DateTimeSelector
  properties:
    title: UTC Timestamp
    format: YYYY-MM-DD HH:mm
    selectUTC: true
    size: large
    variant: filled
    suffixIcon: AiOutlineClockCircle
    label:
      extra: Time is recorded in UTC.
- id: dts_combo_themed
  type: DateTimeSelector
  properties:
    title: Themed Picker
    variant: filled
    size: large
    format: DD MMMM YYYY HH:mm
    placeholder: Choose a special date & time...
    minuteStep: 15
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
dts_combo_appointment:
  _state: dts_combo_appointment
dts_combo_minimal:
  _state: dts_combo_minimal
dts_combo_restricted:
  _state: dts_combo_restricted
dts_combo_utc_large:
  _state: dts_combo_utc_large
dts_combo_themed:
  _state: dts_combo_themed
```

```yaml
- id: applied2_appt_card
  type: Card
  properties:
    title: Book an Appointment
  blocks:
    - id: applied2_appt_datetime
      type: DateTimeSelector
      properties:
        title: Appointment Date & Time
        placeholder: Select date and time
        format: DD MMMM YYYY HH:mm
        minuteStep: 15
        size: large
        suffixIcon: AiOutlineSchedule
        label:
          extra: Appointments are available in 15-minute slots.
        disabledDates:
          min: 2026-03-15
    - id: applied2_appt_service
      type: Selector
      properties:
        title: Service
        placeholder: Select a service...
        options:
          - label: General Consultation
            value: general
          - label: Follow-Up Visit
            value: followup
          - label: Specialist Referral
            value: specialist
          - label: Annual Check-Up
            value: annual
    - id: applied2_appt_notes
      type: TextArea
      properties:
        title: Additional Notes
        placeholder: Any details the provider should know...
        label:
          extra: Optional. Share symptoms or questions in advance.
    - id: applied2_appt_book_btn
      type: Button
      properties:
        title: Book Appointment
        icon: AiOutlineCalendar
        type: primary
        size: large
        block: true
      events:
        onClick:
          - id: book_appt_action
            type: DisplayMessage
            params:
              content: Appointment booked successfully! A confirmation email has been sent.
              duration: 3
```

```yaml
applied2_appt_card:
  _state: applied2_appt_card
```

```yaml
- id: applied3_meeting_card
  type: Card
  properties:
    title: Schedule a Meeting
  blocks:
    - id: applied3_meeting_title
      type: TextInput
      properties:
        title: Meeting Title
        placeholder: Enter meeting subject...
    - id: applied3_meeting_datetime
      type: DateTimeSelector
      properties:
        title: Meeting Date & Time
        placeholder: Select meeting date and time
        format: DD MMMM YYYY HH:mm
        minuteStep: 15
        suffixIcon: AiOutlineClockCircle
        label:
          extra: Meetings are scheduled in 15-minute increments.
        disabledDates:
          min: 2026-03-13
      events:
        onChange:
          - id: meeting_datetime_change
            type: SetState
            params:
              meetingDateSelected: true
    - id: applied3_meeting_schedule_btn
      type: Button
      properties:
        title: Schedule Meeting
        icon: AiOutlineSchedule
        type: primary
        size: large
        block: true
      events:
        onClick:
          - id: schedule_meeting_action
            type: DisplayMessage
            params:
              content: Meeting scheduled! Calendar invites will be sent to all participants.
              duration: 3
```

```yaml
applied3_meeting_card:
  _state: applied3_meeting_card
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
| `format` | string | - | Format in which to parse the date value, eg. "DD MMMM YYYY HH:mm" will parse a date value of 1999-12-31T15:30 as "31 December 1999 15:30". The format has to conform to dayjs formats. Defaults to the active locale's date-time format, or "YYYY-MM-DD HH:mm" when no locale is configured. |
| `hourStep` | integer | `1` | Hour intervals to show in the time selector. |
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
| `minuteStep` | integer | `5` | Minute intervals to show in the time selector. |
| `placeholder` | string | - | Placeholder text inside the block before user types input. |
| `presets` | array | - | Shortcuts listed next to the calendar to quickly select a date and time. Presets are re-evaluated every time the block config is evaluated, so operator based values like "_date: now" stay current. A preset is offered on the same terms as the calendar cells: a shortcut with nothing it may select is listed as disabled. |
| `presets.$.label` | string | - | Text shown for the shortcut - supports html. |
| `presets.$.value` | string \| number \| object | - | A date string, a timestamp, or a _date object. The date is used as the instant it names, so "_date: now" and _dayjs chains need no special handling. With selectUTC the instant is shown on the UTC clock, so a chain that snaps to a calendar boundary needs a utc step to snap to the UTC day, eg. "_dayjs: [now, utc, {startOf: day}]". Without selectUTC the instant is shown on the local clock, so a chain resolves in local time, eg. "_dayjs: [now, {startOf: day}]". |
| `secondStep` | integer | `5` | Minute intervals to show in the time selector. |
| `selectUTC` | boolean | `false` | Shows the user's selection as UTC time, not time-zone based. |
| `showToday` | boolean | `true` | Shows a button to easily select the current date if true. |
| `showNow` | boolean | `true` | Shows a 'Now' button to set current time. |
| `size` | string | `"default"` | Size of the block. Enum: `small`, `default`, `large`. |
| `suffixIcon` | string \| object | `"AiOutlineCalendar"` | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon on right-hand side of the date picker. |
| `timeFormat` | string | `"HH:mm"` | Time format to show in the time selector. HH:mm:ss will show hours, minutes and seconds, HH:mm only hours and minutes and HH only hours. |
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
| `onChange` | `{ value: any }` | Trigger actions when selection is changed. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The DateTimeSelector element. |
| `/label` | The DateTimeSelector label. |
| `/extra` | The DateTimeSelector extra content. |
| `/feedback` | The DateTimeSelector validation feedback. |
| `/popup` | The DateTimeSelector popup. |
| `/suffixIcon` | The suffix icon in the DateTimeSelector. |

No slots defined.
