# @lowdefy/blocks-aggrid

[AG Grid](https://www.ag-grid.com/documentation/) integration for Lowdefy. Provides a high-performance data grid (virtual scrolling, sort/filter/group, row selection) with a built-in cell renderer system that renders Lowdefy-styled tags, links, buttons, etc. inline in cells.

## Theme Blocks

Each theme is a separate block backed by the same internal `AgGrid` component plus a different ag-grid theme stylesheet:

| Block            | ag-grid theme       | Stylesheet                                    |
| ---------------- | ------------------- | --------------------------------------------- |
| `AgGridAlpine`   | `ag-theme-alpine`   | `@ag-grid-community/styles/ag-theme-alpine`   |
| `AgGridMaterial` | `ag-theme-material` | `@ag-grid-community/styles/ag-theme-material` |
| `AgGridBalham`   | `ag-theme-balham`   | `@ag-grid-community/styles/ag-theme-balham`   |

All three accept the same properties and events. The theme blocks are thin wrappers (`src/blocks/AgGrid{Alpine,Material,Balham}/`) that:

1. Apply the ag-grid theme class plus the antd cell-styling class (`ag-grid-antd.module.css`).
2. Forward block props (`components`, `events`, `loading`, `methods`, `properties`) to the inner `AgGrid` React component.

> **Important — `components` forwarding.** The theme block must forward `components` to the inner `AgGrid`. This is how `components.Icon` reaches cell renderers (e.g. icons inside buttons-cell). See [Components plumbing](#components-plumbing) below.

## Block Defaults

`AgGrid.js` destructures these from `properties` with sensible defaults:

| Property            | Default | Notes                                                                                    |
| ------------------- | ------- | ---------------------------------------------------------------------------------------- |
| `suppressCellFocus` | `true`  | Removes ag-grid's keyboard focus outline that visually competes with built-in renderers. |

All other ag-grid props pass through unchanged via `{...someProperties}`. Users can override the default by setting `suppressCellFocus: false` on the block.

## Basic Usage

```yaml
- id: dataGrid
  type: AgGridAlpine
  properties:
    rowData:
      _request: getData
    columnDefs:
      - field: name
        headerName: Name
        sortable: true
        filter: true
      - field: status
        headerName: Status
        cell:
          type: tag
          colorMap:
            Active: green
            Locked: red
```

## Built-in Cell Renderers (`cell.type`)

Define `cell` on a column to opt into a Lowdefy-managed renderer. The build registry lives in `src/cellRenderers/index.js`:

| `cell.type` | Renders                          | Triggers       |
| ----------- | -------------------------------- | -------------- |
| `tag`       | antd `Tag` with color mapping    | —              |
| `avatar`    | antd `Avatar` (initials/image)   | `onCellLink` * |
| `link`      | `<a>` with row-data-substituted href | `onCellLink` |
| `date`      | dayjs-formatted date             | —              |
| `boolean`   | true/false labels with colors    | —              |
| `progress`  | progress bar with thresholds     | —              |
| `number`    | `Intl.NumberFormat` (currency, percent, etc.) | — |
| `buttons`   | list of antd `Button`s, one event per button  | per-button `eventName:` |

\* Avatar emits `onCellLink` only when given a `link` config.

### Pattern

`processColDefs.js` reads each column's `cell.type`, looks up the renderer in `CELL_RENDERERS`, and wraps it as an ag-grid `cellRenderer` adapter that injects `cellConfig`, `methods`, and `components`:

```js
function buildCellRenderer({ cell, methods, components }) {
  const Renderer = getCellRenderer(cell?.type);
  if (!Renderer) return undefined;
  return function CellRendererAdapter(params) {
    return Renderer({ ...params, cellConfig: cell, methods, components });
  };
}
```

Each renderer receives `{ value, data, cellConfig, methods, components }` from the adapter. Use `resolvePath(cellConfig.someField, data)` (from `cellRenderers/resolveFieldRefs.js`) to read row-data paths declared as `*Field` properties on the cell config.

### `cell.type: buttons` — list of buttons per row

Renders a `<Space>` of antd `Button`s per cell. **Each button declares its own `eventName:`**, which becomes the block-level event fired on click. This means each button has an independent action chain configured under the AgGrid block's `events:` — no `_if` dispatching.

```yaml
- field: actions
  cell:
    type: buttons
    buttons:
      - eventName: onEditClick       # required — block-level event name
        title: Edit                  # OR titleField: <row-data path>
        icon: AiOutlineEdit          # OR iconField; antd react-icon name OR Icon block config
        type: primary
      - eventName: onDeleteClick
        title: Delete
        icon: AiOutlineDelete
        danger: true
        disabledField: locked        # row-data path → boolean
        hiddenField: archived        # row-data path → boolean
events:
  onEditClick:
    - id: edit
      type: SetState
      params:
        editingId: { _event: row.id }
  onDeleteClick:
    - id: delete
      type: DisplayMessage
      params:
        content:
          _string.concat:
            - 'Delete '
            - { _event: row.name }
```

Per-button properties **mirror the antd `Button` block schema** (`title`, `icon`, `type`, `variant`, `color`, `size`, `shape`, `danger`, `ghost`, `hideTitle`, `disabled`) so users get a familiar API. Cell-renderer-specific additions:

- `eventName` (required) — block-level event name to fire.
- `*Field` variants — `titleField`, `iconField`, `disabledField`, `hiddenField` resolve from row data, mirroring the convention used by `link`/`avatar` cells (`labelField`, `nameField`, etc.).
- `hidden` / `hiddenField` — hides the button entirely (no Button-block equivalent; useful per-row).
- Default `size: 'small'` (Button block defaults to `'default'`) — appropriate for cell density.

**Click bubbling.** `ButtonsCell` calls `e.stopPropagation()` so a button click does not also fire `onCellClick` / `onRowClick`. Without this, a button click would trigger every row/cell event handler the grid has wired up.

**Event payload.**

```js
{ row: data, value, button: { eventName, title }, buttonIndex }
```

Only the resolved view of the button (`eventName`, `title`) is included — not the full schema entry — to avoid leaking schema keys into action chains. Action chains read row data via `_event: row.<field>`.

## Components Plumbing

Cell renderers need access to the framework's `Icon` component (the same one the standalone `Button` block uses) so that `icon: AiOutlineEdit` and full Icon-block config objects render consistently. The path:

```
LowdefyContext (initLowdefyContext.js in @lowdefy/client)
  components: { Icon, ShortcutBadge }
        │
        ▼ block prop (framework injects on every block)
AgGridAlpine / AgGridMaterial / AgGridBalham (theme block)
  ─ accepts `components` prop, forwards to <AgGrid>
        │
        ▼
AgGrid (src/AgGrid.js)
  ─ destructures `components`, passes to processColDefs(columnDefs, methods, components)
        │
        ▼
processColDefs (src/processColDefs.js)
  ─ buildCellRenderer({ cell, methods, components })
  ─ adapter spreads `components` into renderer params
        │
        ▼
ButtonsCell / future renderers
  ─ const Icon = components?.Icon
  ─ <Icon properties={iconConfig} />   (resolves react-icon name OR Icon block config)
```

Without this plumbing, `components.Icon` is `undefined` inside cell renderers and any icon prop renders nothing. `ButtonsCell` guards (`if (iconConfig && Icon)`) and falls back to label-only buttons rather than crashing — but the expected behavior is for icons to resolve.

> When adding a new theme block (`AgGrid<NewTheme>.js`), make sure to forward `components` to the inner `<AgGrid components={components} ... />`. Forgetting this is a silent failure mode — icons render as empty buttons.

## Events Catalogue

| Event                 | Triggered by                                         | Payload                                                                |
| --------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| `onRowClick`          | Click anywhere on a row (non-bubble-suppressed)      | `{ row, selected, rowIndex }`                                          |
| `onCellClick`         | Click anywhere in a cell                             | `{ cell: { column, value }, colId, row, rowIndex, selected }`          |
| `onRowSelected`       | Row checkbox / selection changes (selection only)    | `{ row, rowIndex, selected }`                                          |
| `onSelectionChanged`  | Multi-row selection set changed                      | `{ selected }`                                                         |
| `onFilterChanged`     | User changed any filter                              | `{ rows, filter }` (rows = currently displayed)                        |
| `onSortChanged`       | User changed sort                                    | `{ rows, sort }`                                                       |
| `onCellLink`          | Click on a `cell.type: link` (or avatar with `link`) | `{ link, row, value }` — wire to `Link` action with `params: { _event: link }` |
| user-defined          | Click on a `cell.type: buttons` button               | `{ row, value, button: { eventName, title }, buttonIndex }` — name is the button's `eventName:` string |

The buttons-cell entry intentionally lists "user-defined" because each button declares its own block-level event name. The meta files include a documentation-only `onCellButton` entry describing the payload shape.

## Cell Layout (`ag-grid-antd.module.css`)

The antd cell wrapper applies `display: flex`, `align-items: center`, `overflow: hidden`, `min-width: 0` so that flex-based cell content (icons + text, multiple buttons, progress bars) clips correctly inside the ag-grid cell rather than overflowing the column width. The `min-width: 0` is the canonical fix for flex children that would otherwise push the parent cell wider than its column.

## Registered Methods

`AgGrid.js` calls `methods.registerMethod` for these grid actions, callable via the `CallMethod` action:

| Method             | Purpose                                                 |
| ------------------ | ------------------------------------------------------- |
| `exportDataAsCsv`  | Export current rows to CSV                              |
| `sizeColumnsToFit` | Auto-size columns to fit grid width                     |
| `setFilterModel`   | Programmatically set filter model                       |
| `setQuickFilter`   | Set the quick-filter text                               |
| `autoSize`         | Auto-size columns by content (`{ skipHeader, colIds }`) |

## Design Decisions

### Why Separate Package?

AG Grid is large (~500KB). Separating it keeps the core bundle small; only apps that import an `AgGrid*` block pay the cost.

### Why Built-in Cell Renderers?

ag-grid's `cellRenderer` accepts a string (registered name) or React component. Cell content like tags, links, and buttons is common enough that asking users to write custom renderers per project is friction. The built-in renderers also ensure consistent antd theming inside cells — variables like `--ant-color-link` resolve to the Lowdefy theme.

### Why Per-Button Event Names (Buttons Cell)?

Three options were considered:
1. **One shared event with id-dispatch.** User writes `_if` ladders inside the action chain.
2. **Per-button `onClick:` action chains inline.** Buttons would carry their own action arrays.
3. **Per-button `eventName:` → block-level event lookup.** Chosen.

(3) wins because it matches how the standalone `Button` block works, keeps action chains discoverable in the block's top-level `events:` map, and allows reuse — multiple buttons (across multiple cells / rows / pages) can target the same event.

### Why Mirror Button Block Schema?

Users learning the buttons cell already know the standalone Button block. Reusing the same property names (`title`, `icon`, `type`, `variant`, `color`, `size`, `shape`, `danger`, `ghost`, `hideTitle`, `disabled`) means there's no second schema to memorize. The only added concept is the `eventName:` + `*Field` row-data resolvers.

### Why `stopPropagation` in Buttons Cell?

ag-grid's `onCellClicked` and `onRowClicked` fire on every click inside a cell. Without `stopPropagation`, clicking a button would also trigger any `onCellClick` / `onRowClick` chain configured on the grid — almost never the intended behavior. The cell renderer assumes the button's click is the user's intent and stops the event there.
