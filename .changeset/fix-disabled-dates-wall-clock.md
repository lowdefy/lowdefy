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

`disabledDates.ranges` is documented as a list of `{ from, to }` objects, but only an array of the
two dates was read and anything else was dropped, so a range written the documented way disabled
nothing:

```yaml
disabledDates:
  ranges:
    - from: 2026-03-10
      to: 2026-03-14
    - ['2026-03-20', '2026-03-24'] # still works
```

Both shapes are now read. Config that is neither raises an error instead of being dropped, and the
same applies to the rest of `disabledDates`: a `min`, `max` or `dates` entry that is not a date, and
a `dates` or `ranges` value that is not an array, were all ignored silently and now report where
they are wrong. An app carrying one of these mistakes will surface an error on the block where it
previously rendered a picker that quietly disabled nothing.
