# @lowdefy/blocks-table

## 7.2.0

### Minor Changes

- 9226424: feat(blocks-table): Table server mode loads rows from an API endpoint with `data.endpoint`

  Server mode loaded rows only from a request on the page, so an app whose data may only be read behind an endpoint's own checks could not use it. `data: { mode: server, endpoint }` now names an API endpoint in place of `request`: the table calls it with `CallAPI`, with the fetch event `{ startRow, endRow, view, groupPath, selected }` as its payload, and reads the routine's `{ rows, total, groups?, aggregates? }`, the shape `MongoDBTableQuery` returns. Give exactly one of `request` and `endpoint`. A response without rows shows the table's own error row.

- 26333a9: feat(blocks-table): Table server mode adds the page's own fields to each fetch event with `data.payload`

  A server-mode Table sent only its own fetch event, `{ startRow, endRow, view, groupPath, selected }`, so a filter the page keeps outside the table's view (a region picked above the table) had to be written into the view's filter, where it ended up in every saved view. `data.payload` is an object of fields the table adds to every fetch event, beside its own fields, which win on a clash. A changed payload starts the rows again from the top.

- ff7e31a: feat(blocks-table): A Table's `emptyFiltered` slot replaces "No matching rows"

  When a filter or search hid every row, the Table always showed "No matching rows" with Clear filters, before it looked at the `empty` slot. On a view whose filter is the point, such as a saved list, Clear filters throws the list away. Blocks in the new `emptyFiltered` slot now replace that state, for example "No deals match this view right now." with an Edit filter button. The `empty` slot keeps its meaning (no rows and no filter), and the wrapper keeps `data-lf-empty="filtered"` either way.

- b1d42ca: feat(helpers, blocks-table, connection-mongodb): A Table filter reads as one sentence, on the page and from `MongoDBTableQuery`

  A saved view's filter was readable only by opening the filter builder, and a server routine running the view through `MongoDBTableQuery` had no way to say what it matched. `describeCondition({ condition, fields })`, new in `@lowdefy/helpers`, turns a filter condition into a sentence such as "Stage is any of Lead or Won and Name contains CX": field titles, operator words, option labels, relative dates in words, `$user` values as "me", and brackets for groups past the first level. A key that names no field reads "an unknown field, <key>," rather than being dropped. The Table's Filter button shows the sentence as its tooltip. `MongoDBTableQuery` fields accept `title` and `options` as Table columns do, and the response carries `sentence` when a filter is set, the same sentence the Table shows for the same titles and options.

- 9085f6d: feat(blocks-table): A Table's `openFilter` method opens its filter builder

  Only the toolbar's Filter button opened the filter builder, so an Edit filter button elsewhere on the page, such as in a list's header or its empty state, had no way to start editing the filter. `CallMethod` with `openFilter` now opens the builder, anchored to the toolbar's Filter button as a click on it does. With `{ key }` it first adds an empty condition on that column and focuses it. On a Table whose toolbar has no filter item, it logs a warning and does nothing.

- 70ef067: feat(blocks-table): A Table's view tabs and filter builder fit a phone

  On a phone the saved view tabs ran off the screen and the filter builder opened as a popover too small to edit. Below 768px (antd's `md` breakpoint) the tabs are now one select showing the active view, with its menu and the changed-view strip beside it, and the toolbar's Filter button opens the builder as a full-height sheet with the record count at its foot, which follows each edit.

- c7c1693: feat(blocks-table): A Table quick filter over a long option list has a search box

  A quick filter chip on a column with `options` opened a plain checkbox list, so finding one name in a long list, such as an owner column listing every member of an organisation, meant scrolling. A list of more than 8 options now has a search box at its top that narrows the options by label as you type, case-insensitive. Ticked options stay listed while you search, Escape clears the search, and a list of 8 or fewer is unchanged.

- 962ac05: feat(blocks-table): The Table cell details panel can load a cell's raw result on demand

  An enrichment or ai cell keeps the provider's whole answer as its raw result, often many times the size of the value, and the rows sent to the browser carried it for every cell although only the details panel shows it. The new `rawEndpoint` property names an API endpoint that returns one cell's raw result: rows can leave `_enrich.<key>.raw` out, and the details panel calls the endpoint with `{ rowKey, key }` when it opens a finished cell whose row has none, showing "Loading the raw result…" meanwhile and an error if the call fails. It loads again when the cell finishes a new run. A table without `rawEndpoint`, or a row that carries the raw result, works as before. TableLight names `rawEndpoint` as a Table-only property.

- 837d529: feat(blocks-table, connection-mongodb): Table `before` and `after` filters take relative dates

  A Table date filter could say "within the last 3 months", but `before` and `after` took only a fixed date, so a saved view such as "not contacted in 3 months" went stale the next day. `before` and `after` now also take the relative value `within` takes, `{ last | next: n, unit: day | week | month | year }`, resolved each time the filter runs: `{ op: before, value: { last: 3, unit: month } }` reads "before 3 months ago". A relative bound compares whole days, in the browser's days in client mode and in the request's `timezone` in `MongoDBTableQuery`. The filter builder offers Date or Relative for `before` and `after`, a date column's filter menu picks `within`, `before` or `after` under Relative, and `MongoDBTableQuery` refuses a bad relative value with the message it gives for `within`.

- 9d5eb24: feat(blocks-table): `rowSelection.selectable` limits row selection to rows that pass a condition

  A `Table` or `TableInput` with `rowSelection` can now offer a checkbox only on some rows, as AgGrid's `isRowSelectable` does. Set `rowSelection.selectable` to a table condition (`{ key, op, value }`, or `and` / `or` lists). A row that fails it shows a disabled checkbox and cannot be selected by click, the header checkbox, a group checkbox or `selectAllMatching`, and the header checkbox reads checked when every selectable row is selected. An `{ all: true }` selection lists the rejected rows in `except` (in server mode, the loaded ones).

- 732646e: feat(blocks-table): A Table can hand Save as to the app with `onViewSaveAs`

  The Table's Save as opened its own popover with a title field and a Shared box, so saving a new view could ask for nothing else: not a unique name, a description, or a count of the rows it matches. A Table with `onViewSaveAs` actions now fires `onViewSaveAs { view }` from Save as instead of opening the popover, so the app opens its own dialog, stores the view and updates `views` and `activeView` as after `onViewSave`. Without `onViewSaveAs` actions, Save as works as before.

- 0dd2e9d: feat(blocks-table): A Table's saved view tab menu takes its items from `viewMenu`

  A saved view tab's menu offered only Delete view, and the only way to hide it was `locked`, which also hid Save. An app that archives views, because other features read them, could not offer Archive in place of Delete. `viewMenu: [{ key, label, danger, confirm }]` now sets the menu's items: picking one fires `onViewMenu { key, id }` with the view's id, after a confirmation when the item has `confirm` (`true` for "Are you sure?", or a message). Without `viewMenu` the menu is Delete view, firing `onViewDelete`, as before. `locked` still hides Save and disables only the default Delete. TableLight names `viewMenu` as a Table-only property.

### Patch Changes

- 02842fe: feat(api): A block schema marks how it draws a string with `textKind` (`html` through `renderHtml`, `text` as escaped text), and a Dynamic blocks policy judges a marked value by it. In an HTML-drawn property, a markdown link target, a protocol-relative word (`//x.example`) and, unless the policy allows HTML, a CSS `url()` are words, not URLs; the `html` rule still applies. In a text-drawn property tag syntax is words too. A whole value with a loaded or script scheme (`https:`, `javascript:`, ...) is still checked, and unmarked values keep every check. `Descriptions` titles, labels and values, `Paragraph` and `Title` content, input titles and labels, `Selector`, `MultipleSelector` and `ButtonSelector` option labels and `Table` column titles, header tooltips and `emptyText` are marked `html`; the `ControlledList` title is marked `text`.
- d143e29: feat(api): A Dynamic blocks policy checks a value as a URL only where it is used as a link or source (URL keys, `urlKind` marks, `Link` params, markdown links and CSS `url()`); everywhere else a URL is text. Text a block draws as HTML or text (`textKind`) no longer has its whole value judged as a URL. `SetState` values are data (only the operator rules apply), unless an input in the content whose value is an object (rich text, uploads, table inputs) draws them. A new `textKind: data` marks values a block stores but never draws (`dataWith` names a sibling the value is data only beside): `Selector`, `MultipleSelector` and shared option `value`s beside a `label`. A new `rowsKind` mark on `Table` and `TableLight` `data` makes the rows data when every column draws its cell as text, no `cell.colorFrom` reads a row field and no `expandable.template` is set. Tags stay checked wherever a property draws HTML.
- a461f7c: fix(deps): Update dependencies for security advisories

  - vite 8.0.16 -> 8.1.6: the dev server no longer serves files outside `server.fs.allow` when a project path matches a system path, and launch-editor's command handling is fixed.
  - @modelcontextprotocol/sdk 1.31.0 -> 1.32.2: bounds request validation memory, ties experimental tasks to their session, checks a bearer token's audience and stops forwarding headers on cross-origin redirects.
  - hono 4.13.7 -> 4.13.14: `serveStatic` no longer decodes the path a second time, which let a request bypass middleware.
  - dompurify 3.4.16 -> 3.4.17: fixes three sanitizer bypasses, one critical.
  - markdown-it 14.3.1 -> 14.3.3, nodemailer 10.0.13 -> 10.1.7 and undici 7.30.0 -> 7.30.1.

- fcea703: fix(blocks-antd): Table avatars are one size, round and readable

  In `Table` and `TableLight` an `avatar` cell with a `descriptionField` drew a 32px avatar, and a row
  without the description drew a 24px one, so a column mixed two sizes. The one-line avatar was also
  cut flat at the top and bottom, because the single-line cell wrapper clipped the avatar where it
  overhangs the text line. Every avatar in `avatar` and `people` cells is now 24px with the same gap
  to the name, and these cells no longer clip their avatars.

  Initials are 10px (were 11px), so two letters no longer fill the circle edge to edge. A `people`
  group shows its avatars side by side with a 2px gap instead of overlapping them, so no avatar or
  its ring cuts into the initials of the one before.

- 1ffabe9: fix(blocks-table): The filter builder keeps its grouping when edits apply late

  The Table's column filter, filter builder and options quick filter keep their own copy of the filter while the table applies each edit. They remembered only the latest edit they sent, so an earlier edit that the table applied after a newer one was taken as a filter change from outside and replaced the editor's copy. The column filter's builder then showed the whole condition wrapped in an extra "All of these conditions" group, one level deeper, which also cost a level of nesting. The editors now treat any edit they sent that the table has not caught up with as their own.

- 4d548e9: fix(blocks-table): The Table header has one group row per level of the column groups it shows.

  A collapsible column group with nested column groups made the header draw a group row for every level of the deepest group, even while the group was collapsed and its nested groups were hidden, so the collapsed table showed an empty band above the column titles. The number of group rows now follows the columns on screen: a collapsed group takes one row for its own title, and expanding it adds the rows its nested groups need. Hiding every column of a group from the column picker also removes the row it no longer needs.

- f51a6cc: fix(blocks-table): The details panel, TableInput and openFilter fixes from the Table review

  - An app with a Table builds again. The date column filter imported `getOperatorLabel` from a file that had moved to `@lowdefy/helpers`, so the client bundle failed with "Could not resolve './getOperatorLabel.js'".
  - A raw result the details panel loads from `rawEndpoint` no longer offers to add its values as extract columns. Extract columns read the raw result from the row, which such rows leave out, so a column added that way stayed empty. The panel now says the result was loaded and shows it read-only. Switching the open panel to another cell no longer shows the previous cell's raw result for a frame.
  - TableInput names `rawEndpoint` as a Table-only property, as TableLight does, so a TableInput config that sets it fails the build with that message instead of accepting a property it never uses.
  - A condition `openFilter({ key })` asked to focus is dropped if it has not appeared after about a second, or when the builder closes. Before, the next plain click on Filter could focus that old condition. `openFilter` also preloads the builder, as hovering the Filter button does.

- Updated dependencies [02842fe]
- Updated dependencies [d143e29]
- Updated dependencies [31d7de8]
- Updated dependencies [dd5c2b1]
- Updated dependencies [61ae799]
- Updated dependencies [f0209f6]
- Updated dependencies [3cd6d62]
- Updated dependencies [0f0cd03]
- Updated dependencies [a461f7c]
- Updated dependencies [fcea703]
- Updated dependencies [b1d42ca]
- Updated dependencies [962ac05]
- Updated dependencies [0dd2e9d]
  - @lowdefy/blocks-antd@7.2.0
  - @lowdefy/helpers@7.2.0
  - @lowdefy/block-utils@7.2.0
  - @lowdefy/nunjucks@7.2.0

## 7.1.0

### Patch Changes

- Updated dependencies [c6d665a]
- Updated dependencies [3df29f3]
  - @lowdefy/blocks-antd@7.1.0
  - @lowdefy/block-utils@7.1.0
  - @lowdefy/helpers@7.1.0
  - @lowdefy/nunjucks@7.1.0

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
