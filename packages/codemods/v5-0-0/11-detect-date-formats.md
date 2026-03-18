# Migration: Detect Custom Date Format Strings

## Context

The date blocks use dayjs instead of moment.js in antd v6. Most format strings are compatible, but edge cases exist with locale-specific tokens and some moment-specific patterns.

## What to Do

Find custom date format strings on date blocks and verify they work with dayjs. Standard formats need no changes.

**Affected blocks:** DateSelector, DateRangeSelector, DateTimeSelector, MonthSelector, WeekSelector.

**Standard formats (no action needed):**

- `YYYY-MM-DD`
- `YYYY-MM-DD HH:mm:ss`
- `YYYY-MM-DD HH:mm`
- `HH:mm:ss`
- `HH:mm`

**Formats to check:**

- Custom format strings that aren't in the standard list above
- Locale-specific format tokens (e.g., `LLLL`, `LT`, `LTS`)
- Moment-specific tokens: `Mo` (ordinal month), `Do` (ordinal day), `Qo` (ordinal quarter)

## Files to Check

Glob: `**/*.{yaml,yml}`
Grep: `type: DateSelector|type: DateRangeSelector|type: DateTimeSelector|type: MonthSelector|type: WeekSelector`

Then look for `format:` properties within those blocks.

## Examples

### No action needed

```yaml
- id: start_date
  type: DateSelector
  properties:
    format: YYYY-MM-DD
```

### Needs review

```yaml
- id: display_date
  type: DateSelector
  properties:
    format: Do MMMM YYYY
```

`Do` (ordinal day like "1st", "2nd") requires the dayjs `advancedFormat` plugin. Verify it renders correctly.

### Operator expression — skip

```yaml
- id: dynamic_date
  type: DateSelector
  properties:
    format:
      _state: dateFormat
```

Skip operator expressions — they'll resolve at runtime.

## Edge Cases

- This is a **report-only** migration — don't change format strings automatically
- Most moment format tokens work identically in dayjs
- The `Do`, `Mo`, `Qo` ordinal tokens require dayjs's `advancedFormat` plugin (bundled by Lowdefy)
- `X` (unix timestamp) and `x` (millisecond timestamp) work in both
- Locale-dependent formats (`L`, `LL`, `LLL`, `LLLL`, `LT`, `LTS`) work but may produce slightly different output depending on locale data differences between moment and dayjs

## Verification

This is informational — no files should change. The user should test date rendering in their app after the upgrade.
