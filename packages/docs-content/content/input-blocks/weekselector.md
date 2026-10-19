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
- id: ws_variant_underlined
  type: WeekSelector
  properties:
    title: Underlined
    variant: underlined
    label:
      disabled: true
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
- id: ws_prefix_icon
  type: WeekSelector
  properties:
    title: Prefix Icon
    prefixIcon: clock
    suffixIcon:
      name: calendar
      color: "#8c8c8c"
- id: ws_prefix_text
  type: WeekSelector
  properties:
    title: Prefix Text
    prefix: "From:"
- id: ws_placement
  type: WeekSelector
  properties:
    title: Popup Opens Top Right
    placement: topRight
- id: ws_read_only
  type: WeekSelector
  properties:
    title: Pick From Calendar Only
    inputReadOnly: true
    label:
      extra: The input is read-only, so touch devices do not open the keyboard.
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
    suffixIcon: clock
    label:
      disabled: true
- id: ws_icon_schedule
  type: WeekSelector
  properties:
    title: Schedule Icon
    suffixIcon: CalendarDays
    label:
      disabled: true
- id: ws_icon_custom_color
  type: WeekSelector
  properties:
    title: Custom Color Icon
    suffixIcon:
      name: calendar
      color: "#1677ff"
    label:
      disabled: true
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
- id: ws_af_on
  type: WeekSelector
  properties:
    title: Auto Focus Enabled
    autoFocus: true
    label:
      disabled: true
```

```yaml
- id: ws_style_element_bg
  type: WeekSelector
  style:
    .element:
      backgroundColor: var(--ant-color-primary-bg)
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
- id: ws_combined_full
  type: WeekSelector
  properties:
    title: Sprint Planning Week
    placeholder: Select sprint week
    format: YYYY [Week] wo
    size: large
    suffixIcon: CalendarDays
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
      name: calendar
      color: "#1677ff"
    disabledDates:
      min: 2026-01-01
      max: 2026-12-31
    label:
      extra: Only weeks in fiscal year 2026 are available.
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
        suffixIcon: CalendarDays
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
        icon: Zap
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
        icon: check
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
| `format` | string | `"YYYY-wo"` | Format in which to format the date value, eg. "wo-YYYY" will format a date value of 1999-12-26 as "52nd-1999". The format has to conform to dayjs formats. |
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
| `presets` | array | - | Shortcuts listed next to the calendar to quickly select a week. Presets are re-evaluated every time the block config is evaluated, so operator based values like "_date: now" stay current. A preset is offered on the same terms as the calendar cells: a shortcut with nothing it may select is listed as disabled. |
| `presets.$.label` | string | - | Text shown for the shortcut - supports html. |
| `presets.$.value` | string \| number \| object | - | A date string, a timestamp, or a _date object. Dates are read as UTC, the same as the block value, so a fixed date like "2026-01-01" resolves to the same week in every timezone. A date relative to now is an instant, not a calendar date, so end a _dayjs chain with a format step to pin it to the local calendar: "_dayjs: [now, {startOf: week}, {format: YYYY-MM-DD}]". Without the format step the chain resolves to an instant, which can select the week before or after the current one, depending on the browser timezone and the time of day. |
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
| `showToday` | boolean | `true` | Deprecated - has no effect. The week picker has no button to select the current date. |
| `size` | string | `"default"` | Size of the block. Enum: `small`, `default`, `large`. |
| `suffixIcon` | string \| object | `"calendar"` | Icon name (a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`) or properties of an Icon block to customize icon at the right-hand side of the date picker. |
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
| `onChange` | `{ value }` | Trigger action when week is changed. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The WeekSelector element. |
| `/label` | The WeekSelector label. |
| `/extra` | The WeekSelector extra content. |
| `/feedback` | The WeekSelector validation feedback. |
| `/popup` | The WeekSelector popup. |
| `/prefixIcon` | The prefix icon in the WeekSelector. |
| `/suffixIcon` | The suffix icon in the WeekSelector. |

No slots defined.
