# Migration: Drop `content*` Prefix from Layout Properties

## Context

Layout properties were previously namespaced with a `content` prefix to distinguish content-area config from block-level config. The new grid system removes this distinction — the prefix is dropped.

Note: `contentGutter` is already handled by prompt 02 (renamed directly to `gap`).

## What to Do

Apply these renames in all YAML files:

| Find                | Replace      |
| ------------------- | ------------ |
| `contentAlign:`     | `align:`     |
| `contentJustify:`   | `justify:`   |
| `contentDirection:` | `direction:` |
| `contentWrap:`      | `wrap:`      |
| `contentOverflow:`  | `overflow:`  |

No user confirmation needed — these renames are unambiguous. The `content*` property names do not exist in any other Lowdefy context.

## Files to Check

Glob: `**/*.{yaml,yml}`
Grep: `contentAlign:|contentJustify:|contentDirection:|contentWrap:|contentOverflow:`

## Examples

### Before

```yaml
- id: main_layout
  type: PageHeaderMenu
  layout:
    contentAlign: middle
    contentJustify: center
    contentDirection: column
    contentWrap: nowrap
    contentOverflow: auto
```

### After

```yaml
- id: main_layout
  type: PageHeaderMenu
  layout:
    align: middle
    justify: center
    direction: column
    wrap: nowrap
    overflow: auto
```

## Edge Cases

- Do not rename inside string values, operator expressions, or code blocks
- Only rename YAML keys (at the start of a line after whitespace), not values

## Verification

```
grep -rn 'contentAlign:\|contentJustify:\|contentDirection:\|contentWrap:\|contentOverflow:' --include='*.yaml' --include='*.yml' .
```

Should return zero matches.
