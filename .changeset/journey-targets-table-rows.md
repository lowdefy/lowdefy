---
'@lowdefy/helpers': patch
'@lowdefy/engine': patch
'@lowdefy/e2e-utils': patch
'@lowdefy/server-dev': patch
'@lowdefy/plugin-posthog': patch
---

fix(journeys): `row` and `column` targets work on `Table` and `TableInput` blocks

A journey step such as `click: { blockId: orders, row: 1, column: actions }` or
`expect: { blockId: orders, row: 0, column: name, text: Jane }` only worked on `AgGrid*` blocks.
It now finds the displayed row (zero-based) and the column `key` of a `Table` or `TableInput`
too, and a click on a row button in a `Table` is recorded with the same `row` and `column`.
Header cells are not rows or cells.
