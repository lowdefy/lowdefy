# Migration: Move `properties.style` → `style: { /element }`

## Context

In the old system, inline styles on a block's root element lived under `properties.style`. In Lowdefy v4.8, all styling moves to a top-level `style:` block with `/`-prefixed slot keys. The root element slot is `/element`.

The build auto-normalizes `properties.style` with a deprecation warning, but migrating now produces cleaner configs.

## What to Do

For each block that has a `style:` key under `properties:`:

1. Remove the `style:` entry from `properties:`
2. Add a sibling `style:` block (at the same level as `properties:`) with the content nested under `/element:`

If the block already has a top-level `style:` block, merge the `/element` entry into it.

## Files to Check

Glob: `**/*.{yaml,yml}`
Grep: `properties:` then check for `style:` child

## Examples

### Before — single-line style

```yaml
- id: header
  type: Box
  properties:
    style:
      backgroundColor: '#f0f0f0'
      padding: 16
```

### After

```yaml
- id: header
  type: Box
  style:
    /element:
      backgroundColor: '#f0f0f0'
      padding: 16
```

### Before — inline object style

```yaml
- id: divider
  type: Divider
  properties:
    style: { marginTop: 24, marginBottom: 24 }
```

### After

```yaml
- id: divider
  type: Divider
  style:
    /element: { marginTop: 24, marginBottom: 24 }
```

### Before — block with other properties

```yaml
- id: card
  type: Card
  properties:
    title: My Card
    style:
      borderRadius: 8
    bordered: true
```

### After

```yaml
- id: card
  type: Card
  properties:
    title: My Card
    bordered: true
  style:
    /element:
      borderRadius: 8
```

## Edge Cases

- Do not move `style:` keys that are already at the block top level (not under `properties:`)
- If a block already has a top-level `style:` with other `/` slots, add `/element` to it rather than creating a duplicate `style:` block
- Do not touch `style:` inside markdown code blocks, string values, or `_ref` content
- Operator expressions inside `style:` (like `_if`, `_state`) should be moved as-is

## Verification

```
grep -rn 'properties:' --include='*.yaml' --include='*.yml' . -A 5 | grep 'style:'
```

No `style:` should appear as a child of `properties:` after migration.
