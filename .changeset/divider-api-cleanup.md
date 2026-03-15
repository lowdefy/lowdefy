---
'@lowdefy/blocks-antd': major
---

Remove Divider `type` property and align with antd v6 API. The `orientation` property now controls divider direction (`horizontal`/`vertical`), replacing the old `type` property. A new `titlePlacement` property (`left`/`center`/`right`) controls where title text sits within the divider, replacing the old `orientation` meaning.

**Migration:**

- `type: vertical` → `orientation: vertical`
- `orientation: left` → `titlePlacement: left`
- `orientation: right` → `titlePlacement: right`
- `orientation: center` → `titlePlacement: center` (or remove, as `center` is the default)
