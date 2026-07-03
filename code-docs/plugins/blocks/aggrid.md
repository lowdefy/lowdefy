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
| `selector`  | antd `Select` (single) per row                 | `eventName:` on change  |
| `multipleSelector` | antd `Select` (multiple) per row        | `eventName:` on change  |
| `switch`    | antd `Switch` (boolean) per row                | `eventName:` on toggle  |
| `textInput` | antd `Input` per row                           | `eventName:` on blur / Enter |
| `paragraphInput` | antd `Typography.Paragraph` with inline edit | `eventName:` on edit confirm |

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

### `cell.type: selector` / `multipleSelector` — dropdown per row

Renders an antd `Select` inside each cell (single-select for `selector`, multi-select for `multipleSelector`). On change the cell fires the column's `eventName` as a block-level event — **event-only, like buttons**: it does not write to the Lowdefy block value. The displayed value is driven by the cell's row data, so **the app persists the change** by updating whatever feeds `rowData` (a `SetState` or `Request` in the event chain). The example below binds each row value to state and writes the new value back so the selection sticks.

For immediate feedback before an async persist completes, the cell also calls ag-grid's `node.setDataValue(colId, newValue)` so the new value shows at once. This is a transient client-side update to ag-grid's own row node, **not** the Lowdefy block value — if the app never persists, `AgGrid`'s row-data sync restores the value from `rowData` on the next render. The source of truth remains `properties.rowData`.

```yaml
properties:
  rowData:
    - id: r1
      name: Task one
      priority: { _state: { key: priorities.r1, default: high } }   # bound to state
  columnDefs:
    - { field: name }
    - field: priority
      cell:
        type: selector
        eventName: onPriorityChange     # block-level event fired on change
        options:
          - { label: Low, value: low, color: green }
          - { label: Medium, value: medium, color: orange }
          - { label: High, value: high, color: red }
    - field: labels
      cell:
        type: multipleSelector
        eventName: onLabelsChange
        options: [bug, feature, docs, urgent]
events:
  onPriorityChange:                     # persist: write newValue back into the bound state
    - id: save
      type: SetState
      params:
        priorities:
          _object.assign:
            - { _state: priorities }
            - _object.fromEntries:
                - [{ _event: row.id }, { _event: newValue }]
```

**Option handling reuses the `Selector` block.** `SelectorCell` imports the standalone block's pure utils — `getSelectorOptions` and `getSelectedIndex` from `@lowdefy/blocks-antd` (a declared dependency) — so `options` accepts the same shape (`primitives` or `{ label, value, disabled, color, filterString, style }`) and the same `valueKey` / `primaryKey` identity matching. The block's `useSelectorOptions` hook (imperative `setData` binding) is intentionally **not** used per cell; the cell calls the pure `getSelectorOptions` directly. Static options only — no per-row `optionsField`.

**Cell config keys:** `options`, `valueKey`, `primaryKey`, `eventName`, `placeholder`, `allowClear` (default `true`), `showSearch` (default `true`), `size` (default `small`), `disabled`.

**Click bubbling.** Like `ButtonsCell`, the `Select` is wrapped in a `div` with `onClick={e => e.stopPropagation()}` so opening the dropdown does not fire `onCellClick` / `onRowClick`. The dropdown uses `getPopupContainer={() => document.body}` so it is not clipped by the cell.

**Event payload.**

```js
{ row: data, value, newValue }   // value = previous cell value; newValue is an array for multipleSelector
```

### `cell.type: switch` / `textInput` / `paragraphInput` — input cells

The same event-only model as the selector cells: each renders an antd input bound to the row value, writes back into ag-grid's row node for immediate feedback, and fires the column's `eventName` with `{ row, value, newValue }`. The app persists by updating the data bound to `rowData`. **When** the event fires differs by control:

- `switch` — on every toggle (`newValue` is a boolean). Config: `checkedText`, `uncheckedText`, `checkedIcon`, `uncheckedIcon`, `color`, `size`, `disabled`.
- `textInput` — on blur / Enter, **not** per keystroke. Typing is held in local state so the cell does not re-render and lose focus mid-edit. Config: `placeholder`, `allowClear`, `maxLength`, `showCount`, `inputType` (HTML input type — named to avoid clashing with `cell.type`), `variant`/`bordered`, `size`, `disabled`.
- `paragraphInput` — `Typography.Paragraph` with inline editing; commits when the edit is confirmed (blur / Enter). Config: `editable` (false → read-only), `maxLength`, `autoSize`, `editTooltip`, `copyable`, `ellipsis`, and text styling (`code`, `strong`, `italic`, `underline`, `delete`, `mark`, `textType`).

```js
{ row: data, value, newValue }   // newValue: boolean (switch) | string (textInput / paragraphInput)
```

> `textInput`/`paragraphInput` commit once (on blur/confirm) rather than per keystroke — committing per keystroke would re-render the grid, remount the cell, and lose input focus.

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
| user-defined          | Change on a `cell.type: selector` / `multipleSelector` | `{ row, value, newValue }` — name is the cell's `eventName:` string (`newValue` is an array for `multipleSelector`) |

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
