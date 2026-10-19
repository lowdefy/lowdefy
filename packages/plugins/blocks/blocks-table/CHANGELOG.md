# @lowdefy/blocks-table

## 7.0.0

### Minor Changes

- 1227e62: feat: Table, grid, Anchor and HTML links carry `pathParams`

  Links set as block properties fill a page path's placeholders with `pathParams`, next to `urlQuery`. In TableLight, Table and AgGrid cell and row links the values are row field paths, as `urlQuery` values are there: `link: { pageId: ticket, pathParams: { ticket_id: _id } }`. A relation cell defaults `urlQuery` to `{ _id: _id }` only when neither `urlQuery` nor `pathParams` is set. `Anchor` takes `pathParams`, and an HTML link takes `data-path-params` as a JSON object: `<a data-page-id="ticket" data-path-params='{"ticket_id":"1"}'>`.

  AgGrid link and avatar link cells now build their href through the Lowdefy Link, so it includes the app's `basePath`. A plain click still emits `onCellLink` without navigating.

- 537bf54: New table blocks: `Table`, `TableInput` and `TableLight`

  Three blocks with the antd look, sharing one column model and one set of cell types. The ag-grid blocks are unchanged.

  - **`Table`** (new package `@lowdefy/blocks-table`, installed by default) is built for large datasets and record lists. Rows and columns are virtualised, so 100k rows × 50 columns scroll smoothly. It has:

    - sort, column resize and reorder, pinned columns, a header menu with column filters, and a column manager, all on by default;
    - an optional toolbar with search, quick filters, a nested And/Or filter builder, grouping, density and CSV export (cells that start like a spreadsheet formula, `=`, `+`, `-` or `@`, are exported as text, so an opened file never runs them);
    - saved views, and optional persistence in the browser or the URL (browser persistence,
      `persist.storage: local`, is kept per signed-in user and cleared at sign-out);
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

    An `avatar` column takes `descriptionField`, a row path shown as a second line under the name,
    such as a person's email; the table then needs `size: default` or `size: comfortable`.
    `options` give enum values a label and colour in one place. `rules` and `rowRules` add conditional formatting with the same condition language as filters, with no `_function` needed. `rowLink` makes rows real links.

  - `@lowdefy/block-utils` exports `getHtmlEnhancements`, so blocks can navigate the same way the `Link` action does, and it reuses `Intl.NumberFormat` instances when formatting.

- 9de3cf9: feat(blocks-table): Collapsible column groups

  A `Table` column group with `collapsible: true` shows a chevron in its header that collapses the group to a summary column and expands it to its breakdown columns, as AG Grid's `columnGroupShow` does. `collapsed: true` starts the group collapsed. Each column or inner group takes `showWhen`: `closed` shows it while its group is collapsed, `open` while it is expanded, and `always` (the default) in both. Collapsing an outer group also hides an inner group with `showWhen: open`.

  The collapsed groups are the view's `collapsedColumnGroups`, saved and persisted with the view. A column its group hides is not displayed, searched or exported, and the column manager lists it as unavailable. `TableLight` refuses the three keys with a message naming `Table`.

- 3f3a320: `Table` enrichment columns

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

- ecdfb65: feat(blocks-table): Show a total row from data in the Table summary footer

  `summaryRow` takes one row object, such as a report total computed by the request, and the summary footer shows it in place of the aggregates. Each column renders it as it renders a body row, with its type, cell options and rules. Use it for totals the table can not compute from its rows, such as a rate whose total is not the sum or average of the rows' rates.

  The row is not a data row: sorting, filtering, search, selection and the record count leave it out, it stays in view under `height`, and `exportCsv` adds it as the last line. Group headers keep their aggregates. `TableLight` refuses `summaryRow` with a message naming `Table`.

### Patch Changes

- 2595439: `@lowdefy/connection-treg`: call treg's catalog of external API endpoints from server routines

  [treg](https://treg.to) puts thousands of external API endpoints (enrichment, SEO and SERP data, social data, scraping, generation) behind one token. The new `TregConnection` connection is a default type, so apps use it without installing a plugin.

  - **`TregCall`** calls a catalog or routed endpoint by id, such as `treg.people.email.find`. It takes `query`, `body`, an `idempotencyKey` (a retry gets the stored answer and is not charged again), a `maxCost` ceiling in USD, cache and routing options, and `meta` tags for per-customer usage. It returns `output`, `raw`, the charged `cost` in micro-USD and USD, the `callId`, the provider that served it and those tried. With `await`, it polls an async task until it is done. Upstream URLs are never accepted as endpoints, and the team's own registered tools need `allowCustomTools: true` on the connection.
  - **`TregCatalogSearch`**, **`TregCatalogGet`** (with `access: true`, the team's price) and **`TregBalance`** for admin pages and provider catalogues.
  - A balance that is too low or a call over `maxCost` is a final error. A rate limit, a busy or out-of-capacity treg and a network failure are a `ServiceError` with `retryAfter`, the seconds treg asked to wait. A treg 422 is a `ConfigError`. Error messages never contain the token, a provider's response body or the top-up link.

  A `:catch` can now read a `ServiceError`'s wait as `_error: retryAfter`.

  `MongoDBEnrichmentComplete` results take a `cost` in micro-USD, stored as the cell's `cost`, and the `Table` cell details panel shows it. An enrichment provider backed by treg returns `TregCall`'s `cost.micro` there. A retried error result can also take `retryAfterMs`, which replaces the exponential backoff (at most a day), so a worker waits as long as treg's `retry_after` asks.

- Updated dependencies [f7fa621]
- Updated dependencies [099d412]
- Updated dependencies [f0162f4]
- Updated dependencies [2735310]
- Updated dependencies [80b5cbf]
- Updated dependencies [26a1894]
- Updated dependencies [6f20e75]
- Updated dependencies [7c4879b]
- Updated dependencies [7836aa2]
- Updated dependencies [2bdb855]
- Updated dependencies [80c0ad2]
- Updated dependencies [99a4f35]
- Updated dependencies [1227e62]
- Updated dependencies [ae6afbf]
- Updated dependencies [6144814]
- Updated dependencies [cfc8f71]
- Updated dependencies [81bd4f0]
- Updated dependencies [10bee50]
- Updated dependencies [cb3551c]
- Updated dependencies [db1a4d3]
- Updated dependencies [575a5ee]
- Updated dependencies [2595439]
- Updated dependencies [f9e483f]
- Updated dependencies [5852b65]
- Updated dependencies [d2c8e01]
- Updated dependencies [36f864c]
- Updated dependencies [eaa6517]
- Updated dependencies [1bb3012]
- Updated dependencies [2ffac21]
- Updated dependencies [a2b5466]
- Updated dependencies [bfc6a00]
- Updated dependencies [b226c43]
- Updated dependencies [239a3a7]
- Updated dependencies [49490b6]
- Updated dependencies [a79fb1d]
- Updated dependencies [1766343]
- Updated dependencies [08f76bb]
- Updated dependencies [a34939d]
- Updated dependencies [e6302c6]
- Updated dependencies [aa6bb38]
- Updated dependencies [a9442cc]
- Updated dependencies [3c2258c]
- Updated dependencies [81bd4f0]
- Updated dependencies [3eb3691]
- Updated dependencies [537bf54]
- Updated dependencies [9de3cf9]
- Updated dependencies [3f3a320]
- Updated dependencies [ecdfb65]
- Updated dependencies [4a69885]
  - @lowdefy/helpers@7.0.0
  - @lowdefy/blocks-antd@7.0.0
  - @lowdefy/block-utils@7.0.0
  - @lowdefy/nunjucks@7.0.0
