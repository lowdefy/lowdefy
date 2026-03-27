---
'@lowdefy/blocks-aggrid': minor
---

AG Grid blocks now follow the Ant Design theme automatically. All six grid blocks (AgGridAlpine, AgGridBalham, AgGridMaterial, and their Input variants) map ag-grid CSS variables to antd design tokens, so they respond to light/dark mode and custom theme colors without any configuration. Override individual `--ag-*` variables via the block's `style` property for per-instance customization. The explicit dark variant blocks (AgGridAlpineDark, AgGridBalhamDark, AgGridInputAlpineDark, AgGridInputBalhamDark) have been removed.
