# blocks-table architecture

`Table` is an input block whose value is its UI state, `{ view, selected, expanded }` (design D2, D6). This note is for whoever adds the next feature module. Design: `lowdefy-design/designs/table/design.md`. Benchmarks: `bench/RESULTS.md`.

## Layers

```
blocks/Table/Table.js         createLazyBlock wrapper: meta, size-stable fallback, method proxies
blocks/Table/Table.lazy.js    the implementation chunk (TanStack Table + Virtual + everything below)
core/TableRoot.js             config, data, table state, TanStack instance, block-level feature hooks
core/Grid.js                  the window component: layout, scroll-driven state, grid-level hooks, DOM
core/Body.js, Row.js, Cell.js rows of the current range, memoised by row key and row object
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

`properties.data` → `stabilizeData` (diff by row key, positional fast path, `rowVersionField` or structural compare; unchanged rows keep their object identity) → TanStack with `createStableCoreRowModel` (reuses `Row` instances; one changed row patches one row) → `createIndexSortedRowModel` (typed `Float64Array` keys per column, index sort, keys cached per rows array; big text columns build their keys in time slices before the sort applies) → `table.getRowModel().rows`. Rows re-render only when their row object, display index, selection, active column or the visible column list changes.

## Layout contract

`computeLayout` returns the visual column order (`start` = leading columns + start-pinned, `center`, `end`) with widths, sticky offsets, centre prefix offsets, and CSS variables on the root: `--lf-w<n>` (width of layout column `n`), `--lf-l<n>` / `--lf-r<n>` (sticky offsets), `--lf-total`, `--lf-center-w`; the scroller carries `--lf-center-before` (the column-virtualisation spacer). Cells use the column's shared `style` object. `api.previewLayout({ widths })` recomputes and writes the variables without rendering: use it for any drag.

## Feature module

A module is a plain object exported from `features/<name>/<name>Feature.js` and listed in `features/index.js`. Order matters: it is the order of handlers and hooks. Every field is optional.

| Field                               | Shape                                                                                           | Used for                                                                                                                                                                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`                              | string                                                                                          | keys, debugging                                                                                                                                                                                                                         |
| `tableFeatures`                     | object of TanStack slots                                                                        | merged once into the stable feature set (`core/tableFeatures.js`), e.g. `{ columnFilteringFeature, filteredRowModel: createFilteredRowModel() }`                                                                                        |
| `slices`                            | `{ [slice]: { init(args), cause, transition?, normalize?({ next, api }) } }`                    | state the module owns; `init` receives `{ value, defaultView, config, viewColumns, rows, getKey }` and resolves the slice from the value                                                                                                |
| `viewKeys`                          | string[]                                                                                        | view keys the module owns; the rest of the view passes through unchanged                                                                                                                                                                |
| `toValue({ state, api })`           | `{ view?: {...}, [valueKey]: ... }`                                                             | the module's part of the block value                                                                                                                                                                                                    |
| `toViewColumn({ key, state, api })` | partial `{ width, pinned, hidden }`                                                             | decorates each `view.columns` entry                                                                                                                                                                                                     |
| `tableOptions({ config })`          | object                                                                                          | TanStack options derived from config (memoised on config)                                                                                                                                                                               |
| `actions`                           | `{ name: (api) => fn }`                                                                         | functions other modules call through `api.actions` (`toggleSort`, `toggleRowSelected`, `activateRow`, ...)                                                                                                                              |
| `methods`                           | `{ name: (api) => fn }`                                                                         | block methods, registered with `methods.registerMethod`; also declare them in `meta.methods` (the lazy wrapper proxies declared methods)                                                                                                |
| `gridHandlers`                      | `{ click \| dblclick \| auxclick \| pointerdown \| keydown \| focus: (event, api) => boolean }` | the one delegated listener per event type on the root (D5); return `true` to stop the chain                                                                                                                                             |
| `headerParts`                       | components `({ api, col, state })`                                                              | rendered in every data header cell after the title                                                                                                                                                                                      |
| `headerCellProps({ col, state })`   | attribute object                                                                                | extra attributes on data header cells (e.g. `aria-sort`)                                                                                                                                                                                |
| `onCommit({ cause, value, api })`   | function                                                                                        | runs after a value write (e.g. `onSelectionChange`)                                                                                                                                                                                     |
| `useData(ctx)`                      | hook → rows                                                                                     | runs before TanStack, in registry order; `ctx = { api, config, data, input, properties }`; returns the rows the table shows (return `data` itself when there is nothing to add). Editing lays its overlays / changeset over `data` here |
| `useFeature(ctx)`                   | hook → fragment                                                                                 | block-level; `ctx = { api, config, data, state, table }`; fragment keys: `leadingColumns`, `regions: { top, bottom }`                                                                                                                   |
| `useGridFeature(ctx)`               | hook → object merged into the grid context                                                      | grid-level (re-runs on scroll); `ctx = { api, config, headerHeight, layout, rowHeight, rows, scrollerRef, state, strategy, viewport }` plus earlier modules' results (`range` from virtualisation, `activeCell` from keyboard)          |

`api` (`core/createApi.js`) is one stable object per table, refreshed every render: `table`, `config`, `state`, `layout`, `rows`, `rowHeight`, `headerHeight`, `rootRef`, `scrollerRef`, `methods`, `components`, `updateSlice`, `setSliceSilently`, `previewLayout`, `actions`, `keyboard`, `suppressClick()` / `takeSuppressedClick()` (a drag that ends on a header must not also sort).

DOM contract for handlers: body rows carry `data-row-key` (TanStack row id = `String(rowKey)`) and `data-row-index` (display index; the header row is `-1`); cells carry `data-lf-cell`, `data-col-key`, `data-col-index` (layout index); header cells `data-lf-header`; special columns `data-special`.

## Adding the planned modules

- **headerMenu**: `headerParts` (menu button, lazy antd `Dropdown` mounted on open), `actions.openHeaderMenu`, a `gridHandlers.click` placed before sorting's (return `true` for the button), and `pin`/`hide`/`sort` through `api.updateSlice('columnPinning' | 'columnVisibility' | 'sorting', ...)`.
- **filtering**: `tableFeatures: { columnFilteringFeature, globalFilteringFeature, filteredRowModel }` where the row model compiles `view.filter` once with `core/compileCondition.js`; slices for the condition and search; `viewKeys: ['filter', 'search']`; `toValue` writes them back; a `headerCellProps` flag for the active-filter icon.
- **toolbar**: `useFeature` returning `regions.top`; `viewKeys: ['density', ...]` only if it takes density over from the core (then move `density` out of `claimedViewKeys`).
- **views** (`persist`, saved views): a `useFeature` effect that reads/writes `api.state` through `deriveValue` / `updateSlice`, and events `onViewSave`/`onViewSelect`; `api.updateSlice` for each slice when a view loads.
- **grouping**: TanStack grouping + `groupedRowModel`/`expandedRowModel` slots, slices `grouping` and `expanded` (take `expanded` from the core), `viewKeys: ['group', 'collapsedGroups', 'aggregates']`. Body needs one core change: rendering a group-header item for grouped rows (the flat row list already feeds the window), plus a single sticky group-header overlay (D10.8).
- **serverData**: `tableOptions({ config })` with `manualSorting`/`manualFiltering` when `data.mode` is `server`; the core's data source (`TableRoot`: `properties.data` → `stabilizeData`) and `aria-rowcount` need a hook for the block cache and the server total.

## Shared column core

`core/normalizeColumns.js`, `getCellRenderer.js`, `createComparator.js`, `compileCondition.js` and `getExportValue.js` are the integration points for `@lowdefy/blocks-antd/table/`. They hold minimal local stand-ins (text cells, a basic comparator) and will re-export the shared implementations. Renderer contract: `CellRenderer({ value, row, rowKey, column, methods, components, onEvent })`; `onEvent({ name, event })` fires a block event with `{ row, rowKey }` added.

## Editing, TableInput and clipboard

- **Editing** (`features/editing/`, before selection/keyboard/events in the registry). Cells stay tier 0 and know nothing about editing: one `EditingLayer` (rendered in `regions.bottom`) portals the single open editor and the status markers into the rendered cell elements, found by row key and column key; `useGridFeature` re-syncs them after every grid render, so a cell that scrolls back in gets its editor or marker again. Editors (`CellEditor.js`, lazy chunk) come from the column type; per-column edit specs (`createEditSpecs`) compile `editable: { when }`, `validate` and `required` with the shared `compileCondition` and read `required` / `default` from the raw column config.
- **Table saves through events**: `onCellEdit` and `onRowMove` are awaited. The change shows at once as an overlay over `data` (cell overlay keyed `rowKey + columnKey`, move overlay for the order), marked saving; `getEventError` reads the result (`success: false` → `error.error.message`); success keeps the overlay until the row (cell) or `data` (move) changes, failure reverts and shows an error marker with the message. `data` is never written.
- **TableInput** (`blocks/TableInput/`) is `TableRoot` with an `input = { changes, methods }` prop. Its block value is a changeset over `data` — `{ updated: { [rowKey]: { [field]: value } }, added: [{ rowKey, ...row }], removed: [rowKey], moved?, order? }` — never the rows, so large tables keep a small Lowdefy state. `useData` shows `data` with the changeset applied (`applyChanges`, touched rows only get new identity); edits, adds, deletes, moves and pastes are pure changeset functions written with one `setValue` each (`writeChanges`), with a bounded undo stack of changeset snapshots. Its UI state (view, selection) is React state inside `TableInputRoot`.
- **Row moves** (`rowDrag`, both blocks): `computeRowMove` gives the neighbours, the key order and, with `positionField`, one fractional position (midpoint, ends ∓1024, renumber in steps of 1024 below a 1e-6 gap). Moves are blocked (with the reason as the handle's tooltip) while sorted by anything but the position field ascending, filtered or grouped.
- **Clipboard** (`features/clipboard/`): Ctrl/Cmd+C copies the selected rows or the focused cell as TSV of displayed text (`getExportValue` formatted); TableInput reads Ctrl/Cmd+V from the `paste` event on the root and plans the paste by row key (`planPaste`: coercion per type, skipped cells reported).
- Inline validation is the table's own: Lowdefy block validation (`validate` / `required` on the block) runs engine-side on the value with operators, and blocks cannot report validation errors to it. A TableInput form can validate its changes with operators on the value; cells failing `validate` / `required` are marked in the table.

## Not done yet

- `empty` area: input blocks receive no slots (`client/src/block/CategorySwitch.js` renders `input` blocks without `content`); supporting it means the `input-container` category or a slot mechanism for input blocks. `emptyText` covers the common case.
- Header groups (`children`) normalise but render as leaf headers only.
- Hovering a row with `rowLink` does not show the URL (rows are not anchors).
- Sorted tables re-sort fully on a data change (incremental re-sort comes with P3 transactions).
- Text sort keys are built in slices on the header click; a sort set through the value or `defaultView` builds them synchronously in the render.
