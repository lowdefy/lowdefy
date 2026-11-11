# Change Log

## 7.2.0

### Patch Changes

- Updated dependencies [31d7de8]
- Updated dependencies [dd5c2b1]
- Updated dependencies [61ae799]
- Updated dependencies [f0209f6]
- Updated dependencies [3cd6d62]
- Updated dependencies [a461f7c]
- Updated dependencies [b1d42ca]
  - @lowdefy/helpers@7.2.0
  - @lowdefy/block-utils@7.2.0

## 7.1.0

### Patch Changes

- @lowdefy/block-utils@7.1.0
- @lowdefy/helpers@7.1.0

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

### Patch Changes

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
- Updated dependencies [99a4f35]
- Updated dependencies [1227e62]
- Updated dependencies [6144814]
- Updated dependencies [cb3551c]
- Updated dependencies [db1a4d3]
- Updated dependencies [575a5ee]
- Updated dependencies [2595439]
- Updated dependencies [f9e483f]
- Updated dependencies [36f864c]
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
  - @lowdefy/helpers@7.0.0
  - @lowdefy/block-utils@7.0.0

## 6.1.0

### Patch Changes

- Updated dependencies [ea69869]
- Updated dependencies [6d6f8fa]
- Updated dependencies [1d3a0b8]
- Updated dependencies [6d6f8fa]
  - @lowdefy/block-utils@6.1.0
  - @lowdefy/helpers@6.1.0

## 6.0.0

### Patch Changes

- 082acec: chore: Bump `yaml` to 2.9.0, clearing vite's `yaml@^2.4.2` peer warning.
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

- Updated dependencies [6446ae6]
  - @lowdefy/helpers@6.0.0
  - @lowdefy/block-utils@6.0.0

## 5.6.0

### Patch Changes

- Updated dependencies [3ead269]
- Updated dependencies [79bbd84]
- Updated dependencies [824f4be]
- Updated dependencies [824f4be]
- Updated dependencies [3ead269]
- Updated dependencies [1a6223f]
- Updated dependencies [3ead269]
  - @lowdefy/helpers@5.6.0
  - @lowdefy/block-utils@5.6.0

## 5.5.1

### Patch Changes

- @lowdefy/block-utils@5.5.1
- @lowdefy/helpers@5.5.1

## 5.5.0

### Patch Changes

- @lowdefy/block-utils@5.5.0
- @lowdefy/helpers@5.5.0

## 5.4.0

### Patch Changes

- Updated dependencies [25225ab]
- Updated dependencies [f11addd]
- Updated dependencies [0108f38]
  - @lowdefy/helpers@5.4.0
  - @lowdefy/block-utils@5.4.0

## 5.3.0

### Patch Changes

- @lowdefy/block-utils@5.3.0
- @lowdefy/helpers@5.3.0

## 5.2.0

### Patch Changes

- @lowdefy/block-utils@5.2.0
- @lowdefy/helpers@5.2.0

## 5.1.0

### Minor Changes

- b1e0c9944: feat(blocks-diff): New package. DataDiff extracted from blocks-antd and split
  into `DiffList`, `DiffSideBySide`, `DiffTimeline`, and `DiffGit` blocks.

  BREAKING: The `DataDiff` block has been removed from `@lowdefy/blocks-antd`.
  Migrate to the per-mode blocks in `@lowdefy/blocks-diff`:

  - `mode: list` → `Diff.DiffList`
  - `mode: sideBySide` → `Diff.DiffSideBySide`
  - `mode: timeline` → `Diff.DiffTimeline`
  - `mode: gitDiff` → `Diff.DiffGit`

  The `diff`, `yaml`, `pluralize`, and `microdiff` dependencies have been moved
  from `@lowdefy/blocks-antd` to `@lowdefy/blocks-diff` along with the block.

### Patch Changes

- @lowdefy/block-utils@5.1.0
- @lowdefy/helpers@5.1.0
