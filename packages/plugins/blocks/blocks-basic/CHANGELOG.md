# Change Log

## 7.1.0

### Patch Changes

- @lowdefy/block-utils@7.1.0
- @lowdefy/helpers@7.1.0

## 7.0.0

### Major Changes

- 575a5ee: feat(blocks-basic)!: `ClickableHtml` fires only the events its `dataEvents` property lists.

  **Breaking:** a `data-event` in a `ClickableHtml` block's HTML now fires its event only when the
  block's new `dataEvents` property lists that event. A block without `dataEvents` fires no events
  from its HTML, and a click on an unlisted `data-event` does nothing and logs a console warning.
  Until now any `data-event` in the HTML fired the block event it named. HTML is often built from
  request or user data, and sanitising keeps `data-*` attributes, so the block now has the author
  say which events its HTML may fire.

  ```yaml
  - id: rows
    type: ClickableHtml
    properties:
      dataEvents:
        - onEdit
        - name: onDelete
          confirm: Delete this row?
      html: ...
  ```

  An entry is an event name, or `{ name, confirm }`. With `confirm`, every click on the event asks
  first whatever the markup says: `confirm: true` uses the element's `data-confirm` message or "Are
  you sure?", and a string is the message. Any `confirm` other than `false` asks, so an empty or
  missing message still asks, with the default message. Unlisted targets are no longer made keyboard
  focusable.

  To migrate, run `lowdefy upgrade`: the `clickable-html-data-events` codemod adds `dataEvents` to
  each `ClickableHtml` block and reports HTML built from data that inserts values without escaping
  them. `ClickableHtml` blocks that `Dynamic` content builds at page load, from config stored outside
  the app's files, need `dataEvents` added where that config lives. The docs now state that HTML
  built from user or request data must escape that data.

  `HtmlComponent` in `@lowdefy/block-utils` takes the list as its `dataEvents` prop, next to
  `onDataEvent`, and applies it inside popover content too.

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

- 1227e62: feat: Table, grid, Anchor and HTML links carry `pathParams`

  Links set as block properties fill a page path's placeholders with `pathParams`, next to `urlQuery`. In TableLight, Table and AgGrid cell and row links the values are row field paths, as `urlQuery` values are there: `link: { pageId: ticket, pathParams: { ticket_id: _id } }`. A relation cell defaults `urlQuery` to `{ _id: _id }` only when neither `urlQuery` nor `pathParams` is set. `Anchor` takes `pathParams`, and an HTML link takes `data-path-params` as a JSON object: `<a data-page-id="ticket" data-path-params='{"ticket_id":"1"}'>`.

  AgGrid link and avatar link cells now build their href through the Lowdefy Link, so it includes the app's `basePath`. A plain click still emits `onCellLink` without navigating.

- 81bd4f0: feat(blocks-basic): new `PollingTimer` block

  A headless block that renders nothing and triggers its `onTick` event every `interval`
  milliseconds while it is running, for polling a request until a background job completes
  or refreshing a page on a schedule. The next tick is scheduled `interval` ms after the
  `onTick` actions finish, so a slow request never makes ticks overlap. It is started and
  stopped with the `start`, `stop` and `toggle` methods, or with `autoStart` on mount, and it
  always stops when the block unmounts. The `onTick` event carries the tick count as
  `{ tick }`, `maxTicks` stops the timer after a given number of ticks, and `pauseWhenHidden`
  (on by default) pauses ticking while the browser tab is hidden and resumes when it becomes
  visible again.

- f889c26: feat: dynamic blocks policies. Declare `policies.dynamicBlocks` in `lowdefy.yaml` to render block config stored as data — generated forms, model output — through a `Dynamic` block within limits the app sets. A policy lists the blocks, actions, operators, endpoints, requests, pages and origins content may use, an optional state path it must write under, whether HTML is allowed, and size, depth and actions-per-event limits. It requires literal values wherever content names a target.

  - `Dynamic` blocks take `properties.policy`. The policy's types are bundled into the page, and the resolved content is checked against the policy on every page get; a violation renders the fallback and logs each rule broken.
  - New built-in routine step `ValidateDynamic` runs the same check and returns `{ valid, errors, blocks }`, with a content path, rule and message per error, for a generator to correct and retry. In a Dynamic block's endpoint, `_step: <stepId>.blocks` of a passing step with the block's policy is returned as config; all other data stays literal.
  - New built-in routine step `DescribeDynamicPolicy` returns what a policy allows, with the schemas of its blocks, actions and operators, to build a model's prompt from.
  - The build validates policies (installed types, exact origins, no `Dynamic` or `_operator`), checks their pages, endpoints and requests on every page that hosts them, and warns when a policy without HTML lists operators that build strings.

- 239a3a7: feat: dates, numbers, avatars, copy buttons, truncation, text tones and confirmations in HTML.

  - **Dates.** `<time datetime="…" data-time="relative">` shows "3 hours ago" and keeps it current, with the exact time on hover. `date`, `datetime` and `time` use the app's locale, and any other value is a dayjs format. Dates show in the reader's time zone.
  - **Numbers.** `data-format` formats the element's number as `number`, `currency` (with `data-currency="USD"`), `percent`, `compact` or `bytes`, with the same formatting as the ag-grid `number` cells; `data-decimals` fixes the decimals.
  - **Avatars.** `data-avatar="Jane Doe"` renders initials in a theme colour, the same as the ag-grid `avatar` cells, and on an `<img>` replaces a missing or broken image. No image service is called.
  - **Copy.** `data-copy` adds an accessible copy button for the element's text or the attribute's value. The copy and check icons are always bundled, and the labels are the new `client.copy`, `client.copyValue`, `client.copied` and `client.copyFailed` translation keys.
  - **Truncation.** `data-truncate` (or `data-truncate="3"`) clamps text to 1–6 lines with an ellipsis and shows the full text in a tooltip only when it is cut off, the same clamp as the ag-grid `ellipsis` columns.
  - **Text tone.** `data-tone="secondary"` (also `tertiary`, `quaternary`, `success`, `warning`, `error`, `info`) colours text with theme tokens that follow dark mode.
  - **Confirm.** In `ClickableHtml`, `data-confirm="Delete this row?"` on a `data-event` element opens a themed confirmation first; only OK fires the event, once. Focus moves to Cancel and returns afterwards, and Escape cancels. A change to the HTML closes it without firing. A bare `data-confirm` asks the new `client.confirm` message ("Are you sure?").
  - **Keyboard.** Space now activates focusable `data-event` targets and popover triggers on key up, like a native button.

- 49490b6: feat: in-app links and status tags in HTML.

  - **Links.** In any HTML string, `<a data-page-id="contacts" data-url-query="_id=42">` links to an app page: Lowdefy sets the `href` (with the app's `basePath`), and a plain click opens the page without reloading the app, like a `Link` action. `data-link` does the same for an existing app-relative `href="/path"`; a `data-page-id` or `data-link` that does not resolve to a page of the app is left as written. `data-new-tab` opens any link in a new tab (sanitising removes `target`, so `target="_blank"` never worked in HTML). The build warns when a `data-page-id` in page config or in an API endpoint names a page that does not exist, with a suggestion for a likely typo.
  - **Status tags and dots.** `<span data-tag="success">Approved</span>` renders a tinted tag and `data-status="warning"` a status dot, in theme colours that follow dark mode. Values are antd status names and preset colours, CSS colours, or any other value, which picks a stable colour. HTML tags look exactly like the ag-grid `tag` cells: both now use the same formatting code in `@lowdefy/block-utils`.
  - **Docs.** A new HTML attributes page describes every attribute HTML understands, and the Html block's schema, hazards and examples teach agents to use them instead of hard-coded hrefs and inline-styled pills.

- a79fb1d: feat: semantic icon names, and icons, tooltips and popovers in HTML.

  - **Semantic icon names.** Anywhere an icon name is accepted you can now write a name like `edit`, `delete`, `warning` or `external-link` (67 built-in names plus Ant Design spellings like `plus` and `setting`). They map to Lucide icons, so apps look consistent without picking a pack per icon. Add or override names with `theme.icons.aliases` in `lowdefy.yaml`, and list icon names that only exist at runtime under `theme.icons.include`. Existing React Icons names work exactly as before, and the build still bundles only the icons your config uses.
  - **Icons, tooltips and popovers in HTML.** Every block that renders HTML (`Html`, `ClickableHtml`, `DangerousHtml`, and HTML properties such as Tooltip and Card titles) understands `<i data-icon="edit"></i>`, `data-tooltip="Text"`, and `data-popover="id"` with a matching `data-popover-content="id"` element. Tooltips and popovers use the app's antd theme and load on first use. An open popover stays open with its new content when the HTML changes, as long as the new HTML still has its trigger. In `ClickableHtml`, `data-event` targets are now keyboard focusable (Enter and Space click them), and a `data-event` inside a popover fires and closes it.
  - **Icon fixes.** Icons no longer remount on every parent render, an icon that failed recovers when its name changes, and a clickable `Icon` block is keyboard focusable.
  - **Agents.** The dev server adds `lowdefy_search_icons` and `GET /lowdefy-docs/icons?q=`, and the agent setup files explain the icon and HTML conventions.

### Patch Changes

- 99a4f35: Update dependencies to releases with published security fixes.

  - `axios` 1.20.0 in the CLI and AxiosHttp.
  - `dompurify` 3.4.16 in `block-utils`, `blocks-basic` and `blocks-markdown`.

  **`dompurify` 3.4.16** keeps the SVG `pointer-events` and `vector-effect` attributes, which earlier releases removed. HTML rendered by `Html`, `ClickableHtml`, `DangerousHtml`, `DangerousMarkdown` and other `renderHtml` properties may keep them.

- cb3551c: fix(blocks): Clicks inside a Modal or Drawer no longer fire the parent block's onClick

  React bubbles events through the component tree, so a click inside a Modal, Drawer or dropdown also reached the Box, Card, Span or Dynamic block that contained it in config, even though the popup renders elsewhere in the document. A Modal placed in a clickable Box that opens it would reopen as soon as its Cancel, OK or close button was clicked. These blocks now fire `onClick` (and Box `onPaste`) only for events from DOM they contain, using the new `isEventFromDomDescendant` helper from `@lowdefy/block-utils`. Fixes #1188.

- 26d905c: `DangerousHtml` warns in the browser console when `DOMPurifyOptions` change after mount instead of ignoring the change silently.
- d2c8e01: feat(api)!: Data read into a Dynamic block's `:return` stays data.

  **Breaking:** a Dynamic block without a dynamic blocks policy no longer renders blocks or actions that its endpoint read as data. In v6, stored operator-free block config returned from a Dynamic endpoint rendered as it was; in v7 the block renders its fallback. Every block and action in the returned content must be written in the endpoint's `:return` config. A block or action that is data an operator returned (a step result, routine state, the payload, a `:for` item, a nested endpoint's result), or a copy or extension of one made with `_get`, `__args` or `__object.assign`, fails resolution. Operators that only pass their checked params through (`_if`, `_switch`, `_if_none`, `_get`, `_args`, `_function`, `_log`, `_array`, and `_object` except `fromEntries` and `defineProperty`) may return written config; content that breaks the rule renders the fallback, with an error naming the operator and the path in its result. Blocks built up in routine state, returned by a nested endpoint, looped over with `_item`, or built by `_js`/`_jsonata` fail: build them inside `:return` with `_array.map`/`_array.concat`, share block config with `_ref`, and write client operators (`__state`, `_array.map` callbacks) in the `:return` config. Data may still fill values inside written blocks, as in the documented `_array.map` pattern, and a block built by config from a stored field renders even when it equals the field. To render stored or generated block config, put the Dynamic block under a dynamic blocks policy and return the content through a `ValidateDynamic` step. See the v6 to v7 migration guide.

  Also:

  - Only operator keys lose their escaping underscore in the returned content (`__state` becomes `_state`); data keys such as `__typename` pass through unchanged.
  - Data read into a Dynamic `:return` may nest at most 200 levels deep, and dynamic blocks policy content likewise (`limits.depth`); deeper data fails resolution with an error saying so.
  - An object from data that `_object.assign` merges with other config can no longer end up as an operator on the client, for example next to a key whose value is a function or evaluates to undefined.
  - Only keys that name one of the app's operators count as operators: in the literal data check an installed client or server operator, in dynamic blocks policies and the fragment build a client operator. Data such as `{ _score: 0.5 }` or `{ _source: { ... } }` now renders as data instead of failing. The build writes `plugins/clientOperators.json` with every client operator name the app knows.
  - Dynamic blocks policies: with `state` set, every `_state` read in the content must name a literal key under that path. URLs are judged by the block's properties schema, which now marks URL-valued properties with `urlKind` (`Search` `indexUrl`, `QRCode` `icon`, `Watermark` `image`, `Tour` step covers, avatar and logo sources, link `url`s and `href`s, `Img` `src`/`srcSet`, AgGrid link cells), whatever the property is called. Every value no schema marks is still judged by its key name; `urlKind: false` opts a URL-named property out (`Search` `result.url`, the Tiptap `image` settings). URLs are read as the browser's URL parser reads them, so surrounding spaces and embedded tabs or newlines do not change the verdict.

- eaa6517: feat(server-dev): Return contextual hazards from the dev MCP with schemas, docs and config lookups.

  `lowdefy_get_schema`, `lowdefy_get_doc` (by kind and type) and `lowdefy_find_config` (per match) now
  include `hazards: [{ id, message, see }]` — behaviours of a type that its schema does not show, such as
  `Html` stripping `<style>`, a closed `Modal` keeping its state, `_state` being `undefined` inside request
  properties, or the tenant wall injecting a `$match` into every `$lookup` of a request over a walled
  connection (`tenant-wall-lookup`, returned only when the request's connection is walled).

  Hazards come from two channels. Plugins declare type-attached hazards through `meta.hazards`: the build
  now carries them into `plugins/blockMetas.json`, request metas already ride along in
  `plugins/requestSchemas.json`, and operator packages can export a `./metas` module which the build
  writes to the new `plugins/operatorMetas.json`. Framework-level hazards ship hand-authored in
  `@lowdefy/docs-content/hazards.json`. Seeds: `Html`, `DangerousHtml`, `Modal` and `_js` carry their
  first hazards; the docs describe hazards and the `meta.hazards` plugin contract.

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

### Minor Changes

- ea69869: feat(blocks-basic): add the `ClickableHtml` block. It renders sanitised HTML like `Html`, and additionally fires a named event when an element carrying a `data-event` attribute inside the markup is clicked: `data-event="onEditClick"` fires the block's `onEditClick` event, so a single block of markup can carry many clickable targets, each with its own action chain, without a block per button. The event object holds the element's other `data-*` attributes with snake_case keys (`data-record-id` → `record_id`). `HtmlComponent` in `@lowdefy/block-utils` now accepts an `onClick` prop.

### Patch Changes

- 1d3a0b8: Update dependencies to releases with published security fixes.

  - `hono` 4.13.5 and `@hono/node-server` 2.0.10 in the servers.
  - `ws` 8.21.0 in the servers; `postcss` 8.5.23 in the dev server.
  - The servers drop leftover Next.js-era dependencies they no longer use: `@sentry/nextjs` from `@lowdefy/server`, and the `webpack` and `@next/eslint-plugin-next` devDependencies.
  - `axios` 1.18.0 in the CLI and AxiosHttp.
  - `dompurify` 3.4.13 in `block-utils`, `blocks-basic` and `blocks-markdown`.
  - `echarts` 6.1.0, `mysql2` 3.23.1, `nodemailer` 9.1.1, `uuid` 13.0.1 and `@auth/mongodb-adapter` 3.11.3 in their plugins.
  - `tar` 7.5.21 and `picomatch` 4.0.4 in the build, `js-yaml` 4.3.2 in `e2e-utils`, and `@babel/core` 7.29.6 in `block-utils`.
  - `@auth/core` 0.41.3 in the servers and `plugin-next-auth`, whose peer range is now `>=0.41.3`. `@auth/mongodb-adapter` 3.11.3 depends on the same release.

  Two of these change output an app can see:

  - **`echarts` 6.1.0** changes chart defaults. Bar, pictorialBar, candlestick and boxplot series no longer draw past the grid edge; set `containShape: false` on the axis to restore the previous look. `axis.startValue` no longer sets `min`. The second argument of a `tooltip.valueFormatter` function is now `rawDataIndex`.
  - **`dompurify` 3.4.13** keeps a few attributes and elements that earlier releases removed: `command` / `commandfor`, `<selectedcontent>`, and some SVG attributes. HTML rendered by `Html`, `ClickableHtml`, `DangerousHtml`, `DangerousMarkdown` and other `renderHtml` properties may keep them.

- Updated dependencies [ea69869]
- Updated dependencies [6d6f8fa]
- Updated dependencies [1d3a0b8]
- Updated dependencies [6d6f8fa]
  - @lowdefy/block-utils@6.1.0
  - @lowdefy/helpers@6.1.0

## 6.0.0

### Minor Changes

- e0a06a2: feat: Dynamic page content — server-resolved blocks at page load.

  Pages can now include a `Dynamic` block whose content is resolved on the server at page load by an api endpoint routine. The routine returns block config; the server builds and validates it, splices it into the page, and the client renders the result like any other page.

  **`Dynamic` block (`@lowdefy/blocks-basic`)**

  - New container block configured with `properties.endpointId`, static `params`, an optional `fallback` slot rendered when resolution fails, and `required: true` to fail the page load instead.
  - `properties.types` declares extra block, action and operator types the endpoint may return, so build includes them in the client bundle.

  **Server resolution (`@lowdefy/api`, `@lowdefy/server`, `@lowdefy/server-dev`)**

  - The endpoint is called in-process during page get with a payload of `{ params, pageId, blockId, urlQuery }` — the page request's query string is forwarded on both initial loads and SPA navigations.
  - Returned blocks are validated before reaching the client: types must be in the client bundle, block properties are checked against plugin schemas (operator values are exempt), and `Request` and `CallAPI` action references are verified.
  - Nested `Dynamic` blocks resolve recursively up to 5 levels; endpoint auth is enforced per resolution.
  - Client-evaluated operators in returned config are escaped with one extra underscore (`__state` → `_state`), the same deferral convention as `_function` args — a plain `_state` evaluates against the routine's own state.

  **Build (`@lowdefy/build`)**

  - Validates `Dynamic` block config, flags dynamic pages in the page artifact, and bundles declared types.
  - New `@lowdefy/build/dynamic` entry builds and validates runtime block config with the same pipeline as static pages.

  **Engine (`@lowdefy/engine`)**

  - Dynamic pages build a fresh context on every navigation, since the server may resolve different content per request.

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

### Patch Changes

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

- 130a569d36: Add keyboard shortcut support for block events.

  Blocks can now define keyboard shortcuts on events using the `shortcut` property in the event long-form object. Shortcuts are platform-aware (`mod+K` maps to Cmd+K on Mac, Ctrl+K on Windows), support sequences (`g i`), and can be arrays for multiple bindings.

  - **Build validation** warns on duplicate shortcuts within a page and conflicts with browser defaults (e.g. `mod+N`)
  - **ShortcutManager** registers a single global keydown listener via tinykeys with visibility gating and input field suppression
  - **ShortcutBadge** component renders platform-appropriate key symbols (e.g. `⌘ K`) and is available to all blocks via `components.ShortcutBadge`
  - **ShortcutBadge in blocks**: Button, Anchor, Tag, and Search blocks display a platform-aware keyboard shortcut badge (e.g. `⌘S` / `Ctrl+S`) next to the title when the event has a `shortcut` defined

### Patch Changes

- 52ea769811: Fix Anchor block icon spacing by adding `marginRight: 4` to the icon style so the icon doesn't sit flush against the title text.
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

- 811f80760: fix(e2e-utils): Escape dotted block IDs in e2e CSS selectors.

  Block IDs containing dots (e.g., `form.field.name`) now work correctly in e2e test locators. Added `escapeId()` utility to `@lowdefy/e2e-utils` that escapes CSS special characters, and updated all block e2e helpers and test specs to use it.

- Updated dependencies [4543688f7]
- Updated dependencies [dea6651a1]
  - @lowdefy/helpers@4.7.0
  - @lowdefy/block-utils@4.7.0

## 4.6.0

### Minor Changes

- fb7910f62: test(blocks): Add comprehensive Playwright e2e tests for blocks-antd and blocks-basic

  **@lowdefy/block-dev-e2e** (new package)

  - Shared test utilities for block e2e testing in the monorepo
  - `createPlaywrightConfig` for consistent Playwright setup
  - `getBlock` helper using framework wrapper ID pattern (`#bl-{blockId}`)
  - `navigateToTestPage` for test page navigation

  **@lowdefy/blocks-antd**

  - ~700 e2e tests covering all 63 blocks
  - Test coverage for input, display, layout, navigation, and overlay blocks
  - Block-specific e2e helpers (Button, TextInput, Selector)

  **@lowdefy/blocks-basic**

  - ~40 e2e tests covering core blocks (Box, Span, Anchor, Html, etc.)

- aa0d6d363e: feat: Config-aware error tracing and Sentry integration

  **Config-Aware Error Tracing (#1940)**

  - Errors now trace back to exact YAML config locations with file:line
  - Clickable VSCode links in terminal and browser
  - Build-time validation catches typos with "Did you mean?" suggestions
  - Service vs Config error classification

  **Plugin Error Refactoring**

  - Operators throw simple error messages without formatting
  - Parsers (WebParser, ServerParser, BuildParser) format errors with received value and location
  - Removed redundant "Operator Error:" prefix from error messages
  - Consistent error format: "{message} Received: {params} at {location}."
  - Actions and connections also simplified: removed inline `received` from error messages (interface layer adds it)
  - Connection plugins (axios-http, knex, redis, sendgrid) no longer expose raw response data in errors

  **Error Class Hierarchy**

  - Unified error system in `@lowdefy/errors` with all error classes
    - `@lowdefy/errors/build` - Build-time classes with sync location resolution
  - Error classes: `LowdefyError`, `ConfigError`, `ConfigWarning`, `PluginError`, `ServiceError`
  - `ConfigWarning` supports `prodError` flag to throw in production builds
  - `ServiceError.isServiceError()` detects network/timeout/5xx errors
  - `~ignoreBuildChecks` cascades through descendants to suppress warnings/errors

  **Build Error Collection**

  - Errors collected in `context.errors[]` instead of throwing immediately
  - `tryBuildStep()` wrapper catches and collects errors from build steps
  - All errors logged together before summary message for proper ordering

  **Sentry Integration (#1945)**

  - Zero-config Sentry support - just set SENTRY_DSN
  - Client and server error capture with Lowdefy context (pageId, blockId, config location)
  - Configurable sampling rates, session replay, user feedback
  - Graceful no-op when DSN not set

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

- 7fa709f19: Add onPaste property to Box.
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

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-rc.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.14) (2023-11-17)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-rc.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.13) (2023-11-17)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-rc.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.11...v4.0.0-rc.12) (2023-10-19)

### Bug Fixes

- Deepsource style fixes. ([e0804b8](https://github.com/lowdefy/lowdefy/commit/e0804b87999e6d812f2d2378770ed214d4264142))

# [4.0.0-rc.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.10...v4.0.0-rc.11) (2023-10-06)

### Bug Fixes

- **blocks:** Add onTextSelection to Paragraph and document. ([7325633](https://github.com/lowdefy/lowdefy/commit/7325633d27adb876734e62140fc3e97b7e4ff119))
- **deps:** Dependencies patch updates. ([adcd80a](https://github.com/lowdefy/lowdefy/commit/adcd80afe8c752e15c900b88eb4d9be8526c7bcd))
- **deps:** Update dependency dompurify to v3.0.5 ([62204c5](https://github.com/lowdefy/lowdefy/commit/62204c5e25603eb997a3021d7efe57f2fb9250a9))

### Features

- **blocks:** Add onTextSelection event to Html. ([4f00d5e](https://github.com/lowdefy/lowdefy/commit/4f00d5e8851e21d0409539b18f4ee8182a92ddcc))

# [4.0.0-rc.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.9...v4.0.0-rc.10) (2023-07-26)

### Bug Fixes

- **deps:** update dependency dompurify to v2.4.7 ([5b3709b](https://github.com/lowdefy/lowdefy/commit/5b3709b00ee002f6e56c7d525fe2314c4f68ff3e))

# [4.0.0-rc.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.8...v4.0.0-rc.9) (2023-05-31)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-rc.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.7...v4.0.0-rc.8) (2023-05-19)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-rc.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.6...v4.0.0-rc.7) (2023-03-24)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-rc.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.5...v4.0.0-rc.6) (2023-03-20)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-rc.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.4...v4.0.0-rc.5) (2023-02-24)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-rc.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.3...v4.0.0-rc.4) (2023-02-21)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-rc.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.2...v4.0.0-rc.3) (2023-02-21)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-rc.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.1...v4.0.0-rc.2) (2023-02-17)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-rc.1](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.0...v4.0.0-rc.1) (2023-02-17)

### Bug Fixes

- **blocks-basic:** Update Anchor schema. ([7ce7d15](https://github.com/lowdefy/lowdefy/commit/7ce7d1588b97699c5a9d830cd765f5c413a972fb))
- **deps:** Update emotion css dependencies. ([7cc5588](https://github.com/lowdefy/lowdefy/commit/7cc5588d5936e7514f2e2a3400ce18f98d92586d))
- **deps:** Update minor versions of util packages. ([2d7a2a5](https://github.com/lowdefy/lowdefy/commit/2d7a2a55c88f0ee33eff49e5ff541f6296ec4337))
- **tests:** Fix jest mocks for es modules in connections. ([e3fadb2](https://github.com/lowdefy/lowdefy/commit/e3fadb2e4fe3bb4948b5f12a752f9356f20e8eb7))

# [4.0.0-rc.0](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.37...v4.0.0-rc.0) (2023-01-05)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.37](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.36...v4.0.0-alpha.37) (2022-12-07)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.36](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.35...v4.0.0-alpha.36) (2022-10-14)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.35](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.34...v4.0.0-alpha.35) (2022-10-05)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.34](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.33...v4.0.0-alpha.34) (2022-09-30)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.33](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.32...v4.0.0-alpha.33) (2022-09-22)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.32](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.31...v4.0.0-alpha.32) (2022-09-22)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.31](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.30...v4.0.0-alpha.31) (2022-09-21)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.30](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.29...v4.0.0-alpha.30) (2022-09-17)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.29](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.28...v4.0.0-alpha.29) (2022-09-13)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.28](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.27...v4.0.0-alpha.28) (2022-09-12)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.27](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.26...v4.0.0-alpha.27) (2022-09-08)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.26](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.25...v4.0.0-alpha.26) (2022-08-25)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.25](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.24...v4.0.0-alpha.25) (2022-08-23)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.24](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.23...v4.0.0-alpha.24) (2022-08-19)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.23](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.22...v4.0.0-alpha.23) (2022-08-03)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.22](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.21...v4.0.0-alpha.22) (2022-07-12)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.21](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.20...v4.0.0-alpha.21) (2022-07-11)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.20](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.19...v4.0.0-alpha.20) (2022-07-09)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.19](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.18...v4.0.0-alpha.19) (2022-07-06)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.18](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.17...v4.0.0-alpha.18) (2022-06-27)

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.14...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.17](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.16...v4.0.0-alpha.17) (2022-06-24)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.14) (2022-06-19)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.12...v4.0.0-alpha.13) (2022-06-16)

### Bug Fixes

- Update all packages to use @lowdefy/jest-yaml-transform. ([7bdf0a4](https://github.com/lowdefy/lowdefy/commit/7bdf0a4bb8ea972de7e4d4b82097a6fdaebfea56))

### Features

- Package updates. ([e024181](https://github.com/lowdefy/lowdefy/commit/e0241813d1276316f0f04897b664c43e24b11d23))
- React 18 update. ([55268e7](https://github.com/lowdefy/lowdefy/commit/55268e74ea08544ce816e85e205cd2093e0f2319))

# [4.0.0-alpha.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.11...v4.0.0-alpha.12) (2022-05-23)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.10...v4.0.0-alpha.11) (2022-05-20)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.9...v4.0.0-alpha.10) (2022-05-06)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.8...v4.0.0-alpha.9) (2022-05-06)

### Bug Fixes

- **blocks-basic:** Fix tests and snapshots. ([b9e6f1c](https://github.com/lowdefy/lowdefy/commit/b9e6f1ce19d5805299fbfb8f0ec846b6d6cdee6a))
- **blocks:** Fix icon names in examples. ([0d28534](https://github.com/lowdefy/lowdefy/commit/0d285347cdccd3a5f5c0531b5ee069d0e735287c))
- Fix bugs in icon and icon usage in docs. ([03858f4](https://github.com/lowdefy/lowdefy/commit/03858f43502404de39024b38fac1c5f87d5c99ca))
- Fix icon names. ([2e81f58](https://github.com/lowdefy/lowdefy/commit/2e81f589fba193e7039dc7c099855831ff9a61fb))

### Features

- **blocks-antd:** Update snapshots. ([5f5ef00](https://github.com/lowdefy/lowdefy/commit/5f5ef001c203b6c85564184683ece5fd968eea37))
- **blocks:** Add skeletons to blocks meta. ([ba34939](https://github.com/lowdefy/lowdefy/commit/ba349397359d4f54d7850536329ec0682ffcf89c))
- **blocks:** Remove loading prop from blocks. ([fc2def3](https://github.com/lowdefy/lowdefy/commit/fc2def366c7f23d09622a60e3d716f6c995ef4e6))
- **blocks:** Remove skeleton definition on blocks. ([f938a51](https://github.com/lowdefy/lowdefy/commit/f938a51268a7c0e5fa129c0628662890b635c8c7))

# [4.0.0-alpha.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.7...v4.0.0-alpha.8) (2022-03-16)

### Bug Fixes

- **blocks-antd:** Icon name corrections. ([7fa29e4](https://github.com/lowdefy/lowdefy/commit/7fa29e4290d533f252390cf48f2059c178ca7c34))
- Revert back to react 17.0.2. ([1b38fd3](https://github.com/lowdefy/lowdefy/commit/1b38fd3e743ee7286468c7c1e2f623838dd5ed84))

# [4.0.0-alpha.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.6...v4.0.0-alpha.7) (2022-02-21)

### Bug Fixes

- **blocks-basic:** Refactored tests to use new Block config. ([37ba69d](https://github.com/lowdefy/lowdefy/commit/37ba69dd60301cbdbbba88bbab2f0b9573c77608))
- **deps:** Update dependency dompurify to v2.3.5. ([41dbc3d](https://github.com/lowdefy/lowdefy/commit/41dbc3d67f0bc55214add6125cda06946eca7ac1))
- **deps:** Update dependency react to v18.0.0-rc.0 ([2345330](https://github.com/lowdefy/lowdefy/commit/23453301716f541a1e044f63a740aae09d635237))
- **deps:** Update emotion css packages. ([3380594](https://github.com/lowdefy/lowdefy/commit/33805944e30e919c57e3e7e1876b9c6723c3988d))
- Fix V4 tests. ([d082d0c](https://github.com/lowdefy/lowdefy/commit/d082d0c335eb4426acadbf30a08de64266d9f004))
- Update docs for Anchor. ([53117b8](https://github.com/lowdefy/lowdefy/commit/53117b88cf759991539265ca84c0f47a9b45a911))

### Features

- **blocks:** Implement Link in blocks. ([2bcf600](https://github.com/lowdefy/lowdefy/commit/2bcf600bd1ae477325cf205069952006e3032b63))

### BREAKING CHANGES

- href and strong property removed for Anchor block, replaced with Link properties.

# [4.0.0-alpha.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.5...v4.0.0-alpha.6) (2022-01-20)

### Bug Fixes

- **blocks:** Updated block meta, types and buildIcons. ([1d774a3](https://github.com/lowdefy/lowdefy/commit/1d774a310a71e125fc7bf7d0d7ef5171632a56a8))

# [4.0.0-alpha.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.4...v4.0.0-alpha.5) (2021-11-27)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.3...v4.0.0-alpha.4) (2021-11-25)

### Bug Fixes

- Plugin import fixes. ([e1becad](https://github.com/lowdefy/lowdefy/commit/e1becad08704833b2a8f559e8c88bcd7172ea622))

# [4.0.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.2...v4.0.0-alpha.3) (2021-11-25)

### Features

- **blocks-basic:** Add styles export to types.js. ([c4900b4](https://github.com/lowdefy/lowdefy/commit/c4900b496d846f250f7ba92141f3bb69439ec36c))

# [4.0.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.1...v4.0.0-alpha.2) (2021-11-25)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [4.0.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.23.1...v4.0.0-alpha.1) (2021-11-25)

### Features

- **build:** Add generateDefaultTypes script. ([18a4863](https://github.com/lowdefy/lowdefy/commit/18a486384d315d661e957e4d23c4efbae47a3ec7))
- **build:** Write plugin imports and types.json during build. ([14247ea](https://github.com/lowdefy/lowdefy/commit/14247eab075cea1ffde8e84f134b0f3b66920cbe))
- Pass components to blocks in server, setup Icon. ([7db2640](https://github.com/lowdefy/lowdefy/commit/7db2640974dd1f77ef42be1b5ba7e4b348da24f6))
- Restructure plugin files. ([f651ed7](https://github.com/lowdefy/lowdefy/commit/f651ed7639181fb0a3db91706cb1c13950bfe654))

## [3.23.1](https://github.com/lowdefy/lowdefy/compare/v3.23.0...v3.23.1) (2021-11-20)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [3.23.0](https://github.com/lowdefy/lowdefy/compare/v3.23.0-alpha.0...v3.23.0) (2021-11-19)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [3.23.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.22.0...v3.23.0-alpha.0) (2021-11-09)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [3.22.0](https://github.com/lowdefy/lowdefy/compare/v3.22.0-alpha.1...v3.22.0) (2021-09-27)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [3.22.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.22.0-alpha.0...v3.22.0-alpha.1) (2021-09-20)

### Bug Fixes

- **blocksBasic:** Handle none type values in DangerousHtml block ([a765be4](https://github.com/lowdefy/lowdefy/commit/a765be4395c315f90b31680d3a914e8ac6f2a5ae))
- **blocksBasic:** Use renamed HtmlComponent in Html block (was RenderHtml) ([cf85d6c](https://github.com/lowdefy/lowdefy/commit/cf85d6ce38ce1fd715d4ae42078b002cc5b5b82e))

# [3.22.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.21.2...v3.22.0-alpha.0) (2021-09-08)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.21.2](https://github.com/lowdefy/lowdefy/compare/v3.21.2-alpha.0...v3.21.2) (2021-08-31)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.21.2-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.21.1...v3.21.2-alpha.0) (2021-08-31)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.21.1](https://github.com/lowdefy/lowdefy/compare/v3.21.0...v3.21.1) (2021-08-26)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [3.21.0](https://github.com/lowdefy/lowdefy/compare/v3.20.4...v3.21.0) (2021-08-25)

### Bug Fixes

- **blocksBasic:** Html test change to new RenderHtml. ([e43617a](https://github.com/lowdefy/lowdefy/commit/e43617a47a04b1e7d9297379207d6455bf66a453))

## [3.20.4](https://github.com/lowdefy/lowdefy/compare/v3.20.3...v3.20.4) (2021-08-21)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.20.3](https://github.com/lowdefy/lowdefy/compare/v3.20.1...v3.20.3) (2021-08-20)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.20.2](https://github.com/lowdefy/lowdefy/compare/v3.20.1...v3.20.2) (2021-08-20)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.20.1](https://github.com/lowdefy/lowdefy/compare/v3.20.0...v3.20.1) (2021-08-20)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [3.20.0](https://github.com/lowdefy/lowdefy/compare/v3.19.0...v3.20.0) (2021-08-20)

### Bug Fixes

- **blocksBasic:** Add row-reverse, column-reverse options to List direction. ([5926be6](https://github.com/lowdefy/lowdefy/commit/5926be6da45aff20a1743d8871b8c1dd1ff5d4e9))
- **blocksBasic:** Refactor to use RenderHtml. ([8e8ff8d](https://github.com/lowdefy/lowdefy/commit/8e8ff8daea67cff2637a4b83d7c0582fc3fc77d6))
- **blocksBasic:** Updated List schema and snapshots. ([7319fe7](https://github.com/lowdefy/lowdefy/commit/7319fe793b65a681971d63f9dfc2214180d5621a))
- **blocksBasic:** Updated List schema. ([006b3b7](https://github.com/lowdefy/lowdefy/commit/006b3b75d89517297c53ca2408c88eb46fe352bb))

### Features

- **blocksBasic:** Added list direction, wrapping and scrolling. ([aba280a](https://github.com/lowdefy/lowdefy/commit/aba280a4f3768c462bff65c8726939a8e6b9cec9))

# [3.19.0](https://github.com/lowdefy/lowdefy/compare/v3.18.1...v3.19.0) (2021-07-26)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.18.1](https://github.com/lowdefy/lowdefy/compare/v3.18.0...v3.18.1) (2021-06-30)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [3.18.0](https://github.com/lowdefy/lowdefy/compare/v3.17.2...v3.18.0) (2021-06-17)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.17.2](https://github.com/lowdefy/lowdefy/compare/v3.17.1...v3.17.2) (2021-06-11)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.17.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0...v3.17.1) (2021-06-11)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [3.17.0](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.3...v3.17.0) (2021-06-11)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [3.17.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.2...v3.17.0-alpha.3) (2021-06-09)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [3.17.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.1...v3.17.0-alpha.2) (2021-06-09)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [3.17.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.0...v3.17.0-alpha.1) (2021-06-09)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [3.17.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.16.5...v3.17.0-alpha.0) (2021-06-09)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.16.5](https://github.com/lowdefy/lowdefy/compare/v3.16.4...v3.16.5) (2021-05-31)

### Bug Fixes

- **deps:** update dependency dompurify to v2.2.8. ([1d9b4de](https://github.com/lowdefy/lowdefy/commit/1d9b4de393b043dd00004b6660153f5fb050a102))
- **deps:** update dependency js-yaml to v4.1.0 ([d3954f3](https://github.com/lowdefy/lowdefy/commit/d3954f30dd719deca4bc1383ba23a351a1b3b60b))

## [3.16.4](https://github.com/lowdefy/lowdefy/compare/v3.16.3...v3.16.4) (2021-05-28)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.16.3](https://github.com/lowdefy/lowdefy/compare/v3.16.2...v3.16.3) (2021-05-27)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.16.2](https://github.com/lowdefy/lowdefy/compare/v3.16.1...v3.16.2) (2021-05-26)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.16.1](https://github.com/lowdefy/lowdefy/compare/v3.16.0...v3.16.1) (2021-05-26)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [3.16.0](https://github.com/lowdefy/lowdefy/compare/v3.15.0...v3.16.0) (2021-05-26)

### Bug Fixes

- **docs:** Document context initialization events for context blocks. ([a59bff5](https://github.com/lowdefy/lowdefy/commit/a59bff50f25b79d0468a4a6afc836f264c3263b2)), closes [#576](https://github.com/lowdefy/lowdefy/issues/576)

### Features

- **blockBasic:** Add Img block. ([c850cb3](https://github.com/lowdefy/lowdefy/commit/c850cb32061cf2a4c361aecc024fe699cc06c7e0))

# [3.15.0](https://github.com/lowdefy/lowdefy/compare/v3.14.1...v3.15.0) (2021-05-11)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.14.1](https://github.com/lowdefy/lowdefy/compare/v3.14.0...v3.14.1) (2021-04-28)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [3.14.0](https://github.com/lowdefy/lowdefy/compare/v3.13.0...v3.14.0) (2021-04-26)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [3.13.0](https://github.com/lowdefy/lowdefy/compare/v3.12.6...v3.13.0) (2021-04-16)

### Bug Fixes

- Update react, react-dom and react-test-renderer to v17.0.2 ([78969ab](https://github.com/lowdefy/lowdefy/commit/78969abd39e8b04a7cddb39472985da6da50c7b9))

## [3.12.6](https://github.com/lowdefy/lowdefy/compare/v3.12.5...v3.12.6) (2021-04-06)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.12.5](https://github.com/lowdefy/lowdefy/compare/v3.12.4...v3.12.5) (2021-03-31)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.12.4](https://github.com/lowdefy/lowdefy/compare/v3.12.3...v3.12.4) (2021-03-30)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.12.3](https://github.com/lowdefy/lowdefy/compare/v3.12.2...v3.12.3) (2021-03-26)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.12.2](https://github.com/lowdefy/lowdefy/compare/v3.12.1...v3.12.2) (2021-03-24)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.12.1](https://github.com/lowdefy/lowdefy/compare/v3.12.0...v3.12.1) (2021-03-24)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [3.12.0](https://github.com/lowdefy/lowdefy/compare/v3.11.4...v3.12.0) (2021-03-24)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.11.4](https://github.com/lowdefy/lowdefy/compare/v3.11.3...v3.11.4) (2021-03-19)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.11.3](https://github.com/lowdefy/lowdefy/compare/v3.11.2...v3.11.3) (2021-03-12)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.11.2](https://github.com/lowdefy/lowdefy/compare/v3.11.1...v3.11.2) (2021-03-11)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.11.1](https://github.com/lowdefy/lowdefy/compare/v3.11.0...v3.11.1) (2021-03-11)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [3.11.0](https://github.com/lowdefy/lowdefy/compare/v3.10.2...v3.11.0) (2021-03-11)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.10.2](https://github.com/lowdefy/lowdefy/compare/v3.10.1...v3.10.2) (2021-02-25)

**Note:** Version bump only for package @lowdefy/blocks-basic

## [3.10.1](https://github.com/lowdefy/lowdefy/compare/v3.10.0...v3.10.1) (2021-02-19)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [3.10.0](https://github.com/lowdefy/lowdefy/compare/v3.9.0...v3.10.0) (2021-02-17)

### Bug Fixes

- **blocks:** Update block tests. ([898fc3c](https://github.com/lowdefy/lowdefy/commit/898fc3c818fd9879a79b48fcc785398c33677731))
- **deps:** Update dependency css-loader to v5.0.2. ([6dd6a82](https://github.com/lowdefy/lowdefy/commit/6dd6a82fa4e4975f201e0c22c6b5bf29cd0541e3))
- **deps:** Update dependency html-webpack-plugin to v5.1.0 ([d0dd688](https://github.com/lowdefy/lowdefy/commit/d0dd688816e3e9fc6ff56235698d3af4707eba5f))
- **deps:** Update dependency webpack to v5.22.0. ([bb9f69e](https://github.com/lowdefy/lowdefy/commit/bb9f69e29cbce728932ab512e12122ce3dc349cc))
- **deps:** Update dependency webpack-cli to v4.5.0. ([445d55c](https://github.com/lowdefy/lowdefy/commit/445d55ca12f720be9f09632a319c319323c7041c))

# [3.9.0](https://github.com/lowdefy/lowdefy/compare/v3.8.0...v3.9.0) (2021-02-16)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [3.8.0](https://github.com/lowdefy/lowdefy/compare/v3.7.2...v3.8.0) (2021-02-12)

### Bug Fixes

- **blocks:** Remove react router from render loop where not required. ([7b6970f](https://github.com/lowdefy/lowdefy/commit/7b6970f9b4fcc1b9e35771ba619fab890fa638f5))
- **docs:** Add container block docs. ([b490ec7](https://github.com/lowdefy/lowdefy/commit/b490ec767d6ab78c79f8b78836aee88f2f3b3f12))

## [3.7.2](https://github.com/lowdefy/lowdefy/compare/v3.7.1...v3.7.2) (2021-02-09)

### Bug Fixes

- Fix package lifecycle scripts. ([af7f3a8](https://github.com/lowdefy/lowdefy/commit/af7f3a8ea29763defb20cfb4f28afba3b56d981c))

## [3.7.1](https://github.com/lowdefy/lowdefy/compare/v3.7.0...v3.7.1) (2021-02-09)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [3.7.0](https://github.com/lowdefy/lowdefy/compare/v3.6.0...v3.7.0) (2021-02-09)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [3.6.0](https://github.com/lowdefy/lowdefy/compare/v3.5.0...v3.6.0) (2021-02-05)

### Features

- 🐢Redirect all paths to blocks-cdn. ([a45447a](https://github.com/lowdefy/lowdefy/commit/a45447ad1dacf977e487a020bd56080ae2b09792))

# [3.5.0](https://github.com/lowdefy/lowdefy/compare/v3.4.0...v3.5.0) (2021-02-05)

### Bug Fixes

- **blockBasic:** Fix typo. ([9772e1a](https://github.com/lowdefy/lowdefy/commit/9772e1a44aa0db1e3c0f3194cd16d71794027de7))
- **blocks:** Add events to all subblocks. ([753ae60](https://github.com/lowdefy/lowdefy/commit/753ae60fc8a150ef2db3a243a2862841c6aad48b))
- **blocks:** Fix port setting in webpack config. ([c828740](https://github.com/lowdefy/lowdefy/commit/c82874045dd041fbf3c3a8b4f5cb7dc27a05f39a))
- **blocksBasic:** Add bad html test. ([98740b8](https://github.com/lowdefy/lowdefy/commit/98740b8aae72a57311d64314f9ce9c1838f212ae))
- **DangerousHtml:** Fix DangerousHtml description in include render details. ([30b348a](https://github.com/lowdefy/lowdefy/commit/30b348aebd163507722dadd163a045e72e7a70ec))
- **deps:** Update dependency copy-webpack-plugin to v7.0.0. ([901d412](https://github.com/lowdefy/lowdefy/commit/901d4126544dd4ee68d62bf520cdd4cc2b0d1dcc))

### Features

- **blocks:** Update block schemas and tests. ([30636bd](https://github.com/lowdefy/lowdefy/commit/30636bd744f43652adcad51dd91570b53667dc04))
- **blocks-basic:** Rename block actions to events. ([cbb5626](https://github.com/lowdefy/lowdefy/commit/cbb5626b8c3767aeb02a5b087a2cbc585e80b635))
- **blocksBasic:** Sanitize html with dompurify. ([83f72a4](https://github.com/lowdefy/lowdefy/commit/83f72a4e2008f4deb1cb29b5d65fb1de11479644))
- **docs:** Add Html block to docs. ([0daff90](https://github.com/lowdefy/lowdefy/commit/0daff90433f74b4132d18d1818bf931593b173ce))

# [3.4.0](https://github.com/lowdefy/lowdefy/compare/v3.3.0...v3.4.0) (2021-01-20)

**Note:** Version bump only for package @lowdefy/blocks-basic

# [3.3.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.3.0) (2021-01-18)

### Bug Fixes

- **deps:** Update js-yaml from 3.14.1 to 4.0.0. ([1a9e1f9](https://github.com/lowdefy/lowdefy/commit/1a9e1f9e1057c14a3638bdd140de1b50d2721cd0))
- **deps:** Update package @wojtekmaj/enzyme-adapter-react-17 to v0.4.1 ([251102e](https://github.com/lowdefy/lowdefy/commit/251102e986b3e18804a8c94dbde2e93d3a7a85e9))

# [3.2.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.2.0) (2021-01-18)

### Bug Fixes

- **deps:** Update js-yaml from 3.14.1 to 4.0.0. ([1a9e1f9](https://github.com/lowdefy/lowdefy/commit/1a9e1f9e1057c14a3638bdd140de1b50d2721cd0))
- **deps:** Update package @wojtekmaj/enzyme-adapter-react-17 to v0.4.1 ([251102e](https://github.com/lowdefy/lowdefy/commit/251102e986b3e18804a8c94dbde2e93d3a7a85e9))

## [1.1.2](https://github.com/lowdefy/lowdefy/compare/@lowdefy/blocks-basic@1.1.0...@lowdefy/blocks-basic@1.1.2) (2020-12-15)

### Bug Fixes

- **blocks:** webpack --port setting should default to 3002 if no port provided ([ec1f5e8](https://github.com/lowdefy/lowdefy/commit/ec1f5e8a85bd2d326ecdb55a9a5ee628ff9034fa))

## [1.1.1](https://github.com/lowdefy/lowdefy/compare/@lowdefy/blocks-basic@1.1.0...@lowdefy/blocks-basic@1.1.1) (2020-12-15)

### Bug Fixes

- **blocks:** webpack --port setting should default to 3002 if no port provided ([ec1f5e8](https://github.com/lowdefy/lowdefy/commit/ec1f5e8a85bd2d326ecdb55a9a5ee628ff9034fa))

# 1.1.0 (2020-12-10)

### Bug Fixes

- **blocks:** do not need to target babel node ([6307e9d](https://github.com/lowdefy/lowdefy/commit/6307e9dcef098c12286ba494f650bc9b90ab0e63))
- **blocks:** pass --port option to webpack config ([e60ca16](https://github.com/lowdefy/lowdefy/commit/e60ca165927f3093aa60344b29de1d762fdb78c9))
- **blocksMarkdown:** fix cov paths, improve bad html test ([77211ec](https://github.com/lowdefy/lowdefy/commit/77211ec65b5a427176d095a2eb318bedc6f3d9fd))
- **deps:** update dependency js-yaml to v3.14.1 ([935ad89](https://github.com/lowdefy/lowdefy/commit/935ad894cd221901784360bee684189a60a2d386))
- **deps:** update dependency react-syntax-highlighter to v15.4.3 ([71d4621](https://github.com/lowdefy/lowdefy/commit/71d4621467d353e0543e743d9a37da8545d3c859))
- sanitizeName should use regex global ([af6b7b9](https://github.com/lowdefy/lowdefy/commit/af6b7b9e21b6eaa3cad8a1ce4d7b0e52b9effe42))
- **deps:** update dependency react-syntax-highlighter to v15.3.1 ([15df277](https://github.com/lowdefy/lowdefy/commit/15df277478013b223cb081bf4b148292afe0cea8))

### Features

- **servers:** add logos, favicons and pwa icons ([fc8610e](https://github.com/lowdefy/lowdefy/commit/fc8610e7f529071fd9ce3961b3991cab2d7911bd))
