---
'@lowdefy/blocks-antd': patch
---

feat(blocks-antd): `DropdownButton` now supports the standard Lowdefy event-shortcut schema (`events.<eventName>.shortcut`) for item shortcuts, alongside the existing item-level `shortcut` property.

When a shortcut is configured via the event, the framework-level shortcut manager binds and fires it — consistent with `Button`. The shortcut badge renders next to the item label in both cases. If both are set on the same item, the event-level shortcut wins. The split-button's main action now also renders a badge when `events.onClick.shortcut` is configured.

**Event-level (preferred, matches `Button`):**

```yaml
- id: actions
  type: DropdownButton
  properties:
    items:
      - title: Undo
        eventName: onUndo
  events:
    onUndo:
      shortcut: mod+z
      try:
        - id: undo
          type: ...
```

**Item-level (still supported):**

```yaml
- id: actions
  type: DropdownButton
  properties:
    items:
      - title: Undo
        eventName: onUndo
        shortcut: mod+z
  events:
    onUndo:
      - id: undo
        type: ...
```
