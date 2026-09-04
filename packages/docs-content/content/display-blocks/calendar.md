# Calendar

Full-size or compact calendar for date display and selection, with support for disabled dates, date cell badges, and panel navigation events.

```yaml
- id: fullsize_default
  type: Calendar
```

```yaml
- id: compact_default
  type: Calendar
  properties:
    fullscreen: false
```

```yaml
- id: year_mode
  type: Calendar
  properties:
    mode: year
```

```yaml
- id: valid_range
  type: Calendar
  properties:
    validRange:
      - 2026-01-01
      - 2026-12-31
```

```yaml
- id: disabled_min_max
  type: Calendar
  properties:
    disabledDates:
      min: 2026-03-10
      max: 2026-03-25
- id: disabled_specific
  type: Calendar
  properties:
    fullscreen: false
    disabledDates:
      dates:
        - 2026-03-15
        - 2026-03-20
        - 2026-03-25
```

```yaml
- id: cell_data_badges
  type: Calendar
  properties:
    dateCellData:
      - date: 2026-03-05
        content: Team standup
        status: processing
      - date: 2026-03-05
        content: Code review
        status: success
      - date: 2026-03-12
        content: Sprint planning
        status: warning
      - date: 2026-03-15
        content: Release deadline
        status: error
      - date: 2026-03-20
        content: Demo day
        status: success
      - date: 2026-03-20
        content: Retrospective
        status: default
      - date: 2026-03-25
        content: Team lunch
        color: "#52c41a"
```

```yaml
- id: compact_badges
  type: Calendar
  properties:
    fullscreen: false
    dateCellData:
      - date: 2026-03-10
        content: Meeting
        status: success
      - date: 2026-03-18
        content: Deadline
        status: error
```

```yaml
- id: calendar_events
  type: Calendar
  properties:
    fullscreen: false
  events:
    onSelect:
      - id: show_date
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - "Selected: "
              - _event: date
          duration: 2
```

```yaml
- id: calendar_events
  type: Calendar
  properties:
    fullscreen: false
  events:
    onSelect:
      - id: show_date
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - "Selected: "
              - _event: date
          duration: 2
```

```yaml
- id: themed_calendar
  type: Calendar
  properties:
    fullscreen: false
    theme:
      itemActiveBg: "#f9f0ff"
      colorPrimary: "#722ed1"
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `fullscreen` | boolean | `true` | Whether to display the calendar in full size. Set to false for a compact card-style calendar. |
| `mode` | string | `"month"` | The display mode of the calendar panel. Enum: `month`, `year`. |
| `disabledDates` | object | - | Disable specific dates so that they can not be chosen. |
| `disabledDates.min` | string \| object | - | Disable all dates less than the minimum date. Can be a date string or a _date object. |
| `disabledDates.max` | string \| object | - | Disable all dates greater than the maximum date. Can be a date string or a _date object. |
| `disabledDates.dates` | array | - | Array of specific dates to disable. |
| `disabledDates.ranges` | array | - | Array of date ranges to disable. A range is an object with a from and a to date, or an array of the two dates. |
| `disabledDates.ranges.$.from` | string \| object | - | Start of the disabled range. |
| `disabledDates.ranges.$.to` | string \| object | - | End of the disabled range. |
| `validRange` | array | - | Set the valid date range as [startDate, endDate]. Dates outside this range will be disabled. |
| `dateCellData` | array | - | Data to display inside calendar date cells. Each item renders as a Badge in the corresponding date cell. |
| `dateCellData.$.date` | string | - | The date for this cell data (ISO date string). |
| `dateCellData.$.content` | string | - | Text to display in the date cell. |
| `dateCellData.$.status` | string | - | Badge status type. Enum: `success`, `processing`, `default`, `error`, `warning`. |
| `dateCellData.$.color` | string | - | Custom badge color. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design calendar tokens](https://ant.design/components/calendar#design-token). |
| `theme.fullBg` | string | - | Background color of the full-size calendar. |
| `theme.fullPanelBg` | string | - | Background color of the calendar panel in full-size mode. |
| `theme.itemActiveBg` | string | - | Background color of the active/selected date. |
| `theme.yearControlWidth` | number | `80` | Width of the year select control in the header. |
| `theme.monthControlWidth` | number | `70` | Width of the month select control in the header. |
| `theme.miniContentHeight` | number | `256` | Height of the content area in mini (non-fullscreen) mode. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | `{ value: any, date: string }` | Trigger actions when the selected date changes. |
| `onSelect` | `{ value: any, date: string, source: string }` | Trigger actions when a date cell is clicked. |
| `onPanelChange` | `{ value: any, date: string, mode: string }` | Trigger actions when the calendar panel mode or date changes. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Calendar element. |

No slots defined.
