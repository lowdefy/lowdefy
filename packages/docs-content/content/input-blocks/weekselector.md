# WeekSelector

Week picker for selecting a week of the year.

```yaml
- id: ws_basic_default
  type: WeekSelector
  properties:
    title: Select a Week
- id: ws_basic_with_extra
  type: WeekSelector
  properties:
    title: Reporting Week
    placeholder: Pick a week...
    label:
      extra: Choose the week for the weekly report.
```

```yaml
ws_basic_default:
  _state: ws_basic_default
ws_basic_with_extra:
  _state: ws_basic_with_extra
```

```yaml
- id: ws_size_small
  type: WeekSelector
  properties:
    title: Small
    size: small
- id: ws_size_default
  type: WeekSelector
  properties:
    title: Default
- id: ws_size_large
  type: WeekSelector
  properties:
    title: Large
    size: large
```

```yaml
ws_size_small:
  _state: ws_size_small
ws_size_default:
  _state: ws_size_default
ws_size_large:
  _state: ws_size_large
```

```yaml
- id: ws_variant_outlined
  type: WeekSelector
  properties:
    title: Outlined (default)
    variant: outlined
- id: ws_variant_filled
  type: WeekSelector
  properties:
    title: Filled
    variant: filled
- id: ws_variant_borderless
  type: WeekSelector
  properties:
    title: Borderless
    variant: borderless
```

```yaml
ws_variant_outlined:
  _state: ws_variant_outlined
ws_variant_filled:
  _state: ws_variant_filled
ws_variant_borderless:
  _state: ws_variant_borderless
```

```yaml
- id: ws_fmt_default
  type: WeekSelector
  properties:
    title: YYYY-wo (default)
    format: YYYY-wo
    label:
      disabled: true
- id: ws_fmt_reversed
  type: WeekSelector
  properties:
    title: wo-YYYY
    format: wo-YYYY
    label:
      disabled: true
- id: ws_fmt_week_prefix
  type: WeekSelector
  properties:
    title: YYYY [Week] wo
    format: YYYY [Week] wo
    label:
      disabled: true
- id: ws_fmt_w_prefix
  type: WeekSelector
  properties:
    title: YYYY [W]ww
    format: YYYY [W]ww
    label:
      disabled: true
```

```yaml
ws_fmt_default:
  _state: ws_fmt_default
ws_fmt_reversed:
  _state: ws_fmt_reversed
ws_fmt_week_prefix:
  _state: ws_fmt_week_prefix
ws_fmt_w_prefix:
  _state: ws_fmt_w_prefix
```

```yaml
- id: ws_ph_default
  type: WeekSelector
  properties:
    title: Default Placeholder
    label:
      disabled: true
- id: ws_ph_custom
  type: WeekSelector
  properties:
    title: Custom Placeholder
    placeholder: Pick a week...
    label:
      disabled: true
- id: ws_ph_descriptive
  type: WeekSelector
  properties:
    title: Descriptive Placeholder
    placeholder: Which week does the report cover?
    label:
      disabled: true
```

```yaml
ws_ph_default:
  _state: ws_ph_default
ws_ph_custom:
  _state: ws_ph_custom
ws_ph_descriptive:
  _state: ws_ph_descriptive
```

```yaml
- id: ws_clear_enabled
  type: WeekSelector
  properties:
    title: Allow Clear (default)
    allowClear: true
    label:
      disabled: true
- id: ws_clear_disabled
  type: WeekSelector
  properties:
    title: No Clear Button
    allowClear: false
    label:
      disabled: true
```

```yaml
ws_clear_enabled:
  _state: ws_clear_enabled
ws_clear_disabled:
  _state: ws_clear_disabled
```

```yaml
- id: ws_today_enabled
  type: WeekSelector
  properties:
    title: Show Today (default)
    showToday: true
    label:
      disabled: true
- id: ws_today_disabled
  type: WeekSelector
  properties:
    title: No Today Button
    showToday: false
    label:
      disabled: true
```

```yaml
ws_today_enabled:
  _state: ws_today_enabled
ws_today_disabled:
  _state: ws_today_disabled
```

```yaml
- id: ws_icon_default
  type: WeekSelector
  properties:
    title: Default Calendar Icon
    label:
      disabled: true
- id: ws_icon_clock
  type: WeekSelector
  properties:
    title: Clock Icon
    suffixIcon: AiOutlineClockCircle
    label:
      disabled: true
- id: ws_icon_schedule
  type: WeekSelector
  properties:
    title: Schedule Icon
    suffixIcon: AiOutlineSchedule
    label:
      disabled: true
- id: ws_icon_custom_color
  type: WeekSelector
  properties:
    title: Custom Color Icon
    suffixIcon:
      name: AiOutlineCalendar
      color: "#1677ff"
    label:
      disabled: true
```

```yaml
ws_icon_default:
  _state: ws_icon_default
ws_icon_clock:
  _state: ws_icon_clock
ws_icon_schedule:
  _state: ws_icon_schedule
ws_icon_custom_color:
  _state: ws_icon_custom_color
```

```yaml
- id: ws_dis_default
  type: WeekSelector
  properties:
    title: Disabled
    disabled: true
    label:
      disabled: true
- id: ws_dis_filled
  type: WeekSelector
  properties:
    title: Disabled Filled
    disabled: true
    variant: filled
    label:
      disabled: true
```

```yaml
ws_dis_default:
  _state: ws_dis_default
ws_dis_filled:
  _state: ws_dis_filled
```

```yaml
- id: ws_dd_min
  type: WeekSelector
  properties:
    title: Min Date (2024-01-01)
    disabledDates:
      min: 2024-01-01
    label:
      disabled: true
- id: ws_dd_range
  type: WeekSelector
  properties:
    title: Min & Max (2026 only)
    disabledDates:
      min: 2026-01-01
      max: 2026-12-31
    label:
      disabled: true
- id: ws_dd_specific
  type: WeekSelector
  properties:
    title: Specific Dates Disabled
    disabledDates:
      dates:
        - 2026-03-15
        - 2026-03-20
        - 2026-03-25
    label:
      disabled: true
- id: ws_dd_date_ranges
  type: WeekSelector
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
ws_dd_min:
  _state: ws_dd_min
ws_dd_range:
  _state: ws_dd_range
ws_dd_specific:
  _state: ws_dd_specific
ws_dd_date_ranges:
  _state: ws_dd_date_ranges
```

```yaml
- id: ws_presets_relative
  type: WeekSelector
  properties:
    title: Relative Presets
    label:
      extra: Shortcuts are listed to the left of the calendar.
    presets:
      - label: This week
        value:
          _dayjs:
            - now
            - startOf: week
            - format: YYYY-MM-DD
      - label: Last week
        value:
          _dayjs:
            - now
            - subtract:
                - 1
                - week
            - format: YYYY-MM-DD
      - label: 4 weeks ago
        value:
          _dayjs:
            - now
            - subtract:
                - 4
                - weeks
            - format: YYYY-MM-DD
- id: ws_presets_fixed
  type: WeekSelector
  properties:
    title: Fixed Presets
    label:
      disabled: true
    presets:
      - label: First week of 2026
        value: 2026-01-01
      - label: Week of 1 July 2026
        value: 2026-07-01
```

```yaml
- id: ws_presets_relative
  type: WeekSelector
  properties:
    title: Relative Presets
    label:
      extra: Shortcuts are listed to the left of the calendar.
    presets:
      - label: This week
        value:
          _dayjs:
            - now
            - startOf: week
            - format: YYYY-MM-DD
      - label: Last week
        value:
          _dayjs:
            - now
            - subtract:
                - 1
                - week
            - format: YYYY-MM-DD
      - label: 4 weeks ago
        value:
          _dayjs:
            - now
            - subtract:
                - 4
                - weeks
            - format: YYYY-MM-DD
- id: ws_presets_fixed
  type: WeekSelector
  properties:
    title: Fixed Presets
    label:
      disabled: true
    presets:
      - label: First week of 2026
        value: 2026-01-01
      - label: Week of 1 July 2026
        value: 2026-07-01
```

```yaml
ws_presets_relative:
  _state: ws_presets_relative
ws_presets_fixed:
  _state: ws_presets_fixed
```

```yaml
- id: ws_lbl_default
  type: WeekSelector
  properties:
    title: Default Label
- id: ws_lbl_colon_off
  type: WeekSelector
  properties:
    title: No Colon
    label:
      colon: false
- id: ws_lbl_inline
  type: WeekSelector
  properties:
    title: Inline Label
    label:
      inline: true
      span: 8
- id: ws_lbl_extra
  type: WeekSelector
  properties:
    title: Sprint Week
    label:
      extra: Choose the <b>sprint week</b> for your team.
    placeholder: Select sprint week
```

```yaml
ws_lbl_default:
  _state: ws_lbl_default
ws_lbl_colon_off:
  _state: ws_lbl_colon_off
ws_lbl_inline:
  _state: ws_lbl_inline
ws_lbl_extra:
  _state: ws_lbl_extra
```

```yaml
- id: ws_lbl_hidden
  type: WeekSelector
  properties:
    title: Hidden Label
    label:
      disabled: true
    placeholder: No label shown
- id: ws_lbl_hidden_filled
  type: WeekSelector
  properties:
    title: Hidden Label Filled
    label:
      disabled: true
    variant: filled
    placeholder: No label, filled variant
```

```yaml
ws_lbl_hidden:
  _state: ws_lbl_hidden
ws_lbl_hidden_filled:
  _state: ws_lbl_hidden_filled
```

```yaml
- id: ws_af_on
  type: WeekSelector
  properties:
    title: Auto Focus Enabled
    autoFocus: true
    label:
      disabled: true
```

```yaml
ws_af_on:
  _state: ws_af_on
```

```yaml
- id: ws_style_element_bg
  type: WeekSelector
  style:
    .element: null
  properties:
    title: Custom Background
    label:
      disabled: true
- id: ws_style_label
  type: WeekSelector
  style:
    .label:
      color: "#531dab"
      fontWeight: bold
  properties:
    title: Styled Label
```

```yaml
ws_style_element_bg:
  _state: ws_style_element_bg
ws_style_label:
  _state: ws_style_label
```

```yaml
- id: ws_class_rounded
  type: WeekSelector
  class: rounded-lg shadow-sm
  properties:
    title: Rounded with Shadow
    label:
      disabled: true
- id: ws_class_border
  type: WeekSelector
  class: border-2 border-border
  properties:
    title: Blue Border
    label:
      disabled: true
```

```yaml
ws_class_rounded:
  _state: ws_class_rounded
ws_class_border:
  _state: ws_class_border
```

```yaml
- id: ws_theme_primary_color
  type: WeekSelector
  properties:
    title: Custom Primary Color
    label:
      disabled: true
    theme:
      colorPrimary: "#722ed1"
- id: ws_theme_large_radius
  type: WeekSelector
  properties:
    title: Large Border Radius
    label:
      disabled: true
    theme:
      borderRadius: 16
- id: ws_theme_tall
  type: WeekSelector
  properties:
    title: Tall Input
    label:
      disabled: true
    theme:
      controlHeight: 48
      fontSize: 18
      borderRadius: 12
- id: ws_theme_brand_color
  type: WeekSelector
  properties:
    title: Brand Purple
    label:
      disabled: true
    theme:
      colorPrimary: "#722ed1"
      colorBorder: "#d3adf7"
- id: ws_theme_popup_highlight
  type: WeekSelector
  properties:
    title: Custom Cell Highlight
    label:
      disabled: true
    theme:
      activeBorderColor: "#fa8c16"
      cellHoverBg: rgba(250, 140, 22, 0.1)
```

```yaml
ws_theme_primary_color:
  _state: ws_theme_primary_color
ws_theme_large_radius:
  _state: ws_theme_large_radius
ws_theme_tall:
  _state: ws_theme_tall
ws_theme_brand_color:
  _state: ws_theme_brand_color
ws_theme_popup_highlight:
  _state: ws_theme_popup_highlight
```

```yaml
- id: ws_combined_full
  type: WeekSelector
  properties:
    title: Sprint Planning Week
    placeholder: Select sprint week
    format: YYYY [Week] wo
    size: large
    suffixIcon: AiOutlineSchedule
    showToday: true
    allowClear: true
    label:
      extra: Choose the week for sprint planning.
      colon: false
- id: ws_combined_minimal
  type: WeekSelector
  properties:
    title: Week
    variant: borderless
    size: small
    allowClear: false
    showToday: false
    format: YYYY-ww
    placeholder: wk
    label:
      disabled: true
- id: ws_combined_restricted
  type: WeekSelector
  properties:
    title: Fiscal Week
    placeholder: Select fiscal week
    format: YYYY [W]ww
    suffixIcon:
      name: AiOutlineCalendar
      color: "#1677ff"
    disabledDates:
      min: 2026-01-01
      max: 2026-12-31
    label:
      extra: Only weeks in fiscal year 2026 are available.
```

```yaml
ws_combined_full:
  _state: ws_combined_full
ws_combined_minimal:
  _state: ws_combined_minimal
ws_combined_restricted:
  _state: ws_combined_restricted
```

```yaml
- id: applied_sprint_card
  type: Card
  properties:
    title: Sprint Planning
  blocks:
    - id: applied_sprint_week
      type: WeekSelector
      properties:
        title: Sprint Week
        placeholder: Select sprint week
        format: YYYY [Week] wo
        size: large
        suffixIcon: AiOutlineSchedule
        label:
          extra: Choose the week this sprint begins.
    - id: applied_sprint_team
      type: Selector
      properties:
        title: Team
        placeholder: Select team...
        options:
          - label: Frontend
            value: frontend
          - label: Backend
            value: backend
          - label: Mobile
            value: mobile
          - label: Infrastructure
            value: infra
    - id: applied_sprint_capacity
      type: NumberInput
      properties:
        title: Team Capacity
        placeholder: Enter story points
        label:
          extra: Total story points available for this sprint.
    - id: applied_sprint_btn
      type: Button
      properties:
        title: Start Sprint
        icon: AiOutlineThunderbolt
        type: primary
        block: true
      events:
        onClick:
          - id: start_sprint_action
            type: DisplayMessage
            params:
              content: Sprint has been started successfully!
              status: success
```

```yaml
applied_sprint_card:
  _state: applied_sprint_card
```

```yaml
- id: applied_ts_card
  type: Card
  properties:
    title: Log Weekly Hours
  blocks:
    - id: applied_ts_week
      type: WeekSelector
      properties:
        title: Work Week
        placeholder: Select week to log
        format: YYYY [W]ww
        disabledDates:
          min: 2026-01-01
        label:
          extra: Select the week you want to submit hours for.
      events:
        onChange:
          - id: week_selected
            type: SetState
            params:
              selectedWeek:
                _state: applied_ts_week
    - id: applied_ts_project
      type: Selector
      properties:
        title: Project
        placeholder: Select project...
        options:
          - label: Website Redesign
            value: web-redesign
          - label: API Migration
            value: api-migration
          - label: Mobile App v2
            value: mobile-v2
          - label: Internal Tools
            value: internal
    - id: applied_ts_hours
      type: NumberInput
      properties:
        title: Hours Worked
        placeholder: Enter hours
        min: 0
        max: 60
        precision: 1
        label:
          extra: Total hours for the selected week.
    - id: applied_ts_notes
      type: TextArea
      properties:
        title: Notes
        placeholder: Describe what you worked on...
        autoSize:
          minRows: 2
          maxRows: 4
    - id: applied_ts_submit
      type: Button
      properties:
        title: Submit Timesheet
        icon: AiOutlineCheck
        type: primary
        block: true
      events:
        onClick:
          - id: submit_ts
            type: Validate
            params:
              - applied_ts_week
              - applied_ts_hours
          - id: ts_success
            type: DisplayMessage
            params:
              content: Timesheet submitted successfully.
              status: success
```

```yaml
- id: applied_ts_card
  type: Card
  properties:
    title: Log Weekly Hours
  blocks:
    - id: applied_ts_week
      type: WeekSelector
      properties:
        title: Work Week
        placeholder: Select week to log
        format: YYYY [W]ww
        disabledDates:
          min: 2026-01-01
        label:
          extra: Select the week you want to submit hours for.
      events:
        onChange:
          - id: week_selected
            type: SetState
            params:
              selectedWeek:
                _state: applied_ts_week
    - id: applied_ts_project
      type: Selector
      properties:
        title: Project
        placeholder: Select project...
        options:
          - label: Website Redesign
            value: web-redesign
          - label: API Migration
            value: api-migration
          - label: Mobile App v2
            value: mobile-v2
          - label: Internal Tools
            value: internal
    - id: applied_ts_hours
      type: NumberInput
      properties:
        title: Hours Worked
        placeholder: Enter hours
        min: 0
        max: 60
        precision: 1
        label:
          extra: Total hours for the selected week.
    - id: applied_ts_notes
      type: TextArea
      properties:
        title: Notes
        placeholder: Describe what you worked on...
        autoSize:
          minRows: 2
          maxRows: 4
    - id: applied_ts_submit
      type: Button
      properties:
        title: Submit Timesheet
        icon: AiOutlineCheck
        type: primary
        block: true
      events:
        onClick:
          - id: submit_ts
            type: Validate
            params:
              - applied_ts_week
              - applied_ts_hours
          - id: ts_success
            type: DisplayMessage
            params:
              content: Timesheet submitted successfully.
              status: success
```

```yaml
applied_ts_card:
  _state: applied_ts_card
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
| `format` | string | `"YYYY-wo"` | Format in which to format the date value, eg. "wo-YYYY" will format a date value of 1999-12-26 as "52nd-1999". The format has to conform to dayjs formats. |
| `placeholder` | string | - | Placeholder text inside the block before user types input. |
| `presets` | array | - | Shortcuts listed next to the calendar to quickly select a week. Presets are re-evaluated every time the block config is evaluated, so operator based values like "_date: now" stay current. A preset is offered on the same terms as the calendar cells: a shortcut with nothing it may select is listed as disabled. |
| `presets.$.label` | string | - | Text shown for the shortcut - supports html. |
| `presets.$.value` | string \| number \| object | - | A date string, a timestamp, or a _date object. Dates are read as UTC, the same as the block value, so a fixed date like "2026-01-01" resolves to the same week in every timezone. A date relative to now is an instant, not a calendar date, so end a _dayjs chain with a format step to pin it to the local calendar: "_dayjs: [now, {startOf: week}, {format: YYYY-MM-DD}]". Without the format step the chain resolves to an instant, which can select the week before or after the current one, depending on the browser timezone and the time of day. |
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
| `showToday` | boolean | `true` | Shows a button to easily select the current date if true. |
| `size` | string | `"default"` | Size of the block. Enum: `small`, `default`, `large`. |
| `suffixIcon` | string \| object | `"AiOutlineCalendar"` | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon at the right-hand side of the date picker. |
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
| `theme.borderRadiusSM` | number | `4` | Border radius for the small picker. |
| `theme.borderRadiusLG` | number | `8` | Border radius for the large picker and popup panel. |
| `theme.controlHeight` | number | `32` | Height of the input. |
| `theme.controlHeightLG` | number | `40` | Height for large size. |
| `theme.controlHeightSM` | number | `24` | Height for small size. |
| `theme.fontSize` | number | `14` | Font size of the picker input. |
| `theme.fontSizeSM` | number | `14` | Font size for the small picker. |
| `theme.fontSizeLG` | number | `16` | Font size for the large picker. |
| `theme.lineWidth` | number | `1` | Border width. |
| `theme.colorPrimary` | string | - | Primary color override. |
| `theme.colorBgContainer` | string | - | Background color of the input. |
| `theme.colorText` | string | - | Text color. |
| `theme.colorBorder` | string | - | Border color. |
| `theme.colorTextPlaceholder` | string | - | Placeholder text color. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | `{ value: any }` | Trigger action when week is changed. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The WeekSelector element. |
| `/label` | The WeekSelector label. |
| `/extra` | The WeekSelector extra content. |
| `/feedback` | The WeekSelector validation feedback. |
| `/popup` | The WeekSelector popup. |
| `/suffixIcon` | The suffix icon in the WeekSelector. |

No slots defined.
