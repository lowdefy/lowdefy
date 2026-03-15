---
'@lowdefy/blocks-antd': major
---

Remove Divider `type` property and align with antd v6 API. `orientation` now controls divider direction (`horizontal`/`vertical`). New `titlePlacement` property (`left`/`center`/`right`) controls where title text sits within the divider.

**Migration:**

- `type: vertical` -> `orientation: vertical`
- `orientation: left` -> `titlePlacement: left`
- `orientation: right` -> `titlePlacement: right`
- `orientation: center` -> `titlePlacement: center` (or remove, `center` is the default)
