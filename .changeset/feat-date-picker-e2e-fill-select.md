---
'@lowdefy/blocks-antd': patch
---

feat(blocks-antd): Add do.select() and do.fill() to date picker e2e helpers.

All five date picker e2e helpers (DateSelector, DateTimeSelector,
DateRangeSelector, MonthSelector, WeekSelector) now support
`do.select()` for calendar UI interaction and `do.fill()` for
typing dates directly. DateTimeSelector also supports time
selection via the time panel.
