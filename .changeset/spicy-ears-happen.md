---
'@lowdefy/blocks-antd': patch
---

Fix Pagination block skip state value. The skip value is now calculated from current and pageSize values if block value is changed using SetState.
