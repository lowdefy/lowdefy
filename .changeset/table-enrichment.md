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
- Enrichment and ai inputs read input, data, enrichment and ai columns: the picker offers only those as provider inputs and prompt placeholders, and a column reading a formula or extract column is refused (a declared one is a config error, a user-defined one an error column).
- A cell's error tooltip says "Failed after N attempts" with the stored message, shortened, below the cell; the details panel has the whole message. Store messages users can read in your worker and provider endpoints, not a connection's error (see the guide).
- Header progress chips take their most severe status' colour (errors red) and collapse to fit beside the title: the full counts, an icon and count per status, or a dot, with the counts in the tooltip.
- The details panel titles each input by its provider input and column ("Full name ← Person"), and the raw result tree colours keys and values, cuts values to its width and shows an always-visible "+" to add a node as a column.
- CSV import suggests columns for common synonyms and close spellings of a header, marked until changed.
- AI tag and tags answers take `{ value, color }` options; the picker gives each a distinct tone. A user-defined column's option colours must be tone names.
- Run states use the cell's font size on the text baseline; Run selected and the new-row editor leave out hidden columns; the select-all checkbox lines up with the row checkboxes; the Run submenu shows a right chevron.
