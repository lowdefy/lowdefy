---
'@lowdefy/blocks-antd': minor
'@lowdefy/client': patch
---

feat(blocks-antd): `ControlledList` now fires `onAdd` / `onRemove` events and defaults the remove icon to the antd error color at a standard size.

**Events.** Both events fire **after** the list mutation completes. The event payload is `{ index, item }`:

- `onAdd` — `index` is where the new row was inserted (`0` for `addToFront: true`, else `list.length`). `item` is the newly added value (typically `undefined` for an empty row).
- `onRemove` — `index` is the removed row's position. `item` is the row value captured before removal, so handlers can reference the deleted data (e.g., `_event: item._id` to delete from a backend).

```yaml
- id: tags
  type: ControlledList
  events:
    onRemove:
      - id: notify
        type: DisplayMessage
        params:
          content:
            _string.concat: ['Removed at index ', { _event: index }]
  blocks:
    - id: tags.$.label
      type: TextInput
```

**Remove icon styling.** The remove icon now defaults to `var(--ant-color-error)` at `var(--ant-font-size-lg)`, with `--ant-color-error-hover` / `--ant-color-error-active` on hover/press — no more hardcoded hex colors, and the size no longer swings with `properties.size`. Override via `class.removeIcon` / `style.removeIcon` (both slots target the icon wrapper). Existing configs that hardcoded `color: '#ff4d4f'` on `removeItemIcon` can drop it — the default is already danger.

**`@lowdefy/client`** also now passes the list's current state value to list-type block components via a `value` prop, so any list block can read its own array data.
