# Migration: Button `type`/`danger` → `color` + `variant`

## Context

The Button block replaces the combined `type` and `danger` properties with separate `color` and `variant` properties in antd v6. The `type` property previously controlled both visual style and color in a single enum. Now these concerns are split.

## What to Do

For each Button block, replace `type` and `danger` with the equivalent `color` and `variant` combination:

| Old `type`           | Old `danger` | New `color` | New `variant` |
| -------------------- | ------------ | ----------- | ------------- |
| `primary`            | —            | `primary`   | `solid`       |
| `primary`            | `true`       | `danger`    | `solid`       |
| `default` or omitted | —            | _(omit)_    | _(omit)_      |
| `default` or omitted | `true`       | `danger`    | _(omit)_      |
| `dashed`             | —            | _(omit)_    | `dashed`      |
| `dashed`             | `true`       | `danger`    | `dashed`      |
| `text`               | —            | _(omit)_    | `text`        |
| `text`               | `true`       | `danger`    | `text`        |
| `link`               | —            | _(omit)_    | `link`        |
| `link`               | `true`       | `danger`    | `link`        |

Remove both old properties (`type` under Button properties, and `danger`) and add the new `color` and `variant` properties.

## Files to Check

Glob: `**/*.{yaml,yml}`
Grep: `type: Button`

## Examples

### Before — primary button

```yaml
- id: submit_btn
  type: Button
  properties:
    title: Submit
    type: primary
```

### After

```yaml
- id: submit_btn
  type: Button
  properties:
    title: Submit
    color: primary
    variant: solid
```

### Before — danger button

```yaml
- id: delete_btn
  type: Button
  properties:
    title: Delete
    type: primary
    danger: true
```

### After

```yaml
- id: delete_btn
  type: Button
  properties:
    title: Delete
    color: danger
    variant: solid
```

### Before — link button

```yaml
- id: cancel_btn
  type: Button
  properties:
    title: Cancel
    type: link
```

### After

```yaml
- id: cancel_btn
  type: Button
  properties:
    title: Cancel
    variant: link
```

### Before — default button with danger

```yaml
- id: remove_btn
  type: Button
  properties:
    title: Remove
    danger: true
```

### After

```yaml
- id: remove_btn
  type: Button
  properties:
    title: Remove
    color: danger
```

## Edge Cases

- **`type:` under Button properties is NOT the block-level `type: Button`.** Only rename `type:` that is a child of the Button's `properties:` section
- If `type` uses an operator expression (e.g., `type: { _if: ... }`), flag for manual review — the expression logic needs updating to return `color`/`variant` pairs instead
- `danger: true` can appear with or without `type` — handle both cases
- `danger: false` can be removed entirely (it's the default)
- If a Button has `type: default` explicitly, just remove it (default is the default)
- Visual differences are possible — `type: primary` had built-in hover effects that `color: primary, variant: solid` reproduces, but custom CSS may need adjustment

## Verification

```
grep -rn 'type: Button' --include='*.yaml' --include='*.yml' . -A 10 | grep -E '^\s+(type:|danger:)'
```

No `type:` or `danger:` should appear under Button properties after migration (except operator-expression cases flagged for review).
