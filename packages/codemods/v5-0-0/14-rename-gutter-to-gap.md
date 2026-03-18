# Migration: Rename `gutter` → `gap`

## Context

The `gutter` property on layout slots is renamed to `gap` in the new Tailwind-compatible grid. The `contentGutter` property (parent layout content gap inheritance) is also renamed — directly to `gap` (the `content*` prefix is dropped, see prompt 03).

## What to Do

Apply these renames in all YAML files:

| Find             | Replace |
| ---------------- | ------- |
| `gutter:`        | `gap:`  |
| `contentGutter:` | `gap:`  |

Order matters: replace `contentGutter:` before `gutter:` to avoid partial matching.

No user confirmation needed — these renames are unambiguous. The `gutter` property name does not exist in any other Lowdefy context.

## Files to Check

Glob: `**/*.{yaml,yml}`
Grep: `gutter:`

## Examples

### Before

```yaml
- id: my_row
  type: Box
  slots:
    content:
      gutter: 16
      blocks: [...]
```

### After

```yaml
- id: my_row
  type: Box
  slots:
    content:
      gap: 16
      blocks: [...]
```

### Before — contentGutter

```yaml
- id: page_layout
  type: PageHeaderMenu
  layout:
    contentGutter: 24
```

### After

```yaml
- id: page_layout
  type: PageHeaderMenu
  layout:
    gap: 24
```

## Edge Cases

- Do not rename `gutter` inside string values, operator expressions, or code blocks
- Only rename YAML keys (at the start of a line after whitespace), not values

## Verification

```
grep -rn 'gutter:' --include='*.yaml' --include='*.yml' .
```

Should return zero matches.
