## Choosing a grid

Four display blocks share one implementation and one property schema. They differ only in how they look:

| Block            | Look                                                                        |
| ---------------- | --------------------------------------------------------------------------- |
| `AgGridLowdefy`  | Themed from the app's antd design tokens. **Recommended for Lowdefy apps.** |
| `AgGridAlpine`   | AG Grid's Alpine theme, recoloured with the app's antd tokens.              |
| `AgGridBalham`   | AG Grid's Balham theme, recoloured with the app's antd tokens. Compact.     |
| `AgGridMaterial` | AG Grid's Material theme, recoloured with the app's antd tokens.            |

Each has an input counterpart that holds the table data as the block's value: `AgGridLowdefyInput`, `AgGridInputAlpine`, `AgGridInputBalham` and `AgGridInputMaterial`.

**To adopt `AgGridLowdefy`, change `type: AgGridBalham` to `type: AgGridLowdefy`.** Every property carries over unchanged, and the grid will deliberately look different afterwards — that is the point. It is a visual opt-in, so there is nothing to migrate and no codemod to run. The Balham, Alpine and Material blocks are kept indefinitely.

## Row density — the `size` property

`AgGridLowdefy` and `AgGridLowdefyInput` take a `size` property, mirroring antd Table:

| `size`             | Row and header height |
| ------------------ | --------------------- |
| `small`            | 36px                  |
| `middle` (default) | 44px                  |
| `large`            | 54px                  |

`size` changes spacing and heights only — colours and font size are identical across sizes.

Two things to watch:

- **A `rowHeight` or `headerHeight` grid option overrides what `size` sets.** Both are AG Grid grid options that pass straight through to the grid, and a grid option beats a theme parameter. So `size: large` together with `rowHeight: 30` gives 30px rows under a 54px header. Use one or the other, not both.
- **There are two `size` vocabularies.** The block-level `size` takes `small | middle | large`, mirroring antd Table. The `cell.size` keys — on button cells and selector cells — take `small | default | large`, mirroring antd Button and Select. So `size: default` and `cell.size: middle` are both invalid. A bad block-level `size` logs a one-time browser console warning and falls back to `middle`; a bad `cell.size` is silent.

The three original theme blocks have a fixed density, so they do not take `size`.

## Retinting one grid — the `themeParams` property

Every AgGrid block takes a `themeParams` object: [AG Grid theming parameter](https://www.ag-grid.com/react-data-grid/theming-parameters/) names, merged onto that block's own theme. This is the recommended way to override the theme of a single grid.

```yaml
- id: custom_theme
  type: AgGridLowdefy
  properties:
    themeParams:
      headerBackgroundColor: '#1a1a2e'
      headerTextColor: '#e0e0ff'
      selectedRowBackgroundColor: rgba(108, 99, 255, 0.2)
      rowHoverColor: rgba(108, 99, 255, 0.1)
      borderColor: '#2a2a4a'
```

Values are CSS strings, so they may reference the app's antd tokens — `borderColor: var(--ant-color-primary)` keeps the override following the app's theme and dark mode. See AG Grid's theming parameter reference for the full list of names; Lowdefy does not reproduce it.

> **A misspelled parameter name is a silent no-op.** Neither Lowdefy nor AG Grid validates parameter names — AG Grid infers a value type from the name and emits a CSS variable nothing reads. There is no warning, at build time or at run time, so check spelling against AG Grid's reference.

### Overriding `--ag-*` variables through `style`

Setting AG Grid's `--ag-*` CSS variables in a block's `style` **still works** — AG Grid deliberately honours `--ag-*` declared on an ancestor element. Existing apps using that technique need no change.

The one thing that did change: AG Grid v33 renamed or folded away a number of the v32 `--ag-*` variables, and an override naming one of those now does nothing. The variables used in the example above map to parameters like this:

| `style` key (v32 `--ag-*`)           | `themeParams` key            |
| ------------------------------------ | ---------------------------- |
| `--ag-header-background-color`       | `headerBackgroundColor`      |
| `--ag-header-foreground-color`       | `headerTextColor`            |
| `--ag-selected-row-background-color` | `selectedRowBackgroundColor` |
| `--ag-row-hover-color`               | `rowHoverColor`              |
| `--ag-border-color`                  | `borderColor`                |

Four of those five variable names still work as-is. `--ag-header-foreground-color` is the exception: v33 renamed it to `--ag-header-text-color`, so an app still setting the old name gets no header text colour and no warning. Move it to `themeParams.headerTextColor`.

## Themes follow the app

All AgGrid blocks take their colours from the app's antd design tokens, so a grid follows the app's theme and its light/dark mode with no configuration and no per-grid dark variant. There is no `AgGridLowdefyDark` block, and none is needed.

## Row selection

`rowSelection` takes AG Grid's object form:

```yaml
rowSelection:
  mode: multiRow # or singleRow
  enableClickSelection: true
  checkboxes: true
  headerCheckbox: true
```

The older string form (`rowSelection: multiple` / `single`) still works but logs a deprecation warning. If you migrate it, **set `enableClickSelection: true`**: the string form enables click-to-select by default and the object form does not, so a bare `{ mode: singleRow }` silently stops clicking a row from selecting it, and `onRowSelected` / `onSelectionChanged` stop firing.

Migrate the column-level checkbox flags in the same edit — `checkboxSelection` and `headerCheckboxSelection` on a `columnDefs` entry become `rowSelection.checkboxes` and `rowSelection.headerCheckbox`.
