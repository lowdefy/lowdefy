---
'@lowdefy/block-utils': patch
---

Preset tag colours purple, cyan, geekblue, gold, lime, magenta and volcano now render as themselves in tag, status and avatar cells (Table, TableLight, ag-grid) and in HTML `data-tag`/`data-status` tags. They pointed at CSS variables antd doesn't define, so they fell back to blue, orange, red or green. They now use antd's palette variables (`--ant-purple-6`, …), which follow dark mode. `pink` is added.
