---
'@lowdefy/blocks-antd': patch
---

fix(blocks-antd): Read `disabledDates` on the calendar's clock.

`disabledDates` compared instants while reading its own bounds in local time, so in a timezone ahead
of UTC the same calendar date could be disabled or allowed depending on which clock the date arrived
on. On `DateSelector`, `DateRangeSelector`, `MonthSelector` and `WeekSelector` that meant a date was
disabled in an empty picker but allowed once the block had a value, because the panel then works in
the UTC wall clock the block reads its value in.

Bounds and dates are now compared as the calendar dates they name, so `disabledDates.min:
'2026-07-15'` disables everything before 15 July on every clock and in every timezone. Apps in a
timezone ahead of UTC that relied on the off-by-one boundary will see the bound move to the date it
names.
