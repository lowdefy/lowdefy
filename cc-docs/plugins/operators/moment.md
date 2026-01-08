# @lowdefy/operators-moment

Date and time operators using Moment.js.

## Operators

| Operator | Purpose |
|----------|---------|
| `_moment` | Full Moment.js operations |
| `_date` | Simplified date operations |

## _date

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

## _moment

Full Moment.js API:

```yaml
# Create moment
date:
  _moment:
    - '2024-01-15'
    - YYYY-MM-DD

# Chain operations
result:
  _moment:
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

| Token | Output |
|-------|--------|
| `YYYY` | 2024 |
| `MM` | 01-12 |
| `DD` | 01-31 |
| `HH` | 00-23 |
| `mm` | 00-59 |
| `ss` | 00-59 |
| `MMMM` | January |
| `dddd` | Monday |

### Relative Time

```yaml
ago:
  _moment:
    on:
      _state: createdAt
    operations:
      - - fromNow
```

### Difference

```yaml
daysBetween:
  _moment:
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
  _moment:
    on:
      _state: date1
    operations:
      - - isAfter
        - _state: date2
```
