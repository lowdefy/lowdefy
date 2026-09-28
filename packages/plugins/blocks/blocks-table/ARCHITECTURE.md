# blocks-table architecture

`Table` is an input block whose value is its UI state, `{ view, selected, expanded }` (design D2, D6). This note is for whoever adds the next feature module. Design: `lowdefy-design/designs/table/design.md`. Benchmarks: `bench/RESULTS.md`.

## Layers

```
blocks/Table/Table.js         createLazyBlock wrapper: meta, size-stable fallback, method proxies
blocks/Table/Table.lazy.js    the implementation chunk (TanStack Table + Virtual + everything below)
core/TableRoot.js             config, data, table state, TanStack instance, block-level feature hooks
core/Grid.js                  the window component: layout, scroll-driven state, grid-level hooks, DOM
core/Body.js, Row.js, Cell.js rows of the current range, memoised by row key and row object
core/HeaderRow.js             header group rows (GroupHeaderRow) and the leaf header row
core/SummaryRow.js            the sticky summary footer (aggregates from core/useSummary.js)
features/<name>/              feature modules, composed through features/index.js
```

Scrolling renders `Grid` and never `TableRoot`, so the engine and the block's own props are untouched by scroll (D10.2).

## State and value

- One React state object (`useTableState`) holds every slice: TanStack's (`sorting`, `columnSizing`, `columnOrder`, `columnPinning`, `columnVisibility`, `rowSelection`), feature-owned non-TanStack slices (`selectionMode`), and the core's (`density`, `viewPassthrough`, `expanded`). TanStack is controlled with it (`state` plus generated `on<Slice>Change` handlers), so TanStack APIs such as `column.toggleSorting` and `row.toggleSelected` go through the same path.
- A change goes through `api.updateSlice(name, updater, { cause })`. It records a pending cause; after the change commits, the value is derived (`deriveValue`) and written once with `methods.setValue`, then `onChange { value, cause }` and each feature's `onCommit` fire. Drags and scroll never call it until the gesture ends.
- A slice with `transition: true` (sorting) updates inside `startTransition`: the click paints at once and the table is dimmed (`data-pending`) until the new order lands.
- A value changed from outside (SetState, Reset) re-initialises the state. SetState on a path mutates the object the table wrote, so the comparison is JSON for `view` and identity for `selected` / `expanded` (`getValueSignature`). A null value (mount, Reset) is filled with the resolved default value, without `onChange`.
- Resolution rules (`createInitialState`, `resolveViewColumns`, `pickViewPart`): each top-level view part falls back value → `defaultView` → column defaults. Unknown view column keys are dropped. Declared columns missing from a stored `view.columns` are appended hidden; `defaultView.columns` entries merge over the column defaults and unlisted columns keep their defaults. A derived view leaves `columns` out while it still equals the configured layout, so columns added to config (or loaded from a request) keep showing up until the user changes the layout.

## Data path

`properties.data` → `stabilizeData` (diff by row key, positional fast path, `rowVersionField` or structural compare; unchanged rows keep their object identity) → TanStack with `createStableCoreRowModel` (reuses `Row` instances; one changed row patches one row) → `createIndexSortedRowModel` (typed `Float64Array` keys per column, index sort, keys cached per rows array; big text columns build their keys in time slices before the sort applies) → `table.getRowModel().rows` (`api.viewRows`, every page) → the pagination feature's `rowRange` slice (`api.rows`, what the grid shows). Rows re-render only when their row object, display index, selection, active column or the visible column list changes.

Sort keys come from the shared core: `createSortKeyGetter({ column })` gives each value's typed key once per distinct value, and text keys are ranked with `compareSortKeys`, the comparison `createComparator` itself uses. The index sort therefore orders rows exactly as `createComparator({ column, desc })` (and TableLight) does, empty values last in both directions; `features/sorting/buildSortKeys.test.js` checks this for every type family.

## Layout contract

`computeLayout` returns the visual column order (`start` = leading columns + start-pinned, `center`, `end`) with widths, sticky offsets, centre prefix offsets, and CSS variables on the root: `--lf-w<n>` (width of layout column `n`), `--lf-l<n>` / `--lf-r<n>` (sticky offsets), `--lf-total`, `--lf-center-w`; the scroller carries `--lf-center-before` (the column-virtualisation spacer). Cells use the column's shared `style` object. `api.previewLayout({ widths })` recomputes and writes the variables without rendering: use it for any drag.

## Feature module

A module is a plain object exported from `features/<name>/<name>Feature.js` and listed in `features/index.js`. Order matters: it is the order of handlers and hooks. Every field is optional.

| Field                               | Shape                                                                                           | Used for                                                                                                                                                                                                                       |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `name`                              | string                                                                                          | keys, debugging                                                                                                                                                                                                                |
| `tableFeatures`                     | object of TanStack slots                                                                        | merged once into the stable feature set (`core/tableFeatures.js`), e.g. `{ columnFilteringFeature, filteredRowModel: createFilteredRowModel() }`                                                                               |
| `slices`                            | `{ [slice]: { init(args), cause, transition?, normalize?({ next, api }) } }`                    | state the module owns; `init` receives `{ value, defaultView, config, viewColumns, rows, getKey }` and resolves the slice from the value                                                                                       |
| `viewKeys`                          | string[]                                                                                        | view keys the module owns; the rest of the view passes through unchanged                                                                                                                                                       |
| `toValue({ state, api })`           | `{ view?: {...}, [valueKey]: ... }`                                                             | the module's part of the block value                                                                                                                                                                                           |
| `toViewColumn({ key, state, api })` | partial `{ width, pinned, hidden }`                                                             | decorates each `view.columns` entry                                                                                                                                                                                            |
| `tableOptions({ config })`          | object                                                                                          | TanStack options derived from config (memoised on config)                                                                                                                                                                      |
| `actions`                           | `{ name: (api) => fn }`                                                                         | functions other modules call through `api.actions` (`toggleSort`, `toggleRowSelected`, `activateRow`, ...)                                                                                                                     |
| `methods`                           | `{ name: (api) => fn }`                                                                         | block methods, registered with `methods.registerMethod`; also declare them in `meta.methods` (the lazy wrapper proxies declared methods)                                                                                       |
| `gridHandlers`                      | `{ click \| dblclick \| auxclick \| pointerdown \| keydown \| focus: (event, api) => boolean }` | the one delegated listener per event type on the root (D5); return `true` to stop the chain                                                                                                                                    |
| `headerParts`                       | components `({ api, col, state })`                                                              | rendered in every data header cell after the title                                                                                                                                                                             |
| `headerCellProps({ col, state })`   | attribute object                                                                                | extra attributes on data header cells (e.g. `aria-sort`)                                                                                                                                                                       |
| `onCommit({ cause, value, api })`   | function                                                                                        | runs after a value write (e.g. `onSelectionChange`)                                                                                                                                                                            |
| `useFeature(ctx)`                   | hook → fragment                                                                                 | block-level; `ctx = { api, config, data, state, table }`; fragment keys: `leadingColumns`, `regions: { top, bottom }`                                                                                                          |
| `useGridFeature(ctx)`               | hook → object merged into the grid context                                                      | grid-level (re-runs on scroll); `ctx = { api, config, headerHeight, layout, rowHeight, rows, scrollerRef, state, strategy, viewport }` plus earlier modules' results (`range` from virtualisation, `activeCell` from keyboard) |

`api` (`core/createApi.js`) is one stable object per table, refreshed every render: `table`, `config`, `state`, `layout`, `rows`, `rowHeight`, `headerHeight`, `rootRef`, `scrollerRef`, `methods`, `components`, `updateSlice`, `setSliceSilently`, `previewLayout`, `actions`, `keyboard`, `suppressClick()` / `takeSuppressedClick()` (a drag that ends on a header must not also sort).

Rows are fixed height (the density, or `rowHeight`) unless a visible column wraps or clamps to more than one line: then `useMeasuredRows` keeps measured heights by row key, `computeWindow` binary-searches the row offsets, rows that grow above the viewport shift the scroll position by the same amount, and column virtualisation is off (D10.1).

DOM contract for handlers: body rows carry `data-row-key` (TanStack row id = `String(rowKey)`) and `data-row-index` (display index; the header row is `-1`); cells carry `data-lf-cell`, `data-col-key`, `data-col-index` (layout index) and the class `lf-table-gridcell`; header cells `data-lf-header`; header group cells `data-group` (no `data-lf-cell`, so keyboard navigation skips them); special columns `data-special`. Body rows carry `lf-table-row`, the class the shared cell CSS reveals `showOn: hover` buttons from (a row element holds its pinned cells too, so CSS hover covers the whole row and no `data-row-hover` tracking is needed).

## Adding the planned modules

- **headerMenu**: `headerParts` (menu button, lazy antd `Dropdown` mounted on open), `actions.openHeaderMenu`, a `gridHandlers.click` placed before sorting's (return `true` for the button), and `pin`/`hide`/`sort` through `api.updateSlice('columnPinning' | 'columnVisibility' | 'sorting', ...)`.
- **filtering**: `tableFeatures: { columnFilteringFeature, globalFilteringFeature, filteredRowModel }` where the row model compiles `view.filter` once with `@lowdefy/blocks-antd/table/compileCondition.js` (with `config.user`); slices for the condition and search; `viewKeys: ['filter', 'search']`; `toValue` writes them back; a `headerCellProps` flag for the active-filter icon.
- **toolbar**: `useFeature` returning `regions.top`; `viewKeys: ['density', ...]` only if it takes density over from the core (then move `density` out of `claimedViewKeys`).
- **views** (`persist`, saved views): a `useFeature` effect that reads/writes `api.state` through `deriveValue` / `updateSlice`, and events `onViewSave`/`onViewSelect`; `api.updateSlice` for each slice when a view loads.
- **grouping**: TanStack grouping + `groupedRowModel`/`expandedRowModel` slots, slices `grouping` and `expanded` (take `expanded` from the core), `viewKeys: ['group', 'collapsedGroups', 'aggregates']`. Body needs one core change: rendering a group-header item for grouped rows (the flat row list already feeds the window), plus a single sticky group-header overlay (D10.8).
- **serverData**: `tableOptions({ config })` with `manualSorting`/`manualFiltering` when `data.mode` is `server`; the core's data source (`TableRoot`: `properties.data` → `stabilizeData`) and `aria-rowcount` need a hook for the block cache and the server total.
- **editing**: editors mount in cells (tier 1, on focus); `gridHandlers.keydown` for Enter/Escape before keyboard's; `onCellEdit` through `api.methods.triggerEvent`.

## Shared column core

Columns, cells, conditions and exports come from `@lowdefy/blocks-antd/table/<file>.js`, the core TableLight renders with, so a TableLight config means the same thing on Table (TableLight is a strict subset of Table's properties):

- `useTableConfig` runs `normalizeColumns` (string or object columns, header tree) and `compileColumns({ columns, columnsByKey, user })` once per config; `rowRules` compile with `compileRules`. `user` is the block property the app sets with `_user`, so `$user` works in client-side conditions.
- `Cell` renders `renderCell({ column, row, rowKey, methods, components, onEvent })` inside its grid cell. Renderers build full event payloads (buttons, menus, `onCellLink`) and `api.onCellEvent` passes them to `methods.triggerEvent` unchanged.
- Row events use the shared `isControlTarget` (with the row as container) and `resolveLink`; `rowLink` navigates with `getHtmlEnhancements().link(...)`, the client's registered Link function, as TableLight does. With `onRowClick` defined, a plain click runs it and only a modified click follows the link.
- Export uses `getExportValue` and `htmlToText`; the summary footer uses `computeAggregate` and `getAggregateText`.
- Rich cell types (`core/lazyCellTypes.js`) render through `core/LazyCell.js`: cells that come into view during a fast scroll show their text (`getCellText`) in the cell layout and upgrade when the scroll settles; `buttons` with `showOn: hover` mount only on the hovered or focused row. `api.cellActivity` (`core/createCellActivity.js`) holds the hovered row, focused row and fast-scroll flag, fed by `features/lazyCells`.
- The engine's own grid-cell class is `lf-table-gridcell` (the shared core owns `lf-table-cell`, `lf-table-empty` and `lf-table-progress`).

## Not done yet

- `empty` area: input blocks receive no slots (`client/src/block/CategorySwitch.js` renders `input` blocks without `content`); supporting it means the `input-container` category or a slot mechanism for input blocks. `emptyText` covers the common case.
- Hovering a row with `rowLink` does not show the URL (rows are not anchors).
- Sorted tables re-sort fully on a data change (incremental re-sort comes with P3 transactions).
- Text sort keys are built in slices on the header click; a sort set through the value or `defaultView` builds them synchronously in the render.
- Pagination (`pagination: true`) keeps the page in local state, not in the value; `scrollToRow` only finds rows on the current page.
- `buttons` cells mount antd `Button`s (the shared renderer, as in TableLight). D4's static token-styled form for always-visible buttons is not built; the fast-scroll placeholder stands in for it.
