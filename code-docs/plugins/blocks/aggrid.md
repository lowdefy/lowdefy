# @lowdefy/blocks-aggrid

[AG Grid](https://www.ag-grid.com/documentation/) integration for Lowdefy. Provides a high-performance data grid (virtual scrolling, sort/filter/group, row selection) with a built-in cell renderer system that renders Lowdefy-styled tags, links, buttons, etc. inline in cells.

## Theme Blocks

Eight blocks share two internal cores — `AgGrid.js` (display) and `AgGridInput.js` (input). Every block passes a Theming API theme object built in `src/theme/themeLowdefy.js`. **No row has a stylesheet:** the package is on AG Grid v33, where the Theming API is the default and class-based file themes are gone.

| Display block    | Input block           | Base theme      | Params                                            | Wrapper class       | `size` |
| ---------------- | --------------------- | --------------- | ------------------------------------------------- | ------------------- | ------ |
| `AgGridLowdefy`  | `AgGridLowdefyInput`  | `themeQuartz`   | `antdParams` + `lowdefyParams` + the size variant | —                   | yes    |
| `AgGridAlpine`   | `AgGridInputAlpine`   | `themeAlpine`   | `antdParams`                                      | `ag-theme-alpine`   | no     |
| `AgGridBalham`   | `AgGridInputBalham`   | `themeBalham`   | `antdParams`                                      | `ag-theme-balham`   | no     |
| `AgGridMaterial` | `AgGridInputMaterial` | `themeMaterial` | `antdParams` + `primaryColor`                     | `ag-theme-material` | no     |

The `ag-theme-*` class on the six original blocks is **purely a styling hook now, not a theming mechanism** — the module's per-theme avatar rules key on it, and apps may target it in their own CSS. It no longer themes anything.

All eight blocks accept the same properties and events (bar `size`). Each block file (`src/blocks/<Block>/`) is a thin wrapper that:

1. Applies the shared antd cell-styling class (`className={antdStyles.antdTheme}` from `ag-grid-antd.module.css`) — all eight.
2. Builds its theme with `useGridTheme(<base theme>, properties.themeParams)` and passes it to the core as the `theme` prop — all eight.
3. Additionally carries its `ag-theme-*` class, so the module's per-theme avatar rules match — the six originals only. `AgGridLowdefy` has no such class and instead sets `--lf-avatar-size` / `--lf-avatar-font-size` inline on the wrapper from `SIZES`, which is also what makes its avatars track `size`.

> **Important — `components` forwarding.** The theme block must forward `components` to the inner `AgGrid`. This is how `components.Icon` reaches cell renderers (e.g. icons inside buttons-cell). See [Components plumbing](#components-plumbing) below.

## Theming

### Why the package has no legacy-CSS path at all

v33 keeps a `theme="legacy"` escape hatch for apps still on class-based file themes. **This package cannot use it**, and no block may import AG Grid CSS.

v33 treats a legacy stylesheet in the document as an error, not a warning: `ag-grid.css` defines `--ag-legacy-styles-loaded`, and `environment.ts` raises AG Grid error 106 whenever a Theming API grid can read that property. Three facts make it fire in every app, not just on a page that mixes grids:

1. **Every grid probes for the flag itself.** `ag-grid.css` carries one declaration, `.ag-measurement-container { --ag-legacy-styles-loaded: "true"; }`, and every grid creates a `div.ag-measurement-container` inside its own root. AG Grid then reads `getComputedStyle(this.getMeasurementContainer()).getPropertyValue('--ag-legacy-styles-loaded')` — the very element the rule targets. Nothing depends on inheritance or on a legacy grid existing: loading the stylesheet anywhere in the document is enough for every Theming API grid to see the flag on its own measurement container.
2. **The stylesheet would always be in the document.** The build emits one static barrel import per block type, and `blocks.js` re-exports all eight blocks. The package declares no `sideEffects`, so a bundler must keep a module-scope `import 'ag-grid-community/styles/ag-grid.css'` in any block it loads, used or not.
3. **AG Grid offers no in-document remedy** beyond migrating all grids together or shadow-DOM isolation.

So an app whose only grid is `AgGridLowdefy`, on a page with no legacy grid at all, would still log error 106. Every block therefore renders through the Theming API, error 106 is structurally impossible, and there is one theming mechanism instead of two. v34 removes file themes regardless.

Guard it with a static check: `grep -rn "ag-grid-community/styles" src/` must return nothing.

### `src/theme/themeLowdefy.js`

One module builds every theme in the package. All theme objects are created **once at module scope** — Theming API objects are cheap and identity-stable, so switching `size` just swaps which object is passed.

**`antdParams`** — 23 parameters mapping AG Grid onto antd design tokens, applied to all four bases. Every colour is a `var(--ant-*)` reference rather than a resolved value, so antd's cssVar mode regenerates the grid's colours on each theme or dark-mode change with no JS. Seventeen of the 23 carry over what the deleted `--ag-*` CSS overlay imposed on the six original blocks — colours, shadows, `fontFamily`, `fontSize` and the zebra stripe — and six are additions the overlay never made: `accentColor`, `chromeBackgroundColor`, `menuBackgroundColor`, `menuShadow`, `tooltipTextColor` and `browserColorScheme`. `cardShadow` is **not** one of the additions: the overlay already set `--ag-card-shadow: var(--ant-box-shadow-secondary)` and the map holds the identical token.

**`lowdefyParams`** — four structural parameters, on `themeQuartz` only: `headerFontWeight: 600`, `borderRadius`, `wrapperBorderRadius`, and `oddRowBackgroundColor: 'transparent'` (no zebra, antd Table's default).

**Why the split is load-bearing.** `withParams` appends a part and later parts win outright; worse, setting a parameter in the default mode **deletes** it from every non-default mode, erasing the base theme's light/dark variants for those names. So a single map applied to all four bases is not additive — it overwrites whatever the base set. Each prebuilt base defines its identity precisely through the parameters a naive shared map would carry (Balham: `fontSize: 12`, `borderRadius: 2`, `headerFontWeight: 'bold'`; Alpine: 13 / 3 / `700`; Material: `borderRadius: 0`, Roboto). Flatten those and `AgGridBalham` becomes `AgGridLowdefy` with Balham icons.

The line is drawn at _what the antd overlay already imposed_, not at colour-versus-structure. `fontFamily` and `fontSize` stay in the shared map because the overlay's doubled `.antdTheme.antdTheme` selector already outspecified `.ag-theme-balham` — dropping them would revert Balham to 12px and Material to Roboto, which no user has seen since the overlay landed. `oddRowBackgroundColor` stays in the shared map at the overlay's value for the same reason (v33 defaults it to `backgroundColor`, i.e. no stripe), and `transparent` moves to `lowdefyParams`.

**Material's `primaryColor` carve-out.** `themeMaterial`'s `styleMaterial` part sets `primaryColor: '#3f51b5'` and refs it for the tab underline, button text, input focus border and cell-editing border. `antdParams` sets `accentColor`, a different parameter, so without the addition those stay Material indigo. `primaryColor` exists only on Material's parameter type, so the shared map cannot carry it — hence the per-base extra.

**The four fallback chains.** antd v6 in cssVar mode only emits a `--ant-*` variable when a rendered antd component references that token. Four tokens have a single common emitter a given page might not render, so they chain rather than resolving to nothing:

| Parameter                     | Chain                                                    | Sole common emitter         |
| ----------------------------- | -------------------------------------------------------- | --------------------------- |
| `wrapperBorderRadius`         | `--ant-border-radius-lg` → `--ant-border-radius` → `8px` | Card                        |
| `tooltipBackgroundColor`      | `--ant-color-bg-spotlight` → `--ant-color-bg-container`  | Tooltip                     |
| `modalOverlayBackgroundColor` | `--ant-color-bg-mask` → `--ant-color-bg-container`       | Modal / Drawer              |
| `menuBackgroundColor`         | `--ant-color-bg-elevated` → `--ant-color-bg-container`   | Dropdown / Popover / Select |

Never a hardcoded colour — a static literal would render wrong in the opposite mode. `tooltipTextColor` is the deliberate exception: its fallback is a literal `#fff`, because antd always pairs `colorBgSpotlight` with `colorTextLightSolid`, which is `#fff` in both modes. In practice antd emits its whole alias token set on `.lowdefy`, so these chains are defensive, not load-bearing.

**`SIZES`** — the one source of every size-dependent value. It feeds both the theme variants (`spacing` / `rowHeight` / `headerHeight`) and the avatar CSS custom properties:

| `size`   | `spacing` | `rowHeight` | `headerHeight` | `avatarSize` | `avatarFontSize` | ≈ antd Table |
| -------- | --------- | ----------- | -------------- | ------------ | ---------------- | ------------ |
| `small`  | 4         | 36          | 36             | 20           | 10               | `small`      |
| `middle` | 6         | 44          | 44             | 24           | 12               | `middle`     |
| `large`  | 8         | 54          | 54             | 28           | 14               | default      |

Sizes differ only in spacing and heights — colours and fonts are identical across sizes, matching antd, where `size` changes padding rather than the type scale.

**`useGridTheme(baseTheme, themeParams)`** — one shared hook used by all eight blocks. It returns the base object untouched when `themeParams` is absent or an empty object, so the module-scope themes stay shared and identity-stable, and memoises on a `JSON.stringify` key when present (Lowdefy re-evaluates block properties each render, so `themeParams` is a fresh reference every time). `type.isObject` rejects a non-plain-object, which would otherwise make `withParams` emit junk `--ag-0` / `--ag-1` variables from a string's characters.

### Reconciling the deleted overlay against `antdParams`

The `--ag-* : var(--ant-*)` overlay in `ag-grid-antd.module.css` is what coloured the six original blocks before v33. Its 34 declarations map onto the 23 in `antdParams` as follows. Both sides balance: **13 carried unchanged + 4 re-pointed + (6 + 3 + 6 + 2) dropped = the overlay's 34**, and **13 + 4 carried + 6 additions = the map's 23**.

**Carried over unchanged (13).** `--ag-background-color`, `--ag-foreground-color`, `--ag-odd-row-background-color`, `--ag-header-background-color`, `--ag-header-cell-hover-background-color`, `--ag-selected-row-background-color`, `--ag-tooltip-background-color`, `--ag-modal-overlay-background-color`, `--ag-card-shadow`, `--ag-font-family` and `--ag-font-size` map onto identically-named parameters with the same antd token; `--ag-header-foreground-color` → `headerTextColor` and `--ag-checkbox-checked-color` → `checkboxCheckedBackgroundColor` carry over through a v33 rename.

`--ag-card-shadow` → `cardShadow` had to be one of them. v33's `cardShadow` default is the hardcoded light-mode literal `'0 1px 4px 1px #00000018'`, and both `dropdownShadow` and `cellEditingShadow` are `{ ref: 'cardShadow' }`, so omitting it would put a light-mode shadow on cell editors and dropdowns in a dark app — exactly the "a static literal renders wrong in the opposite mode" failure the map exists to avoid.

**Re-pointed to a different antd token (4)** — the visible colour changes on the six original blocks:

| Overlay                                                           | `antdParams`                                            | Visible effect                                   |
| ----------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------ |
| `--ag-row-hover-color: var(--ant-color-primary-bg-hover)`         | `rowHoverColor: var(--ant-color-fill-tertiary)`         | hover goes from a primary tint to a neutral fill |
| `--ag-border-color: var(--ant-color-border)`                      | `borderColor: var(--ant-color-border-secondary)`        | lighter grid/row/wrapper borders                 |
| `--ag-checkbox-unchecked-color: var(--ant-color-text-quaternary)` | `checkboxUncheckedBorderColor: var(--ant-color-border)` | checkbox outline tone                            |
| `--ag-popup-shadow: var(--ant-box-shadow)`                        | `popupShadow: var(--ant-box-shadow-secondary)`          | lighter popup elevation                          |

These four are accepted deliberately: applying one shared map uniformly is what keeps the six originals looking like antd rather than restoring per-block-family colour values.

The remaining 17 declarations are dropped, in four distinct ways.

**Dropped because v33 derives them from a parameter that is set (6).** Each still tracks the app's antd theme and dark mode through the parameter it refs:

| Overlay                                    | v33 parameter covering it          | Derives from                              |
| ------------------------------------------ | ---------------------------------- | ----------------------------------------- |
| `--ag-secondary-foreground-color`          | `subtleTextColor` (renamed)        | `{ ref: textColor }` → `foregroundColor`  |
| `--ag-header-cell-moving-background-color` | `headerCellMovingBackgroundColor`  | `{ ref: headerCellHoverBackgroundColor }` |
| `--ag-column-hover-color`                  | `columnHoverColor`                 | `accentMix(0.05)` → `accentColor`         |
| `--ag-checkbox-background-color`           | `checkboxUncheckedBackgroundColor` | `backgroundColor`                         |
| `--ag-input-disabled-background-color`     | `inputDisabledBackgroundColor`     | foreground/background mix                 |
| `--ag-input-disabled-border-color`         | `inputDisabledBorder` (folded)     | `{ ref: inputBorder }` → `borderColor`    |

**Dropped deliberately — AG Grid Enterprise (3).** `--ag-range-selection-border-color`, `--ag-range-selection-background-color` and `--ag-range-selection-highlight-color` style **Enterprise** cell selection, which these community blocks cannot render. All three survive in v33 as parameters and all three already derive from `accentColor`, which the map sets, so nothing is lost by leaving them alone.

**Dropped because v33 has neither the parameter nor the variable (6).** `--ag-secondary-border-color`, `--ag-control-panel-background-color`, `--ag-subheader-background-color`, `--ag-subheader-toolbar-background-color`, `--ag-disabled-foreground-color` and `--ag-chip-background-color` were removed outright — nothing on v33 reads them. `chromeBackgroundColor` covers the control-panel and subheader surfaces three of them named.

**Dropped although v33 does have a parameter (2).** `--ag-input-focus-box-shadow` and `--ag-input-focus-border-color` both survived, under new names the map deliberately does not set: `inputFocusShadow` (a straight rename, `box-shadow` → `shadow`; `inputStyleBordered` gives it `{ ref: focusShadow }`) and `inputFocusBorder` (a fold, colour into a composite border). Focus styling is left to each base theme, which is why no loss follows: Alpine, Balham and Material all set their own `focusShadow` (and Alpine and Material their own `inputFocusBorder`), and every one of those resolves through `accentColor`, `foregroundColor` or Material's `primaryColor` — parameters the map does set. So focus rings still track antd, with each base's own geometry.

### Structural drift on the six original blocks

AG Grid's prebuilt themes approximate the file themes rather than reproducing them. Measured against a running app, Balham / Alpine / Material shifted:

|                         | v32 file theme                                                        | v33 prebuilt + `antdParams`                        |
| ----------------------- | --------------------------------------------------------------------- | -------------------------------------------------- |
| row height              | 28 / 42 / 48 px                                                       | **29** / 42 / 48 px                                |
| header height           | 32 / 48 / 56 px                                                       | unchanged                                          |
| cell horizontal padding | 12 / 18 / 24 px                                                       | **8** / **16** / 24 px                             |
| wrapper radius          | 6 px on all six (forced by the since-deleted `.ag-root-wrapper` rule) | **Balham 2 / Alpine 3 / Material 0**               |
| header font-weight      | 600 / 700 / 600                                                       | **700** / 700 / 600                                |
| icons                   | shared `ag-icon` font                                                 | each base's own SVG icon set — glyph shapes differ |

One behavioural change comes with it: **row height now tracks the app's antd font size, above the icon size.** v33's `rowHeight` is `calc: max(iconSize, dataFontSize) + spacing * 3.25` (Material uses `* 3.75`), `dataFontSize` refs `fontSize`, and `antdParams` points `fontSize` at `var(--ant-font-size)` — so a larger app font makes rows taller, but only once it passes `iconSize`, which is 16 on the core and 18 on Material. At antd's default 14px nothing changes; the drift is real at 18px or 20px. v32's file themes were font-size-independent at any size. Alpine is immune at every size, but not because it pins a row height — it does not set `rowHeight` at all. It pins the _input_: `themeAlpine` sets `dataFontSize: 14`, which `antdParams` never overrides (the map sets `fontSize`, and an explicit `dataFontSize` wins over the `{ ref: fontSize }` default).

Zebra striping, fonts and overall density are preserved, which is what splitting `lowdefyParams` off the shared map buys.

### `size` and `themeParams`

**`size`** — `small | middle | large`, default `middle`. Available on the **two Lowdefy blocks only**, gated by the `{ size: true }` flag both shared meta factories (`createDisplayMeta`, `createInputMeta`) take. It does nothing on the fixed-density original blocks, so it is not advertised there.

`resolveSize` returns `middle` for an unset value and, for an unrecognised one, warns **once per distinct bad value** before falling back to `middle`. It warns rather than throwing: a bad `size` is a cosmetic typo with a sane default. The signal matters because there is no build-time check — **Lowdefy does not validate a statically configured block's properties against its meta schema.**

**Two `size` vocabularies, and only one of them warns.** The block-level `size` takes `small | middle | large` (mirroring antd Table). The two `cell.size` keys — button cells and selector cells — take `small | default | large` (mirroring antd Button and Select). So `size: default` and `cell.size: middle` are both no-ops, and `default` is the plausible wrong guess for the block property precisely because it is the valid spelling one level down. A bad block `size` logs the `themeForSize` warning; a bad `cell.size` is silent, because the cell renderers were outside this change's scope. Both spellings are correct for what they wrap and the repo already carries both (`DropdownButton`/`ColorSelector` use `middle`; `Button`/`Slider`/`Label` use `default`) — documentation, not a bug to fix.

**`size` loses to an explicit height.** `size` sets the theme parameters `rowHeight` and `headerHeight`, but both are also AG Grid grid options that pass straight through, and a grid option beats a theme parameter (`_getRowHeightForNode` reads `gos.get('rowHeight')` and falls back to the theme default only when absent). So `size: large` with `rowHeight: 30` gives 30px rows under a 54px header. This is documented rather than prevented: stripping the two options from the spread would remove legitimate capabilities to protect a cosmetic property.

**`themeParams`** — an object of AG Grid Theming API parameter names merged onto the block's theme, added **unconditionally** in both meta factories because it is meaningful on all eight blocks. Merged by the shared `useGridTheme` hook; it _merges onto_ the block's theme rather than replacing it.

There is **no Lowdefy-side allow-list**, and the reason is not that AG Grid validates the names — it does not. `paramValueToCss` dispatches on `getParamType`, which matches the key's _suffix_ against a fixed list (`color`, `length`, `border`, `shadow`, `fontFamily`, …) and falls back to `'length'` for anything matching none of them. Either way the key is typed, converted and emitted: `{ headrBackgroundColor: 'red' }` still ends in `color`, so it types as a colour and emits `--ag-headr-background-color: red`; a key matching no suffix at all, `{ headerBackgrund: '4px' }`, takes the `'length'` fallback and emits `--ag-header-backgrund: 4px`. Neither warns. AG Grid's `_error(107)` fires only when a _value_ cannot be converted for the inferred type. No allow-list is added because there is no authoritative list to copy (`getParamDocs` is exported only from `private-theming-api.ts`) and a hand-maintained one would go stale every release while blocking parameters we never thought of.

**The user-facing consequence: an unrecognised `themeParams` key is a silent no-op** — nothing at build time or run time flags it. The docs point at AG Grid's theming parameter reference as the place to check spelling.

> `theme` is an internal React prop on the two cores, not a block property. Users reach the theme through `themeParams` (and `size` on the Lowdefy blocks).

### Overriding `--ag-*` through a block's `style` still works

The Theming API deliberately honours `--ag-*` inherited from an ancestor: `_getPerGridCss` emits `--ag-foo: var(--ag-inherited-foo, <theme value>)` on the grid root against a companion `--ag-inherited-foo: var(--ag-foo)` capture rule on the root's parent, both in `:where()` so neither side has specificity. The documented `custom_theme` technique — setting `--ag-*` in a block's `style` — therefore survived the v33 move, and stays supported.

What did break is narrower: v33 renamed, folded away or removed 14 of the 34 `--ag-*` names the overlay used, and an override naming one of those is a silent no-op. `--ag-header-foreground-color` (now `headerTextColor` / `--ag-header-text-color`) is the case in the documented example, and `src/blocks/AgGridAlpine/gallery.yaml` still carries it as an inert override. `themeParams` is the recommendation, not a rescue.

### Module registration

Both cores call `ModuleRegistry.registerModules([AllCommunityModule])` at **module scope**. Registration is idempotent, so each core registers independently and stays standalone. v33 requires explicit registration; `AllCommunityModule` covers the client-side row model, sorting, all default filters, pagination, row selection, quick filter, cell/row styling, the legacy column menu (`columnMenu="legacy"`, still valid) and CSV export, plus `ValidationModule` for dev-time grid-option warnings.

Fine-grained module selection to shrink the bundle is a **deliberate later optimization** — it depends on measured bundle impact and per-feature usage evidence that does not exist yet.

## Block Defaults

`AgGrid.js` destructures these from `properties` with sensible defaults:

| Property            | Default    | Notes                                                                                    |
| ------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| `suppressCellFocus` | `true`     | Removes ag-grid's keyboard focus outline that visually competes with built-in renderers. |
| `size`              | `'middle'` | Lowdefy blocks only. Row density — see [Theming](#size-and-themeparams).                 |
| `themeParams`       | —          | All eight blocks. Theming API parameters merged onto the block's theme.                  |

`size`, `themeParams`, `height` and `rowId` are destructured out in **both** cores before the `{...someProperties}` spread. They are Lowdefy block properties, not grid options, and v33's `ValidationModule` warns `invalid gridOptions property '<key>' did you mean any of these: …` for anything unrecognised that reaches `<AgGridReact>`. The warning goes through `_warnOnce`, which dedupes on the message text, so it fires **once per distinct bad key** rather than once per render — a single line in the console for a mistake that never stops.

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

| `cell.type`        | Renders                                       | Triggers                     |
| ------------------ | --------------------------------------------- | ---------------------------- |
| `tag`              | antd `Tag` with color mapping                 | —                            |
| `avatar`           | antd `Avatar` (initials/image)                | `onCellLink` \*              |
| `link`             | `<a>` with row-data-substituted href          | `onCellLink`                 |
| `date`             | dayjs-formatted date                          | —                            |
| `boolean`          | true/false labels with colors                 | —                            |
| `progress`         | progress bar with thresholds                  | —                            |
| `number`           | `Intl.NumberFormat` (currency, percent, etc.) | —                            |
| `buttons`          | list of antd `Button`s, one event per button  | per-button `eventName:`      |
| `selector`         | antd `Select` (single) per row                | `eventName:` on change       |
| `multipleSelector` | antd `Select` (multiple) per row              | `eventName:` on change       |
| `switch`           | antd `Switch` (boolean) per row               | `eventName:` on toggle       |
| `textInput`        | antd `Input` per row                          | `eventName:` on blur / Enter |
| `paragraphInput`   | antd `Typography.Paragraph` with inline edit  | `eventName:` on edit confirm |

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
      priority: { _state: { key: priorities.r1, default: high } } # bound to state
  columnDefs:
    - { field: name }
    - field: priority
      cell:
        type: selector
        eventName: onPriorityChange # block-level event fired on change
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
  onPriorityChange: # persist: write newValue back into the bound state
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
{
  row: data, value, newValue;
} // value = previous cell value; newValue is an array for multipleSelector
```

### `cell.type: switch` / `textInput` / `paragraphInput` — input cells

The same event-only model as the selector cells: each renders an antd input bound to the row value, writes back into ag-grid's row node for immediate feedback, and fires the column's `eventName` with `{ row, value, newValue }`. The app persists by updating the data bound to `rowData`. **When** the event fires differs by control:

- `switch` — on every toggle (`newValue` is a boolean). Config: `checkedText`, `uncheckedText`, `checkedIcon`, `uncheckedIcon`, `color`, `size`, `disabled`.
- `textInput` — on blur / Enter, **not** per keystroke. Typing is held in local state so the cell does not re-render and lose focus mid-edit. Config: `placeholder`, `allowClear`, `maxLength`, `showCount`, `inputType` (HTML input type — named to avoid clashing with `cell.type`), `variant`/`bordered`, `size`, `disabled`.
- `paragraphInput` — `Typography.Paragraph` with inline editing; commits when the edit is confirmed (blur / Enter). Config: `editable` (false → read-only), `maxLength`, `autoSize`, `editTooltip`, `copyable`, `ellipsis`, and text styling (`code`, `strong`, `italic`, `underline`, `delete`, `mark`, `textType`).

```js
{
  row: data, value, newValue;
} // newValue: boolean (switch) | string (textInput / paragraphInput)
```

> `textInput`/`paragraphInput` commit once (on blur/confirm) rather than per keystroke — committing per keystroke would re-render the grid, remount the cell, and lose input focus.

## Components Plumbing

Cell renderers need access to the framework's `Icon` component (the same one the standalone `Button` block uses) so that `icon: AiOutlineEdit` and full Icon-block config objects render consistently. The path:

```
LowdefyContext (initLowdefyContext.js in @lowdefy/client)
  components: { Icon, ShortcutBadge }
        │
        ▼ block prop (framework injects on every block)
AgGridLowdefy / AgGridAlpine / AgGridMaterial / AgGridBalham (theme block)
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

> When adding a new theme block (`AgGrid<NewTheme>.js`), make sure to forward `components` to the inner `<AgGrid components={components} ... />`, and to pass a `theme` object. Forgetting `components` is a silent failure mode — icons render as empty buttons.

## Events Catalogue

| Event                | Triggered by                                           | Payload                                                                                                             |
| -------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `onRowClick`         | Click anywhere on a row (non-bubble-suppressed)        | `{ row, selected, rowIndex }`                                                                                       |
| `onCellClick`        | Click anywhere in a cell                               | `{ cell: { column, value }, colId, row, rowIndex, selected }`                                                       |
| `onRowSelected`      | Row checkbox / selection changes (selection only)      | `{ row, rowIndex, selected }`                                                                                       |
| `onSelectionChanged` | Multi-row selection set changed                        | `{ selected }`                                                                                                      |
| `onFilterChanged`    | User changed any filter                                | `{ rows, filter }` (rows = currently displayed)                                                                     |
| `onSortChanged`      | User changed sort                                      | `{ rows, sort }`                                                                                                    |
| `onCellLink`         | Click on a `cell.type: link` (or avatar with `link`)   | `{ link, row, value }` — wire to `Link` action with `params: { _event: link }`                                      |
| user-defined         | Click on a `cell.type: buttons` button                 | `{ row, value, button: { eventName, title }, buttonIndex }` — name is the button's `eventName:` string              |
| user-defined         | Change on a `cell.type: selector` / `multipleSelector` | `{ row, value, newValue }` — name is the cell's `eventName:` string (`newValue` is an array for `multipleSelector`) |

The buttons-cell entry intentionally lists "user-defined" because each button declares its own block-level event name. The meta files include a documentation-only `onCellButton` entry describing the payload shape.

## The shared CSS module (`ag-grid-antd.module.css`)

**One module, not one per block family.** All eight blocks apply it via `className={antdStyles.antdTheme}`. It carries only structural helpers now — no colours:

- The antd cell wrapper (`display: flex`, `align-items: center`, `overflow: hidden`, `min-width: 0`) so flex-based cell content (icons + text, multiple buttons, progress bars) clips inside the ag-grid cell rather than overflowing the column width. The `min-width: 0` is the canonical fix for flex children that would otherwise push the parent cell wider than its column.
- The `.lf-ellipsis-N` line clamps (1–6).
- The paragraph-input inline-edit offset fix.
- `.ag-overlay-no-rows-wrapper` text colour — **this one stays**, because AG Grid's _empty_ overlay is the one the blocks actually use and the empty-grid specs assert it.
- The per-legacy-theme avatar variables, keyed on `ag-theme-balham` / `-alpine` / `-material`. They keep working because those six blocks keep their class and their density is fixed; `AgGridLowdefy` sets the same variables inline from `SIZES` instead.

### Three rule groups were deleted in the v33 move

**The `--ag-* : var(--ant-*)` colour block.** Its mappings became `antdParams`. Leaving it would not have been harmless duplication — it would have **won**: the Theming API honours `--ag-*` inherited from an ancestor, so the module sitting on the wrapper would have overridden every parameter it duplicates, on all eight blocks. One mechanism, not two.

**The `.ag-root-wrapper` radius/overflow rule.** Both halves are now owned by the Theming API's own core CSS (`_root.css` sets `overflow: hidden` and `border-radius: var(--ag-wrapper-border-radius)`). Worse, `.antdTheme .ag-root-wrapper` **outspecifies** the generated bare `.ag-root-wrapper`, so keeping it would have clamped `wrapperBorderRadius` back to the smaller `--ant-border-radius` and defeated the parameter on every block. (Its removal is why the six original blocks no longer all render at a 6px wrapper radius — see [Structural drift](#structural-drift-on-the-six-original-blocks).)

**The two `.ag-overlay-loading-*` rules — already dead.** They style AG Grid's native loading overlay, which never renders: both cores pass `suppressLoadingOverlay` unconditionally and render `LoadingOverlay.js` instead, whose inline styles reproduce those rules exactly. An app cannot make the native overlay render, so deleting them changes nothing observable.

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
