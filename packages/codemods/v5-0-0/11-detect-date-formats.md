# Migration: Detect and Fix Date Format Strings

## Context

Lowdefy v5 uses dayjs instead of moment.js for date formatting — both on date blocks (antd v6) and in the Nunjucks `date()` filter. Most explicit format strings (e.g., `YYYY-MM-DD`) are compatible, but **moment.js locale shortcuts render as literal characters** in dayjs and must be replaced with explicit format tokens.

## What to Do

### Part 1 — Nunjucks `date()` filter: Replace locale shortcuts (auto-fix)

Moment.js locale shortcuts (`l`, `ll`, `lll`, `llll` and uppercase `L`, `LL`, `LLL`, `LLLL`) are not supported by dayjs in the Nunjucks `date()` filter. They render as literal characters (e.g., dates show as "llll" instead of a formatted date).

**Replace these with explicit dayjs format tokens:**

| Moment shortcut | Moment output example | Replacement |
| --- | --- | --- |
| `l` | 3/26/2026 | `D/M/YYYY` |
| `ll` | Mar 26, 2026 | `D MMM YYYY` |
| `lll` | Mar 26, 2026 3:27 PM | `D MMM YYYY h:mm A` |
| `llll` | Wed, Mar 26, 2026 3:27 PM | `ddd, D MMM YYYY h:mm A` |
| `L` | 03/26/2026 | `DD/MM/YYYY` |
| `LL` | March 26, 2026 | `D MMMM YYYY` |
| `LLL` | March 26, 2026 3:27 PM | `D MMMM YYYY h:mm A` |
| `LLLL` | Wednesday, March 26, 2026 3:27 PM | `dddd, D MMMM YYYY h:mm A` |
| `LT` | 3:27 PM | `h:mm A` |
| `LTS` | 3:27:45 PM | `h:mm:ss A` |

**Files to search:**

Glob: `**/*.{yaml,yml,yaml.njk}`
Grep: `date\(['"]([lL]{1,4}|LTS?)['"]\)`

**Example:**

Before:
```yaml
template: "{{ meeting_date | date('llll') }}"
```

After:
```yaml
template: "{{ meeting_date | date('ddd, D MMM YYYY h:mm A') }}"
```

Before:
```yaml
Last modified by {{ doc.updated.user.name | safe }} on {{ doc.updated.timestamp | date('lll')}}
```

After:
```yaml
Last modified by {{ doc.updated.user.name | safe }} on {{ doc.updated.timestamp | date('D MMM YYYY h:mm A')}}
```

### Part 2 — Date block format properties: Review (report-only)

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
- Moment-specific tokens: `Mo` (ordinal month), `Do` (ordinal day), `Qo` (ordinal quarter)

**Files to search:**

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

- Part 1 (Nunjucks locale shortcuts) is an **auto-fix** — the replacements are safe to apply
- Part 2 (date block formats) is **report-only** — don't change format strings automatically
- Most moment format tokens work identically in dayjs
- The `Do`, `Mo`, `Qo` ordinal tokens require dayjs's `advancedFormat` plugin (bundled by Lowdefy)
- `X` (unix timestamp) and `x` (millisecond timestamp) work in both

## Verification

After applying Part 1 replacements, verify date rendering in the app. Part 2 is informational — the user should test any flagged date blocks after the upgrade.
