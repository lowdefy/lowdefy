# Change Log

## 5.1.0

### Minor Changes

- b2a2a981d: feat(blocks-aggrid): Add built-in cell renderer types.

  Every AgGrid column now accepts a `cell` object on `columnDefs` entries that selects a first-class renderer — `tag`, `avatar`, `link`, `date`, `boolean`, `progress`, `number` — plus an `ellipsis: N` column-level helper that auto-enables `wrapText` + `autoHeight` with an N-line clamp.

  The `number` renderer wraps `Intl.NumberFormat` with Excel-style config: `format` (`number` / `currency` / `percent` / `compact`), `locale`, `currency`, `decimals`, accounting-style `negative: parentheses`, `signColor` (green/red by sign), and optional `prefix` / `suffix`. Number columns auto-right-align (`cellStyle.justifyContent: flex-end` + `ag-right-aligned-header`) and every `cell.type` supports an `align: left | center | right` override. Renderer output is React, vertically centred, and styled entirely through antd CSS tokens (`--ant-control-height`, `--ant-margin-xs`, `--ant-color-*`, `--ant-border-radius`, `--ant-font-size`, etc.) so the grid adapts to Material vs Balham row heights and to dark / compact antd `theme.algorithm` without per-theme overrides.

  Field-valued keys (`nameField`, `srcField`, `idField`, `colorFrom`, and every value inside `link.urlQuery`) are plain row-data path strings — no `_function` wrapping required. Null values render a muted em-dash across every built-in type.

  Link navigation: `cell.type: link` and `avatar.link` render anchors and emit a new `onCellLink` block event with the resolved link config; wire it to a `Link` action (`params: { _event: link }`) to navigate — matches the existing Lowdefy event → action pattern.

  `antd`, `@ant-design/icons`, and `dayjs` are now declared as peer dependencies on `@lowdefy/blocks-aggrid` (de-facto required by the existing `ag-grid-antd.module.css` token mapping).

  Also fixes the long-standing cell vertical-centering drift: `.ag-cell` is now a flex container via the antd theme CSS module, which also benefits users' existing `renderHtml` cells.

- 72625593e: feat(blocks-aggrid): Declare tooltip properties in block schemas.

  All six AgGrid variants (Alpine/Balham/Material for display and input) now declare `enableBrowserTooltips`, `tooltipShowDelay`, and `tooltipHideDelay` at the grid level and `tooltipField`, `tooltipValueGetter`, and `tooltipComponent` at the column level. These AG Grid props already worked — they were passed through via property spreading — but were not documented in the block schemas. Users can now discover and configure tooltips directly from the schema.

### Patch Changes

- a7f2480b4: fix(blocks-aggrid): React to `loading` prop changes on AgGrid.

  The `loading` block flag now toggles AG Grid's native `showLoadingOverlay` / `hideOverlay` at runtime. Previously the overlay calls were inside a `useEffect` with an empty dependency array, so they only ran once on mount and never reacted to subsequent `loading` changes. The effect has been split in two — method registration still runs once, overlay toggling now runs whenever `loading` changes — and an `onGridReady` callback applies the initial overlay state safely after the grid api is attached.

- 797ab5b2d: fix(blocks-aggrid): Safari loading overlay stuck.

  `AgGrid` and `AgGridInput` no longer use ag-grid's internal `showLoadingOverlay` / `hideOverlay` API to reflect the block's `loading` prop. On Safari / WebKit, a microtask race between our `hideOverlay()` call and ag-grid's own late `showOverlay` tick left the "Loading…" box stuck on screen even after data had rendered (ag-grid issues #4421, #1665, #8358). Chromium happened to win the race the other way, which hid the symptom.

  Both blocks now wrap `AgGridReact` in a `position: relative` div, set `suppressLoadingOverlay` on the grid, and render a small themed overlay component (`LoadingOverlay.js`) when the Lowdefy `loading` prop is `true`. The overlay is styled via antd CSS custom properties, so it follows the active theme.

  - @lowdefy/block-utils@5.1.0
  - @lowdefy/helpers@5.1.0

## 5.0.0

### Major Changes

- 29eb199c7f: Restructure block metadata from component static properties to dedicated `meta.js` files.

  ### Breaking Changes

  - **`schema.js` renamed to `meta.js`**: Block definitions moved from `schema.js` to `meta.js`. The `meta.js` files export `category`, `icons`, `valueType`, `cssKeys`, `events`, and `properties` (JSON Schema).
  - **`schemas.js` barrel renamed to `metas.js`**: Block packages export `./metas` instead of `./schemas`.
  - **`.meta` removed from components**: Block components no longer have a `.meta` static property. Metadata is loaded from the `blockMetas.json` build artifact at runtime.
  - **`blockMetas.json` build artifact**: The build pipeline writes `plugins/blockMetas.json` containing category, valueType, and initValue for each block type.
  - **`buildBlockSchema(meta)`**: New function in `@lowdefy/block-utils` generates complete JSON Schema from meta objects with operator support and CSS slot key validation.

- f430f02dde: Replace auto-generated `types.json` with source `types.js` files in all plugin packages.

  ### Breaking Changes

  - **Plugin type resolution**: Plugin types are now read from source `types.js` files instead of auto-generated `types.json`. Block packages derive types from their `metas.js` barrel using the `extractBlockTypes` helper.
  - **`extract-plugin-types` script removed**: The build-time extraction script in `@lowdefy/node-utils` has been deleted. Each plugin package maintains its own `types.js`.

- f430f02dde: Migrate all blocks from `defaultProps` to `withBlockDefaults` wrapper for React 19 compatibility.

  ### Breaking Changes

  - **`defaultProps` removed**: React 19 silently ignores `defaultProps` on function components. All ~101 block components now use a `withBlockDefaults` wrapper from `@lowdefy/block-utils`.
  - **`withBlockDefaults` API**: New export from `@lowdefy/block-utils` that wraps block components with default property injection. Antd blocks use `withTheme` which absorbs defaults; non-antd blocks use the generic wrapper.

- f430f02dde: Replace the Less/Emotion styling system with unified `style` and `class` properties using `.` prefixed CSS slot keys.

  ### Breaking Changes

  - **Less removed**: `.less` files are no longer supported. All styling uses CSS, CSS Modules, or Tailwind utilities.
  - **`makeCssClass` removed**: Blocks no longer call `methods.makeCssClass()`. They receive `classNames` and `styles` objects as props, keyed by CSS slot names (`element`, `icon`, `header`, `body`, etc.).
  - **`mediaToCssObject` removed** from `@lowdefy/block-utils`.
  - **`style` replaces `styles`**: The `style` (singular) property handles all styling. Using `styles` (plural) throws a `ConfigError`.
  - **`class` property added**: New `class` property for CSS classes (Tailwind utilities, custom classes). Supports string, array, or object with `.` slot keys.
  - **`properties.style` moved**: Block-specific `properties.style` maps to `style: { .element }` at build time.
  - **Inline style props removed**: `headerStyle`, `bodyStyle`, `maskStyle`, `contentWrapperStyle`, `contentStyle`, `labelStyle`, `valueStyle`, `tabBarStyle`, `overlayStyle` are replaced by CSS slot keys (e.g., `style: { .header }`, `style: { .body }`).

  ### CSS Slot Keys

  `.` prefixed keys target specific parts of a block:

  | Key                                | Target                                                  |
  | ---------------------------------- | ------------------------------------------------------- |
  | `.block`                           | Layout wrapper (grid column)                            |
  | `.element`                         | Component root element                                  |
  | `.header`, `.body`, `.cover`, etc. | Antd semantic sub-elements (declared in `meta.cssKeys`) |

  Flat shorthand (no `.` keys) maps to `.block`:

  ```yaml
  # These are equivalent:
  style: { marginTop: 20 }
  style:
    .block: { marginTop: 20 }
  ```

### Minor Changes

- 45964f1506: AG Grid blocks now follow the Ant Design theme automatically. All six grid blocks (AgGridAlpine, AgGridBalham, AgGridMaterial, and their Input variants) map ag-grid CSS variables to antd design tokens, so they respond to light/dark mode and custom theme colors without any configuration. Override individual `--ag-*` variables via the block's `style` property for per-instance customization. The explicit dark variant blocks (AgGridAlpineDark, AgGridBalhamDark, AgGridInputAlpineDark, AgGridInputBalhamDark) have been removed.

### Patch Changes

- Updated dependencies [29eb199c7f]
- Updated dependencies [130a569d36]
- Updated dependencies [905d5d406]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
  - @lowdefy/block-utils@5.0.0
  - @lowdefy/helpers@5.0.0

## 4.7.3

### Patch Changes

- @lowdefy/block-utils@4.7.3
- @lowdefy/helpers@4.7.3

## 4.7.2

### Patch Changes

- @lowdefy/block-utils@4.7.2
- @lowdefy/helpers@4.7.2

## 4.7.1

### Patch Changes

- @lowdefy/block-utils@4.7.1
- @lowdefy/helpers@4.7.1

## 4.7.0

### Patch Changes

- Updated dependencies [4543688f7]
- Updated dependencies [dea6651a1]
  - @lowdefy/helpers@4.7.0
  - @lowdefy/block-utils@4.7.0

## 4.6.0

### Patch Changes

- Updated dependencies [aa0d6d363e]
- Updated dependencies [aebca6ab51]
- Updated dependencies [ab19b1bb77]
- Updated dependencies [8ec5f1be05]
  - @lowdefy/helpers@4.6.0
  - @lowdefy/block-utils@4.6.0

## 4.5.2

### Patch Changes

- @lowdefy/block-utils@4.5.2
- @lowdefy/helpers@4.5.2

## 4.5.1

### Patch Changes

- @lowdefy/block-utils@4.5.1
- @lowdefy/helpers@4.5.1

## 4.5.0

### Patch Changes

- @lowdefy/block-utils@4.5.0
- @lowdefy/helpers@4.5.0

## 4.4.0

### Patch Changes

- @lowdefy/block-utils@4.4.0
- @lowdefy/helpers@4.4.0

## 4.3.2

### Patch Changes

- @lowdefy/block-utils@4.3.2
- @lowdefy/helpers@4.3.2

## 4.3.1

### Patch Changes

- @lowdefy/block-utils@4.3.1
- @lowdefy/helpers@4.3.1

## 4.3.0

### Patch Changes

- @lowdefy/block-utils@4.3.0
- @lowdefy/helpers@4.3.0

## 4.2.2

### Patch Changes

- @lowdefy/block-utils@4.2.2
- @lowdefy/helpers@4.2.2

## 4.2.1

### Patch Changes

- a1f47d97c: Fix Github actions release.
- Updated dependencies [a1f47d97c]
  - @lowdefy/block-utils@4.2.1
  - @lowdefy/helpers@4.2.1

## 4.2.0

### Patch Changes

- @lowdefy/block-utils@4.2.0
- @lowdefy/helpers@4.2.0

## 4.1.0

### Patch Changes

- @lowdefy/block-utils@4.1.0
- @lowdefy/helpers@4.1.0

## 4.0.2

### Patch Changes

- @lowdefy/block-utils@4.0.2
- @lowdefy/helpers@4.0.2

## 4.0.1

### Patch Changes

- @lowdefy/block-utils@4.0.1
- @lowdefy/helpers@4.0.1

## 4.0.0

### Patch Changes

- @lowdefy/block-utils@4.0.0
- @lowdefy/helpers@4.0.0

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0-rc.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.14...v4.0.0-rc.15) (2023-12-05)

**Note:** Version bump only for package @lowdefy/blocks-aggrid

# [4.0.0-rc.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.14) (2023-11-17)

**Note:** Version bump only for package @lowdefy/blocks-aggrid

# [4.0.0-rc.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.13) (2023-11-17)

**Note:** Version bump only for package @lowdefy/blocks-aggrid

# [4.0.0-rc.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.11...v4.0.0-rc.12) (2023-10-19)

### Bug Fixes

- Deepsource style fixes. ([e0804b8](https://github.com/lowdefy/lowdefy/commit/e0804b87999e6d812f2d2378770ed214d4264142))

# [4.0.0-rc.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.10...v4.0.0-rc.11) (2023-10-06)

### Bug Fixes

- **deps:** Dependencies patch updates. ([adcd80a](https://github.com/lowdefy/lowdefy/commit/adcd80afe8c752e15c900b88eb4d9be8526c7bcd))

# [4.0.0-rc.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.9...v4.0.0-rc.10) (2023-07-26)

### Features

- **blocks-aggrid:** Update AgGrid to v29.3.5. ([8c6898a](https://github.com/lowdefy/lowdefy/commit/8c6898a6c57d458af2183a03a4b84bb710abfac7))

# [4.0.0-rc.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.8...v4.0.0-rc.9) (2023-05-31)

**Note:** Version bump only for package @lowdefy/blocks-aggrid

# [4.0.0-rc.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.7...v4.0.0-rc.8) (2023-05-19)

**Note:** Version bump only for package @lowdefy/blocks-aggrid

# [4.0.0-rc.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.6...v4.0.0-rc.7) (2023-03-24)

**Note:** Version bump only for package @lowdefy/blocks-aggrid

# [4.0.0-rc.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.5...v4.0.0-rc.6) (2023-03-20)

### Bug Fixes

- **blocks-ag-grid:** Update ag-grid README.md ([f1ee1dc](https://github.com/lowdefy/lowdefy/commit/f1ee1dce278247a4c43766162acfff95c2191696))
- **blocks-aggrid:** onRowClick and onRowSelected events. ([17a9df5](https://github.com/lowdefy/lowdefy/commit/17a9df54a2558112b2f00942ccbcb841a32efc06))

### Features

- **blocks-aggrid:** Add onSortChanged method. ([aa262fb](https://github.com/lowdefy/lowdefy/commit/aa262fb72243c0339ab7dc7563932cd6c5465d36))
- **blocks-aggrid:** Implement loading in AgGrid and AgGridInput. ([80db126](https://github.com/lowdefy/lowdefy/commit/80db126ac9122d4203a283bb6116521716f9a404))
- **blocks-aggrid:** Pass loading through to blocks. ([79d2a6c](https://github.com/lowdefy/lowdefy/commit/79d2a6c15e2fb27be7315d83984a49a615f24a66))
- **blocks-aggrid:** Update all blocks schema.json file. ([70cf5d1](https://github.com/lowdefy/lowdefy/commit/70cf5d1ce7a8055f128a09aed411118e3817c083))
- **docs:** Finalise AgGrid docs and update README. ([0024b34](https://github.com/lowdefy/lowdefy/commit/0024b34d33e4e645d252dea42d895c3751a87202))

# [4.0.0-rc.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.4...v4.0.0-rc.5) (2023-02-24)

**Note:** Version bump only for package @lowdefy/blocks-aggrid

# [4.0.0-rc.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.3...v4.0.0-rc.4) (2023-02-21)

**Note:** Version bump only for package @lowdefy/blocks-aggrid

# [4.0.0-rc.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.2...v4.0.0-rc.3) (2023-02-21)

**Note:** Version bump only for package @lowdefy/blocks-aggrid

# [4.0.0-rc.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.1...v4.0.0-rc.2) (2023-02-17)

**Note:** Version bump only for package @lowdefy/blocks-aggrid

# [4.0.0-rc.1](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.0...v4.0.0-rc.1) (2023-02-17)

### Bug Fixes

- **deps:** Update emotion css dependencies. ([7cc5588](https://github.com/lowdefy/lowdefy/commit/7cc5588d5936e7514f2e2a3400ce18f98d92586d))
- **tests:** Fix jest mocks for es modules in connections. ([e3fadb2](https://github.com/lowdefy/lowdefy/commit/e3fadb2e4fe3bb4948b5f12a752f9356f20e8eb7))

# [4.0.0-rc.0](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.37...v4.0.0-rc.0) (2023-01-05)

**Note:** Version bump only for package @lowdefy/blocks-aggrid

# [4.0.0-alpha.37](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.36...v4.0.0-alpha.37) (2022-12-07)

**Note:** Version bump only for package @lowdefy/blocks-aggrid

# [4.0.0-alpha.36](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.35...v4.0.0-alpha.36) (2022-10-14)

**Note:** Version bump only for package @lowdefy/blocks-aggrid

# [4.0.0-alpha.35](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.34...v4.0.0-alpha.35) (2022-10-05)

**Note:** Version bump only for package @lowdefy/blocks-aggrid

# [4.0.0-alpha.34](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.33...v4.0.0-alpha.34) (2022-09-30)

### Bug Fixes

- **blocks-aggrid:** Add valueType to input blocks. ([89a8d55](https://github.com/lowdefy/lowdefy/commit/89a8d55bdf2cec262e3ea3e487ed6fba41be3bec))

# [4.0.0-alpha.33](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.32...v4.0.0-alpha.33) (2022-09-22)

**Note:** Version bump only for package @lowdefy/blocks-aggrid

# [4.0.0-alpha.32](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.31...v4.0.0-alpha.32) (2022-09-22)

**Note:** Version bump only for package @lowdefy/blocks-aggrid

# [4.0.0-alpha.31](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.30...v4.0.0-alpha.31) (2022-09-21)

**Note:** Version bump only for package @lowdefy/blocks-aggrid

# [4.0.0-alpha.30](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.29...v4.0.0-alpha.30) (2022-09-17)

**Note:** Version bump only for package @lowdefy/blocks-aggrid

# [4.0.0-alpha.29](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.28...v4.0.0-alpha.29) (2022-09-13)

**Note:** Version bump only for package @lowdefy/blocks-aggrid

# [4.0.0-alpha.28](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.27...v4.0.0-alpha.28) (2022-09-12)

**Note:** Version bump only for package @lowdefy/blocks-aggrid

# [4.0.0-alpha.27](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.26...v4.0.0-alpha.27) (2022-09-08)

### Bug Fixes

- **blocks-aggrid:** Import all input types. ([06f753e](https://github.com/lowdefy/lowdefy/commit/06f753ef0dc821ec9f62617b28109e56d3e62347))

# [4.0.0-alpha.26](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.25...v4.0.0-alpha.26) (2022-08-25)

**Note:** Version bump only for package @lowdefy/blocks-aggrid

# [4.0.0-alpha.25](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.24...v4.0.0-alpha.25) (2022-08-23)

**Note:** Version bump only for package @lowdefy/blocks-aggrid

# [4.0.0-alpha.24](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.23...v4.0.0-alpha.24) (2022-08-19)

**Note:** Version bump only for package @lowdefy/blocks-aggrid

# [4.0.0-alpha.23](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.22...v4.0.0-alpha.23) (2022-08-03)

**Note:** Version bump only for package @lowdefy/blocks-aggrid

# [4.0.0-alpha.22](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.21...v4.0.0-alpha.22) (2022-07-12)

### Bug Fixes

- **blocks-aggrid:** Fix typo 😱 ([21eef06](https://github.com/lowdefy/lowdefy/commit/21eef065d00eb1f7e7e9c2d0b180c49848dbec2e))

# [4.0.0-alpha.21](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.20...v4.0.0-alpha.21) (2022-07-11)

### Bug Fixes

- **blocks-aggrid:** Fix typo in processColDefs. ([3073510](https://github.com/lowdefy/lowdefy/commit/307351054100033545606fe1a57d5d03269f28b5))

# [4.0.0-alpha.20](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.19...v4.0.0-alpha.20) (2022-07-09)

### Bug Fixes

- **blocks-aggrid:** Rec fix cellRenderer. ([4bb03b1](https://github.com/lowdefy/lowdefy/commit/4bb03b133ad37cab4404c890caa3b30e2a7cb347))

# [4.0.0-alpha.19](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.18...v4.0.0-alpha.19) (2022-07-06)

### Bug Fixes

- Allow cellRenderer in Aggrid to render html. ([811ef4f](https://github.com/lowdefy/lowdefy/commit/811ef4f28092155172a4e7f8485fb93847453ac4))

# [4.0.0-alpha.18](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.17...v4.0.0-alpha.18) (2022-06-27)

### Features

- **blocks-aggrid:** Add aggrid as a default block. ([3133fee](https://github.com/lowdefy/lowdefy/commit/3133feeefe27b52fecfd352060d7cd25013c5d51))

# [4.0.0-alpha.17](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.16...v4.0.0-alpha.17) (2022-06-24)

### Features

- **blocks-aggrid:** Add aggrid as a default block. ([3133fee](https://github.com/lowdefy/lowdefy/commit/3133feeefe27b52fecfd352060d7cd25013c5d51))
