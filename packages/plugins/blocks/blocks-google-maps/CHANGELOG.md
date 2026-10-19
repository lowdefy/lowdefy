# Change Log

## 7.0.0

### Major Changes

- 36f864c: feat!: Lucide icons replace react-icons, with icon settings and icon-set plugins.

  Lowdefy icons are now [Lucide](https://lucide.dev) icons rendered by `lucide-react`. react-icons names such as `AiOutlineUser` no longer resolve. Run `lowdefy upgrade` to rewrite them, or follow the migration guide at `/v6-to-v7` in the docs.

  Breaking changes:

  - **Icon names.** Use a semantic name (`edit`, `delete`, `chevron-down`, …), a Lucide name in PascalCase (`Pencil`, `Trash`), or a set-qualified name (`lucide:Pencil`). An unknown name at an icon property fails the build with a suggestion; old react-icons and Ant Design names get a migration message.
  - **Block and Ant Design icons are Lucide.** Every icon a block chooses (validation marks, date picker calendar, menu and sidebar toggles, dark-mode switch, upload lists, pagination arrows, …) and Ant Design's own close, status, expand and loading icons now render through semantic names, so they follow the app's icon set and `theme.icons.aliases`.
  - **`theme.icons.aliases` targets lose the `Lu` prefix** (`LuPencil` → `Pencil`), and several semantic names now point at Lucide 1.x names (`delete` → `Trash`, `filter` → `Funnel`, `help` → `CircleQuestionMark`, `history` → `RotateCcwClock`).
  - **Icon hover titles** are generated from the new names ("Pencil", "Arrow left right").

  New:

  - **Icon settings.** `theme.icons.size` (default `1em`), `theme.icons.strokeWidth` (default `2`) and `theme.icons.nonScalingStroke` set app-wide defaults; every icon accepts `strokeWidth` and `nonScalingStroke`.
  - **Icon-set plugins.** A plugin declares `iconSets` in `types.js` and exports icon data from `./iconSets`. Sets are layered in plugin order - the last plugin wins per icon name, and a partial set falls through - so a plugin can add a single icon to `lucide` or replace one. `theme.icons.set` picks the default set for PascalCase names and can re-skin semantic names.
  - **`@lowdefy/icons-react-icons`** holds every react-icons 5.6.0 icon under its old name. Install it and set `theme.icons.set: react-icons` to keep old names, for example icon names stored in a database.
  - **`lowdefy upgrade`** gains a `7.0.0` phase that rewrites react-icons names to semantic or Lucide names from a table covering every Ant Design, Lucide and commonly used react-icons name.

  Fixes: the header locale selector and the AgGrid row menu icons now bundle in production builds, and the dev server reports unknown icon names on pages written inline in `lowdefy.yaml`.

### Minor Changes

- 81bd4f0: feat(blocks-google-maps): add a `PlacesAutocomplete` input block. The block searches the Google Places Autocomplete Data API from inside a `GoogleMapsScript`, ideally one that loads the places library with `libraries: [places]` (otherwise the library is imported on demand). Its value is an object: selecting a suggestion fetches the place fields listed in `fetchFields`, renames them through `resultMapping` (dotted paths nest) and writes them to the value, while typing writes the free text to `labelField`, so a form still holds a usable address when no suggestion is picked. Typing, selecting or clearing removes the fields the previous place wrote, so typed text never keeps another place's coordinates, while sibling keys written by other blocks are preserved. Suggestion requests are debounced (`debounce`, default 250 ms) and share a session token per search. Suggestions can be restricted or biased through `requestOptions`, antd design tokens can be overridden through `theme`, and the block emits `onPlaceChanged` (with the mapped place), `onChange` (with the new value), `onError`, `onSearch`, `onClear`, `onBlur` and `onFocus`. Outside a `GoogleMapsScript`, or when the places library cannot be loaded, it is a plain text input.

### Patch Changes

- 7836aa2: fix: ConfigProvider `componentDisabled` now disables the Lowdefy blocks inside it.

  `componentDisabled: true` on a ConfigProvider block was documented to disable every child
  component, but Lowdefy's input blocks and buttons ignored it: they passed `disabled={false}` to
  antd whenever the block was not loading, and antd lets an explicit `false` beat the
  ConfigProvider. Blocks now pass their `disabled` property through unchanged (and `true` while
  loading), so inside a ConfigProvider with `componentDisabled: true`:

  - Every input, selector, date selector, switch, slider, color selector and button is disabled,
    including TagSelector and TagMultipleSelector pills, SegmentedSelector, RatingSlider,
    PhoneNumberInput, DropdownButton (its hover menu no longer opens either), the ControlledList add
    button and remove icons, and the textInput, selector, switch and buttons cells of the AgGrid
    blocks.
  - A block that sets `disabled: false` itself stays enabled, and `disabled: true` still disables a
    block anywhere.
  - Pasting into an UploadDragger does nothing while it is disabled by the ConfigProvider.

  Nothing changes for blocks outside a ConfigProvider, or when `componentDisabled` is not set. As in
  antd, ParagraphInput, TitleInput (whose `disabled` is a style only) and Pagination don't follow
  `componentDisabled`.

  AutoComplete now matches the other Select-based blocks:

  - New `onOpenChange` event with `{ open }` when the dropdown opens or closes.
  - New `listHeight`, `placement`, `popupMatchSelectWidth` and `virtual` properties, the same as
    Selector.
  - `size: default` is passed to antd as `medium`, so antd 6 no longer warns about it.
  - An empty `prefix` no longer falls back to `prefixIcon`, matching Selector.

- a9442cc: Production pages load only the plugin code they use.

  The production client used to ship every block, action, operator and icon the app uses anywhere in one main bundle, and every first visit downloaded all of it. Now the build writes one small module per distinct page type set, and each page loads its own. On the docs app the main bundle drops from 6,016 kB to 1,021 kB (1,778 kB to 332 kB gzipped). A simple page's first load drops from 1,720 kB to 529 kB gzipped.

  - The HTML preloads the page's chunks alongside the main bundle, so the first page does not wait an extra round trip.
  - Content-hashed assets are served with `Cache-Control: public, max-age=31536000, immutable`, on the Node server and in `lowdefy vercel-output`.
  - Lowdefy's plugin packages declare `"sideEffects": ["**/*.css"]`, so a page that uses one block no longer loads the whole package.
  - The build adds the types a page runs without naming them: the operators the `_js` accessors call, and the actions and operators a block runs for events it registers itself (such as `Request` in `Upload` or `SetLocale` in `PageHeaderMenu`), which blocks list in `meta.actions` and `meta.operators`. Plugin blocks that register their own events should list them the same way.
  - A Dynamic block whose content uses a type its `properties.types` did not declare still works: the page loads the full type set and the server logs a warning naming the type to declare.

  No config changes. The dev server is unchanged.

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

## 6.1.0

### Patch Changes

- Updated dependencies [ea69869]
- Updated dependencies [1d3a0b8]
  - @lowdefy/block-utils@6.1.0

## 6.0.0

### Patch Changes

- 28cb944: feat: Dev server docs and MCP endpoint for AI coding agents

  The dev server now always serves documentation for everything installed in your project — every block, operator, action, connection and request type, from core plugins and your own local plugins — plus the full Lowdefy docs as markdown.

  **Docs API and MCP endpoint (`@lowdefy/server-dev`)**

  - Plain GET routes under `/lowdefy-docs`: list all available types per kind, JSON schemas per type, block usage examples, docs pages as markdown, and search.
  - An MCP endpoint (streamable HTTP) at `/lowdefy-docs/mcp` exposing the same as tools (`lowdefy_list_types`, `lowdefy_get_schema`, `lowdefy_get_examples`, `lowdefy_get_doc`, ...) so agents like Claude Code can look up exact type contracts instead of guessing.
  - The `/lowdefy-docs` page path prefix is now reserved in dev.

  **Discovery build artifacts (`@lowdefy/build`)**

  - Dev builds now write `plugins/availableTypes.json` (every installed type, used or not) and `plugins/connectionSchemas.json` + `plugins/requestSchemas.json` (collected from connection definitions).
  - Fixed custom/local plugin schemas being silently missing from all schema maps — plugin modules now also resolve from the server directory.

  **Docs content package (`@lowdefy/docs-content`)**

  - New package shipping the Lowdefy docs extracted as markdown with a manifest, generated from the docs app build (`pnpm docs:content`).

  **Block plugins**

  - Block packages now publish their `gallery.yaml`/`examples.yaml`/`tests.yaml` files in `dist/`, so the docs API can serve real examples.
  - @lowdefy/block-utils@6.0.0

## 5.6.0

### Patch Changes

- @lowdefy/block-utils@5.6.0

## 5.5.1

### Patch Changes

- @lowdefy/block-utils@5.5.1

## 5.5.0

### Patch Changes

- @lowdefy/block-utils@5.5.0

## 5.4.0

### Patch Changes

- Updated dependencies [0108f38]
  - @lowdefy/block-utils@5.4.0

## 5.3.0

### Patch Changes

- @lowdefy/block-utils@5.3.0

## 5.2.0

### Patch Changes

- @lowdefy/block-utils@5.2.0

## 5.1.0

### Patch Changes

- @lowdefy/block-utils@5.1.0

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

### Patch Changes

- Updated dependencies [29eb199c7f]
- Updated dependencies [130a569d36]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
  - @lowdefy/block-utils@5.0.0

## 4.7.3

### Patch Changes

- @lowdefy/block-utils@4.7.3

## 4.7.2

### Patch Changes

- @lowdefy/block-utils@4.7.2

## 4.7.1

### Patch Changes

- @lowdefy/block-utils@4.7.1

## 4.7.0

### Patch Changes

- @lowdefy/block-utils@4.7.0

## 4.6.0

### Patch Changes

- Updated dependencies [aa0d6d363e]
  - @lowdefy/block-utils@4.6.0

## 4.5.2

### Patch Changes

- @lowdefy/block-utils@4.5.2

## 4.5.1

### Patch Changes

- @lowdefy/block-utils@4.5.1

## 4.5.0

### Patch Changes

- @lowdefy/block-utils@4.5.0

## 4.4.0

### Patch Changes

- @lowdefy/block-utils@4.4.0

## 4.3.2

### Patch Changes

- @lowdefy/block-utils@4.3.2

## 4.3.1

### Patch Changes

- @lowdefy/block-utils@4.3.1

## 4.3.0

### Patch Changes

- @lowdefy/block-utils@4.3.0

## 4.2.2

### Patch Changes

- @lowdefy/block-utils@4.2.2

## 4.2.1

### Patch Changes

- a1f47d97c: Fix Github actions release.
- Updated dependencies [a1f47d97c]
  - @lowdefy/block-utils@4.2.1

## 4.2.0

### Patch Changes

- @lowdefy/block-utils@4.2.0

## 4.1.0

### Patch Changes

- @lowdefy/block-utils@4.1.0

## 4.0.2

### Patch Changes

- @lowdefy/block-utils@4.0.2

## 4.0.1

### Patch Changes

- @lowdefy/block-utils@4.0.1

## 4.0.0

### Patch Changes

- @lowdefy/block-utils@4.0.0

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0-rc.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.14...v4.0.0-rc.15) (2023-12-05)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-rc.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.14) (2023-11-17)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-rc.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.13) (2023-11-17)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-rc.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.11...v4.0.0-rc.12) (2023-10-19)

### Bug Fixes

- Deepsource style fixes. ([e0804b8](https://github.com/lowdefy/lowdefy/commit/e0804b87999e6d812f2d2378770ed214d4264142))
- Deepsource style fixes. ([2086f5d](https://github.com/lowdefy/lowdefy/commit/2086f5d2e8e5665ec5fd16ce83e59119571f833d))

# [4.0.0-rc.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.10...v4.0.0-rc.11) (2023-10-06)

### Bug Fixes

- **deps:** Dependencies patch updates. ([adcd80a](https://github.com/lowdefy/lowdefy/commit/adcd80afe8c752e15c900b88eb4d9be8526c7bcd))
- **deps:** Update dependency @react-google-maps/api to v2.19.2 ([8f69817](https://github.com/lowdefy/lowdefy/commit/8f69817c2f186fe506e3ba83055e665a349619dd))

# [4.0.0-rc.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.9...v4.0.0-rc.10) (2023-07-26)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-rc.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.8...v4.0.0-rc.9) (2023-05-31)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-rc.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.7...v4.0.0-rc.8) (2023-05-19)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-rc.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.6...v4.0.0-rc.7) (2023-03-24)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-rc.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.5...v4.0.0-rc.6) (2023-03-20)

### Bug Fixes

- **blocks-google-maps:** Fix example in README. ([67e7e22](https://github.com/lowdefy/lowdefy/commit/67e7e22a2419e85bb09bc6444486ef13c6caaf14))
- **docs:** Update GoogleMaps blocks docs. Split into GoogleMaps, GoogleMapsHeatmap, GoogleMapsScript. ([262f5a4](https://github.com/lowdefy/lowdefy/commit/262f5a4392ecc3288f802b41cb0a854a01e991d9))

# [4.0.0-rc.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.4...v4.0.0-rc.5) (2023-02-24)

### Bug Fixes

- **blocks-google-maps:** Fix typo in readme. ([4b9582d](https://github.com/lowdefy/lowdefy/commit/4b9582dad8c7f110b6f7ffa896bb70d07488461e))
- **blocks-google-maps:** Fix zoom not working when defaulting to use fitbounds. ([d272512](https://github.com/lowdefy/lowdefy/commit/d272512536be3a82f3578bb0ae36a584024e563b))

### Features

- **blocks-google-maps:** Add ability to add Marker Clusterers to map. ([3b19b49](https://github.com/lowdefy/lowdefy/commit/3b19b496296ae2f1abdc4c1f604006c54d8a2568))
- **blocks-google-maps:** Add examples and descriptions of marker clusterers and new methods. ([8d5cf5f](https://github.com/lowdefy/lowdefy/commit/8d5cf5f99bca908f2c120989c083812ef1224c24))
- **blocks-google-maps:** Update google maps block schema. ([b6b6997](https://github.com/lowdefy/lowdefy/commit/b6b69971074526f21e581efa91e5e6542c02f15e))

# [4.0.0-rc.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.3...v4.0.0-rc.4) (2023-02-21)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-rc.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.2...v4.0.0-rc.3) (2023-02-21)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-rc.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.1...v4.0.0-rc.2) (2023-02-17)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-rc.1](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.0...v4.0.0-rc.1) (2023-02-17)

### Bug Fixes

- **deps:** Dependencies minor version updates ([e50ec30](https://github.com/lowdefy/lowdefy/commit/e50ec30a8bf7dcd38d3ca4cbf68907935939f088))
- **deps:** Update emotion css dependencies. ([7cc5588](https://github.com/lowdefy/lowdefy/commit/7cc5588d5936e7514f2e2a3400ce18f98d92586d))
- **tests:** Fix jest mocks for es modules in connections. ([e3fadb2](https://github.com/lowdefy/lowdefy/commit/e3fadb2e4fe3bb4948b5f12a752f9356f20e8eb7))

# [4.0.0-rc.0](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.37...v4.0.0-rc.0) (2023-01-05)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-alpha.37](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.36...v4.0.0-alpha.37) (2022-12-07)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-alpha.36](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.35...v4.0.0-alpha.36) (2022-10-14)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-alpha.35](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.34...v4.0.0-alpha.35) (2022-10-05)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-alpha.34](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.33...v4.0.0-alpha.34) (2022-09-30)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-alpha.33](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.32...v4.0.0-alpha.33) (2022-09-22)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-alpha.32](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.31...v4.0.0-alpha.32) (2022-09-22)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-alpha.31](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.30...v4.0.0-alpha.31) (2022-09-21)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-alpha.30](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.29...v4.0.0-alpha.30) (2022-09-17)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-alpha.29](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.28...v4.0.0-alpha.29) (2022-09-13)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-alpha.28](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.27...v4.0.0-alpha.28) (2022-09-12)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-alpha.27](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.26...v4.0.0-alpha.27) (2022-09-08)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-alpha.26](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.25...v4.0.0-alpha.26) (2022-08-25)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-alpha.25](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.24...v4.0.0-alpha.25) (2022-08-23)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-alpha.24](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.23...v4.0.0-alpha.24) (2022-08-19)

### Bug Fixes

- **blocks-google-maps:** Fix map jumping when clicking markers. ([6a6c2c7](https://github.com/lowdefy/lowdefy/commit/6a6c2c78acb9d6b565aa9760c4c385c68c75e8d8))
- **google-maps:** update center comparison. ([c0cedb7](https://github.com/lowdefy/lowdefy/commit/c0cedb74159a896bb1b6b5cf44dc183fe5982302))

# [4.0.0-alpha.23](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.22...v4.0.0-alpha.23) (2022-08-03)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-alpha.22](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.21...v4.0.0-alpha.22) (2022-07-12)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-alpha.21](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.20...v4.0.0-alpha.21) (2022-07-11)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-alpha.20](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.19...v4.0.0-alpha.20) (2022-07-09)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-alpha.19](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.18...v4.0.0-alpha.19) (2022-07-06)

**Note:** Version bump only for package @lowdefy/blocks-google-maps

# [4.0.0-alpha.18](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.17...v4.0.0-alpha.18) (2022-06-27)

### Bug Fixes

- **blocks-google-maps:** Fix fitBounds. ([a4748ba](https://github.com/lowdefy/lowdefy/commit/a4748baf4c1b17472df235e681a660dc8871c222))
- **blocks-google-maps:** Fix load script libraries. ([c9376f0](https://github.com/lowdefy/lowdefy/commit/c9376f03cbe57927c57491fa21847350f585bf96))
- **blocks-google-maps:** Fix onLoad event. ([2c1de9a](https://github.com/lowdefy/lowdefy/commit/2c1de9a6f7052981b44e34c7442fe8e1e6496cf8))
- **blocks-google-maps:** Fixes to onLoad. ([1dd08e4](https://github.com/lowdefy/lowdefy/commit/1dd08e4c2c34b2406351cb2e0a11908cf4e6f6ac))
- **dev-server:** Add google maps and aggrid as default types. ([b3fa3a2](https://github.com/lowdefy/lowdefy/commit/b3fa3a24c325cfecd7ae48dc2019523ccab102d4))

### Features

- **blocks-googl-maps:** Update docs. ([fb950b6](https://github.com/lowdefy/lowdefy/commit/fb950b662135bf2163429d813204a7d65da1df33))
- **blocks-google-maps:** Add google maps as a default block. ([b0daaec](https://github.com/lowdefy/lowdefy/commit/b0daaec9fa06972da82a39d9c2ca94da90680b4b))
- **blocks-google-maps:** Add onLoad to maps. ([e9a75df](https://github.com/lowdefy/lowdefy/commit/e9a75df9cb1aaa95838f21ef6485e0ee9a9ce73f))
- **blocks-google-maps:** Switch to @react-google-maps/api. ([3edbd9a](https://github.com/lowdefy/lowdefy/commit/3edbd9aeaff5013f23ed1c173de17828b8be5d5f))
- **blocks-google-maps:** Update Google Maps block docs. ([2657a3c](https://github.com/lowdefy/lowdefy/commit/2657a3c6c390807ba987980407a1fd75fac5dede))

# [4.0.0-alpha.17](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.16...v4.0.0-alpha.17) (2022-06-24)

### Bug Fixes

- **blocks-google-maps:** Fix fitBounds. ([a4748ba](https://github.com/lowdefy/lowdefy/commit/a4748baf4c1b17472df235e681a660dc8871c222))
- **blocks-google-maps:** Fix load script libraries. ([c9376f0](https://github.com/lowdefy/lowdefy/commit/c9376f03cbe57927c57491fa21847350f585bf96))
- **blocks-google-maps:** Fix onLoad event. ([2c1de9a](https://github.com/lowdefy/lowdefy/commit/2c1de9a6f7052981b44e34c7442fe8e1e6496cf8))
- **blocks-google-maps:** Fixes to onLoad. ([1dd08e4](https://github.com/lowdefy/lowdefy/commit/1dd08e4c2c34b2406351cb2e0a11908cf4e6f6ac))
- **dev-server:** Add google maps and aggrid as default types. ([b3fa3a2](https://github.com/lowdefy/lowdefy/commit/b3fa3a24c325cfecd7ae48dc2019523ccab102d4))

### Features

- **blocks-googl-maps:** Update docs. ([fb950b6](https://github.com/lowdefy/lowdefy/commit/fb950b662135bf2163429d813204a7d65da1df33))
- **blocks-google-maps:** Add google maps as a default block. ([b0daaec](https://github.com/lowdefy/lowdefy/commit/b0daaec9fa06972da82a39d9c2ca94da90680b4b))
- **blocks-google-maps:** Add onLoad to maps. ([e9a75df](https://github.com/lowdefy/lowdefy/commit/e9a75df9cb1aaa95838f21ef6485e0ee9a9ce73f))
- **blocks-google-maps:** Switch to @react-google-maps/api. ([3edbd9a](https://github.com/lowdefy/lowdefy/commit/3edbd9aeaff5013f23ed1c173de17828b8be5d5f))
- **blocks-google-maps:** Update Google Maps block docs. ([2657a3c](https://github.com/lowdefy/lowdefy/commit/2657a3c6c390807ba987980407a1fd75fac5dede))
