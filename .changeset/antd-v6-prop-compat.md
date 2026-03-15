---
'@lowdefy/blocks-antd': patch
---

Add backward-compatible property fallbacks for antd v6 renames. Collapse accepts `expandIconPosition` (falls back to `expandIconPlacement`). Notification `message` property removed — use `title` instead. Tooltip `defaultVisible` property removed — use `defaultOpen` instead. Descriptions reverts to passing `bordered` directly instead of mapping to `variant`.
