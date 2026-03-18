# Migration: Rename `areas` → `slots`

## Context

The `areas` key on container blocks is renamed to `slots` in Lowdefy v4.8. Both names work during the deprecation period, but `slots` is the canonical name going forward.

## What to Do

In all YAML files, rename `areas:` keys on blocks to `slots:`. This is a direct key rename — the structure underneath stays identical.

## Files to Check

Glob: `**/*.{yaml,yml}`
Grep: `areas:`

## Examples

### Before

```yaml
- id: my_card
  type: Card
  areas:
    content:
      blocks:
        - id: title
          type: Title
```

### After

```yaml
- id: my_card
  type: Card
  slots:
    content:
      blocks:
        - id: title
          type: Title
```

## Edge Cases

- Only rename `areas:` that are direct children of a block (at the same indent level as `type:`, `properties:`, `events:`, etc.)
- Do not rename `areas` inside string values, operator expressions, `_ref` paths, or markdown/code blocks
- Do not rename `areas` that appear as a property value (e.g., `name: areas`) — only YAML keys

## Verification

After applying, grep for remaining `areas:` keys at block level:

```
grep -rn '^\s*areas:' --include='*.yaml' --include='*.yml' .
```

All matches should be zero (or only inside code blocks / string content).
