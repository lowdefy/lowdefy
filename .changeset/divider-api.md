---
'@lowdefy/blocks-antd': major
---

Remove Divider `type` property and align with antd v6 API. `orientation` now controls divider direction (`horizontal`/`vertical`). New `titlePlacement` property (`start`/`center`/`end`) controls where title text sits within the divider.

**Migration:**

- `type: vertical` -> `orientation: vertical`
- `orientation: left` -> `titlePlacement: start`
- `orientation: right` -> `titlePlacement: end`
- `orientation: center` -> `titlePlacement: center` (or remove, `center` is the default)
