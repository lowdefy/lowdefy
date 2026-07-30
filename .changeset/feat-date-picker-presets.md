---
'@lowdefy/blocks-antd': minor
'@lowdefy/docs-content': patch
---

feat(blocks-antd): Add `presets` to the date picker blocks.

`DateRangeSelector`, `DateSelector`, `DateTimeSelector`, `MonthSelector` and `WeekSelector` accept a
`presets` array that renders quick select shortcuts next to the calendar, like antd's
[preset ranges](https://ant.design/components/date-picker#date-picker-demo-preset-ranges).

A preset is a `label` (supports html) and a `value`. `DateRangeSelector` takes a `[from, to]` pair,
the other blocks take a single date. Values are dates — a date string, a timestamp, or a `_date`
object — so relative shortcuts are built with the existing operators, and are re-evaluated on every
render instead of being frozen at page load:

```yaml
- id: report_period
  type: DateRangeSelector
  properties:
    presets:
      - label: Last 7 Days
        value:
          - _dayjs: [now, utc, { subtract: [7, days] }]
          - _date: now
      - label: Month to date
        value:
          - _dayjs: [now, utc, { startOf: month }]
          - _date: now
      - label: 2026 Q1
        value: ['2026-01-01', '2026-03-31']
```

Preset dates are read as UTC, the same as the block value, so a `_date` object selects the calendar
date it names in every timezone. Start `_dayjs` chains with a `utc` step — steps that snap to a
calendar boundary, like `startOf` and `endOf`, resolve in local time otherwise and can land on the
wrong day.
