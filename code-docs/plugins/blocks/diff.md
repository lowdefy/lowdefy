# @lowdefy/blocks-diff

Blocks for rendering a user-facing diff between a `before` and an `after` object. Split into four purpose-built blocks so each can evolve independently and advertise its own schema — users pick the visualisation they want rather than toggling a `mode` string on a single block.

## Blocks

| Block            | Visualisation                                              | When to use                             |
| ---------------- | ---------------------------------------------------------- | --------------------------------------- |
| `DiffList`       | Grouped table; changes clustered under their top-level key | Default — best for detail-rich records  |
| `DiffSideBySide` | Before / after columns (paired antd `Descriptions`)        | Reviewing value pairs directly          |
| `DiffTimeline`   | Vertical audit-trail timeline with colour-coded dots       | Change logs / audit surfaces            |
| `DiffGit`        | Unified YAML patch with `+` / `-` line prefixes            | Technical audiences, diff export / copy |

## Shared architecture

All four blocks share a diff engine in `src/shared/`:

- **`buildDiffModel`** — takes raw `before` / `after` values, runs them through [`microdiff`](https://github.com/AsyncBanana/microdiff), enriches each entry with `path`, `pathStr`, `label`, `breadcrumb`, `depth`, and an optional `formatter` from the user's `format` map, then groups by top-level key and collapses any paths deeper than `maxDepth` (default 4) into a single JSON-rendered row.
- **`pathUtils` / `breadcrumbLabel`** — path humanisation and breadcrumb rendering. Array indices become 1-based ordinals (`Order 1`, `Order 2`) via [`pluralize`](https://www.npmjs.com/package/pluralize).
- **`ChangeTypeTag`, `ValueCell`, `formatValue`** — shared UI primitives: change-type badges, old/new value cells (with strikethrough / highlight), and the per-path value formatters (`date`, `datetime`, `boolean`, `currency`, `enum`, `json`, `code`).
- **`serializeYaml`** — stable-sorted YAML serialiser via [`yaml`](https://www.npmjs.com/package/yaml). Only used by `DiffGit`.
- **`DiffShell`** — common block wrapper: title, `classNames`/`styles` plumbing, empty-state rendering.
- **`withTheme`** — copied verbatim from blocks-antd; wraps each block in a scoped `ConfigProvider` when `properties.theme` is an object, so per-block antd design tokens work the same way as the antd pack.

### Mode dispatch

`DiffList`, `DiffSideBySide`, `DiffTimeline` all call `buildDiffModel` with the user's options and hand the result to a renderer under `src/shared/renderers/`. `DiffTimeline` forces `groupByRoot: false` (the timeline is flat).

`DiffGit` bypasses the model — it serialises `before` and `after` to YAML directly and pipes them through [`diff.diffLines`](https://github.com/kpdecker/jsdiff) for a faithful patch output, with `hide` / `show` filtering applied before serialisation.

## Dependencies

- `@ant-design/icons`, `dayjs`, `microdiff`, `pluralize`, `yaml`, `diff`
- `@lowdefy/block-utils`, `@lowdefy/helpers`
- Peer dep on `antd >= 6`, `react >= 18`, `react-dom >= 18`

## Theming

Every block wraps with `withTheme('Descriptions', ...)` (or `withTheme('Timeline', ...)` for `DiffTimeline`) so passing a `theme` object on the block's properties scopes antd design token overrides to the renderer's primary component — see the [antd design token docs](https://ant.design/components/descriptions#design-token) for available tokens.
