---
'@lowdefy/blocks-aggrid': minor
---

feat(blocks-aggrid): Add a `menu` cell for row actions.

`cell.type: menu` renders a row's actions as a dropdown behind one trigger button, instead of spending a wide column on a `buttons` cell. Each `cell.items[]` entry declares its own `eventName`, so items wire to block-level events exactly as buttons do, and the same `*Field` row-data resolution applies (`titleField`, `iconField`, `disabledField`, `hiddenField`).

```yaml
- headerName: ''
  colId: menu
  width: 60
  cell:
    type: menu
    items:
      - eventName: onMenuRename
        title: Rename
        icon: AiOutlineEdit
        hiddenField: readOnly
      - eventName: onMenuDelete
        title: Delete
        icon: AiOutlineDelete
        danger: true
        hiddenField: readOnly
```

A hidden item is dropped rather than disabled, and a row on which every item is hidden renders no trigger at all rather than a button that opens an empty menu. The trigger's `type` and `shape` are fixed rather than configurable, because both keys are already taken at cell level (`type` names the renderer, `shape` is the avatar's); `icon` and `placement` are configurable.
