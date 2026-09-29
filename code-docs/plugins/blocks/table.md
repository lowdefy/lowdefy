# @lowdefy/blocks-table

The `Table` and `TableInput` blocks: a virtualised, keyboard-accessible data table built on [TanStack Table](https://tanstack.com/table) v9 (state and row models) and [TanStack Virtual](https://tanstack.com/virtual) v3 (row and column windows), styled with plain CSS over the app's antd tokens. `TableLight` (in `@lowdefy/blocks-antd`) shares its column model and cells. The server-side half is `MongoDBTableQuery` and `MongoDBTableChanges` in `@lowdefy/connection-mongodb` (see [mongodb.md](../connections/mongodb.md#table-requests)).

User docs: `packages/docs/blocks/display/Table.yaml` + `TableGuide.md`, `packages/docs/blocks/input/TableInput.yaml` + `TableInputGuide.md`. Package notes: `packages/plugins/blocks/blocks-table/ARCHITECTURE.md` (the feature-module contract in full), `bench/RESULTS.md`. Design: `lowdefy-design/designs/table/design.md` (decisions D1-D16; the code is the source of truth where they differ).

## Why it exists

AG Grid is licensed for the features CRM tables need (grouping, server rows), and antd's `Table` cannot be made fast for 10k+ rows: it virtualises rows but not columns, emulates scrolling in JS, and has no column resize, reorder or grouping primitives (design D1). The table owns its body (native scroll, one sizer, CSS-variable widths) and uses antd only for chrome: menus, popovers, checkboxes, pagination, editors.

Three decisions shape everything else:

1. **The value is UI state, not data** (D2). `Table`'s value is `{ view, selected, expanded }`, so `_state: <id>.selected` and `_state: <id>.view` need no wiring, and `SetState` / `Reset` drive the table. Data comes from `properties.data` or server mode.
2. **One column model across TableLight and Table** (D3, D16). Columns, cell renderers, conditions, sort keys, aggregates and exports live in `blocks-antd/src/table/`, so a TableLight config means the same thing on Table.
3. **Build does the conditions, the server does the query** (D4, D9). No `_function` is needed for formatting or filtering: `rules`, `when`, `options` and templates compile once per config, and the view the browser sends is data validated against an allowlist on the server.

## Package layout

```
packages/plugins/blocks/blocks-antd/src/
├── blocks/TableLight/            TableLight: antd <Table>, the shared column core, no TanStack
└── table/                        the shared column core (exported as @lowdefy/blocks-antd/table/*.js)
    ├── normalizeColumns.js       string/object columns, header tree, defaultColumn, duplicate keys
    ├── compileColumns.js         per-column compiled rules, tooltips, templates, button/menu flags
    ├── compileCondition.js       the condition language (filters, rules, when, validate)
    ├── compileRules.js           rules / rowRules -> (row, value) => { className, style }
    ├── cellTypeFamilies.js       type -> family (text, number, date, boolean, array, other, action)
    ├── getOperators.js           operators per family
    ├── createSortKeyGetter.js    typed sort keys; createComparator / compareSortKeys agree with it
    ├── computeAggregate.js       sum, avg, min, max, count*, percentEmpty, earliest, latest
    ├── renderCell.js, cells/     the cell renderers (tier 0 static DOM, buttons/menu antd)
    ├── getCellText.js            display text (search, fast-scroll placeholders)
    ├── getExportValue.js         CSV / clipboard values
    └── resolveLink.js, isControlTarget.js, getSafeUrl.js, ...

packages/plugins/blocks/blocks-table/src/
├── blocks/Table/                 meta.js, Table.js (createLazyBlock wrapper), Table.lazy.js, TableFallback.js,
│                                 gallery.yaml, e2e.js, tests/*.e2e.{yaml,spec.js}
├── blocks/TableInput/            meta.js (Table's meta with a changeset value), TableInputRoot.js, gallery.yaml
├── core/                         TableRoot, Grid, Body, Row, Cell, HeaderRow, SummaryRow, layout, value derivation
├── features/<name>/              feature modules, composed in features/index.js
└── bench/                        the Playwright performance suite (not shipped)
```

`Table.js` is a `createLazyBlock` wrapper: the page's block chunk holds only the meta, the fallback (`TableFallback`, the table's own initial loading state built from the column config, see Loading states) and method proxies for the methods declared in `meta.methods`. `Table.lazy.js` (TanStack, the core and the always-on features, about 57 kB gzip with React, antd and `@lowdefy/*` shared) loads on the first mount, then the optional features the config needs (editing, server mode, group rows, the toolbar, ...) and, on first use, the popovers and editors. A method called before the chunk loads is proxied, which is why every feature method must be declared in `meta.methods`.

`Table` is category `input-container` (a value plus slots `toolbarStart`, `toolbarEnd`, `bulkActions`, `empty`), declares `actions: ['Request']` (server mode fires an internal Request action) and `dynamicEvents: true` (button and menu `eventName`s are authored in properties). `TableInput` spreads Table's meta without its `slots` (an `input` renders no slot content), switches to `input`, replaces `onChange`, drops `onCellEdit` / `onRowMove`, and adds `resetChanges`, `addRow`, `deleteRows` and `rowActions`.

## Render layers

| Layer                     | Owns                                                                                                        | Re-renders on                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `TableRoot`               | config (`useTableConfig`), the data pipeline, table state, the TanStack instance, block-level feature hooks | data, config, state changes                                          |
| `Grid`                    | layout, the scroll window, grid-level feature hooks, the delegated listeners, DOM                           | scroll (range changes), layout                                       |
| `Body` / `Row` / `Cell`   | the rows of the current range                                                                               | row object, display index, selection, active column, visible columns |
| `HeaderRow`, `SummaryRow` | header groups and leaf headers; the sticky footer                                                           | layout, sort/filter state, aggregates                                |

Scrolling renders `Grid` only; the engine and the block's props are never touched by scroll. Resizing writes CSS variables (`--lf-w<n>`, `--lf-l<n>`, `--lf-r<n>`) through `api.previewLayout` and commits once on pointer up.

## The feature-module system

Every behaviour beyond the grid itself is a feature module: a plain object in `features/<name>/<name>Feature.js`, listed in `features/index.js`. The core loops over the list; order matters, because it is the order of delegated handlers (the first to return `true` stops the chain) and of data pipeline hooks.

Registry order: filtering, headerMenu, columnManager, enrichment\*, sorting, sizing, ordering, pinning, visibility, density, transactions, editing\*, newRows\*, clipboard, paste\*, selection, expansion, serverData\*, grouping, groupRows\*, tree\*, expandable\*, virtualization, positionedRows\*, serverRange\*, lazyCells, views\*, toolbar\*, bulk, queue, keyboard, events, export, pagination. Starred entries are optional: each loads in its own chunk only for tables whose config needs it (`core/useFeatureSet.js`, which suspends until they are there and builds the table's feature set, `api.features`); see `ARCHITECTURE.md`, Feature sets and optional features. A table keeps the optional features it has loaded (`useFeatureSet`), so config that passes through a smaller state (columns read again by a request are empty while it loads) never remounts it; only a config that needs a new feature does. Enrichment (with newRows) reaches the core only through extension points: `cellRenderer` (run-state and error columns), `toolbarItems` (Import), `bulkItems` (Run selected), `headerParts`, `headerCellProps`, `headerMenuItems` and `gridHandlers` (clicks, keys, and pointerover / focus to preload the column picker and details panel).

Why some of that order matters:

- filtering and headerMenu come first: the filtered row model feeds sorting, and their header buttons must claim clicks before sorting or column reordering see them;
- transactions before editing: an optimistic edit overlays pushed changes, and a pushed change to an edited row settles the edit;
- editing before selection and keyboard: Enter on an editable cell edits instead of activating the row;
- views before toolbar (the toolbar renders the tabs); queue before keyboard (a bare key fires a row action before navigation sees it).

A module can declare any of (full table in `ARCHITECTURE.md`): `tableFeatures` (TanStack slots), `slices` (state it owns, with `init`, `cause`, `transition`), `viewKeys`, `toValue`, `toViewColumn`, `tableOptions`, `actions` (called by other modules via `api.actions`), `methods` (block methods), `gridHandlers` (`click`, `dblclick`, `auxclick`, `pointerdown`, `keydown`, `focus`), `headerParts`, `headerCellProps`, `headerMenuItems`, `mountValue`, `onCommit`, the pipeline hooks `useData` / `useRows` / `useItems`, `useFeature` (block-level fragments: `leadingColumns`, `regions.top/bottom`, `loading`, `pending`, `refreshing`), `rowRenderers`, `cellLead`, `bodyOverlay` and `useGridFeature`.

`api` (`core/createApi.js`) is one stable object per table, refreshed every render: the TanStack `table`, `config`, `properties`, `value`, `state`, `layout`, `rows`, `dataRows`, `methods`, `updateSlice`, `loadValue`, `getValue`, `resolveValue`, `previewLayout`, `actions`, `keyboard`, `views`, `serverStore`, `total` and more.

Events use one delegated listener per event type on the root (D5). Handlers find their target from the DOM contract: rows carry `data-row-key` and `data-row-index` (the header row is `-1`), group rows `data-group-key`, cells `data-lf-cell`, `data-col-key`, `data-col-index`, header cells `data-lf-header`, special columns `data-special`. Clicks on controls inside a cell (`isControlTarget`) and drags that select text (`isTextDrag`) never become row events. `keyboard: false` gates cell navigation (`keyboard`), tree Right/Left and TableInput paste; copy, group header keys, header menu keys, Cmd/Ctrl+F, queue keys and editing keys stay on.

A table's events go through the engine's DOM event claiming (`code-docs/packages/engine.md`, DOM Event Bubbling): only blocks on the DOM event's path take part, and the innermost with actions claims it unless its event has `bubble: true`. A block targeted by `CallMethod` during that DOM event is exempt, so a Table in a toolbar or next to a button still fires `onSelectionChange` after the button's `CallMethod clearSelection`, and the internal `__tableFetch` (registered with `registerEvent`) is never skipped.

## Data pipeline

One pipeline in `TableRoot`; each stage runs its feature hooks in registry order, and every hook returns its input unchanged when it has nothing to do, so downstream memos stay warm.

| Stage           | Code            | In -> out                                                    | Modules                                                                                                      |
| --------------- | --------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| 1. source       | `useData`       | `properties.data` -> source rows                             | serverData (the block cache's rows), tree (flattens `childrenField`)                                         |
| 2. key diff     | `stabilizeData` | source rows -> rows whose identity changes only with content | core (positional fast path, `rowVersionField` read as a dot path, or structural compare for rows without it) |
| 3. overlays     | `useRows`       | stable rows -> the rows TanStack sees                        | transactions (`applyTransaction`), editing (Table's optimistic overlay, TableInput's changeset)              |
| 4. row model    | TanStack        | rows -> filtered, sorted rows                                | filtering (`createConditionFilteredRowModel`), sorting (`createIndexSortedRowModel`), selection              |
| 5. display list | `useItems`      | row model -> display items, `dataRows`, height estimates     | serverData, grouping, tree, expandable, pagination                                                           |
| 6. window       | Grid            | display items -> offsets and the rendered range              | virtualization, serverRange                                                                                  |

- **Stage 2 is what makes live data cheap.** `properties.data` is often a new array of new objects after every engine update; after the key diff, a row object only changes when its content does, so rows memoise on identity and overlays can key on it.
- **Sorting** builds typed `Float64Array` keys per column (`createSortKeyGetter`) once per rows array and sorts an index array; big text columns build keys in time slices before the sort applies (`SLICED_THRESHOLD` 5000). Sort runs in `startTransition`, so the header paints at once and the old order stays (dimmed, `data-pending`) until the new one lands. `buildSortKeys.test.js` checks the index sort matches `createComparator` for every type family.
- **Filtering** writes through `applyFiltering({ filter, search })`: rows are tested in slices into a `Uint8Array`, cached per rows array and filter context, then the slices update in a transition. Conditions compile once with the shared `compileCondition`. Search tests every word against the lowercased display text (`getCellText`) of the searched columns, cached per row, and a search that extends the previous one only tests the rows it kept.
- **The display list** (`api.rows`) is one flat list: TanStack rows, wrapped rows (`kind: 'row'`, tree and expandable), group headers (`kind: 'group'`), detail rows (`kind: 'detail'`), server error rows (`kind: 'error'`, a failed block), a lazy tree row's skeleton child (`kind: 'skeleton'`), and `undefined` holes for unloaded server rows (skeletons). `core/isDataItem.js` tells data rows apart; `api.dataRows` is every data row in display order (all pages, rows of collapsed groups), which export reads.
- **Grouping** is not TanStack's (its grouped model runs before sorting): `useGrouping` builds the group tree from the sorted rows in one pass with counts, leaf ranges and aggregates (`buildGroupTree`), and `flattenGroups` turns it into the list; collapsing reruns only the flatten. One overlay (`StickyGroupRow`, a `bodyOverlay`) shows a sticky group header per level, stacked, each found by binary search over that level's header indices (`getStickyGroups`).
- **Trees** (client only) flatten in stage 1, build a parent/children index, and in stage 5 keep row model order within siblings and re-insert ancestors the filter dropped.

## Value and view model

- One React state object (`useTableState`) holds every slice: TanStack's (`sorting`, `columnSizing`, `columnOrder`, `columnPinning`, `columnVisibility`, `rowSelection`), feature slices (`selectionMode`, `selectionView`, `density`, `wrap`, `pageSize`, `filter`, `search`, `grouping`, `collapsedGroups`, `aggregates`, `expanded`) and `viewPassthrough` (view keys no module claims). TanStack is controlled from it.
- Every change goes through `api.updateSlice(name, updater, { cause })`. After the commit, `deriveValue` builds the value, `methods.setValue` writes it once, then `onChange { value, cause }` and each module's `onCommit` fire (`onSelectionChange`, `onViewSelect`). Drags and scroll write only when the gesture ends.
- A value changed from outside (`SetState`, `Reset`) re-initialises the state. `getValueSignature` compares `view` by JSON (SetState on a path mutates the written object) and `selected` / `expanded` by identity. A null value is filled with the resolved default without `onChange`; on mount a null value first asks the modules' `mountValue` (the persisted view, then the active saved view). `Reset` always returns to `defaultView`.
- Resolution (`createInitialState`, `resolveViewColumns`, `pickViewPart`): each view part falls back value -> `defaultView` -> column defaults; unknown column keys are dropped; declared columns missing from a stored `view.columns` are appended hidden. The derived view omits `columns` while it equals the configured layout, so config changes keep showing until the user changes the layout.
- `api.resolveValue(value)` gives the value a state built from `value` would write; views use it to compare a partial saved view with the current one (`isViewDirty`, which ignores `search` and `collapsedGroups`).
- View keys (`features/views/viewKeys.js`): `columns`, `sort`, `filter`, `search`, `group`, `collapsedGroups`, `aggregates`, `density`, `wrap`, `pageSize`. density owns `wrap` (with it, `computeLayout` gives text-like columns without their own `wrap` / `ellipsis` a wrapped copy, `getViewWrapColumn`, so their rows are measured; the toolbar density control has the Wrap toggle, cause `wrap`); pagination owns `pageSize` (`view.pageSize`, else the property).
- `persist` writes `{ view: compactView(...), activeView }` after each view change: `localStorage` key `lowdefy-table:<key>`, or a base64url query parameter written with `history.replaceState`. Reads are wrapped so blocked storage means no persistence.

**TableInput** is `TableRoot` with an `input = { changes, methods }` prop (`TableInputRoot.js`). The table's own value (view, selection) lives in React state in `TableInputRoot`, which wraps `methods.setValue` and swallows the engine's `onChange`; the block value is the changeset.

## Events

Payloads match TableLight and the AgGrid blocks where they overlap, so actions move over unchanged:

| Event                                             | Payload                                                                                                                                                                                                                                                                                                                | Fired by                                                                  |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `onChange`                                        | `{ value, cause }` (TableInput: `{ value, cause, rowKey, skipped }`)                                                                                                                                                                                                                                                   | core after a user-caused commit                                           |
| `onSelectionChange`                               | `{ selected, rows }`                                                                                                                                                                                                                                                                                                   | selection `onCommit`                                                      |
| `onRowClick`, `onRowDoubleClick`                  | `{ row, rowKey, index }`: `index` from `getRowIndex`, the row's index in `data` (depth-first for `childrenField` trees, `api.getSourceIndex` over the stable source rows), its absolute index in its server list (`serverStore.getRowIndex`), or `null` for rows not in `data` (`applyTransaction` or TableInput adds) | events                                                                    |
| `onCellClick`                                     | `{ row, rowKey, column: { key, field }, value }`                                                                                                                                                                                                                                                                       | events                                                                    |
| `onCellLink`                                      | `{ link, row, value }`                                                                                                                                                                                                                                                                                                 | link, avatar and relation cells                                           |
| button / menu `eventName`                         | `{ row, rowKey, value, button \| item, buttonIndex \| itemIndex }`                                                                                                                                                                                                                                                     | the shared renderers via `api.onCellEvent`, or queue's single-key actions |
| `onRowExpand`                                     | `{ row, rowKey, expanded, needsChildren }` (`needsChildren`: a `tree.lazy` row expanded with none of its children in `data`)                                                                                                                                                                                           | expansion                                                                 |
| `onViewSelect`, `onViewSave`, `onViewDelete`      | `{ id }`, `{ view, id?, title, shared }`, `{ id }`                                                                                                                                                                                                                                                                     | views                                                                     |
| `onCellEdit`, `onRowMove`                         | `{ row, rowKey, column, value, previous }`, `{ row, rowKey, fromIndex, toIndex, beforeKey, afterKey, position?, positions? }` (indices over `api.dataRows`, every page)                                                                                                                                                | editing (Table only; awaited)                                             |
| `onExport`                                        | `{ view, filename, formatted }`                                                                                                                                                                                                                                                                                        | export, server mode                                                       |
| `onColumnAdd`, `onColumnUpdate`, `onColumnDelete` | `{ column, position }` (`position`: `{ before \| after: key }` or null), `{ column, previous }`, `{ column }` (column configs as the app wrote them)                                                                                                                                                                   | enrichment (awaited: picker, rename, delete confirmation pending)         |
| `onColumnRun`, `onRowRun`, `onCellRun`            | `{ column, mode, selection }` (selection value, or `{ all: true, except: [], filter, search }` of the view), `{ row, rowKey, columns }`, `{ row, rowKey, column }`                                                                                                                                                     | enrichment                                                                |
| `onRowAdd`, `onImport`                            | `{ values }`, `{ rows, newColumns, batchIndex, batchCount, total }` (500 rows a batch, sequential); every value at its column's field path, new input columns with their `field` (under `inputFieldPrefix`)                                                                                                            | enrichment (awaited)                                                      |
| `__tableFetch`                                    | `{ startRow, endRow, view, groupPath, selected }`                                                                                                                                                                                                                                                                      | serverData (internal, registered with `registerEvent`)                    |

## Server mode

`data: { mode: server, request, blockSize, maxBlocks }` (`features/serverData`). `useServerView` registers the internal event `__tableFetch` (a `Request` action for `data.request`), so the page's request reads the fetch arguments with `_event` in its `payload`. `readFetchResult` expects `{ rows, total, groups?, aggregates? }` from `responses.__tableFetch.response[0]`.

`createServerStore` owns:

- **the view** sent to the server, `pickServerView`: `sort`, `filter`, `search`, `group` and the aggregates in effect. Column layout and density never refetch. A new view gets a new cache, scrolls to the top, fetches block 0, and keeps the previous cache on screen (dimmed) until the new root block lands; responses for a superseded cache are ignored.
- **the block cache** (`createBlockCache`), one per view: blocks of `blockSize` rows per list (the root list `[]` and each open group's list, keyed by `JSON.stringify(groupPath)`), LRU-evicted beyond `maxBlocks`, never evicting a visible or loading block. `invalidate()` (the `refresh` method) bumps a generation: `triggerEvent` cannot be aborted, so older responses are dropped instead, and invalidated blocks stay on screen until they reload.
- **loading**: `serverRange` (grid level, after virtualisation) reports every rendered range. Slow range changes load missing blocks at once; fast ones (above 0.05 rows/ms, about 2000 px/s) wait for the range to settle for 120 ms.
- **the display list** (`buildServerItems`): the root rows, or its groups with open groups followed by their own list, with `undefined` holes (an open group's leaf list shows its group's `count` of holes before its first block lands, and the group item is `loading`); a failed block is one `kind: 'error'` item in place of its rows, which `ServerErrorRow` renders with Retry (`store.retry` reloads that block only). `total` sizes the scroll height and `aria-rowcount`. Open server groups live in the store, not the value, and reset when `view.group` changes.

TanStack sees only loaded leaf rows (`manualSorting`, `manualFiltering`, `manualGrouping`). Selection is always preserved in server mode; the header checkbox writes `{ all: true, except: [], filter, search }` (`selectionMode: 'all'`, the filter and search held in the `selectionView` slice) and `api.selectionExcept` keeps exceptions whose rows were evicted. "Select all matching" (bulk, both modes) writes the same shape; the value describes itself, so `MongoDBTableChanges` bulk mode can resolve it, rows that arrive later join it only if they match (client: the filtered rows), and a filter or search change clears it (`useSelection`, `isSelectionViewCurrent`). `exportCsv` fires `onExport`. `applyTransaction` merges updates into loaded rows and refetches the visible rows for adds and removes. Trees, pagination and row moves are rejected in server mode.

## Loading states

Design D17; the shared pieces are in `blocks-antd/src/table/` so TableLight uses the same ones.

- **One state per render.** `TableRoot` reads Lowdefy's `loading` prop (onMount actions, the block's `loading` key) or `properties.loading`, holds the last rows while loading and `data` has none (`useHeldRows` / `holdRows`: a refetch without `holdValue` makes `_request` null), and resolves `resolveLoadingState({ loading, pending, sourceCount, displayCount })`: `initial`, `refreshing`, `empty`, `ready`. Server mode adds its fragments: `loading` (no root block yet), `pending` (a view change, the previous cache on screen) and `refreshing` (loaded blocks reloading). The state is `api.loadingState` (Export, select all and the bulk bar read it) and the root's `data-loading-state`.
- **Timing** is `useSkeletonTiming` over the pure `getSkeletonPhase`: `hidden` for the first 120 ms (skeleton rows hold their space, invisible: `data-skeleton-hidden`), `visible`, then `holding` until it has shown 300 ms. One timer per phase change. Start times are kept per block id, so the table picks up where its fallback left off.
- **Skeleton rows** (`SkeletonRows`, `SkeletonRow`) render one `SkeletonCell` per cell, shaped by `getSkeletonShape(type)` with widths seeded by row index and column key (`getSkeletonWidth`), at the density's row height. The count is `getTableSkeletonCount`: fill `height` or `maxHeight`, capped by the page size and by known rows. Tier 0: spans with a CSS variable, no hooks. The shimmer is one transform animation per row (`::after`, compositor only), off under `prefers-reduced-motion`. Server holes and a lazy tree's skeleton child use the same row.
- **Busy and pending** are root attributes, not renders: `data-busy` (a refetch or refresh) and `data-pending` (a view change, also set directly by sort and filter while their slices build) show the 2px bar that `HeaderRow` always renders under the header (`display` toggled by CSS, a 120 ms fade-in); `data-pending` also dims the body after 300 ms with a delayed CSS animation, so a quick transition never dims.
- **The fallback** (`TableFallback`, in the page's block chunk with `table.css`) lays the columns out from config with the engine's `buildLayout` (`computeFallbackLayout`: the view's order, pins and widths via `resolveViewColumns`, the selection and row-controls columns), renders the real `HeaderRow` with the sort indicator, the same skeleton rows, and placeholders for the toolbar row, pager and add-row button, so the swap to the table keeps every box. Its header takes no clicks. It starts the template compiler's load when the config needs it.
- **Lazy parts.** Popovers, the header menu and the cell editor render `PopoverLoading` / a spinner as their Suspense fallback, so they open at once. A lazy tree expand is awaited (`createToggleRowExpanded` with `api.childLoads`): the chevron spins and a skeleton child shows; a failure collapses the row and shows the error on the chevron. The toolbar's `ExportButton` spins until `exportCsv` resolves (a server export returns the `onExport` promise).
- **Enrichment** follows the same rules: the fallback lays out its trailing "+" / run column (`needsTrailingColumn`, `TRAILING_COLUMN_WIDTH`) and leaves room for Table's "+ New row" (`addRow`), so the swap keeps every box; the column picker, details panel and import dialog open at once as a drawer or dialog of their size with a spinner (`OverlayLoading`) until their chunk loads; run states (queued, waiting, running) are cell data, not loading states. Apps wire `loading` to the rows request and reload columns and rows with `holdValue: true`, as the reference page does. Formula templates never need the template compiler: they are placeholders, filled in as text.
- **Templates** load on demand: `needsTemplates` decides, `readTemplateCompiler` suspends the table until `@lowdefy/nunjucks` has loaded (`loadTemplateCompiler`, once per page), and `compileColumns` / `compileTooltip` / `normalizeExpandable` take the compiler as `compileTemplate`.

## Editing

- **Cells know nothing about editing.** One `EditingLayer` (in `regions.bottom`) portals the single open editor and the status markers into the rendered cell elements, found by row and column key; `useGridFeature` re-syncs them after every grid render, so a cell that scrolls back in gets its editor or marker back. Editors (`CellEditor.js`) come from the type (`getEditorKind`); `createEditSpecs` compiles `editable.when`, `validate` and `required` per column.
- **Table saves through awaited events.** `onCellEdit` / `onRowMove` run while an overlay shows the change (cell overlay keyed `rowKey + columnKey`, move overlay for the order) with a saving marker. `getEventError` reads the `triggerEvent` result (`success: false` -> the inner error's message): failure reverts and shows an error marker; success keeps the overlay until the row (cell) or `data` (move) changes. `data` is never written. A dev warning fires once when a table allows edits or moves without the event.
- **TableInput's changeset.** `{ updated: { [rowKey]: { [field]: value } }, added: [{ rowKey, ...row }], removed: [rowKey], moved?, order? }`. `useRows` shows `data` with the changeset applied (`applyChanges`; touched rows only get new identity). Edits, adds, deletes, moves and pastes are pure changeset functions, each written with one `setValue` (`writeChanges`), with an undo stack of changeset snapshots (limit 100). New row keys come from `crypto.randomUUID` (with a fallback for insecure origins).
- **Row moves** (`rowDrag`, both blocks): a drop gap on the page (`api.rows`) maps to a gap in `api.dataRows` (`getDataGap`), so with pagination the indices, neighbours, key order and positions cover every page, and an added row's position follows the last data row. `computeRowMove` gives the neighbours, key order and, with `positionField`, one fractional position (midpoint, ends -/+ 1024, renumber in steps of 1024 below a 1e-6 gap). Moves are blocked while sorted by anything but the position field ascending, filtered, grouped, in a tree or in server mode.
- **Clipboard**: Cmd/Ctrl+C copies the selected rows or the focused cell as TSV of displayed text; TableInput plans a paste by row key (`planPaste`: coercion per type, skipped cells reported, never adds rows).

## Performance rules

The D10 rules the code follows, and what to keep when changing it:

1. Native scroll, one scroll container, one sizer. Scroll handling is passive and rAF-coalesced; the scroll offset never enters React state above `Grid`.
2. Rows and columns are both virtualised (`virtual: auto`: rows above 200, columns above 20 or wider than 2x the viewport). Pinned columns are sticky, outside the column range.
3. Fixed row heights by default (density 32/40/52 or `rowHeight`). `wrap` or `ellipsis > 1` opts into measured heights (`useRowOffsets`, cached by measure key, dropped on layout change) and turns column virtualisation off. Detail rows are always measured.
4. Tiered cells: tier 0 is static DOM from the shared renderers; `buttons` with `showOn: hover` mount only on the hovered row or the row with keyboard focus, and during a fast scroll rich cells (`lazyCellTypes.js`) render their text and upgrade when scrolling settles (`api.cellActivity`, fed by `features/lazyCells`).
5. Rows memoise on row key and row object; column definitions compile once per config (`useStableConfig` compares config by content, not identity).
6. Resizes and drags write CSS variables, never React state, until the gesture ends.
7. Heavy stages (text sort keys, the first filter over many rows) run in time slices; sort, filter and group commit in transitions.
8. Every pipeline hook returns its input when it has nothing to change.

### The bench suite

`pnpm --filter=@lowdefy/blocks-table bench` builds the package, measures the lazy chunk (vite build with React, antd and `@lowdefy/*` external) and each block's page cost with the shared column core and the template compiler counted (Table and TableLight; the compiler must stay on demand), runs the Playwright suite in `bench/tests/` against a Vite app (`bench/app/`, seeded synthetic 100k x 50 data with the real shared cell renderers) on port `LOWDEFY_BENCH_PORT` (default 3116), and writes `bench/results/report.{json,md}` with each D10 budget next to the measured value.

| Test                                     | Measures                                                                                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `scroll-fps`                             | frame times (p50/p95/p99), long tasks, commits and DOM nodes for slow, fast, horizontal and programmatic scrolls, at 1x and 4x CPU throttle |
| `sort-100k`, `filter-100k`, `group-100k` | main-thread blocking, INP and click-to-paint for number and text sorts, filters and grouping                                                |
| `initial-render`                         | render + commit time, nodes and heap for 1000x10, 10k x 20 and 100k x 50                                                                    |
| `resize-drag`                            | frame rate and body renders during a column resize (budget: zero)                                                                           |
| `row-update`                             | one row of 100k updated: time and rows re-rendered (budget: exactly one)                                                                    |
| `memory-leak`                            | heap growth over 60 s of scrolling with forced GC (budget: under 5%)                                                                        |
| `server-scroll`                          | server mode with a mocked 50 ms fetch: frame times during fast scrolls over skeleton rows, and the share of frames with skeletons on screen |

`bench/RESULTS.md` records the latest run and the before/after of each optimisation. The suite is not in CI: numbers are machine-dependent (run on an idle machine, compare runs side by side).

## Testing

- **Unit tests** (`pnpm --filter=@lowdefy/blocks-table test`): the pure functions of each feature, co-located as `*.test.js` (sort keys, filter preparation, group trees and flattening, tree indexing, block cache and server store, view compaction and dirtiness, persist encoding, row moves, changeset functions, undo, paste planning, quick filters, header menu collection). The shared core's tests live in `blocks-antd/src/table/*.test.js`.
- **E2E** (`pnpm --filter=@lowdefy/blocks-table e2e`): Playwright over the pages in `src/blocks/*/tests/*.e2e.yaml`, one spec per page, using the helpers exported from `@lowdefy/blocks-table/e2e` (`do.sort`, `do.selectRow`, `expect.rowCount`, `expect.sorted`, ...). `server.e2e.yaml` answers the server request in the browser with `page.route` (counts requests, delays and reorders responses); `server-mongodb.e2e.spec.js` runs only with `LOWDEFY_SECRET_TABLE_MONGODB_URI` set. The e2e pages are the best worked examples of each feature. Specs open their page with `e2e/openTablePage.js`, which waits until the tables' code has replaced the fallback (the fallback renders the table's header and skeleton rows); `loading.e2e.spec.js` drives the loading states with held responses and Playwright's clock.
- Block rendering has no Jest tests (block tests are disabled repo-wide).

## Known gaps

- Expandable rows render HTML (`expandable.template`) only; Lowdefy blocks in detail rows need engine support.
- Server trees and lazy children in server mode are not supported; trees are client mode.
- `TableInput` has no slots (no toolbar, bulk action or empty slot blocks); it is an `input`, not an `input-container`.
- `rowLink` rows are not anchors, so hovering does not show the URL.
- Sorted tables re-sort fully on a data change.
- No build-time validation beyond the JSON schema: duplicate column keys, unknown condition operators, bad `within` values and a missing `data.request` are runtime errors.

## User-written columns

Formula templates and AI prompts are user content: the shared column core fills their `{{ column }}` placeholders as plain text (`renderPlaceholders`), never with nunjucks, which can run code; `findTemplateProblem` refuses tags, comments and expressions (in `normalizeColumnKind`, and in the picker's `validateDraft`). A user-defined column (`userDefined: true`) whose config fails normalisation or linking becomes an error column (`invalidateColumn`: `invalid` holds the reason, the kind's keys go, so it never runs or is read as an input); the enrichment feature renders its cells as "Invalid column: <reason>", marks its header (`data-lf-invalid`) and offers Edit column and Delete column. Declared columns still throw. A user-defined column is one user's content rendered in every viewer's browser, so `normalizeUserLeaf` keeps only `USER_COLUMN_KEYS` (identity, layout, feature flags and the kind keys; a `{ field }` tooltip) and drops `cell`, `rules`, `validate` and template tooltips, ignores `defaultColumn.type`, and makes any type outside `USER_COLUMN_TYPES` (`userColumnTypes.js`: text-safe types only, no `html`, `image`, `avatar`, `people`, `link`, `relation` or actions) an error column. The picker offers the same list. `normalizeColumns` takes `providerIds` (the Table's catalogue) so an unknown provider is caught with the columns.
