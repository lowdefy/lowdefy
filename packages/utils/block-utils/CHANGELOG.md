# Change Log

## 7.2.0

### Minor Changes

- f0209f6: feat(build): Warn when a mobile page sets a property the phone ignores

  Native blocks accept the web properties a phone cannot honour (such as `hoverable`, `copyable`, a label's `align` or an input's `prefixIcon`), so a page shared by web and mobile stays valid. The build now warns when a mobile or shared page sets one: once per page for each block type and property, naming the page, the block and the property. `~ignoreBuildChecks: [native-ignored]` silences it.

  - `extractBlockTypes` lists the property paths a meta marks `nativeIgnored: true` in the block meta it returns.
  - The native list and input blocks now mark their ignored properties `nativeIgnored`, as the layout and display blocks do.

### Patch Changes

- a461f7c: fix(deps): Update dependencies for security advisories

  - vite 8.0.16 -> 8.1.6: the dev server no longer serves files outside `server.fs.allow` when a project path matches a system path, and launch-editor's command handling is fixed.
  - @modelcontextprotocol/sdk 1.31.0 -> 1.32.2: bounds request validation memory, ties experimental tasks to their session, checks a bearer token's audience and stops forwarding headers on cross-origin redirects.
  - hono 4.13.7 -> 4.13.14: `serveStatic` no longer decodes the path a second time, which let a request bypass middleware.
  - dompurify 3.4.16 -> 3.4.17: fixes three sanitizer bypasses, one critical.
  - markdown-it 14.3.1 -> 14.3.3, nodemailer 10.0.13 -> 10.1.7 and undici 7.30.0 -> 7.30.1.

- Updated dependencies [df6fa3c]
- Updated dependencies [31d7de8]
- Updated dependencies [dd5c2b1]
- Updated dependencies [61ae799]
- Updated dependencies [f0209f6]
- Updated dependencies [7c85b4b]
- Updated dependencies [3cd6d62]
- Updated dependencies [7aec569]
- Updated dependencies [b1d42ca]
  - @lowdefy/errors@7.2.0
  - @lowdefy/helpers@7.2.0

## 7.1.0

### Patch Changes

- @lowdefy/errors@7.1.0
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

### Minor Changes

- 1227e62: feat: Table, grid, Anchor and HTML links carry `pathParams`

  Links set as block properties fill a page path's placeholders with `pathParams`, next to `urlQuery`. In TableLight, Table and AgGrid cell and row links the values are row field paths, as `urlQuery` values are there: `link: { pageId: ticket, pathParams: { ticket_id: _id } }`. A relation cell defaults `urlQuery` to `{ _id: _id }` only when neither `urlQuery` nor `pathParams` is set. `Anchor` takes `pathParams`, and an HTML link takes `data-path-params` as a JSON object: `<a data-page-id="ticket" data-path-params='{"ticket_id":"1"}'>`.

  AgGrid link and avatar link cells now build their href through the Lowdefy Link, so it includes the app's `basePath`. A plain click still emits `onCellLink` without navigating.

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

- 08f76bb: Heavy blocks load their code when they first mount.

  - `createLazyBlock` in `@lowdefy/block-utils` lets any plugin block load its implementation on first mount. A hidden block, or one in a closed panel, unopened tab or modal, never downloads it. The block's methods (declared in `meta.methods`) can be called from mount: calls made before the code arrives run in order once it loads, or fail with the usual error. Implementation modules are named `*.lazy.js`, and the production server prefetches them at low priority.
  - `AgentChat` is lazy. Its drawer launcher paints immediately, and a click before load opens the drawer when the chat arrives. Mermaid diagrams, code highlighting and LaTeX load only when a message uses them. `setInput` is now listed in the block's methods, and `renderLatex` works in the browser build.
  - `EChart` loads the charting library inside its own sized box, so pages paint without it and the layout does not move.
  - `HtmlComponent` no longer re-sanitizes and re-renders HTML that has not changed.

  No config changes.

- 537bf54: New table blocks: `Table`, `TableInput` and `TableLight`

  Three blocks with the antd look, sharing one column model and one set of cell types. The ag-grid blocks are unchanged.

  - **`Table`** (new package `@lowdefy/blocks-table`, installed by default) is built for large datasets and record lists. Rows and columns are virtualised, so 100k rows × 50 columns scroll smoothly. It has:

    - sort, column resize and reorder, pinned columns, a header menu with column filters, and a column manager, all on by default;
    - an optional toolbar with search, quick filters, a nested And/Or filter builder, grouping, density and CSV export (cells that start like a spreadsheet formula, `=`, `+`, `-` or `@`, are exported as text, so an opened file never runs them);
    - saved views, and optional persistence in the browser or the URL (browser persistence,
      `persist.storage: local`, is kept per signed-in user and cleared at sign-out);
    - row selection with a bulk-action bar;
    - grouping with per-group totals, tree rows, expandable detail rows, and a summary footer;
    - keyboard navigation and inline editing;
    - row drag reorder, and server mode.

    Its value is the table's state (`{ view, selected, expanded }`), so `_state: <id>.selected` is always the selection and `_state: <id>.view` the current view.

  - **`TableInput`** edits rows in a form. Its value is a changeset of only what changed (`{ updated, added, removed, moved?, order? }`), never the rows themselves, so page state stays small. Row drag uses fractional positions, so moving a row writes one field.
  - **`TableLight`** (in `@lowdefy/blocks-antd`) is antd's own `Table` for small tables and adds no dependencies. Its config is a strict subset of `Table`'s: to switch, change the `type`.
  - **Columns** declare a `type` that drives display, sorting, filter operators, totals, the editor and export:

    - text, number, currency, percent, date, datetime, boolean;
    - tag, tags, status, avatar, people;
    - link, email, phone, url, relation;
    - progress, rating, image, html (nunjucks templates), json;
    - buttons, menu.

    An `avatar` column takes `descriptionField`, a row path shown as a second line under the name,
    such as a person's email; the table then needs `size: default` or `size: comfortable`.
    `options` give enum values a label and colour in one place. `rules` and `rowRules` add conditional formatting with the same condition language as filters, with no `_function` needed. `rowLink` makes rows real links.

  - `@lowdefy/block-utils` exports `getHtmlEnhancements`, so blocks can navigate the same way the `Link` action does, and it reuses `Intl.NumberFormat` instances when formatting.

### Patch Changes

- 99a4f35: Update dependencies to releases with published security fixes.

  - `axios` 1.20.0 in the CLI and AxiosHttp.
  - `dompurify` 3.4.16 in `block-utils`, `blocks-basic` and `blocks-markdown`.

  **`dompurify` 3.4.16** keeps the SVG `pointer-events` and `vector-effect` attributes, which earlier releases removed. HTML rendered by `Html`, `ClickableHtml`, `DangerousHtml`, `DangerousMarkdown` and other `renderHtml` properties may keep them.

- 6144814: Allow only safe link schemes in block hrefs

  An `href` is used only when its scheme is one DOMPurify allows by default (`http`, `https`, `ftp`, `ftps`, `mailto`, `tel`, `callto`, `sms`, `cid`, `xmpp`, `matrix`), or it is a relative path, a query or a fragment. Any other value, including one with leading whitespace or control characters, renders no link. This applies to `Button`, `Tag` and `FloatButton`, the url cell of table, AgentChat message and tool result links, `TiptapMentionInput` mention links, and every `href` given to the Lowdefy `Link` component, which covers table and ag-grid link, avatar and relation cells. A `Link` whose `href` is refused renders a span without navigating, and does not fall back to its `pageId` or `url`; the `Link` action with such an `href` throws "Invalid Link: no target resolved." as it does for a `url` it cannot resolve.

  `@lowdefy/helpers` exports the check as `getSafeHref(href)`, which returns the href or `undefined`; `@lowdefy/block-utils` re-exports it.

- cb3551c: fix(blocks): Clicks inside a Modal or Drawer no longer fire the parent block's onClick

  React bubbles events through the component tree, so a click inside a Modal, Drawer or dropdown also reached the Box, Card, Span or Dynamic block that contained it in config, even though the popup renders elsewhere in the document. A Modal placed in a clickable Box that opens it would reopen as soon as its Cancel, OK or close button was clicked. These blocks now fire `onClick` (and Box `onPaste`) only for events from DOM they contain, using the new `isEventFromDomDescendant` helper from `@lowdefy/block-utils`. Fixes #1188.

- a9442cc: Production pages load only the plugin code they use.

  The production client used to ship every block, action, operator and icon the app uses anywhere in one main bundle, and every first visit downloaded all of it. Now the build writes one small module per distinct page type set, and each page loads its own. On the docs app the main bundle drops from 6,016 kB to 1,021 kB (1,778 kB to 332 kB gzipped). A simple page's first load drops from 1,720 kB to 529 kB gzipped.

  - The HTML preloads the page's chunks alongside the main bundle, so the first page does not wait an extra round trip.
  - Content-hashed assets are served with `Cache-Control: public, max-age=31536000, immutable`, on the Node server and in `lowdefy vercel-output`.
  - Lowdefy's plugin packages declare `"sideEffects": ["**/*.css"]`, so a page that uses one block no longer loads the whole package.
  - The build adds the types a page runs without naming them: the operators the `_js` accessors call, and the actions and operators a block runs for events it registers itself (such as `Request` in `Upload` or `SetLocale` in `PageHeaderMenu`), which blocks list in `meta.actions` and `meta.operators`. Plugin blocks that register their own events should list them the same way.
  - A Dynamic block whose content uses a type its `properties.types` did not declare still works: the page loads the full type set and the server logs a warning naming the type to declare.

  No config changes. The dev server is unchanged.

- 3c2258c: Production pages load only the icons they use.

  Icons used to be one app-wide chunk that every page loaded, which is costly for apps with a long `theme.icons.include` list or the react-icons compatibility set. Each page's plugin chunk now carries its own icons: the names in its config and `_js` functions, the icons its blocks draw, and the icons in `menus` and `global`.

  - An icon name that only arrives at runtime (from state, a request, HTML built from data, `theme.icons.include`, or another page) still renders. The first time a page draws a bundled icon that is not one of its own, it loads the rest of the app's icons once; the icon keeps its space, empty, until they arrive. A `data-icon` name renders nothing until then.
  - A page whose Dynamic content names such an icon loads the app's icons before it first renders, and the HTML preloads them.
  - `Client` takes an optional `loadAllIcons` prop, and `createIcon` now takes `{ icons, loadAllIcons }`.

  No config changes. The dev server still loads every icon.

- 3eb3691: Tag colours are fixed and readable.

  - **Preset tag colours render as themselves.** purple, cyan, geekblue, gold, lime, magenta and volcano pointed at CSS variables antd doesn't define, so they fell back to blue, orange, red or green. `pink` is added.
  - **Tag text is readable.** Tags (Table, TableLight, ag-grid tag and progress cells, HTML `data-tag`/`data-status`) use antd Tag's fill, border and text shade, with the text mixed toward the base text colour. Every preset, status name and custom colour reaches at least 4.5:1 contrast in light and dark themes; gold text on its tint went from 1.75:1 to 6.4:1. red, orange, yellow, green and blue now take their base colour from antd's palette, as antd's Tag does, so status dots and rule colours shift slightly.
  - **An input-container's slots can render with their own loading state** (`content[slot](style, { loading })`). By default they still inherit the block's loading, so existing blocks are unchanged. The Table uses this so its toolbar and bulk-bar buttons stay usable while the page loads.

- Updated dependencies [f7fa621]
- Updated dependencies [099d412]
- Updated dependencies [4d08b55]
- Updated dependencies [6144814]
- Updated dependencies [db1a4d3]
- Updated dependencies [04077d9]
- Updated dependencies [d42f420]
- Updated dependencies [ebf95f8]
- Updated dependencies [2595439]
- Updated dependencies [f9e483f]
- Updated dependencies [09717e8]
- Updated dependencies [2baefc1]
- Updated dependencies [662eaa9]
- Updated dependencies [bfc6a00]
- Updated dependencies [b226c43]
- Updated dependencies [239a3a7]
- Updated dependencies [1766343]
- Updated dependencies [a34939d]
- Updated dependencies [e6302c6]
- Updated dependencies [aa6bb38]
- Updated dependencies [94fc9e0]
- Updated dependencies [81bd4f0]
- Updated dependencies [2755501]
- Updated dependencies [cac0798]
- Updated dependencies [9512788]
  - @lowdefy/helpers@7.0.0
  - @lowdefy/errors@7.0.0

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

- Updated dependencies [6d6f8fa]
- Updated dependencies [6d6f8fa]
  - @lowdefy/helpers@6.1.0
  - @lowdefy/errors@6.1.0

## 6.0.0

### Patch Changes

- Updated dependencies [37c8c14]
- Updated dependencies [6446ae6]
- Updated dependencies [c9bea1c]
  - @lowdefy/errors@6.0.0
  - @lowdefy/helpers@6.0.0

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
  - @lowdefy/errors@5.6.0

## 5.5.1

### Patch Changes

- @lowdefy/errors@5.5.1
- @lowdefy/helpers@5.5.1

## 5.5.0

### Patch Changes

- @lowdefy/errors@5.5.0
- @lowdefy/helpers@5.5.0

## 5.4.0

### Minor Changes

- 0108f38: feat: First-class i18n / locale support for Lowdefy apps.

  Apps can now declare supported locales and message catalogs under
  `config.i18n`, switch language at runtime, and translate their own
  strings with ICU MessageFormat. Ant Design's component strings (date
  pickers, modal Ok/Cancel, pagination, form validation messages),
  dayjs date formatting, and the engine's built-in framework strings
  (loading toasts, validation summaries, popup blocker warnings, error
  page) all localize automatically once `config.i18n` is set.

  ```yaml
  config:
    i18n:
      defaultLocale: en-US
      locales:
        - { code: en-US, label: English, antd: en_US, dayjs: en }
        - { code: de-DE, label: Deutsch, antd: de_DE, dayjs: de }
      messages:
        en-US: { greeting: 'Hello, {name}!' }
        de-DE: { greeting: 'Hallo, {name}!' }
  ```

  **New schema** — `config.i18n` with `defaultLocale`, `locales[]`, and
  `messages`. Validated at build time; only declared locales are bundled
  (antd and dayjs locale imports are codegen'd, no ~150KB unused). The
  missing-key fallback is always `en-US`, so plugin and module authors
  should ship `en-US` translations as a baseline.

  **New operators**

  - [`_t`](/_t) — translate operator with ICU MessageFormat. Resolution
    order: active locale → fallback locale → built-in framework message
    → key.

    ```yaml
    _t:
      key: cart.items
      values: { count: { _state: itemCount } }
    ```

  - [`_locale`](/_locale) — read `active` / `default` / `fallback`
    (always `'en-US'`) / `supported` locale state. Use with `Selector`
    to build a language picker.

  **New action** — [`SetLocale`](/SetLocale) sets the user's preferred
  locale (persisted to `localStorage`). Pass `'auto'` to clear the
  preference and fall back to the browser language or default.

  **Built-in framework strings.** Engine and client strings (`'Loading'`,
  `'Success'`, `'This field is required'`, validation summaries, popup
  blocker, error page) live in a built-in catalog and surface as English
  by default. Authors override per-locale by adding the same key to
  `config.i18n.messages`:

  ```yaml
  messages:
    de-DE:
      engine.action.loading: 'Laden'
      engine.validation.fieldRequired: 'Pflichtfeld'
  ```

  See the [Internationalization concept page](/i18n) for the full list
  of overridable keys.

  **Ant Design block cleanup.** `Modal`/`ConfirmModal` `okText`/`cancelText`
  and date picker placeholders (`DateSelector`, `DateRangeSelector`,
  `DateTimeSelector`, `MonthSelector`, `WeekSelector`) no longer hardcode
  English defaults — they fall through to antd's `ConfigProvider locale`,
  so a German app gets `'OK'` / `'Abbrechen'` / `'Datum auswählen'`
  without per-block configuration. The antd `ConfigProvider` block
  itself now accepts a `locale` prop for subtree overrides.

  **Server-side translation.** API requests resolve the user's active
  locale from the `Accept-Language` header and thread it into the server
  operator parser, so `_t` works the same in server-side actions and
  requests as on the client.

  **Translation engine.** A new `translate()` helper in `@lowdefy/helpers`
  backs both the `_t` operator and the engine/client adapter (installed
  on `lowdefy._internal.translate`). One source of truth for the lookup
  chain; no duplication. Adds `intl-messageformat` as a foundational dep.

  **Plugin-author surface.** Action and block plugins receive
  `methods.translate(key, values)` and `methods.getLocale()` for runtime
  translation in their JS code. Plugin packages can ship default
  messages via a `./messages` export — the build merges them into the
  app's i18n catalog (user app messages > plugin messages > framework
  builtins > key).

  **DatePicker and NumberInput auto-localization.** Date selector blocks
  (`DateSelector`, `DateRangeSelector`, `DateTimeSelector`,
  `MonthSelector`) and `NumberInput` derive their default `format` /
  `decimalSeparator` from the active locale via `Intl.DateTimeFormat` /
  `Intl.NumberFormat`. A German user sees `DD.MM.YYYY` and `1234,56`
  automatically; an en-US user sees `MM/DD/YYYY` and `1234.56`.

### Patch Changes

- Updated dependencies [25225ab]
- Updated dependencies [f11addd]
- Updated dependencies [0108f38]
- Updated dependencies [302e330]
  - @lowdefy/helpers@5.4.0
  - @lowdefy/errors@5.4.0

## 5.3.0

### Patch Changes

- @lowdefy/errors@5.3.0
- @lowdefy/helpers@5.3.0

## 5.2.0

### Patch Changes

- @lowdefy/errors@5.2.0
- @lowdefy/helpers@5.2.0

## 5.1.0

### Patch Changes

- @lowdefy/errors@5.1.0
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

- Updated dependencies [905d5d406]
  - @lowdefy/helpers@5.0.0
  - @lowdefy/errors@5.0.0

## 4.7.3

### Patch Changes

- @lowdefy/errors@4.7.3
- @lowdefy/helpers@4.7.3

## 4.7.2

### Patch Changes

- @lowdefy/errors@4.7.2
- @lowdefy/helpers@4.7.2

## 4.7.1

### Patch Changes

- @lowdefy/errors@4.7.1
- @lowdefy/helpers@4.7.1

## 4.7.0

### Patch Changes

- Updated dependencies [4543688f7]
- Updated dependencies [dea6651a1]
  - @lowdefy/helpers@4.7.0
  - @lowdefy/errors@4.7.0

## 4.6.0

### Minor Changes

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
- Updated dependencies [f673e3ab3]
  - @lowdefy/errors@4.6.0
  - @lowdefy/helpers@4.6.0

## 4.5.2

### Patch Changes

- @lowdefy/helpers@4.5.2

## 4.5.1

### Patch Changes

- @lowdefy/helpers@4.5.1

## 4.5.0

### Patch Changes

- @lowdefy/helpers@4.5.0

## 4.4.0

### Patch Changes

- @lowdefy/helpers@4.4.0

## 4.3.2

### Patch Changes

- @lowdefy/helpers@4.3.2

## 4.3.1

### Patch Changes

- @lowdefy/helpers@4.3.1

## 4.3.0

### Patch Changes

- @lowdefy/helpers@4.3.0

## 4.2.2

### Patch Changes

- @lowdefy/helpers@4.2.2

## 4.2.1

### Patch Changes

- a1f47d97c: Fix Github actions release.
- Updated dependencies [a1f47d97c]
  - @lowdefy/helpers@4.2.1

## 4.2.0

### Patch Changes

- @lowdefy/helpers@4.2.0

## 4.1.0

### Patch Changes

- @lowdefy/helpers@4.1.0

## 4.0.2

### Patch Changes

- @lowdefy/helpers@4.0.2

## 4.0.1

### Patch Changes

- @lowdefy/helpers@4.0.1

## 4.0.0

### Patch Changes

- @lowdefy/helpers@4.0.0

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0-rc.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.14...v4.0.0-rc.15) (2023-12-05)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-rc.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.14) (2023-11-17)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-rc.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.13) (2023-11-17)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-rc.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.11...v4.0.0-rc.12) (2023-10-19)

### Bug Fixes

- Deepsource style fixes. ([2086f5d](https://github.com/lowdefy/lowdefy/commit/2086f5d2e8e5665ec5fd16ce83e59119571f833d))

# [4.0.0-rc.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.10...v4.0.0-rc.11) (2023-10-06)

### Bug Fixes

- **blocks:** Add onTextSelection to Paragraph and document. ([7325633](https://github.com/lowdefy/lowdefy/commit/7325633d27adb876734e62140fc3e97b7e4ff119))
- **deps:** Dependencies patch updates. ([adcd80a](https://github.com/lowdefy/lowdefy/commit/adcd80afe8c752e15c900b88eb4d9be8526c7bcd))
- **deps:** Update dependency @emotion/css to v11.11.2 ([6bd3155](https://github.com/lowdefy/lowdefy/commit/6bd3155430c861dadedbce7f49b0ccc32922aa29))
- **deps:** Update dependency dompurify to v3.0.5 ([62204c5](https://github.com/lowdefy/lowdefy/commit/62204c5e25603eb997a3021d7efe57f2fb9250a9))
- **deps:** Update development dependencies. ([b7d7cca](https://github.com/lowdefy/lowdefy/commit/b7d7cca10e676949957cf6650ec706ab1a08f68a))

### Features

- **blocks:** Add onTextSelection event to Html. ([4f00d5e](https://github.com/lowdefy/lowdefy/commit/4f00d5e8851e21d0409539b18f4ee8182a92ddcc))

# [4.0.0-rc.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.9...v4.0.0-rc.10) (2023-07-26)

### Bug Fixes

- **deps:** update dependency dompurify to v2.4.7 ([5b3709b](https://github.com/lowdefy/lowdefy/commit/5b3709b00ee002f6e56c7d525fe2314c4f68ff3e))

# [4.0.0-rc.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.8...v4.0.0-rc.9) (2023-05-31)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-rc.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.7...v4.0.0-rc.8) (2023-05-19)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-rc.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.6...v4.0.0-rc.7) (2023-03-24)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-rc.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.5...v4.0.0-rc.6) (2023-03-20)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-rc.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.4...v4.0.0-rc.5) (2023-02-24)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-rc.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.3...v4.0.0-rc.4) (2023-02-21)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-rc.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.2...v4.0.0-rc.3) (2023-02-21)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-rc.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.1...v4.0.0-rc.2) (2023-02-17)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-rc.1](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.0...v4.0.0-rc.1) (2023-02-17)

### Bug Fixes

- **deps:** Update emotion css dependencies. ([7cc5588](https://github.com/lowdefy/lowdefy/commit/7cc5588d5936e7514f2e2a3400ce18f98d92586d))
- **deps:** Update minor versions of util packages. ([2d7a2a5](https://github.com/lowdefy/lowdefy/commit/2d7a2a55c88f0ee33eff49e5ff541f6296ec4337))
- Fix jest testsfor es modules in operators and utils packages ([e239727](https://github.com/lowdefy/lowdefy/commit/e239727d1e9b74cd8945037cee462f8ec4afcdb3))

# [4.0.0-rc.0](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.37...v4.0.0-rc.0) (2023-01-05)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.37](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.36...v4.0.0-alpha.37) (2022-12-07)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.36](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.35...v4.0.0-alpha.36) (2022-10-14)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.35](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.34...v4.0.0-alpha.35) (2022-10-05)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.34](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.33...v4.0.0-alpha.34) (2022-09-30)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.33](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.32...v4.0.0-alpha.33) (2022-09-22)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.32](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.31...v4.0.0-alpha.32) (2022-09-22)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.31](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.30...v4.0.0-alpha.31) (2022-09-21)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.30](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.29...v4.0.0-alpha.30) (2022-09-17)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.29](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.28...v4.0.0-alpha.29) (2022-09-13)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.28](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.27...v4.0.0-alpha.28) (2022-09-12)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.27](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.26...v4.0.0-alpha.27) (2022-09-08)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.26](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.25...v4.0.0-alpha.26) (2022-08-25)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.25](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.24...v4.0.0-alpha.25) (2022-08-23)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.24](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.23...v4.0.0-alpha.24) (2022-08-19)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.23](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.22...v4.0.0-alpha.23) (2022-08-03)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.22](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.21...v4.0.0-alpha.22) (2022-07-12)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.21](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.20...v4.0.0-alpha.21) (2022-07-11)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.20](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.19...v4.0.0-alpha.20) (2022-07-09)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.19](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.18...v4.0.0-alpha.19) (2022-07-06)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.18](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.17...v4.0.0-alpha.18) (2022-06-27)

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.14...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.17](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.16...v4.0.0-alpha.17) (2022-06-24)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.14) (2022-06-19)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.12...v4.0.0-alpha.13) (2022-06-16)

### Bug Fixes

- Fix license typo. ([972acbb](https://github.com/lowdefy/lowdefy/commit/972acbb46b9b1113053797f82a41c5f9032dd8b0))

### Features

- Package updates. ([e024181](https://github.com/lowdefy/lowdefy/commit/e0241813d1276316f0f04897b664c43e24b11d23))
- React 18 update. ([55268e7](https://github.com/lowdefy/lowdefy/commit/55268e74ea08544ce816e85e205cd2093e0f2319))

# [4.0.0-alpha.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.11...v4.0.0-alpha.12) (2022-05-23)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.10...v4.0.0-alpha.11) (2022-05-20)

### Bug Fixes

- Remove user from block properties. ([7cadf63](https://github.com/lowdefy/lowdefy/commit/7cadf6389a3c50fafbb4834f099e6514cad790bd))

### BREAKING CHANGES

- Removed user from block properties.

# [4.0.0-alpha.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.9...v4.0.0-alpha.10) (2022-05-06)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.8...v4.0.0-alpha.9) (2022-05-06)

### Bug Fixes

- **block-utils:** Icon should not spin on page loading. ([c3d9be5](https://github.com/lowdefy/lowdefy/commit/c3d9be52b13f91fc93d566af81cd19df6b1cc863))
- Fix bugs in icon and icon usage in docs. ([03858f4](https://github.com/lowdefy/lowdefy/commit/03858f43502404de39024b38fac1c5f87d5c99ca))
- Update snapshots. ([19db923](https://github.com/lowdefy/lowdefy/commit/19db92316c4a1f6aeccf8bb31a3f9ba8e7e66d5a))

### Features

- **client:** Init @lowdefy/client. ([bb7931d](https://github.com/lowdefy/lowdefy/commit/bb7931d0da4ca3614ae4223ca19663a9088d2a45))

# [4.0.0-alpha.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.7...v4.0.0-alpha.8) (2022-03-16)

### Bug Fixes

- **block-utils:** Update test snapshots. ([445d20d](https://github.com/lowdefy/lowdefy/commit/445d20dd5ad93dfe57b420d14878f6e5b436fc55))
- **block-utils:** Wrap Icon in antd Icon component. ([07dc80a](https://github.com/lowdefy/lowdefy/commit/07dc80a08defbb322f77f9de350b5bb4a08a3d54))
- Revert back to react 17.0.2. ([1b38fd3](https://github.com/lowdefy/lowdefy/commit/1b38fd3e743ee7286468c7c1e2f623838dd5ed84))

# [4.0.0-alpha.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.6...v4.0.0-alpha.7) (2022-02-21)

### Bug Fixes

- **bock-utils:** Fix icon properties, size might be an issue. ([cd2b9ad](https://github.com/lowdefy/lowdefy/commit/cd2b9ad3957cb9a30019b94e3129a17ff6f3fc3f))
- **deps:** Update dependency dompurify to v2.3.5. ([41dbc3d](https://github.com/lowdefy/lowdefy/commit/41dbc3d67f0bc55214add6125cda06946eca7ac1))
- **deps:** Update dependency react to v18.0.0-rc.0 ([2345330](https://github.com/lowdefy/lowdefy/commit/23453301716f541a1e044f63a740aae09d635237))
- **deps:** Update emotion css packages. ([3380594](https://github.com/lowdefy/lowdefy/commit/33805944e30e919c57e3e7e1876b9c6723c3988d))
- Fix util package tests. ([9d0cc45](https://github.com/lowdefy/lowdefy/commit/9d0cc45cffd3a373492bc842ba54a7254f7c509f))
- Fix V4 tests. ([d082d0c](https://github.com/lowdefy/lowdefy/commit/d082d0c335eb4426acadbf30a08de64266d9f004))

### Features

- **build:** Add buildPath to config. ([1cce024](https://github.com/lowdefy/lowdefy/commit/1cce024339bc89e4192d86f09d1a9ec233663f02))

# [4.0.0-alpha.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.5...v4.0.0-alpha.6) (2022-01-20)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.4...v4.0.0-alpha.5) (2021-11-27)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.3...v4.0.0-alpha.4) (2021-11-25)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.2...v4.0.0-alpha.3) (2021-11-25)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.1...v4.0.0-alpha.2) (2021-11-25)

**Note:** Version bump only for package @lowdefy/block-utils

# [4.0.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.23.1...v4.0.0-alpha.1) (2021-11-25)

**Note:** Version bump only for package @lowdefy/block-utils

## [3.23.1](https://github.com/lowdefy/lowdefy/compare/v3.23.0...v3.23.1) (2021-11-20)

**Note:** Version bump only for package @lowdefy/block-tools

# [3.23.0](https://github.com/lowdefy/lowdefy/compare/v3.23.0-alpha.0...v3.23.0) (2021-11-19)

**Note:** Version bump only for package @lowdefy/block-tools

# [3.23.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.22.0...v3.23.0-alpha.0) (2021-11-09)

**Note:** Version bump only for package @lowdefy/block-tools

# [3.22.0](https://github.com/lowdefy/lowdefy/compare/v3.22.0-alpha.1...v3.22.0) (2021-09-27)

**Note:** Version bump only for package @lowdefy/block-tools

# [3.22.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.22.0-alpha.0...v3.22.0-alpha.1) (2021-09-20)

### Bug Fixes

- **blockTools:** Add renderHtml helper function. ([b0c35f7](https://github.com/lowdefy/lowdefy/commit/b0c35f7341630c6ab7fb2470d3a3ca1bce1b1f0c))
- **blockTools:** Handle falsey values better in RenderHtml component ([4363803](https://github.com/lowdefy/lowdefy/commit/43638035d038e5b4993a2709cf657ae60d10e8be))

# [3.22.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.21.2...v3.22.0-alpha.0) (2021-09-08)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.21.2](https://github.com/lowdefy/lowdefy/compare/v3.21.2-alpha.0...v3.21.2) (2021-08-31)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.21.2-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.21.1...v3.21.2-alpha.0) (2021-08-31)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.21.1](https://github.com/lowdefy/lowdefy/compare/v3.21.0...v3.21.1) (2021-08-26)

**Note:** Version bump only for package @lowdefy/block-tools

# [3.21.0](https://github.com/lowdefy/lowdefy/compare/v3.20.4...v3.21.0) (2021-08-25)

### Bug Fixes

- **blockTools:** RenderHtml to only update ref after render. ([9351255](https://github.com/lowdefy/lowdefy/commit/9351255d3a05d3cbfb0f1241b714feb8960878df))
- **blockTools:** RenderHtml to return span by default, closes [#775](https://github.com/lowdefy/lowdefy/issues/775) [#777](https://github.com/lowdefy/lowdefy/issues/777) ([abbd823](https://github.com/lowdefy/lowdefy/commit/abbd8237174ba3565d5af149c846ca99ada9d06b))

## [3.20.4](https://github.com/lowdefy/lowdefy/compare/v3.20.3...v3.20.4) (2021-08-21)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.20.3](https://github.com/lowdefy/lowdefy/compare/v3.20.1...v3.20.3) (2021-08-20)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.20.2](https://github.com/lowdefy/lowdefy/compare/v3.20.1...v3.20.2) (2021-08-20)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.20.1](https://github.com/lowdefy/lowdefy/compare/v3.20.0...v3.20.1) (2021-08-20)

**Note:** Version bump only for package @lowdefy/block-tools

# [3.20.0](https://github.com/lowdefy/lowdefy/compare/v3.19.0...v3.20.0) (2021-08-20)

### Bug Fixes

- Fixes for configurable basePath. ([63955bb](https://github.com/lowdefy/lowdefy/commit/63955bbd1131da3b27b537d4e0d72dc943119287))
- **blockTools:** Add RenderHtml to blockTools. ([7662de1](https://github.com/lowdefy/lowdefy/commit/7662de1d1bf19b781cefcb2425e6b66f14e146ef))
- **blockTools:** RenderHtml should default to display-inline block. ([dcaf615](https://github.com/lowdefy/lowdefy/commit/dcaf61575c09a9f253f1197826ff4ea60bdcd685))

# [3.19.0](https://github.com/lowdefy/lowdefy/compare/v3.18.1...v3.19.0) (2021-07-26)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.18.1](https://github.com/lowdefy/lowdefy/compare/v3.18.0...v3.18.1) (2021-06-30)

**Note:** Version bump only for package @lowdefy/block-tools

# [3.18.0](https://github.com/lowdefy/lowdefy/compare/v3.17.2...v3.18.0) (2021-06-17)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.17.2](https://github.com/lowdefy/lowdefy/compare/v3.17.1...v3.17.2) (2021-06-11)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.17.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0...v3.17.1) (2021-06-11)

**Note:** Version bump only for package @lowdefy/block-tools

# [3.17.0](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.3...v3.17.0) (2021-06-11)

**Note:** Version bump only for package @lowdefy/block-tools

# [3.17.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.2...v3.17.0-alpha.3) (2021-06-09)

**Note:** Version bump only for package @lowdefy/block-tools

# [3.17.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.1...v3.17.0-alpha.2) (2021-06-09)

**Note:** Version bump only for package @lowdefy/block-tools

# [3.17.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.0...v3.17.0-alpha.1) (2021-06-09)

**Note:** Version bump only for package @lowdefy/block-tools

# [3.17.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.16.5...v3.17.0-alpha.0) (2021-06-09)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.16.5](https://github.com/lowdefy/lowdefy/compare/v3.16.4...v3.16.5) (2021-05-31)

### Bug Fixes

- **deps:** update dependency js-yaml to v4.1.0 ([d3954f3](https://github.com/lowdefy/lowdefy/commit/d3954f30dd719deca4bc1383ba23a351a1b3b60b))

## [3.16.4](https://github.com/lowdefy/lowdefy/compare/v3.16.3...v3.16.4) (2021-05-28)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.16.3](https://github.com/lowdefy/lowdefy/compare/v3.16.2...v3.16.3) (2021-05-27)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.16.2](https://github.com/lowdefy/lowdefy/compare/v3.16.1...v3.16.2) (2021-05-26)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.16.1](https://github.com/lowdefy/lowdefy/compare/v3.16.0...v3.16.1) (2021-05-26)

**Note:** Version bump only for package @lowdefy/block-tools

# [3.16.0](https://github.com/lowdefy/lowdefy/compare/v3.15.0...v3.16.0) (2021-05-26)

**Note:** Version bump only for package @lowdefy/block-tools

# [3.15.0](https://github.com/lowdefy/lowdefy/compare/v3.14.1...v3.15.0) (2021-05-11)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.14.1](https://github.com/lowdefy/lowdefy/compare/v3.14.0...v3.14.1) (2021-04-28)

**Note:** Version bump only for package @lowdefy/block-tools

# [3.14.0](https://github.com/lowdefy/lowdefy/compare/v3.13.0...v3.14.0) (2021-04-26)

### Bug Fixes

- **blockTools:** Add full error page. ([9baf5ad](https://github.com/lowdefy/lowdefy/commit/9baf5adba218f93fa257d46cf0e3bbfa0ed6b85b))
- **blockTools:** Update error defaults. ([cc02a89](https://github.com/lowdefy/lowdefy/commit/cc02a89571d260dd08b0cfdbd486f1f4c0c9841c))
- Make lgtm corrections. ([ef20857](https://github.com/lowdefy/lowdefy/commit/ef2085781aa245bf0d027ddec3511d949403bed9))

# [3.13.0](https://github.com/lowdefy/lowdefy/compare/v3.12.6...v3.13.0) (2021-04-16)

### Bug Fixes

- Update react, react-dom and react-test-renderer to v17.0.2 ([78969ab](https://github.com/lowdefy/lowdefy/commit/78969abd39e8b04a7cddb39472985da6da50c7b9))

## [3.12.6](https://github.com/lowdefy/lowdefy/compare/v3.12.5...v3.12.6) (2021-04-06)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.12.5](https://github.com/lowdefy/lowdefy/compare/v3.12.4...v3.12.5) (2021-03-31)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.12.4](https://github.com/lowdefy/lowdefy/compare/v3.12.3...v3.12.4) (2021-03-30)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.12.3](https://github.com/lowdefy/lowdefy/compare/v3.12.2...v3.12.3) (2021-03-26)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.12.2](https://github.com/lowdefy/lowdefy/compare/v3.12.1...v3.12.2) (2021-03-24)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.12.1](https://github.com/lowdefy/lowdefy/compare/v3.12.0...v3.12.1) (2021-03-24)

**Note:** Version bump only for package @lowdefy/block-tools

# [3.12.0](https://github.com/lowdefy/lowdefy/compare/v3.11.4...v3.12.0) (2021-03-24)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.11.4](https://github.com/lowdefy/lowdefy/compare/v3.11.3...v3.11.4) (2021-03-19)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.11.3](https://github.com/lowdefy/lowdefy/compare/v3.11.2...v3.11.3) (2021-03-12)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.11.2](https://github.com/lowdefy/lowdefy/compare/v3.11.1...v3.11.2) (2021-03-11)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.11.1](https://github.com/lowdefy/lowdefy/compare/v3.11.0...v3.11.1) (2021-03-11)

**Note:** Version bump only for package @lowdefy/block-tools

# [3.11.0](https://github.com/lowdefy/lowdefy/compare/v3.10.2...v3.11.0) (2021-03-11)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.10.2](https://github.com/lowdefy/lowdefy/compare/v3.10.1...v3.10.2) (2021-02-25)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.10.1](https://github.com/lowdefy/lowdefy/compare/v3.10.0...v3.10.1) (2021-02-19)

**Note:** Version bump only for package @lowdefy/block-tools

# [3.10.0](https://github.com/lowdefy/lowdefy/compare/v3.9.0...v3.10.0) (2021-02-17)

### Bug Fixes

- **blocks:** Update block tests. ([898fc3c](https://github.com/lowdefy/lowdefy/commit/898fc3c818fd9879a79b48fcc785398c33677731))
- **deps:** Update dependency css-loader to v5.0.2. ([6dd6a82](https://github.com/lowdefy/lowdefy/commit/6dd6a82fa4e4975f201e0c22c6b5bf29cd0541e3))
- **deps:** Update dependency html-webpack-plugin to v5.1.0 ([d0dd688](https://github.com/lowdefy/lowdefy/commit/d0dd688816e3e9fc6ff56235698d3af4707eba5f))
- **deps:** Update dependency webpack to v5.22.0. ([bb9f69e](https://github.com/lowdefy/lowdefy/commit/bb9f69e29cbce728932ab512e12122ce3dc349cc))
- **deps:** Update dependency webpack-cli to v4.5.0. ([445d55c](https://github.com/lowdefy/lowdefy/commit/445d55ca12f720be9f09632a319c319323c7041c))

# [3.9.0](https://github.com/lowdefy/lowdefy/compare/v3.8.0...v3.9.0) (2021-02-16)

### Bug Fixes

- **blockTools:** Add example value to block render tests. ([e860013](https://github.com/lowdefy/lowdefy/commit/e8600131aeabaad93d70b7be4125a2153cb7598d))

# [3.8.0](https://github.com/lowdefy/lowdefy/compare/v3.7.2...v3.8.0) (2021-02-12)

**Note:** Version bump only for package @lowdefy/block-tools

## [3.7.2](https://github.com/lowdefy/lowdefy/compare/v3.7.1...v3.7.2) (2021-02-09)

### Bug Fixes

- Fix package lifecycle scripts. ([af7f3a8](https://github.com/lowdefy/lowdefy/commit/af7f3a8ea29763defb20cfb4f28afba3b56d981c))

## [3.7.1](https://github.com/lowdefy/lowdefy/compare/v3.7.0...v3.7.1) (2021-02-09)

**Note:** Version bump only for package @lowdefy/block-tools

# [3.7.0](https://github.com/lowdefy/lowdefy/compare/v3.6.0...v3.7.0) (2021-02-09)

### Bug Fixes

- **blockTools:** Add pageId to block schema in schemaTest. ([548ba6a](https://github.com/lowdefy/lowdefy/commit/548ba6aefefa8475cfa6cb7c48ccce143d577d95))
- **blockTools:** Fix Skeleton linear-gradient for safari. ([59026f4](https://github.com/lowdefy/lowdefy/commit/59026f4b75d186a61162f0bc44e8bf8454ea06ff))

# [3.6.0](https://github.com/lowdefy/lowdefy/compare/v3.5.0...v3.6.0) (2021-02-05)

**Note:** Version bump only for package @lowdefy/block-tools

# [3.5.0](https://github.com/lowdefy/lowdefy/compare/v3.4.0...v3.5.0) (2021-02-05)

### Features

- **block-tools:** Rename block actions to events ([e33d0f3](https://github.com/lowdefy/lowdefy/commit/e33d0f3046b8ab354c0bfb38759c67708aafe22a))

# [3.4.0](https://github.com/lowdefy/lowdefy/compare/v3.3.0...v3.4.0) (2021-01-20)

### Bug Fixes

- **block-tools:** Fix test snapshot. ([e70fc5c](https://github.com/lowdefy/lowdefy/commit/e70fc5c1b95cecfc2b1214f59b9ba969640a239c))

# [3.3.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.3.0) (2021-01-18)

### Bug Fixes

- **deps:** Update js-yaml from 3.14.1 to 4.0.0. ([1a9e1f9](https://github.com/lowdefy/lowdefy/commit/1a9e1f9e1057c14a3638bdd140de1b50d2721cd0))
- **deps:** Update package @wojtekmaj/enzyme-adapter-react-17 to v0.4.1 ([251102e](https://github.com/lowdefy/lowdefy/commit/251102e986b3e18804a8c94dbde2e93d3a7a85e9))

# [3.2.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.2.0) (2021-01-18)

### Bug Fixes

- **deps:** Update js-yaml from 3.14.1 to 4.0.0. ([1a9e1f9](https://github.com/lowdefy/lowdefy/commit/1a9e1f9e1057c14a3638bdd140de1b50d2721cd0))
- **deps:** Update package @wojtekmaj/enzyme-adapter-react-17 to v0.4.1 ([251102e](https://github.com/lowdefy/lowdefy/commit/251102e986b3e18804a8c94dbde2e93d3a7a85e9))

## [1.1.2](https://github.com/lowdefy/lowdefy/compare/@lowdefy/block-tools@1.1.0...@lowdefy/block-tools@1.1.2) (2020-12-15)

**Note:** Version bump only for package @lowdefy/block-tools

## [1.1.1](https://github.com/lowdefy/lowdefy/compare/@lowdefy/block-tools@1.1.0...@lowdefy/block-tools@1.1.1) (2020-12-15)

**Note:** Version bump only for package @lowdefy/block-tools

# 1.1.0 (2020-12-10)

### Bug Fixes

- **block-tools:** remove console log ([c6bcd4c](https://github.com/lowdefy/lowdefy/commit/c6bcd4ce186a852f6cb0573370d5db33a6afe12a))
- **blocksAntd:** remove rename from defaultProps ([9c510ec](https://github.com/lowdefy/lowdefy/commit/9c510ecf3a95583f104129d5e7036422da9977b3))
- **blocksTools:** copy css files on build ([c95af42](https://github.com/lowdefy/lowdefy/commit/c95af4267fff2accb3b514aa1985fc8b3b0bfdb5))
- **blockTools:** add style to blockSchema ([84da967](https://github.com/lowdefy/lowdefy/commit/84da967a4de81a0f2d62b61d661bde7cc6d0916e))
- **blockTools:** always mock callAction, registerAction, registerMethod ([cb4a612](https://github.com/lowdefy/lowdefy/commit/cb4a612373fa29eef3358b2bf1f62e88c6b2c012))
- **blockTools:** apply blockDefaults to mockBlock ([e0f7f17](https://github.com/lowdefy/lowdefy/commit/e0f7f174568945794fe7b99b7c1110aa77538693))
- **blockTools:** bug fixes and create initEmotion ([d62884a](https://github.com/lowdefy/lowdefy/commit/d62884af75d90ee934b7e737c5eae8027492c358))
- **blockTools:** call initEmotion in tests ([569c382](https://github.com/lowdefy/lowdefy/commit/569c38217cca6ce818f2aa5838573f1b3f610a77))
- **blockTools:** change mock method preference, and rename example to block ([ba7d7bf](https://github.com/lowdefy/lowdefy/commit/ba7d7bf2c09052fb1125e93d083bb9ba22deb1c6))
- **blockTools:** cleanup devDependancies and babelrc ([b5f79fc](https://github.com/lowdefy/lowdefy/commit/b5f79fcac9a286547e4d2084cb212e289f10432a))
- **blockTools:** cleanup mockBlock and rename mockBlockProps to stubBlockProps ([aaf1d89](https://github.com/lowdefy/lowdefy/commit/aaf1d895875d1a6e6e8b676c2da6476a31b27ece))
- **blockTools:** cleanup webpack config ([c5ae88a](https://github.com/lowdefy/lowdefy/commit/c5ae88ae6b6c3edf542c538d5c6b385455cf71e8))
- **blockTools:** correct schema to areas.content.blocks ([c5bd4eb](https://github.com/lowdefy/lowdefy/commit/c5bd4ebc9aac30c584b9e45a4b084ac950437600))
- **blockTools:** do not mock innerHTML ([094ede8](https://github.com/lowdefy/lowdefy/commit/094ede84a652022754472174c38448d5f97b0caf))
- **blockTools:** do not mock makeCssClass but replace methods ([c7a34cf](https://github.com/lowdefy/lowdefy/commit/c7a34cfd4e8bb8940c3880a3bfe515ded1256432))
- **blockTools:** exclude runMethodTests from covarage ([a3f0bcf](https://github.com/lowdefy/lowdefy/commit/a3f0bcf9aedbf36493898a515cc2f2d3d97e0a66))
- **blockTools:** export BlockSchemaErrors ([fbcb024](https://github.com/lowdefy/lowdefy/commit/fbcb024d37d106d4dd248717a0fc92d9a429ca97))
- **blockTools:** export Loading ([9e4fb66](https://github.com/lowdefy/lowdefy/commit/9e4fb6693fa8d15dfe98926f1e1b55cdd9ac93ac))
- **blockTools:** fix filesname and test teardown ([ca314f0](https://github.com/lowdefy/lowdefy/commit/ca314f0af6bd0d42707e9c4de696ee345a64c213))
- **blockTools:** fix method mock test ([77cc324](https://github.com/lowdefy/lowdefy/commit/77cc324f975603b05aa441abecf1853ebcb1ac8d))
- **blockTools:** igore tests level block fields to schema tests ([82d27c1](https://github.com/lowdefy/lowdefy/commit/82d27c1313fb3aac5618558d1657645ababfb9c0))
- **blockTools:** implement blockDefaultProps in blockTools ([a128de6](https://github.com/lowdefy/lowdefy/commit/a128de68109c962d46d27405e24fbdafb6926a71))
- **blockTools:** include defaultMethods in blockDefaults to help with inherited blocks ([184a94c](https://github.com/lowdefy/lowdefy/commit/184a94c857ab17c96eeaa22de0eeba648782041f))
- **blockTools:** list prop must be an array on content() for list blocks to itterate over ([f30e229](https://github.com/lowdefy/lowdefy/commit/f30e229dace786643dc07e1cb8f6f0dada7e7394))
- **blockTools:** mediaToCssObject with null should not throw ([7cdfcbb](https://github.com/lowdefy/lowdefy/commit/7cdfcbb0bacefffdb95eadc5e1fe8490e4786750))
- **blockTools:** mock window.media ([a73c0ec](https://github.com/lowdefy/lowdefy/commit/a73c0ec5602ca9cb34abded0e21605c0e776b991))
- **blockTools:** react-test-renderer should be a dependency ([23ff001](https://github.com/lowdefy/lowdefy/commit/23ff00193c15711401824b1efdbb77298899b71c))
- **blockTools:** remove BlockSchemaErrors margin ([cf21a2f](https://github.com/lowdefy/lowdefy/commit/cf21a2fa0108de2c40b11cd934e3dc510333d77d))
- **blockTools:** remove registeredMethods ([b984e6f](https://github.com/lowdefy/lowdefy/commit/b984e6f5554a617d4d8d7e077e91619330d0eb4d))
- **blockTools:** rename runMethodTests to runMockMethodTests ([70bb195](https://github.com/lowdefy/lowdefy/commit/70bb19518955696f27ef224257078fb6b2d465f6))
- **blockTools:** runBlockSchemaTests match true no snapshot required ([62c5f66](https://github.com/lowdefy/lowdefy/commit/62c5f66345e799d823bba51184eee45a479475e8))
- **blockTools:** runMockRenderTests mocks should be an array ([30dfabd](https://github.com/lowdefy/lowdefy/commit/30dfabdc7c378acf7e6dafd4db293b3228129680))
- **blockTools:** runMockRenderTests must mock makeCssClass ([6fb6fa9](https://github.com/lowdefy/lowdefy/commit/6fb6fa93c0e54c8863c0fd234f1150da712cb665))
- **blockTools:** simplify blockDefaults to not be a hoc ([6da1743](https://github.com/lowdefy/lowdefy/commit/6da17434633a66b69df2fc14920c7e230cfef8c7))
- **blockTools:** stubBlockProps update test for error catching ([22c6c2f](https://github.com/lowdefy/lowdefy/commit/22c6c2f3b4aeea544f8c43a6118a44d129e58e81))
- **blockTools:** update block mocks to work with setState ([42e08c0](https://github.com/lowdefy/lowdefy/commit/42e08c07a0ca1e5983ddfd672ed1b2a6611f325a))
- **blockTools:** update loading component tests ([c56b2fa](https://github.com/lowdefy/lowdefy/commit/c56b2fa96be253b54ab7935d0d9d6eaa97601e92))
- **blockTools:** use default imports in demo ([b4d85a6](https://github.com/lowdefy/lowdefy/commit/b4d85a66a5af6317cccc0b3f7cf31a8dc0d0f478))
- **deps:** update dependency js-yaml to v3.14.1 ([935ad89](https://github.com/lowdefy/lowdefy/commit/935ad894cd221901784360bee684189a60a2d386))
- memoize emotion and fix error boundry ([21dfcd2](https://github.com/lowdefy/lowdefy/commit/21dfcd24228e6e0383a98d0899dcb2864c805e85))
- replace blockDefaults with blockdDefaultProps ([9807ac7](https://github.com/lowdefy/lowdefy/commit/9807ac7b061788baa4dea8a1037aab58fe34f941))
- use helpers from helpers ([ebe3738](https://github.com/lowdefy/lowdefy/commit/ebe373827d54f4009f5f246fef8be630e20ba4a7))
- yarn install and @lowdefy/block-tools version bump ([14dd133](https://github.com/lowdefy/lowdefy/commit/14dd1336638441daf558432f78e9c82119ac9ce2))

### Features

- **blocksAntd:** Progress and tests ([10156c5](https://github.com/lowdefy/lowdefy/commit/10156c53d722f546e9c047ff5ed3313dd7aeb976))
- **blocksTools:** mockBlockProps to provide schema errors ([6c192d4](https://github.com/lowdefy/lowdefy/commit/6c192d42b0ab9521b9c74a3a1466b03d414864bb))
- **blocktools:** init loading component ([2aef2d3](https://github.com/lowdefy/lowdefy/commit/2aef2d36e9e01fb62f904604d2929f1a882a0ac4))
- **blockTools:** add BlockSchemaError ([a9200e0](https://github.com/lowdefy/lowdefy/commit/a9200e01768baf26afedbf5c6832495ab4dde870))
- **blockTools:** add default props for validation and required ([b7665e4](https://github.com/lowdefy/lowdefy/commit/b7665e4046bf6b799428a987f0e7bf9baf2c758e))
- **blockTools:** add full schema for menus to blockSchema ([aa6845a](https://github.com/lowdefy/lowdefy/commit/aa6845a8c5c48d7a482f6e051ac7c11e0b37d312))
- **blockTools:** add Lowdefy to Spinner ([85b62cd](https://github.com/lowdefy/lowdefy/commit/85b62cd39067f7c7d2339958e0d9b0c742ead1c1))
- **blockTools:** add MemoryRouter to render tests for react-router tests containing Link ([95faa66](https://github.com/lowdefy/lowdefy/commit/95faa66b0bc7bddd59c234971d7a7046490b682e))
- **blockTools:** add menus to block schema ([412f08a](https://github.com/lowdefy/lowdefy/commit/412f08a04d9c59be88d63d9b3bed79762cd330c3))
- **blockTools:** add method auto tests to runRenderTests ([0112fef](https://github.com/lowdefy/lowdefy/commit/0112fefbd251b85232c22a70e630916179a92d26))
- **blockTools:** add mockBlock, mockBlockProps, runRenderTests ([0d70ba0](https://github.com/lowdefy/lowdefy/commit/0d70ba087de3c366053b2085ee0fb06cc6fafc2b))
- **blockTools:** add more mock fns to mockBlock from antd ([746ffdb](https://github.com/lowdefy/lowdefy/commit/746ffdbfc449aa74e88aeee490279c1d409d0feb))
- **blockTools:** add registerAction and Math.random mock ([954aadf](https://github.com/lowdefy/lowdefy/commit/954aadfd00b8e7e9074163e6643ae94dc320b954))
- **blockTools:** add rename as a default block property ([3c23757](https://github.com/lowdefy/lowdefy/commit/3c237572b925124125d36b11068d5cff2d1c2715))
- **blockTools:** add render tests for meta.test.required and meta.test.validation ([a177a81](https://github.com/lowdefy/lowdefy/commit/a177a81f328885000e6cee45e1ad59081914be9a))
- **blockTools:** bump version ([b450047](https://github.com/lowdefy/lowdefy/commit/b450047478ba55d93e233c839c77677c0114847a))
- **blockTools:** change mocks to use structured args ([0295a8e](https://github.com/lowdefy/lowdefy/commit/0295a8e6e1349630e25970441208dcd5f96eb212))
- **blockTools:** improve stubBlockProps with registerAction and actionLog ([fa3654c](https://github.com/lowdefy/lowdefy/commit/fa3654ccb3db8ec6c34591388253babca1c44e32))
- **blockTools:** init block tests ([e952aee](https://github.com/lowdefy/lowdefy/commit/e952aee00225720bf5552eb462002d4bcb2adaa2))
- **blockTools:** init runBlockSchemaTests ([bfa6e4c](https://github.com/lowdefy/lowdefy/commit/bfa6e4ce70dba74e845af6697877714ea4db3646))
- **blockTools:** Loading components ([53a716a](https://github.com/lowdefy/lowdefy/commit/53a716aee9b6515080e629be296f547498b25ffa))
- **blockTools:** memoize compiled ajv schemas in stubBlockProps ([7b69aa0](https://github.com/lowdefy/lowdefy/commit/7b69aa0fe2d4a895ea294ce9e7ea922619a364aa))
- **blockTools:** memoize registerMethod to envoke methods in tests ([426e011](https://github.com/lowdefy/lowdefy/commit/426e01189db399e7e50bd51bc6774003dac7b0f4))
- **blockTools:** move module fed functions to blockTools ([5e6cebf](https://github.com/lowdefy/lowdefy/commit/5e6cebf6d0eaef1360ba1637e7135df52858fd16)), closes [#219](https://github.com/lowdefy/lowdefy/issues/219)
- **blockTools:** replace alert with logger in mocks ([bb8b08f](https://github.com/lowdefy/lowdefy/commit/bb8b08f6855bf19c45c908634e5752fb07988cec))
- **blockTools:** run render tests with all meta.values ([b1cc706](https://github.com/lowdefy/lowdefy/commit/b1cc7063afac92117af93031700b8623289b2a37))
- **blockTools:** runMockRenderTests to mount MemoryRouter for Link mocks ([a5f3058](https://github.com/lowdefy/lowdefy/commit/a5f30584342449a2f465f3886b15213a37056bce))
- **blockTools:** split method tests into seperate functions and mock methods ([953a88d](https://github.com/lowdefy/lowdefy/commit/953a88d698272c4c4ebb7bd6bca31bc0ea1d1999))
- **blockTools:** split run schemaTest to seperate file ([f65301b](https://github.com/lowdefy/lowdefy/commit/f65301bf0fd8fffa93b9626568b71b26d92ac4f5))
- **blockTools:** test for all modules ([5519789](https://github.com/lowdefy/lowdefy/commit/5519789581ae05cfdf673ca7765546903beb2e8f))
- **blockTools:** tests for LogoSpinner and mockBlockProps, and extra lines ([e15f1aa](https://github.com/lowdefy/lowdefy/commit/e15f1aab239802f5e3409ece2c44fd853f8d5912))
- init @lowdefy/block-tools ([e9854a7](https://github.com/lowdefy/lowdefy/commit/e9854a7a29f3ee25559d27be10c16b0476c89e92))
- init loadings ([137df72](https://github.com/lowdefy/lowdefy/commit/137df72506a5930756c459fef8d3d280ca2065a9))
- move block files in layout to blockTools ([94866c8](https://github.com/lowdefy/lowdefy/commit/94866c8bf12a20f1b1f5eff5484037735002a17e))
- renderer first render 😱 ([a8b7f80](https://github.com/lowdefy/lowdefy/commit/a8b7f80659991821e6a13e2b77544a1e51a6797b))
