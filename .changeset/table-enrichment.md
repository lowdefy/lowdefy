---
'@lowdefy/blocks-table': minor
'@lowdefy/blocks-antd': minor
---

`Table` enrichment columns

Columns that compute per row from other columns: `enrichment` (a provider endpoint of the app), `ai` (a prompt), `formula` (a template filled in the browser) and `extract` (a value from another column's result), with a run state per cell, header progress, an add-column picker (`addColumn`, `providers`), column management for user-defined columns, runs of a column, row, selection or cell, a cell details panel, "+ New row" (`addRow`) and CSV import (`importCsv`). Results arrive with `applyTransaction({ merge: 'deep' })`.

- The feature loads in its own chunk, only for tables that use it; the picker, details panel and import dialog load on first use.
- Formula templates and AI prompts take `{{ column }}` placeholders only, filled in as plain text, never a template engine.
- A user-defined column with an invalid config renders as an error column with Edit and Delete, instead of breaking the table.
- `inputFieldPrefix` puts new input columns' values under a path, so `onRowAdd` and `onImport` values are all at field paths.
- `TableInput` takes formula columns; the other enrichment keys are `Table` only, and `TableInput` refuses them with a message naming `Table`.
