---
'@lowdefy/blocks-aggrid': minor
---

feat(blocks-aggrid): Add built-in cell renderer types.

Every AgGrid column now accepts a `cell` object on `columnDefs` entries that selects a first-class renderer — `tag`, `avatar`, `link`, `date`, `boolean`, `progress`, `number` — plus an `ellipsis: N` column-level helper that auto-enables `wrapText` + `autoHeight` with an N-line clamp.

The `number` renderer wraps `Intl.NumberFormat` with Excel-style config: `format` (`number` / `currency` / `percent` / `compact`), `locale`, `currency`, `decimals`, accounting-style `negative: parentheses`, `signColor` (green/red by sign), and optional `prefix` / `suffix`. Number columns auto-right-align (`cellStyle.justifyContent: flex-end` + `ag-right-aligned-header`) and every `cell.type` supports an `align: left | center | right` override. Renderer output is React, vertically centred, and styled entirely through antd CSS tokens (`--ant-control-height`, `--ant-margin-xs`, `--ant-color-*`, `--ant-border-radius`, `--ant-font-size`, etc.) so the grid adapts to Material vs Balham row heights and to dark / compact antd `theme.algorithm` without per-theme overrides.

Field-valued keys (`nameField`, `srcField`, `idField`, `colorFrom`, and every value inside `link.urlQuery`) are plain row-data path strings — no `_function` wrapping required. Null values render a muted em-dash across every built-in type.

Link navigation: `cell.type: link` and `avatar.link` render anchors and emit a new `onCellLink` block event with the resolved link config; wire it to a `Link` action (`params: { _event: link }`) to navigate — matches the existing Lowdefy event → action pattern.

`antd`, `@ant-design/icons`, and `dayjs` are now declared as peer dependencies on `@lowdefy/blocks-aggrid` (de-facto required by the existing `ag-grid-antd.module.css` token mapping).

Also fixes the long-standing cell vertical-centering drift: `.ag-cell` is now a flex container via the antd theme CSS module, which also benefits users' existing `renderHtml` cells.
