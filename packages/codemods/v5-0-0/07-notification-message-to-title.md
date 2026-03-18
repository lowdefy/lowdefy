# Migration: Notification `message` → `title`

## Context

The Notification block renames its `message` property to `title` in antd v6. This is a context-aware rename — `message` is a common word that appears in many contexts, so only rename it inside Notification block properties.

## What to Do

Find Notification blocks and rename `message:` to `title:` within their `properties:` section only.

## Files to Check

Glob: `**/*.{yaml,yml}`
Grep: `type: Notification` (to find Notification blocks, then check for `message:` inside their properties)

## Examples

### Before

```yaml
- id: success_notify
  type: Notification
  properties:
    message: Record saved
    description: Your changes have been saved successfully.
    type: success
```

### After

```yaml
- id: success_notify
  type: Notification
  properties:
    title: Record saved
    description: Your changes have been saved successfully.
    type: success
```

### Before — with operator expression

```yaml
- id: error_notify
  type: Notification
  properties:
    message:
      _string.concat:
        - 'Error: '
        - _state: errorMessage
    type: error
```

### After

```yaml
- id: error_notify
  type: Notification
  properties:
    title:
      _string.concat:
        - 'Error: '
        - _state: errorMessage
    type: error
```

## Edge Cases

- **Only rename `message` inside Notification block properties.** Do not rename `message` in:
  - DisplayMessage action params (different context)
  - Other block properties (e.g., Alert has its own `message`)
  - State values or operator expressions
- To identify context: find `type: Notification` at block level, then look for `properties:` at the next indent, then look for `message:` as a direct child of properties
- Notification can appear as both a block and an action — only rename in block properties, not in action params

## Verification

Search for Notification blocks and verify none still have `message:` under properties:

```
grep -rn 'type: Notification' --include='*.yaml' --include='*.yml' . -A 10 | grep 'message:'
```

Should return zero matches.
