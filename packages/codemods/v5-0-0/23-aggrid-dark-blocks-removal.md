# Migration: Remove AG Grid Dark Block Variants

## Context

AG Grid light theme blocks now auto-detect dark mode via `prefers-color-scheme` and automatically switch to the dark CSS class. The explicit dark variant block types have been removed:

- `AgGridAlpineDark` → use `AgGridAlpine`
- `AgGridBalhamDark` → use `AgGridBalham`
- `AgGridInputAlpineDark` → use `AgGridInputAlpine`
- `AgGridInputBalhamDark` → use `AgGridInputBalham`

## What to Do

Replace any `type:` references to the removed dark variant blocks with their light counterpart. The light blocks will automatically use the dark theme when the user's system prefers dark mode.

## Files to Check

Glob: `**/*.{yaml,yml}`
Grep: `type:\s*AgGrid(Alpine|Balham|Input(Alpine|Balham))Dark`

## Replacements

| Before                        | After                     |
| ----------------------------- | ------------------------- |
| `type: AgGridAlpineDark`      | `type: AgGridAlpine`      |
| `type: AgGridBalhamDark`      | `type: AgGridBalham`      |
| `type: AgGridInputAlpineDark` | `type: AgGridInputAlpine` |
| `type: AgGridInputBalhamDark` | `type: AgGridInputBalham` |

## Examples

### Before

```yaml
- id: my_table
  type: AgGridBalhamDark
  properties:
    height: 400
    columnDefs:
      - field: name
```

### After

```yaml
- id: my_table
  type: AgGridBalham
  properties:
    height: 400
    columnDefs:
      - field: name
```

## Verification

```
grep -rn 'type: AgGrid.*Dark' --include='*.yaml' --include='*.yml' .
```

Should return zero matches after migration.
