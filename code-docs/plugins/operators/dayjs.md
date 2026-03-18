# @lowdefy/operators-dayjs

Date and time operators using [Day.js](https://day.js.org/).

## Operators

| Operator | Purpose                    |
| -------- | -------------------------- |
| `_dayjs` | Full Day.js operations     |
| `_date`  | Simplified date operations |

## \_date

Simple date operations:

```yaml
# Current date/time
now:
  _date: now

# Format current date
formatted:
  _date:
    - now
    - format: YYYY-MM-DD

# Parse and format
displayDate:
  _date:
    - _state: dateString
    - format: MMMM D, YYYY

# Add/subtract time
nextWeek:
  _date:
    - now
    - add:
        - 7
        - days
```

## \_dayjs

Full Day.js API:

```yaml
# Create dayjs instance
date:
  _dayjs:
    - '2024-01-15'
    - YYYY-MM-DD

# Chain operations
result:
  _dayjs:
    on:
      _state: startDate
    operations:
      - - add
        - 1
        - month
      - - startOf
        - month
      - - format
        - YYYY-MM-DD
```

## Common Operations

### Format Tokens

| Token  | Output  |
| ------ | ------- |
| `YYYY` | 2024    |
| `MM`   | 01-12   |
| `DD`   | 01-31   |
| `HH`   | 00-23   |
| `mm`   | 00-59   |
| `ss`   | 00-59   |
| `MMMM` | January |
| `dddd` | Monday  |

### Relative Time

```yaml
ago:
  _dayjs:
    on:
      _state: createdAt
    operations:
      - - fromNow
```

### Difference

```yaml
daysBetween:
  _dayjs:
    on:
      _state: endDate
    operations:
      - - diff
        - _state: startDate
        - days
```

### Comparison

```yaml
isAfter:
  _dayjs:
    on:
      _state: date1
    operations:
      - - isAfter
        - _state: date2
```

## Breaking Changes from v4

- `_moment` renamed to `_dayjs` — simple find-and-replace in YAML config
- `thresholds` parameter on `humanizeDuration` is accepted but ignored
- Locale names are auto-normalized (e.g. `en-US` → `en`)
- 22 bundled locales; uncommon locales fall back to English
