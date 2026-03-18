# Migration: Divider Dual Rename — `type`/`orientation` Swap

## Context

The Divider block has a dual rename where both `type` and `orientation` change meaning:

- Old `type` (direction: horizontal/vertical) → becomes `orientation`
- Old `orientation` (text position: left/center/right) → becomes `titlePlacement` with value mapping

This is tricky because both properties exist and their meanings swap. A naive rename would break the config.

## What to Do

For each Divider block, apply both renames simultaneously:

| Old Property          | Old Values           | New Property              | New Values           |
| --------------------- | -------------------- | ------------------------- | -------------------- |
| `type: horizontal`    | horizontal, vertical | `orientation: horizontal` | horizontal, vertical |
| `type: vertical`      |                      | `orientation: vertical`   |                      |
| `orientation: left`   | left, center, right  | `titlePlacement: start`   | start, center, end   |
| `orientation: center` |                      | `titlePlacement: center`  |                      |
| `orientation: right`  |                      | `titlePlacement: end`     |                      |

**Important:** Apply both changes in one pass to avoid the intermediate state where `type` is renamed to `orientation` and then conflicts with the existing `orientation`.

## Files to Check

Glob: `**/*.{yaml,yml}`
Grep: `type: Divider`

## Examples

### Before — horizontal divider with left text

```yaml
- id: section_divider
  type: Divider
  properties:
    type: horizontal
    orientation: left
    children: Section Title
```

### After

```yaml
- id: section_divider
  type: Divider
  properties:
    orientation: horizontal
    titlePlacement: start
    children: Section Title
```

### Before — vertical divider (no orientation)

```yaml
- id: vert_divider
  type: Divider
  properties:
    type: vertical
```

### After

```yaml
- id: vert_divider
  type: Divider
  properties:
    orientation: vertical
```

### Before — only orientation set

```yaml
- id: centered_divider
  type: Divider
  properties:
    orientation: center
    children: OR
```

### After

```yaml
- id: centered_divider
  type: Divider
  properties:
    titlePlacement: center
    children: OR
```

## Edge Cases

- A Divider may have only `type`, only `orientation`, or both — handle each case
- `type:` on a Divider is NOT the block-level `type:` key (which identifies the component). The block-level `type: Divider` stays unchanged. Only rename `type:` that is under `properties:`
- If `type` or `orientation` use operator expressions, rename the key but flag the value for manual review
- Verify each Divider after transformation — the dual swap is error-prone

## Verification

Search for Divider blocks and check for old property names:

```
grep -rn 'type: Divider' --include='*.yaml' --include='*.yml' . -A 10 | grep -E '^\s+(type|orientation):'
```

Under Divider properties, `type:` should not appear (replaced by `orientation:`), and `orientation:` with values `left`/`right` should not appear (replaced by `titlePlacement:`).
