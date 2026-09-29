---
'@lowdefy/blocks-table': minor
'@lowdefy/blocks-antd': minor
---

`Table` enrichment columns

Columns that compute per row from other columns: `enrichment` (a provider endpoint of the app), `ai` (a prompt), `formula` (a template filled in the browser) and `extract` (a value from another column's result), with a run state per cell, header progress, an add-column picker (`addColumn`, `providers`), column management for user-defined columns, runs of a column, row, selection or cell, a cell details panel, "+ New row" (`addRow`) and CSV import (`importCsv`). Live results arrive with `applyTransaction({ update })`. Whole documents, such as a change stream's `fullDocument`, merge shallow, so fields the server removed disappear. `merge: 'deep'` is for partial patches.

- The feature loads in its own chunk, only for tables that use it; the picker, details panel and import dialog load on first use.
- Formula templates and AI prompts take `{{ column }}` placeholders only, filled in as plain text, never a template engine.
- A user-defined column with an invalid config renders as an error column with Edit and Delete, instead of breaking the table. User-defined columns are limited to text-safe types (no html, image, avatar, link or buttons), and any `cell` or template tooltip on them is dropped.
- CSV import parses in time slices and refuses files over 50 MB or 100,000 rows.
- `inputFieldPrefix` puts new input columns' values under a path, so `onRowAdd` and `onImport` values are all at field paths.
- `TableInput` takes formula columns; the other enrichment keys are `Table` only, and `TableInput` refuses them with a message naming `Table`.
