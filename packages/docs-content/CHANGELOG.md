# @lowdefy/docs-content

## 6.0.0

### Minor Changes

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

### Patch Changes

- a647873: feat: Agent feedback loop, scaffolding, screenshots, and llms.txt

  Building on the dev server docs/MCP endpoint, agents now get a full edit-verify loop and one-command project setup.

  **Feedback loop (`@lowdefy/server-dev`, `@lowdefy/build`)**

  - The dev build now persists its result to `build/buildStatus.json`, and `GET /lowdefy-docs/build-status` (or the `lowdefy_build_status` MCP tool) returns the current build errors and warnings — with source file and line — plus recent browser runtime errors. Edit config, ask what broke, fix it.
  - `GET /lowdefy-docs/page-config/{pageId}` / `lowdefy_get_page_config`: the fully built page config, or its structured build errors.
  - `GET /lowdefy-docs/find/{id}` / `lowdefy_find_config`: which yaml file (and line) defines a page, block, or request id.

  **Visual verification (`@lowdefy/server-dev`)**

  - `GET /lowdefy-docs/screenshot/{pageId}` / `lowdefy_screenshot_page`: PNG of the rendered page via headless Chromium (playwright-core), so agents can see what they built.

  **Scaffolding (`@lowdefy/server-dev`, `lowdefy` CLI)**

  - `lowdefy_scaffold_page` MCP tool creates a canonical new page file.
  - New `lowdefy agent-setup` CLI command writes `.mcp.json`, a Claude Code skill, and an `AGENTS.md` section into your project (merge-safe).

  **Docs reach**

  - docs.lowdefy.com now serves every docs page as raw markdown at `/md/{section}/{slug}.md`, plus `llms.txt` and `llms-full.txt` for AI crawlers.

- 46029df: feat(blocks-antd): Add `presets` to the date picker blocks.

  `DateRangeSelector`, `DateSelector`, `DateTimeSelector`, `MonthSelector` and `WeekSelector` accept a
  `presets` array that renders quick select shortcuts next to the calendar, like antd's
  [preset ranges](https://ant.design/components/date-picker#date-picker-demo-preset-ranges).

  A preset is a `label` (supports html) and a `value`. `DateRangeSelector` takes a `[from, to]` pair,
  the other blocks take a single date. Values are dates — a date string, a timestamp, or a `_date`
  object — so relative shortcuts are built with the existing operators, and are re-evaluated on every
  render instead of being frozen at page load:

  ```yaml
  - id: report_period
    type: DateRangeSelector
    properties:
      presets:
        - label: Last 7 Days
          value:
            - _dayjs: [now, { subtract: [7, days] }, { format: YYYY-MM-DD }]
            - _dayjs: [now, { format: YYYY-MM-DD }]
        - label: Month to date
          value:
            - _dayjs: [now, { startOf: month }, { format: YYYY-MM-DD }]
            - _dayjs: [now, { format: YYYY-MM-DD }]
        - label: 2026 Q1
          value: ['2026-01-01', '2026-03-31']
  ```

  The date pickers read a preset as UTC, the same as the block value, so a fixed date like
  `2026-01-01` selects the day it names in every timezone. A date relative to now is an instant rather
  than a calendar date, so end a `_dayjs` chain with a `format` step, as above — a chain that resolves
  to an instant can select the day, month or week before or after the current one, depending on the
  browser timezone and the time of day.

  `DateTimeSelector` selects an instant, so `_date: now` and plain `_dayjs` chains are all it needs. It
  follows its `selectUTC` setting: with it the instant is shown on the UTC clock, without it on the
  local clock.

  Presets respect `disabledDates`. A preset is offered on the same terms as the calendar cells: a
  `DateRangeSelector` range that starts or ends on a disabled date is narrowed to the dates it may
  select, so a `Last 7 days` shortcut next to `disabledDates.min: now` selects today rather than
  silently doing nothing. A shortcut with nothing it may select is listed as disabled.

- 16fdeb8: fix(client): Make the `Link` action honour `href`.

  `createLink` routes `href` to `newOriginLink`, but the action's `newOriginLink` in
  `setupLink.js` only ever read `url` — so `{ type: Link, params: { href: '/some/path' } }`
  navigated to the literal string `"undefined"`. The anchor renderer used for `Link` blocks
  (`createLinkComponent.js`) already prefers `href` over `url`; this brings the action to the
  same precedence, and `href` is used verbatim: no protocol added, no `urlQuery` appended.

  That verbatim handling is the point of having the parameter at all. `url` means an external
  address and gains an `https://` prefix when the value has no scheme, which turns a
  root-relative `/reports?id=1` into a request for a host named `reports`. `href` is how you
  link to a same-origin path, a fragment, or any address that must be passed through as
  written — so the fix removes the need to work around `url`'s prefixing.

  `href` was also missing from the `Link` action docs, which is presumably how the gap went
  unnoticed. Documented alongside the fix.
