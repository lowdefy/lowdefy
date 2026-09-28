---
'@lowdefy/blocks-table': minor
'@lowdefy/blocks-antd': minor
'@lowdefy/block-utils': minor
'@lowdefy/build': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
---

New table blocks: `Table`, `TableInput` and `TableLight`

Three blocks with the antd look, sharing one column model and one set of cell types. The ag-grid blocks are unchanged.

- **`Table`** (new package `@lowdefy/blocks-table`, installed by default) is built for large datasets and record lists. Rows and columns are virtualised, so 100k rows × 50 columns scroll smoothly. It has:

  - sort, column resize and reorder, pinned columns, a header menu with column filters, and a column manager, all on by default;
  - an optional toolbar with search, quick filters, a nested And/Or filter builder, grouping, density and CSV export;
  - saved views, and optional persistence in the browser or the URL;
  - row selection with a bulk-action bar;
  - grouping with per-group totals, tree rows, expandable detail rows, and a summary footer;
  - keyboard navigation and inline editing;
  - row drag reorder, and server mode.

  Its value is the table's state (`{ view, selected, expanded }`), so `_state: <id>.selected` is always the selection and `_state: <id>.view` the current view.

- **`TableInput`** edits rows in a form. Its value is a changeset of only what changed (`{ updated, added, removed, moved?, order? }`), never the rows themselves, so page state stays small. Row drag uses fractional positions, so moving a row writes one field.
- **`TableLight`** (in `@lowdefy/blocks-antd`) is antd's own `Table` for small tables and adds no dependencies. Its config is a strict subset of `Table`'s: to switch, change the `type`.
- **Columns** declare a `type` that drives display, sorting, filter operators, totals, the editor and export:

  - text, number, currency, percent, date, datetime, boolean;
  - tag, tags, status, avatar, people;
  - link, email, phone, url, relation;
  - progress, rating, image, html (nunjucks templates), json;
  - buttons, menu.

  `options` give enum values a label and colour in one place. `rules` and `rowRules` add conditional formatting with the same condition language as filters, with no `_function` needed. `rowLink` makes rows real links.

- `@lowdefy/block-utils` exports `getHtmlEnhancements`, so blocks can navigate the same way the `Link` action does, and it reuses `Intl.NumberFormat` instances when formatting.
