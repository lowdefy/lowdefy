# Migration: Tabs `tabPosition` → `tabPlacement` with Value Mapping

## Context

The Tabs block renames `tabPosition` to `tabPlacement` and remaps directional values from physical to logical names.

## What to Do

1. Rename `tabPosition` to `tabPlacement`
2. Map values: `left` → `start`, `right` → `end`
3. `top` and `bottom` are unchanged

## Files to Check

Glob: `**/*.{yaml,yml}`
Grep: `tabPosition:`

## Examples

### Before

```yaml
- id: settings_tabs
  type: Tabs
  properties:
    tabPosition: left
```

### After

```yaml
- id: settings_tabs
  type: Tabs
  properties:
    tabPlacement: start
```

### Before — right position

```yaml
- id: nav_tabs
  type: Tabs
  properties:
    tabPosition: right
```

### After

```yaml
- id: nav_tabs
  type: Tabs
  properties:
    tabPlacement: end
```

### Before — top (no value change)

```yaml
- id: main_tabs
  type: Tabs
  properties:
    tabPosition: top
```

### After

```yaml
- id: main_tabs
  type: Tabs
  properties:
    tabPlacement: top
```

## Edge Cases

- If the value is an operator expression (e.g., `tabPosition: { _state: position }`), rename the key to `tabPlacement` but flag for manual review — the state value may contain `"left"` or `"right"` that also needs updating
- `tabPosition` is a unique property name — safe to rename globally without block-type checking

## Verification

```
grep -rn 'tabPosition:' --include='*.yaml' --include='*.yml' .
```

Should return zero matches.
