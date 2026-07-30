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
          - _dayjs: [now, { subtract: [7, days] }, { format: YYYY-MM-DD }]
          - _dayjs: [now, { format: YYYY-MM-DD }]
      - label: Month to date
        value:
          - _dayjs: [now, { startOf: month }, { format: YYYY-MM-DD }]
          - _dayjs: [now, { format: YYYY-MM-DD }]
      - label: 2026 Q1
        value: ['2026-01-01', '2026-03-31']
```

The date pickers read a preset as UTC, the same as the block value, so a fixed date like
`2026-01-01` selects the day it names in every timezone. A date relative to now is an instant rather
than a calendar date, so end a `_dayjs` chain with a `format` step, as above — a chain that resolves
to an instant can select the day, month or week before or after the current one, depending on the
browser timezone and the time of day.

`DateTimeSelector` selects an instant, so `_date: now` and plain `_dayjs` chains are all it needs. It
follows its `selectUTC` setting: with it the instant is shown on the UTC clock, without it on the
local clock.

Presets respect `disabledDates`. A preset is offered on the same terms as the calendar cells: a
`DateRangeSelector` range that starts or ends on a disabled date is narrowed to the dates it may
select, so a `Last 7 days` shortcut next to `disabledDates.min: now` selects today rather than
silently doing nothing. A shortcut with nothing it may select is listed as disabled.
