# Migration: Convert `bordered` → `variant`

## Context

The boolean `bordered` property on input blocks and containers is replaced by a `variant` enum in antd v6. `bordered: false` becomes `variant: borderless`. `bordered: true` is the default and can be removed.

**Affected blocks:** AutoComplete, Card, Collapse, DateRangeSelector, DateSelector, DateTimeSelector, Descriptions, MonthSelector, MultipleSelector, NumberInput, PasswordInput, PhoneNumberInput, Selector, TextArea, TextInput, WeekSelector.

## What to Do

1. Replace `bordered: false` with `variant: borderless`
2. Remove `bordered: true` entirely (it's the default)

## Files to Check

Glob: `**/*.{yaml,yml}`
Grep: `bordered:`

## Examples

### Before

```yaml
- id: search_input
  type: TextInput
  properties:
    bordered: false
    placeholder: Search...
```

### After

```yaml
- id: search_input
  type: TextInput
  properties:
    variant: borderless
    placeholder: Search...
```

### Before — bordered: true (remove)

```yaml
- id: details_card
  type: Card
  properties:
    bordered: true
    title: Details
```

### After

```yaml
- id: details_card
  type: Card
  properties:
    title: Details
```

## Edge Cases

- Match `bordered: false`, `bordered: "false"`, and `bordered: 'false'` — all become `variant: borderless`
- Match `bordered: true`, `bordered: "true"`, and `bordered: 'true'` — all are removed
- Do not change `bordered` that uses an operator expression (e.g., `bordered: { _state: showBorder }`) — flag these for manual review. The replacement would be `variant: { _if: { ... } }` mapping to `"borderless"` or `"outlined"`
- Do not modify `bordered` inside code blocks or string content

## Verification

```
grep -rn 'bordered:' --include='*.yaml' --include='*.yml' .
```

Only operator-expression uses should remain (flagged for manual review).
