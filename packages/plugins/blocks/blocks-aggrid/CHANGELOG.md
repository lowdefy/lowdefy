# Change Log

## 7.2.0

### Patch Changes

- dc785ea: fix(blocks-aggrid): Long cell text ends in an ellipsis

  Text wider than its column was cut off mid-word in every AgGrid block. It now ends in "…" in plain
  columns, `cellRenderer` columns (plain text, or HTML mixing elements and text), `link` cells and
  checkbox or row-drag columns. Text nested deeper inside other cell types is still clipped without
  "…".

  A cell holding only text (no renderer) now lays out as a block instead of a flex container, so it
  aligns with `text-align`. `cell.align` sets it, and a column's own `cellStyle.justifyContent` and
  `cellStyle.alignItems` are mapped to `textAlign` and `alignContent`, so existing columns keep their
  alignment. Flex alignment set through `cellClass` CSS or `defaultColDef.cellStyle` no longer applies
  to plain-text cells; use `textAlign` there.

- Updated dependencies [02842fe]
- Updated dependencies [d143e29]
- Updated dependencies [31d7de8]
- Updated dependencies [dd5c2b1]
- Updated dependencies [61ae799]
- Updated dependencies [f0209f6]
- Updated dependencies [3cd6d62]
- Updated dependencies [0f0cd03]
- Updated dependencies [a461f7c]
- Updated dependencies [fcea703]
- Updated dependencies [b1d42ca]
- Updated dependencies [962ac05]
- Updated dependencies [0dd2e9d]
  - @lowdefy/blocks-antd@7.2.0
  - @lowdefy/helpers@7.2.0
  - @lowdefy/block-utils@7.2.0

## 7.1.0

### Patch Changes

- 96d6f1c: fix(blocks-aggrid): Show the tick in ticked AgGrid checkboxes

  A ticked checkbox in an AgGrid Balham block, including a read-only boolean cell and a row-selection checkbox, showed no tick. The antd theme draws the ticked box in the primary colour, and the Balham block drew the tick in that same colour, so a ticked box read as empty and a read-only one as a plain grey square. The other blocks drew the tick in the background colour, so it turned dark in dark mode. Every AgGrid block now draws a white tick on the primary colour, as antd's Checkbox does.

- b1d58df: fix(blocks-aggrid): AgGrid columns accept named filters and components

  The build warned `columnDefs.N.filter must be type "boolean"` on every AgGrid column whose `filter` named an AG Grid filter, such as `filter: agDateColumnFilter`, though the grid filtered correctly. `filter` now takes `true`, `false` or a provided filter name: `agTextColumnFilter`, `agNumberColumnFilter` or `agDateColumnFilter`. Any other name, such as a misspelt one or an Enterprise filter this block does not include, still warns. `cellRenderer` and `tooltipComponent` likewise accept the name of a registered component, such as the cell renderer `agAnimateShowChangeCellRenderer`.

- Updated dependencies [c6d665a]
- Updated dependencies [3df29f3]
  - @lowdefy/blocks-antd@7.1.0
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

### Minor Changes

- 2735310: feat: Add icon placement to buttons and expose more antd 6.6 features on button, menu, navigation and page layout blocks.

  Buttons can now put their icon after the title. Set `iconPlacement: end` on a `Button`, on a
  `DropdownButton` (the main button, in normal and split mode), or on each button of an ag-grid
  `buttons` cell.

  New properties, events and CSS keys:

  - `Button`: `iconPlacement`, `target` (open an `href` in a new tab), and more design tokens in
    `theme` (`fontWeight`, `iconGap`, `contentFontSize*`, `default*` colors, shadows and more).
  - `DropdownButton`: `iconPlacement`, and `left`/`right` placements.
  - `DropdownMenu`: `selectable` (needed for `onSelect` to fire), and `left`/`right` placements.
  - `FloatButton`: `disabled`, and a back to top mode with `backTop`, `visibilityHeight`,
    `duration` and `showProgress` (a scroll progress ring).
  - `Menu`: `triggerSubMenuAction` (open submenus on click), `tooltip` for collapsed inline
    menus, a `popup` CSS key for submenu popups, and `keyPath` in the `onClick` and `onSelect`
    events. Horizontal menus draw their overflow indicator with the app's icons.
  - `Breadcrumb`: `item` and `separator` CSS keys, and `links` on a breadcrumb item to show a
    dropdown menu of links (also on the page layout `breadcrumb` property).
  - `Pagination`: `align`, `size: large`, `showLessItems`, `responsive`, an `item` CSS key, and
    more design tokens.
  - `Steps`: `maxCount` to collapse long step lists, `item`, `itemTitle`, `itemSubtitle` and
    `itemContent` CSS keys, and more design tokens.
  - `Tabs`: `centered`, `tabBarGutter`, `indicator` (size and alignment of the ink bar),
    `destroyOnHidden`, and `item` and `popup` CSS keys.
  - `Affix`: `target`, the id of a scrollable element to stick to.
  - `Tour`: `gap.offset` and `gap.radius`, `nextButtonProps` and `prevButtonProps` for step
    button text, object `scrollIntoViewOptions`, and `title`, `description`, `cover` and `footer`
    CSS keys.
  - `Layout` and `Sider`: the `theme` property now applies antd Layout design tokens (such as
    `bodyBg`, `headerHeight`, `footerBg` and the sider trigger tokens), and the docs list them.
  - `Sider`: a `body` CSS key, `xxxl` breakpoint, and `onBreakpoint` now passes `{ broken }`.
  - `PageSiderMenu` and `PageSidebarLayout`: a `siderBody` CSS key, and `sider.collapsible` is
    documented on both.
  - ag-grid `buttons` cell: per-button `iconPlacement`. ag-grid `menu` cell: `left`/`right`
    placements.

  Fixes that change what existing apps see or receive:

  - `Pagination` passed the wrong `skip` in its `onChange` and `onSizeChange` event payloads: one
    page too many (`current * pageSize`). The event `skip` now matches the block value
    (`(current - 1) * pageSize`). Apps that corrected for this, for example by subtracting the
    page size from `_event: skip`, must remove that correction. Apps that read `skip` from the
    block value in state are not affected.
  - An inline `Menu` with `collapsed: true` outside a `Sider` now collapses. Before, antd never
    received the setting and the menu rendered expanded.
  - A collapsible `Sider`'s trigger (and the trigger shown when `collapsedWidth` is 0) did nothing
    when clicked. It now toggles the sider, and in `PageSiderMenu` and `PageSidebarLayout` it
    toggles the page's sider state. Responsive collapse is unchanged: crossing the breakpoint
    only fires `onBreakpoint`.
  - The `theme` property of `Layout`, `Sider`, `PageHeaderMenu` and `PageSiderMenu` had no effect.
    `Layout` and `Sider` now apply it as antd Layout design tokens, and `PageHeaderMenu` and
    `PageSiderMenu`, like `PageSidebarLayout`, apply it as global design tokens for the page.
    Apps that set it will now see it applied.
  - `DropdownButton` and `DropdownMenu` applied the `menu` CSS key through props antd ignores, so
    menu classes and styles never reached the popup. The `profileMenu` and `localeSelectorMenu`
    CSS keys of `Header` and the page layouts had the same problem. `DropdownButton` also dropped
    its `item` CSS key, and outside split mode, like `DropdownMenu`, its element id, class and
    style: these now land on the button (`DropdownButton`) and the trigger wrapper
    (`DropdownMenu`).
  - `Tabs` passed its `tabBar`, `tabPane` and `inkBar` CSS keys under names antd 6 does not use,
    so they had no effect. They now style the tab bar, each tab pane and the ink bar.
  - The `item` style of `Menu` and `DropdownMenu` was ignored; only the class applied. Both now
    apply.
  - `Tour` ignored `gap: { x, y }`. It now maps to antd's `gap.offset`.

  Other fixes:

  - `Pagination` always showed the item range and total, although the docs said `showTotal`
    defaults to false. The docs now say it defaults to true, and `showTotal: false` hides it.
  - `Steps` no longer logs antd deprecation warnings for `size: default`, `progressDot` and item
    `description`.
  - `FloatButton` no longer logs a deprecation warning for `description`, and draws its default
    icon with the app's icons.
  - `DropdownButton` passes antd's `medium` size for `size: middle`.
  - The `Header`, `Footer` and `Content` `theme` docs now say antd only applies Layout tokens
    from the parent `Layout` block. The `arrow` CSS key of `DropdownButton` and `DropdownMenu` and
    the `subMenu` CSS key of `DropdownMenu` are documented as having no effect, since antd does
    not expose those parts.

- 1227e62: feat: Table, grid, Anchor and HTML links carry `pathParams`

  Links set as block properties fill a page path's placeholders with `pathParams`, next to `urlQuery`. In TableLight, Table and AgGrid cell and row links the values are row field paths, as `urlQuery` values are there: `link: { pageId: ticket, pathParams: { ticket_id: _id } }`. A relation cell defaults `urlQuery` to `{ _id: _id }` only when neither `urlQuery` nor `pathParams` is set. `Anchor` takes `pathParams`, and an HTML link takes `data-path-params` as a JSON object: `<a data-page-id="ticket" data-path-params='{"ticket_id":"1"}'>`.

  AgGrid link and avatar link cells now build their href through the Lowdefy Link, so it includes the app's `basePath`. A plain click still emits `onCellLink` without navigating.

- 7c20d1b: feat: Events no longer bubble to the blocks around the block that handled them

  A click on a block inside another clickable block used to run the events of both, so a Button in a clickable Card also opened the card, and a Box in a List row also ran the row's `onClick`. Now a browser event runs only the innermost event that handles it: once a block with actions for the event fires, the blocks around it skip that same browser event. A block without an event for the interaction, like a Paragraph in the card, still passes the click on to the card. Only blocks on the browser event's own path skip it: events that blocks fire from effects, events of blocks inside the one that handled it, events from method calls, and events a block runs for its own machinery (a file upload's policy request, a table's row fetch) all still run.

  Set `bubble: true` on an event to also run the events of the blocks around it:

  ```yaml
  events:
    onClick:
      bubble: true
      try:
        - id: select
          type: SetState
          params:
            selected: true
  ```

  Inside AgGrid blocks, clicks on a cell's buttons, links, menus, inputs, selectors, switches or selection checkbox no longer trigger `onRowClick` or `onCellClick`. They only fire the control's own event.

  This changes behaviour for apps that relied on a nested click running both events: add `bubble: true` to the inner event to keep it. The `nested-event-bubbling` codemod in `lowdefy upgrade` adds `bubble: true` only where an outer event reads a value the inner event sets, moves AgGrid row-click state setup into the cell control events that relied on it, and lists the other nested events for review. Closes #1154.

### Patch Changes

- 0a1f07a: ag-grid block fixes:

  - Editing a cell in an input grid (`AgGridInput*`, `AgGridLowdefyInput`) that is sorted or filtered no longer overwrites another row. The edit used the row's displayed position as its position in the value, so a second row could receive the new value.
  - Icons show in `buttons` and `menu` cells in the input grids. The input grids now pass `components` to their cells, as the display grids do.
  - After a row drag in an input grid, the grid is fed the new order directly instead of the old rows.
  - `quickFilterValue` works: it shows only rows with a cell containing the text, and it can be bound to state. Before, the property was read but did nothing.
  - Event handlers read the current render's `events` instead of those from the first render.

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

- 6144814: Allow only safe link schemes in block hrefs

  An `href` is used only when its scheme is one DOMPurify allows by default (`http`, `https`, `ftp`, `ftps`, `mailto`, `tel`, `callto`, `sms`, `cid`, `xmpp`, `matrix`), or it is a relative path, a query or a fragment. Any other value, including one with leading whitespace or control characters, renders no link. This applies to `Button`, `Tag` and `FloatButton`, the url cell of table, AgentChat message and tool result links, `TiptapMentionInput` mention links, and every `href` given to the Lowdefy `Link` component, which covers table and ag-grid link, avatar and relation cells. A `Link` whose `href` is refused renders a span without navigating, and does not fall back to its `pageId` or `url`; the `Link` action with such an `href` throws "Invalid Link: no target resolved." as it does for a `url` it cannot resolve.

  `@lowdefy/helpers` exports the check as `getSafeHref(href)`, which returns the href or `undefined`; `@lowdefy/block-utils` re-exports it.

- c377065: fix(blocks-aggrid): Bundle the default menu cell icon for the AgGrid input blocks

  The menu cell falls back to the `more-vertical` icon when a column's menu sets no icon. The display AgGrid blocks declared that icon so the build bundled it, but the AgGridInput blocks, which render the same menu cell, declared no icons, so the default menu button rendered without its icon. The input blocks now declare it too. Fixes #2393.

- d2c8e01: feat(api)!: Data read into a Dynamic block's `:return` stays data.

  **Breaking:** a Dynamic block without a dynamic blocks policy no longer renders blocks or actions that its endpoint read as data. In v6, stored operator-free block config returned from a Dynamic endpoint rendered as it was; in v7 the block renders its fallback. Every block and action in the returned content must be written in the endpoint's `:return` config. A block or action that is data an operator returned (a step result, routine state, the payload, a `:for` item, a nested endpoint's result), or a copy or extension of one made with `_get`, `__args` or `__object.assign`, fails resolution. Operators that only pass their checked params through (`_if`, `_switch`, `_if_none`, `_get`, `_args`, `_function`, `_log`, `_array`, and `_object` except `fromEntries` and `defineProperty`) may return written config; content that breaks the rule renders the fallback, with an error naming the operator and the path in its result. Blocks built up in routine state, returned by a nested endpoint, looped over with `_item`, or built by `_js`/`_jsonata` fail: build them inside `:return` with `_array.map`/`_array.concat`, share block config with `_ref`, and write client operators (`__state`, `_array.map` callbacks) in the `:return` config. Data may still fill values inside written blocks, as in the documented `_array.map` pattern, and a block built by config from a stored field renders even when it equals the field. To render stored or generated block config, put the Dynamic block under a dynamic blocks policy and return the content through a `ValidateDynamic` step. See the v6 to v7 migration guide.

  Also:

  - Only operator keys lose their escaping underscore in the returned content (`__state` becomes `_state`); data keys such as `__typename` pass through unchanged.
  - Data read into a Dynamic `:return` may nest at most 200 levels deep, and dynamic blocks policy content likewise (`limits.depth`); deeper data fails resolution with an error saying so.
  - An object from data that `_object.assign` merges with other config can no longer end up as an operator on the client, for example next to a key whose value is a function or evaluates to undefined.
  - Only keys that name one of the app's operators count as operators: in the literal data check an installed client or server operator, in dynamic blocks policies and the fragment build a client operator. Data such as `{ _score: 0.5 }` or `{ _source: { ... } }` now renders as data instead of failing. The build writes `plugins/clientOperators.json` with every client operator name the app knows.
  - Dynamic blocks policies: with `state` set, every `_state` read in the content must name a literal key under that path. URLs are judged by the block's properties schema, which now marks URL-valued properties with `urlKind` (`Search` `indexUrl`, `QRCode` `icon`, `Watermark` `image`, `Tour` step covers, avatar and logo sources, link `url`s and `href`s, `Img` `src`/`srcSet`, AgGrid link cells), whatever the property is called. Every value no schema marks is still judged by its key name; `urlKind: false` opts a URL-named property out (`Search` `result.url`, the Tiptap `image` settings). URLs are read as the browser's URL parser reads them, so surrounding spaces and embedded tabs or newlines do not change the verdict.

- a2b5466: fix: Block meta now declares the events and properties the components already support.

  The `EChart` block declares all 35 ECharts events it wires through, not just `onClick`, so they are valid config and appear on the docs page. `AgGrid`, `Tabs` and `DropdownButton` mark themselves as firing event names authored in their own properties.

  Several property schemas were narrower than the components that read them and are widened to match: numeric `Avatar` and `Spinner` sizes, `Collapse` `defaultActiveKey` arrays, `Layout` `hasSider`, `SkeletonInput` `label`, `SkeletonButton` `shape`, `ProgressBar` `progress`, `PhoneNumberInput` `showFlags`, `ColorSelector` `label` and `title`, `Sider` and `Menu` theme strings, `TimelineList` pending text, `SegmentedSelector` middle size, selector option values of any type, and the AgGrid grid-option passthrough and cell types.

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

- a9442cc: Production pages load only the plugin code they use.

  The production client used to ship every block, action, operator and icon the app uses anywhere in one main bundle, and every first visit downloaded all of it. Now the build writes one small module per distinct page type set, and each page loads its own. On the docs app the main bundle drops from 6,016 kB to 1,021 kB (1,778 kB to 332 kB gzipped). A simple page's first load drops from 1,720 kB to 529 kB gzipped.

  - The HTML preloads the page's chunks alongside the main bundle, so the first page does not wait an extra round trip.
  - Content-hashed assets are served with `Cache-Control: public, max-age=31536000, immutable`, on the Node server and in `lowdefy vercel-output`.
  - Lowdefy's plugin packages declare `"sideEffects": ["**/*.css"]`, so a page that uses one block no longer loads the whole package.
  - The build adds the types a page runs without naming them: the operators the `_js` accessors call, and the actions and operators a block runs for events it registers itself (such as `Request` in `Upload` or `SetLocale` in `PageHeaderMenu`), which blocks list in `meta.actions` and `meta.operators`. Plugin blocks that register their own events should list them the same way.
  - A Dynamic block whose content uses a type its `properties.types` did not declare still works: the page loads the full type set and the server logs a warning naming the type to declare.

  No config changes. The dev server is unchanged.

- 3eb3691: Tag colours are fixed and readable.

  - **Preset tag colours render as themselves.** purple, cyan, geekblue, gold, lime, magenta and volcano pointed at CSS variables antd doesn't define, so they fell back to blue, orange, red or green. `pink` is added.
  - **Tag text is readable.** Tags (Table, TableLight, ag-grid tag and progress cells, HTML `data-tag`/`data-status`) use antd Tag's fill, border and text shade, with the text mixed toward the base text colour. Every preset, status name and custom colour reaches at least 4.5:1 contrast in light and dark themes; gold text on its tint went from 1.75:1 to 6.4:1. red, orange, yellow, green and blue now take their base colour from antd's palette, as antd's Tag does, so status dots and rule colours shift slightly.
  - **An input-container's slots can render with their own loading state** (`content[slot](style, { loading })`). By default they still inherit the block's loading, so existing blocks are unchanged. The Table uses this so its toolbar and bulk-bar buttons stay usable while the page loads.

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

- ae9803e: feat(blocks): icon-only buttons get tooltips. A Button with `hideTitle: true` (or a circle button with no visible title) now shows its `title` on hover, and a buttons cell in an AgGrid does the same for each icon-only button, so a row of glyphs says what each one does. A `tooltip` property on either sets its own hover text.
- Updated dependencies [ae9803e]
- Updated dependencies [ea69869]
- Updated dependencies [6d6f8fa]
- Updated dependencies [1d3a0b8]
- Updated dependencies [6d6f8fa]
  - @lowdefy/blocks-antd@6.1.0
  - @lowdefy/block-utils@6.1.0
  - @lowdefy/helpers@6.1.0

## 6.0.0

### Minor Changes

- e7a9270: feat(blocks-aggrid): Add a `menu` cell for row actions.

  `cell.type: menu` renders a row's actions as a dropdown behind one trigger button, instead of spending a wide column on a `buttons` cell. Each `cell.items[]` entry declares its own `eventName`, so items wire to block-level events exactly as buttons do, and the same `*Field` row-data resolution applies (`titleField`, `iconField`, `disabledField`, `hiddenField`).

  ```yaml
  - headerName: ''
    colId: menu
    width: 60
    cell:
      type: menu
      items:
        - eventName: onMenuRename
          title: Rename
          icon: AiOutlineEdit
          hiddenField: readOnly
        - eventName: onMenuDelete
          title: Delete
          icon: AiOutlineDelete
          danger: true
          hiddenField: readOnly
  ```

  A hidden item is dropped rather than disabled, and a row on which every item is hidden renders no trigger at all rather than a button that opens an empty menu. The trigger's `type` and `shape` are fixed rather than configurable, because both keys are already taken at cell level (`type` names the renderer, `shape` is the avatar's); `icon` and `placement` are configurable.

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

- 1cc1521: fix(blocks-aggrid): Stop cells being destroyed on every render.

  `processColDefs` built a fresh `cellRenderer` function for every column on every render. A cellRenderer is a React element type, so a new function is a different component: ag-grid's `CellCtrl.refreshCellRenderer` bails when `cellRendererClass !== componentClass` and the cell is recreated. Anything a cell was holding died with it — an open popup, the focus and half-typed value of a `selector`, `textInput` or `paragraphInput` cell — whenever anything else re-rendered the block, including a request finishing elsewhere on the page.

  Each column now keeps one renderer adapter for its lifetime and the closure behind it is replaced in place, so ag-grid keeps the cell and the cell still renders the current config. Because cells are no longer recreated when a column definition changes — ag-grid refreshes body cells on data changes and does not listen for `colDefChanged` — the block now calls `refreshCells({ force: true })` when the authored `columnDefs` change, which re-renders the mounted cells in place. Function-valued column properties are compared by identity, since `JSON.stringify` cannot see them.

  Both the display and input grids are fixed.

- Updated dependencies [ef707bd]
- Updated dependencies [46029df]
- Updated dependencies [28cb944]
- Updated dependencies [ae5f618]
- Updated dependencies [01d7552]
- Updated dependencies [629837d]
- Updated dependencies [6446ae6]
- Updated dependencies [fb80e0a]
- Updated dependencies [0e71ebd]
- Updated dependencies [c2e0823]
  - @lowdefy/blocks-antd@6.0.0
  - @lowdefy/helpers@6.0.0
  - @lowdefy/block-utils@6.0.0

## 5.6.0

### Minor Changes

- 8306262: feat(blocks-aggrid): Add `AgGridLowdefy`, upgrade to AG Grid v33, and theme every grid through the Theming API.

  **Two new blocks.** `AgGridLowdefy` (display) and `AgGridLowdefyInput` (input) are grids themed from the app's antd design tokens — primary colour, surfaces, fonts and radius — so they look like they belong in a Lowdefy app and follow light/dark mode automatically, with no configuration and no separate dark block. They take a `size` property (`small | middle | large`, default `middle`) mirroring antd Table's densities, which sets row and header height to 36 / 44 / 54 pixels. Everything else — properties, events, methods, cell renderers — is identical to the existing grids.

  To adopt, change `type: AgGridBalham` to `type: AgGridLowdefy` (or `type: AgGridInputBalham` to `type: AgGridLowdefyInput`). Every property carries over unchanged and the grid will deliberately look different afterwards. It is a visual opt-in, so there is no codemod.

  Note that `size` loses to an explicit height: `rowHeight` and `headerHeight` are AG Grid grid options, and a grid option beats the theme parameter `size` sets. Setting `size: large` alongside `rowHeight: 30` gives 30 pixel rows under a 54 pixel header — use one or the other.

  **AG Grid v33.** The package moves from `@ag-grid-community/*@32` to `ag-grid-community` + `ag-grid-react@33.3.2`, with `AllCommunityModule` registered explicitly. The Theming API is v33's default and class-based file themes are gone, so no block imports AG Grid CSS any more.

  **The Balham, Alpine and Material blocks change appearance slightly.** They are kept indefinitely with the same API and the same names, but they now render AG Grid's prebuilt Theming API equivalents of those themes, with the antd colour mapping carried across as theme parameters. No config change is needed. What shifts:

  - Spacing and header weight move a little — Balham rows go 28px to 29px, cell horizontal padding tightens on Balham and Alpine, the wrapper corner radius now comes from each theme (Balham 2px, Alpine 3px, Material 0) rather than a uniform 6px, and Balham's header weight goes from 600 to bold. Icons come from each theme's own SVG set, so glyph shapes differ from the old icon font.
  - Row height now tracks the app's antd font size on Balham and Material, because v33 derives it from the data font size. It was font-size-independent before. The height only moves once the font size passes the theme's icon size (16px on Balham, 18px on Material), so at antd's default 14px nothing changes — you will see it at 18px or 20px. Alpine is unaffected at any font size.
  - Four colours are re-pointed: row hover is a neutral fill rather than a primary tint, borders are lighter, the checkbox outline tone changes, and popup shadows are softer.
  - Zebra striping, fonts and overall row density are preserved.

  **A new `themeParams` property, on all eight blocks.** `themeParams` takes AG Grid Theming API parameter names and merges them onto the block's theme — the recommended way to retint a single grid:

  ```yaml
  - id: my_table
    type: AgGridLowdefy
    properties:
      themeParams:
        headerBackgroundColor: '#1a1a2e'
        headerTextColor: '#e0e0ff'
        borderColor: var(--ant-color-primary)
  ```

  Values are CSS strings and may reference antd tokens. Neither Lowdefy nor AG Grid validates parameter names, so a misspelled key is a silent no-op — check spelling against AG Grid's theming parameter reference.

  Overriding `--ag-*` variables through a block's `style` — the documented `custom_theme` technique — **still works**; the Theming API honours an ancestor's declaration by design. The one caveat is that v33 renamed or folded away a number of the v32 `--ag-*` variables, and an override naming one of those is now a silent no-op. `--ag-header-foreground-color`, which appears in the documented example, is the case to watch: it is now `headerTextColor` (`--ag-header-text-color`). The AgGrid docs page carries the mapping table.

  **One deprecation warning existing apps may see.** `rowSelection: multiple` / `single` is deprecated in v33 in favour of `rowSelection: { mode: multiRow }` / `{ mode: singleRow }`. The string form still works. If you migrate it, three things must move together:

  - **Set `enableClickSelection: true`.** The string form defaults click-to-select on; the object form defaults it **off**. A bare `{ mode: singleRow }` silently stops clicking a row from selecting it, and `onRowSelected` / `onSelectionChanged` stop firing. The object form is not equivalent without this.
  - **Move the colDef flags in the same edit.** `checkboxSelection` and `headerCheckboxSelection` on a column become `rowSelection.checkboxes` and `rowSelection.headerCheckbox`. v33 only supports `headerCheckboxSelection` alongside the _string_ form, so migrating one without the other breaks the header checkbox.
  - **Six sibling options are read only in the string branch and are silently lost on migration:** `suppressRowClickSelection`, `suppressRowDeselection`, `rowMultiSelectWithClick`, `groupSelectsChildren`, `groupSelectsFiltered` and `isRowSelectable`. All six are deprecated in favour of `rowSelection.*` — move any you use across.

  **Dark-mode apps now get dark browser chrome throughout (`@lowdefy/client`, `@lowdefy/server`, `@lowdefy/server-dev`, `@lowdefy/server-e2e`).** `color-scheme` is now set on `<html>` from the resolved dark-mode state — in the client's dark-mode effect and in each server's pre-hydration inline script, so first paint matches too. Native scrollbars, `<select>` dropdowns, date pickers and autofill backgrounds render dark in a dark app, inside grids and everywhere else. This is an app-wide behaviour change, well beyond AgGrid, and it is what lets the grid's own scrollbars follow dark mode. Apps pinned to light with `theme.darkMode: light` are unaffected, including on a dark OS. Apps that leave `theme.darkMode` unset get the default, `system`, so on a dark OS they resolve to dark and do pick up `color-scheme: dark` — set `theme.darkMode: light` if that is not wanted.

### Patch Changes

- Updated dependencies [3ead269]
- Updated dependencies [9399e4e]
- Updated dependencies [79bbd84]
- Updated dependencies [508708d]
- Updated dependencies [824f4be]
- Updated dependencies [824f4be]
- Updated dependencies [3ead269]
- Updated dependencies [1a6223f]
- Updated dependencies [3ead269]
  - @lowdefy/helpers@5.6.0
  - @lowdefy/blocks-antd@5.6.0
  - @lowdefy/block-utils@5.6.0

## 5.5.1

### Patch Changes

- Updated dependencies [59cae71]
  - @lowdefy/blocks-antd@5.5.1
  - @lowdefy/block-utils@5.5.1
  - @lowdefy/helpers@5.5.1

## 5.5.0

### Minor Changes

- c5cc340: feat(blocks-aggrid): Add interactive cell inputs — `selector`, `multipleSelector`, `switch`, `textInput`, and `paragraphInput`.

  The display AgGrid theme blocks (`AgGridAlpine`, `AgGridMaterial`, `AgGridBalham`) gain five new built-in `cell.type` renderers that put an input control in each row, alongside the existing `buttons` cell. They follow the same event-only model: the control is bound to the row value, and on change it fires the column's `eventName` with `{ row, value, newValue }`. The app persists the change by updating the data bound to `rowData` (e.g. a `SetState` or `Request` in the event chain); the cell also writes the new value into ag-grid's row node for immediate feedback.

  - `selector` / `multipleSelector` — antd `Select` (single / multiple). Reuses the standalone `Selector`/`MultipleSelector` block option handling, so `options` (primitives or `{ label, value, disabled, color, filterString, style }`), `valueKey`, `primaryKey`, `variant` (incl. `solid` fill), colored labels and tag pills all work. Other config: `placeholder`, `allowClear`, `showSearch`, `showArrow`, `maxTagCount`, `autoClearSearchValue`, `size`, `disabled`.
  - `switch` — antd `Switch`, fires on every toggle (boolean value). Config: `checkedText`, `uncheckedText`, `checkedIcon`, `uncheckedIcon`, `color`, `size`.
  - `textInput` — antd `Input`, commits on blur / Enter (typing is held locally so the cell keeps focus). Config: `placeholder`, `allowClear`, `maxLength`, `showCount`, `inputType` (HTML input type — renamed to avoid clashing with `cell.type`), `variant`/`bordered`, `size`.
  - `paragraphInput` — antd `Typography.Paragraph` with inline editing; commits on edit confirm. Config: `editable`, `maxLength`, `autoSize`, `editTooltip`, `copyable`, `ellipsis`, and text styling (`code`, `strong`, `italic`, `underline`, `delete`, `mark`, `textType`).

### Patch Changes

- @lowdefy/blocks-antd@5.5.0
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

### Minor Changes

- 99fe9b8: feat(blocks-aggrid): Buttons cell renderer and ag-grid v32 update.

  **New `cell.type: buttons` renderer** — render a list of action buttons in a column with each button firing its own block-level event with the row data on the payload. Per-button properties mirror the antd Button block (`title`, `icon`, `type`, `variant`, `color`, `size`, `shape`, `danger`, `ghost`, `hideTitle`, `disabled`) plus row-data-path variants (`titleField`, `iconField`, `disabledField`, `hiddenField`) for per-row state. Use this for inline Edit/Delete/Approve actions without `_if` dispatching.

  **ag-grid updated to v32.3.9** — pulls in two majors of upstream fixes. The column header UX (hamburger column menu with filter popup) is preserved by default; opt into the new ag-grid v32 column menu via `columnMenu: 'new'` on the block.

  **Cell focus suppressed by default** — `suppressCellFocus` now defaults to `true` so the keyboard focus outline doesn't visually compete with built-in cell renderers (tags, buttons, links). Override with `suppressCellFocus: false` if needed. Cell overflow is also clipped so flex-rendered content stays inside its column.

- 7f40746: feat(blocks-aggrid): Tag cell renders one tag per item for array-valued fields.

  The `cell.type: tag` renderer now accepts an array of strings in addition to a single string. Each item is rendered as its own styled tag and resolves its colour through the existing `colorMap` / `colorFrom` / `default` configuration. Empty arrays and arrays containing only null/empty entries render the em-dash placeholder, matching the existing null-value behaviour. Single-string values are unchanged.

- e3a08cc: feat(blocks-aggrid): Auto-colour tag cells by default for consistent per-value colouring.

  When a `cell.type: tag` column is used with no `colorMap`, no `colorFrom`, and no `default`, tag values are now coloured from a stable hash so the same value always gets the same colour across rows, columns, and tables. The palette uses 12 antd named hues (red, volcano, orange, gold, yellow, lime, green, cyan, blue, geekblue, purple, magenta) and respects the active theme.

  The grey fallback is still available — set `cell: { type: tag, default: default }` on any column to opt out. When `colorMap`, `colorFrom`, or `default` is set, behaviour is unchanged.

### Patch Changes

- @lowdefy/block-utils@5.3.0
- @lowdefy/helpers@5.3.0

## 5.2.0

### Patch Changes

- 186a57d: fix(blocks-aggrid): Suppress cell focus by default and clip overflowing cell content.

  The ag-grid cell focus outline visually competed with built-in cell renderers (buttons, links, tags), so `suppressCellFocus` now defaults to `true` and can still be overridden per grid. The antd cell wrapper also clips overflowing flex children so long text and inline cell components no longer blow out the cell width.

  - @lowdefy/block-utils@5.2.0
  - @lowdefy/helpers@5.2.0

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
