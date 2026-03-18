# Migration: Simple Property and Event Renames

## Context

Several blocks have properties and events renamed in antd v6. These are direct renames with no value changes (except where noted).

## What to Do

Apply these renames in all YAML files:

| Block    | Old Name             | New Name              | Type     |
| -------- | -------------------- | --------------------- | -------- |
| Modal    | `visible`            | `open`                | Property |
| Tooltip  | `defaultVisible`     | `defaultOpen`         | Property |
| Tooltip  | `onVisibleChange`    | `onOpenChange`        | Event    |
| Progress | `gapPosition`        | `gapPlacement`        | Property |
| Carousel | `dotPosition`        | `dotPlacement`        | Property |
| Collapse | `expandIconPosition` | `expandIconPlacement` | Property |

### Special handling for Modal `visible`

The `visible` key is also used at the block level (all blocks have a `visible:` property for conditional rendering). Only rename `visible` that is inside a Modal block's `properties:` section — not the block-level `visible:`.

**How to distinguish:**

- Block-level `visible:` is at the same indent as `type:`, `properties:`, `events:`
- Properties-level `visible:` is nested under `properties:` (indented 2 more spaces)
- Only rename when the block's `type:` is `Modal`

## Files to Check

Glob: `**/*.{yaml,yml}`
Grep: `visible:|defaultVisible:|onVisibleChange:|gapPosition:|dotPosition:|expandIconPosition:`

## Examples

### Before — Modal visible

```yaml
- id: my_modal
  type: Modal
  properties:
    title: Confirm
    visible:
      _state: showModal
```

### After

```yaml
- id: my_modal
  type: Modal
  properties:
    title: Confirm
    open:
      _state: showModal
```

### Before — Tooltip event

```yaml
- id: info_tooltip
  type: Tooltip
  properties:
    defaultVisible: true
  events:
    onVisibleChange:
      try:
        - id: log
          type: SetState
```

### After

```yaml
- id: info_tooltip
  type: Tooltip
  properties:
    defaultOpen: true
  events:
    onOpenChange:
      try:
        - id: log
          type: SetState
```

### Before — Progress and Carousel

```yaml
- id: progress1
  type: Progress
  properties:
    gapPosition: bottom

- id: carousel1
  type: Carousel
  properties:
    dotPosition: left
```

### After

```yaml
- id: progress1
  type: Progress
  properties:
    gapPlacement: bottom

- id: carousel1
  type: Carousel
  properties:
    dotPlacement: left
```

## Edge Cases

- `defaultVisible`, `gapPosition`, `dotPosition`, `expandIconPosition`, `onVisibleChange` are unique property names — safe to rename globally without block-type checking
- `visible` is NOT unique — it exists on all blocks. Only rename under Modal's `properties:` section
- Do not rename inside code blocks, string values, or operator key paths

## Verification

```
grep -rn 'defaultVisible:\|gapPosition:\|dotPosition:\|expandIconPosition:\|onVisibleChange:' --include='*.yaml' --include='*.yml' .
```

Should return zero matches. Then manually verify Modal `visible` → `open` was applied correctly.
