# Change Log

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
