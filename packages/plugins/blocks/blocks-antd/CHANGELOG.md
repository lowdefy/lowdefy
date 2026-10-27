# Change Log

## 7.2.0

### Minor Changes

- 0f0cd03: The `Search` block can show a few best results per group, keep one action row last, and remember the results a person opened. A production app's command palette needs this to search documents, controls and people at once, where one kind used to crowd out the others under `maxResults`.

  - `groups[].limit` shows that many rows for a group, with the group's full match count in the heading and a "See all N" row when there are more. `groups[].seeAll` is an object (`label`, `pageId`, `urlQuery`) that fires `onSeeAll` with `{ group, count, query, pageId, urlQuery }`, or the name of an event to fire instead. `maxResults` keeps its meaning when no group sets a limit; when one does, it caps each group that sets none, and "Other".
  - `pinned: { title, icon, shortcut, event }` adds a row after the list while a query is typed. `{query}` in the title is the typed text. It is selected when nothing matches, reachable with the arrow keys, and its shortcut (for example `mod+enter`) works from any row. It fires `onPinned` with `{ query }`.
  - `recentResults: true` lists the last `recentResultsCount` (default 4) selected results when the input is empty, in place of recent searches, kept per app and signed-in user like recent searches.
  - Below 576px the modal is a full-screen sheet with the pinned row kept in view. `footer` adds a line of key hints.
  - `result.icon` now draws each result's icon: the field holds an icon name, or Icon properties such as `{ name, color }` to colour it by the result's state. Before, every result showed the document icon.

### Patch Changes

- 02842fe: feat(api): A block schema marks how it draws a string with `textKind` (`html` through `renderHtml`, `text` as escaped text), and a Dynamic blocks policy judges a marked value by it. In an HTML-drawn property, a markdown link target, a protocol-relative word (`//x.example`) and, unless the policy allows HTML, a CSS `url()` are words, not URLs; the `html` rule still applies. In a text-drawn property tag syntax is words too. A whole value with a loaded or script scheme (`https:`, `javascript:`, ...) is still checked, and unmarked values keep every check. `Descriptions` titles, labels and values, `Paragraph` and `Title` content, input titles and labels, `Selector`, `MultipleSelector` and `ButtonSelector` option labels and `Table` column titles, header tooltips and `emptyText` are marked `html`; the `ControlledList` title is marked `text`.
- d143e29: feat(api): A Dynamic blocks policy checks a value as a URL only where it is used as a link or source (URL keys, `urlKind` marks, `Link` params, markdown links and CSS `url()`); everywhere else a URL is text. Text a block draws as HTML or text (`textKind`) no longer has its whole value judged as a URL. `SetState` values are data (only the operator rules apply), unless an input in the content whose value is an object (rich text, uploads, table inputs) draws them. A new `textKind: data` marks values a block stores but never draws (`dataWith` names a sibling the value is data only beside): `Selector`, `MultipleSelector` and shared option `value`s beside a `label`. A new `rowsKind` mark on `Table` and `TableLight` `data` makes the rows data when every column draws its cell as text, no `cell.colorFrom` reads a row field and no `expandable.template` is set. Tags stay checked wherever a property draws HTML.
- fcea703: fix(blocks-antd): Table avatars are one size, round and readable

  In `Table` and `TableLight` an `avatar` cell with a `descriptionField` drew a 32px avatar, and a row
  without the description drew a 24px one, so a column mixed two sizes. The one-line avatar was also
  cut flat at the top and bottom, because the single-line cell wrapper clipped the avatar where it
  overhangs the text line. Every avatar in `avatar` and `people` cells is now 24px with the same gap
  to the name, and these cells no longer clip their avatars.

  Initials are 10px (were 11px), so two letters no longer fill the circle edge to edge. A `people`
  group shows its avatars side by side with a 2px gap instead of overlapping them, so no avatar or
  its ring cuts into the initials of the one before.

- 962ac05: feat(blocks-table): The Table cell details panel can load a cell's raw result on demand

  An enrichment or ai cell keeps the provider's whole answer as its raw result, often many times the size of the value, and the rows sent to the browser carried it for every cell although only the details panel shows it. The new `rawEndpoint` property names an API endpoint that returns one cell's raw result: rows can leave `_enrich.<key>.raw` out, and the details panel calls the endpoint with `{ rowKey, key }` when it opens a finished cell whose row has none, showing "Loading the raw result…" meanwhile and an error if the call fails. It loads again when the cell finishes a new run. A table without `rawEndpoint`, or a row that carries the raw result, works as before. TableLight names `rawEndpoint` as a Table-only property.

- 0dd2e9d: feat(blocks-table): A Table's saved view tab menu takes its items from `viewMenu`

  A saved view tab's menu offered only Delete view, and the only way to hide it was `locked`, which also hid Save. An app that archives views, because other features read them, could not offer Archive in place of Delete. `viewMenu: [{ key, label, danger, confirm }]` now sets the menu's items: picking one fires `onViewMenu { key, id }` with the view's id, after a confirmation when the item has `confirm` (`true` for "Are you sure?", or a message). Without `viewMenu` the menu is Delete view, firing `onViewDelete`, as before. `locked` still hides Save and disables only the default Delete. TableLight names `viewMenu` as a Table-only property.

- Updated dependencies [31d7de8]
- Updated dependencies [dd5c2b1]
- Updated dependencies [61ae799]
- Updated dependencies [f0209f6]
- Updated dependencies [3cd6d62]
- Updated dependencies [a461f7c]
- Updated dependencies [b1d42ca]
  - @lowdefy/helpers@7.2.0
  - @lowdefy/block-utils@7.2.0
  - @lowdefy/nunjucks@7.2.0

## 7.1.0

### Patch Changes

- c6d665a: fix(blocks-antd): DateRangeSelector applies a typed date on Enter

  Typing a start or end date into a `DateRangeSelector` and pressing Enter now applies the range when the other date is set: `onChange` fires with the new range, and Escape no longer puts back the old date. Before, Enter only moved focus to the other date, and nothing applied until that date was confirmed too. A typed date the block disables is not applied, and a start date after the end date is swapped into order when both inputs are enabled, as when the range is picked. A partly typed or cleared date is not applied. A typed date also stays when the block renders again before it is applied, for example for its own `onBlur` actions; before, it went back to the value. Picking dates with the mouse is unchanged.

- 3df29f3: fix(blocks-antd): A RatingSlider's `color` colours its track, handle and dots, in the hover and active states too. The slider drew them in the theme's primary colour whatever `color` was set to.
  - @lowdefy/block-utils@7.1.0
  - @lowdefy/helpers@7.1.0
  - @lowdefy/nunjucks@7.1.0

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

- 80b5cbf: feat: Expose more antd 6.6 features on the text, number, date, colour and range input blocks.

  Existing properties, events, cssKeys and defaults are unchanged. A few fixes change what existing
  apps see; they are listed under **Behaviour changes**.

  **Text inputs**

  - `TextInput`, `TextArea`: new `onClear` event. New Input tokens on the `TextInput` theme:
    `inputFontSize`, `inputFontSizeLG`, `inputFontSizeSM`.
  - `PasswordInput`: new `allowClear`, `maxLength`, `prefix` and `prefixIcon` properties, a
    `prefixIcon` cssKey, an `onClear` event, and the Input font size tokens.
  - `NumberInput`: new `prefix`, `prefixIcon`, `suffix` and `suffixIcon` properties (with
    `prefixIcon` and `suffixIcon` cssKeys), `mode: spinner` for minus and plus buttons on either side
    of the input, and `changeOnWheel`.
  - `AutoComplete`: new `prefix` and `prefixIcon` properties, an `onSelect` event that fires when an
    option is picked from the dropdown, and `popup` and `prefixIcon` cssKeys.
  - `PhoneNumberInput`: new `onClear` event, and a `selectorBg` theme token for the region selector
    background.
  - The `underlined` variant works on every input with a `variant` property.

  **Date selectors** (`DateSelector`, `DateTimeSelector`, `DateRangeSelector`, `MonthSelector`,
  `WeekSelector`)

  - New `prefix`, `prefixIcon`, `placement` and `inputReadOnly` properties, a `prefixIcon` cssKey,
    the `underlined` variant, and `onFocus`, `onBlur`, `onClear` and `onOpenChange` events.
    `DateRangeSelector` passes `{ range: 'start' | 'end' }` with `onFocus` and `onBlur`.
  - `showWeek` on `DateSelector`, `DateTimeSelector` and `DateRangeSelector`.
  - `DateTimeSelector`: `needConfirm: false` removes the OK button and saves the selection when the
    popup closes.
  - `DateRangeSelector`: `allowEmpty` for open-ended ranges (the empty end is `null` in the value), and
    `disabled` accepts `[true, false]` to disable only one end.
  - The five blocks document the same design token set, now including `presetsWidth`,
    `presetsMaxWidth`, `hoverBg`, `activeBg` and `withoutTimeCellHeight`.

  **Colour, range and toggle inputs**

  - `ColorSelector`: `mode` accepts `[single, gradient]` to offer both, `presets` items are
    documented, and a new `popup` cssKey.
  - `Slider`: `disabled` accepts an array to disable individual range handles, `range` accepts
    `{ draggableTrack, editable, minCount, maxCount }`, new `autoFocus` and `keyboard` properties,
    `onChangeComplete`, `onFocus` and `onBlur` events, and `rail`, `track` and `handle` cssKeys.
  - `Switch`: new `loading` property.
  - `CheckboxSwitch`: new `indeterminate` and `autoFocus` properties.

  **Behaviour changes**

  - `ColorSelector`: clearing the colour sets the value to `null`, where it used to be the last colour
    with zero alpha, eg. `#1677ff00`. A cleared, required ColorSelector now fails validation. In
    gradient mode the value is a `linear-gradient(...)` CSS string.
  - `PhoneNumberInput`: the region selector and the input are siblings in an `.ant-space-compact`
    group instead of an `.ant-input-group-addon`. The `ldf-phone-number-input` class and the `element`
    style stay on the outer wrapper, but CSS that targets `.ant-input-group-addon` or
    `.ant-input-group-wrapper` needs updating. The `theme` applies to both the region selector and the
    input. `addonBg` no longer applies, since there is no addon; use `selectorBg`.
  - `AutoComplete` and `ColorSelector`: `theme` tokens used to be ignored and now apply (see Fixes).

  **Fixes**

  - `AutoComplete` theme tokens now apply. They targeted a component token set antd does not have;
    they now target `Select`, which AutoComplete renders.
  - `ColorSelector` theme tokens now apply (they targeted `ColorSelector` instead of `ColorPicker`).
    The `colorPicker*` tokens are no longer documented, since antd computes them and ignores
    overrides.
  - `ColorSelector` gradient mode works: a gradient is stored as a `linear-gradient(...)` CSS string
    and read back as a gradient, where it used to collapse to its first colour and switch the picker
    back to single mode. Clearing the colour sets the value to `null` instead of a transparent hex.
  - The `popup` cssKey of the date selectors now reaches the calendar popup. The date selectors no
    longer document `addonBg`, which the DatePicker never reads.
  - The `variant` description says that `bordered: false` takes precedence, which is how the input
    blocks behave.
  - `PhoneNumberInput` renders the region selector and the input in a `Space.Compact` group instead of
    the deprecated `addonBefore`.
  - `AutoComplete` and `PhoneNumberInput` pass options as an `options` array and search settings
    through `showSearch`, instead of the deprecated `Select.Option` children and top-level
    `filterOption`, `onSearch` and `optionFilterProp`.
  - `DateTimeSelector` no longer passes the deprecated `onSelect`, which antd 6 ignores.
    `showToday` is passed to antd as `showNow` on `DateSelector` and `DateTimeSelector`.
  - `Switch` passes `size: medium` to antd for the `default` size, which antd 6 deprecates.
  - `Search` passes `destroyOnHidden` to its modal instead of the deprecated `destroyOnClose`.
  - `Search` `theme` now applies. It targeted an antd component that doesn't exist; the tokens now style the trigger Button, the search Modal and its Input.
  - `RatingSlider` no longer passes Lowdefy's `components` and `events` to the antd Slider.
  - `DateTimeSelector` documents the `secondStep` default (30) and description correctly, and
    `MonthSelector` and `WeekSelector` document that `showToday` has no effect.
  - Examples that used the removed `inputStyle`, `optionsStyle` and object `options` properties now
    use `style` cssKeys or are removed.

- 26a1894: feat: Expose antd 6.6 dropdown, tree and label features on the selector blocks and fix their antd deprecations.

  The selector, tree, list and Label blocks were audited against antd 6.6.5. New properties, events
  and style keys are additive; existing properties keep their names and defaults.

  **Selector, MultipleSelector, TreeSelector, TreeMultipleSelector**

  - New properties `placement`, `listHeight`, `virtual`, `popupMatchSelectWidth`, `prefix` and
    `prefixIcon`.
  - New `onOpenChange` event with `{ open }`.
  - New `popup` and `prefixIcon` style keys. TreeSelector and TreeMultipleSelector also get the
    `selector` key that the other two already had.
  - While the block is loading, the suffix icon becomes a spinner.
  - Selector and MultipleSelector accept `variant: underlined`.

  **MultipleSelector**

  - New `maxCount`, `showSearch` and `removeIcon` properties (plus a `removeIcon` style key).
    `maxTagCount` also accepts `responsive`.
  - `onChange` now passes `{ value }`, as Selector does.

  **TreeSelector and TreeMultipleSelector**

  - New `treeLine` and `treeExpandAction` properties.
  - TreeSelector opens its dropdown with the selected node's parents expanded (unless
    `treeDefaultExpandAll` is set), so a nested value is visible instead of hidden under a collapsed
    parent.
  - `theme` now also applies the selector tokens (`selectorBg`, `hoverBorderColor`,
    `activeBorderColor`, the `multipleItem*` tokens and so on). They were documented but had no
    effect, because antd styles the TreeSelect input with the Select tokens. New tree node tokens:
    `indentSize`, `nodeHoverColor`, `nodeSelectedColor` and `switcherSize`.
  - TreeMultipleSelector gets `maxCount`, `checkStrictly` (with `checkable`),
    `autoClearSearchValue` and `removeIcon`. `maxTagCount` also accepts `responsive`.

  **TreeInput**

  - New `blockNode` and `height` properties. Setting `height` turns on virtual scrolling for large
    trees.
  - New `item`, `itemTitle` and `itemSwitcher` style keys.
  - `theme` now documents the Tree tokens instead of the TreeSelect ones.

  **RadioSelector, CheckboxSelector, ButtonSelector, SegmentedSelector**

  - New `options` style key for styling each option.
  - ButtonSelector gets `block`, which stretches the buttons to full width, and `direction`, which
    can stack them vertically.
  - SegmentedSelector options accept a `tooltip`, and `icon` can be an Icon properties object.

  **ControlledList**

  - No longer renders antd's `List`, which antd 6.6 deprecates. ControlledList renders the same markup
    and `ant-list-*` class names itself and ships the List styles it uses, so it looks the same and
    existing CSS and tests keep matching. Its `theme` tokens, List tokens from the app theme or a
    ConfigProvider block, and a ConfigProvider `componentSize` still apply.

  **Label**

  - New `wrap` property (also on every input's `label`), for wrapping long inline labels.
  - The per-breakpoint label widths `xs`, `sm`, `md`, `lg`, `xl` and `xxl` (each `{ span }`), which
    already worked, are now documented on the Label block and on every input's `label`.
  - Fixed: the Label block's `theme` tokens (`labelColor`, `labelFontSize`,
    `labelRequiredMarkColor`, colon margins, feedback colors) had no effect and now apply.
  - Fixed: `class.element` and `style.element` now reach the Label block's row.

  **Fixes**

  - RadioSelector and CheckboxSelector no longer trigger antd's deprecated `Space` `direction` prop.
  - ListSelector no longer passes the deprecated Card `size="default"`. It and the Select-based
    blocks now pass antd's `medium` for the default size, and SegmentedSelector maps `middle` to
    `medium`.
  - Selector and MultipleSelector build antd `options` instead of `Select.Option` children. The
    search props (`filterOption`, `onSearch`, `autoClearSearchValue`, `treeNodeFilterProp`) now go
    inside `showSearch`, where antd 6 expects them.
  - ControlledList: the `addItemButton.title` lookup had a stray trailing space in its path. Items
    added for `minItems` are now pushed after render instead of during it, before the list paints.
    The remove icon no longer causes a React key warning.
  - Tree dropdown nodes no longer log antd's "`key` or `value` must be the same" warning.
  - The Selector and TreeSelector e2e helpers `value` and `placeholder` read antd 6's class names.
  - TreeInput examples use the flat `primaryKey`/`parentKey` data model instead of nested
    `children`, which TreeInput does not read.

- 6f20e75: feat: Expose antd 6.6 features on the display and typography blocks, and stop passing deprecated props to antd.

  The display and typography blocks were audited against the antd 6.6.5 docs. New properties,
  events and CSS keys are additive; existing property names and values keep working and are
  translated to the antd 6 names where antd renamed them.

  New features:

  - `Alert`: `variant` (`outlined` or `filled`) and `closeIcon`. The `message`, `action` and
    `closeIcon` CSS keys now style the title, actions and close button.
  - `Avatar`: `srcSet`, and `focus` as a `group.maxPopoverTrigger`. In group mode `onClick` fires
    for each avatar with `event.index`.
  - `Badge`: `ribbon` (`text`, `color`, `placement`) renders a corner ribbon around the content,
    `title: false` removes the native tooltip, and the `paddingInline` theme token. The `indicator`
    CSS key now styles the count.
  - `Calendar`: `showWeek`, and `header`, `item` and `itemContent` CSS keys.
  - `Card`: `variant`, `loading`, an `actions` slot for the bar at the bottom of the card, and a
    `title` CSS key. The `cover`, `actions` and `extra` CSS keys now also take styles.
  - `Carousel`: `autoplay: { dotDuration: true }` for a progress dot, `initialSlide` and
    `waitForAnimate`. `onSwipe` passes `event.direction`.
  - `Collapse`: `ghost`, `size` (`small`, `medium`, `large`), `collapsible` (`header`, `icon`,
    `disabled`), a list `activeKey`, a `title` CSS key and the `headerPaddingSM`, `headerPaddingLG`,
    `contentPaddingSM` and `contentPaddingLG` theme tokens.
  - `Descriptions`: `size: medium`, item `span: filled` and breakpoint spans, `xxl` and `xxxl`
    columns, and `header` and `title` CSS keys.
  - `Divider`: `variant` (`solid`, `dashed`, `dotted`), `size` (`small`, `medium`, `large`), and
    `title` and `rail` CSS keys.
  - `Title` and `Paragraph`: `actions.placement` to put the copy and expand buttons before the text,
    `keyboard`, ellipsis `expandable: collapsible`, `defaultExpanded`, `symbol` and `tooltip`, and an
    `actions` CSS key. `onExpand` passes `event.expanded`.
  - `Progress`: `size`, `percentPosition`, gradient and per-step `strokeColor`, circle `steps` with a
    `gap`, `butt` line caps, and `rail`, `track` and `indicator` CSS keys.
  - `QRCode`: `iconSize` as `{ width, height }` and a `cover` CSS key.
  - `Result`: `title` and `subTitle` CSS keys.
  - `Statistic`: `timer` (`countdown` or `countup`, with a `format`) and an `onFinish` event, and
    `title`, `content`, `prefix` and `suffix` CSS keys.
  - `Tag`: `variant` (`filled`, `solid`, `outlined`), `disabled`, `href`, `target`, `closeIcon` and
    a `closeIcon` CSS key.
  - `TimelineList`: `orientation`, `variant`, `titleSpan`, a `label` CSS key and the `dotSize` theme
    token.
  - `Watermark`: `text` lines can be `{ text, font }` to style each line.

  Fixes:

  - `Title` and `Paragraph` with an expandable ellipsis, an ellipsis suffix or a copy button cut plain
    text content to the given rows instead of collapsing it to "...".
  - `Calendar` in year mode with `dateCellData` no longer repeats the month name in each cell.
  - `Carousel` `onSwipe` fires. react-slick drops an `onSwipe` prop, so the event never ran.
  - `Collapse` renders when `panels` is an empty list, and the `content` CSS key styles the panel
    body.
  - `Avatar` group `onClick` fires. It was set on the group, which antd does not forward.
  - Deprecated antd props are no longer passed: `Alert` `message`, `closeText`, `onClose` and
    `afterClose`; `Avatar.Group` `maxCount`, `maxStyle` and popover props; `size: default` on
    `Avatar`, `Badge`, `Card` and `Descriptions`; `Carousel` `dotPosition`; `Collapse.Panel` and
    `Descriptions.Item` children; `Progress` `width`, `trailColor`, `gapPosition` and line
    `strokeWidth`; `Timeline.Item` children, `pending`, `pendingDot` and `mode: left|right`.
  - `Progress` `gapPosition` is applied. It was documented but not passed to antd.
  - Examples in `tests.yaml` use `slots` instead of the deprecated `areas`, and no longer use
    properties the blocks do not have.

- 7c4879b: feat: Expose antd 6 options on the overlay, feedback, layout and file blocks.

  The overlay, feedback, layout and upload blocks now expose the antd 6.6 features that fit
  declarative config, and several properties that silently did nothing now work.

  **Modal, ConfirmModal and Drawer**

  - `mask` also takes an object: `enabled`, `blur` (blur the page behind the dialog) and `closable`.
    `maskClosable` still works and is folded into `mask.closable`.
  - `closable` also takes an object: `disabled` shows the close button disabled; on Drawer,
    `placement: end` moves it to the end of the header.
  - New `focusable` object (`trap`, `focusTriggerAfterClose`; ConfirmModal adds `autoFocusButton`).
  - New `keyboard` (Modal, ConfirmModal) and `scrollLock` (Modal, ConfirmModal).
  - New `loading`, `destroyOnHidden` and `forceRender` (Modal, Drawer).
  - Modal: responsive `width` object (`xs` to `xxl`), `afterOpenChange` event with `{ open }`, `title`
    cssKey. The `afterClose` event it already fired is now documented.
  - Drawer: `size` (`default`, `large`, a number or a CSS length), `resizable` with `maxSize` and an
    `onResizeEnd` event with `{ size }`, html `title`, `title` cssKey, and `open` on the
    `afterOpenChange` event. The `getContainer` property it already passed to antd is now documented:
    `false` renders the drawer in place, a CSS selector mounts it in the matching element.
  - ConfirmModal: `okButton` and `cancelButton` document their button properties, including
    `iconPlacement: end`.

  **Message and Notification**

  - Notification: `showProgress`, `pauseOnHover`, `closable`, `role`, the `placement` values `top`
    and `bottom`, and `title`, `description`, `actions` and `progress` cssKeys.
  - Notification: the `button` now closes the notification when clicked, as documented.
  - Message: `pauseOnHover` and an `onClick` event.

  **Tooltip and Popover**

  - `arrow` (`false` hides it, `{ pointAtCenter: true }` centres it), the `contextMenu` trigger, and
    `{ open }` on the `onOpenChange` event.
  - Popover: `destroyOnHidden`, html `title`, and the `width` and `minWidth` theme tokens.
  - Tooltip: `destroyOnHidden`, the antd 6 name for `destroyTooltipOnHide`, which still works.

  **Flex, Masonry, MasonryList, Splitter and ConfigProvider**

  - Flex: `orientation`, the `medium` gap preset, and the `start`, `end`, `left`, `right`, `normal`,
    `self-start` and `self-end` alignment values.
  - Masonry and MasonryList: `item` cssKey and responsive `gutter` objects.
  - Splitter: `collapsible` (`motion`, custom `icon.start` and `icon.end`), `destroyOnHidden` (also per
    panel), `draggerIcon`, the `onDraggerDoubleClick` event with `{ index }`, and `panel`, `dragger`,
    `draggerIcon` and `collapseIcon` cssKeys. Panel `collapsible` objects document `start`, `end` and
    `showCollapsibleIcon`. The default collapse arrows are now the `chevron-left`, `chevron-right`,
    `chevron-up` and `chevron-down` icons, so they follow the app icon set.
  - ConfigProvider: `virtual`, `popupMatchSelectWidth`, `popupOverflow`, `wave` and the `medium`
    component size.

  **Upload, UploadDragger and UploadPhoto**

  - `showUploadList` also takes an object with `showPreviewIcon`, `showRemoveIcon` and
    `showDownloadIcon`.
  - Upload and UploadDragger: `directory` (upload a folder) and `listType` (`text` or `picture`).
  - Upload and UploadPhoto: `pastable` (upload files pasted on the page).
  - UploadDragger: `openFileDialogOnClick`, for a drop or paste only area.
  - UploadPhoto: `capture` (`user` or `environment` camera on mobile) and `listType`
    (`picture-card` or `picture-circle`).
  - Upload documents `iconPlacement` on its `button`.

  **Fixes**

  - Notification status icons lost their colour on antd 6.6; the colour class now reaches antd's icon
    wrapper. Notification passes `actions` instead of the deprecated `btn`.
  - Modal and ConfirmModal no longer pass the deprecated `maskClosable`, Tooltip no longer passes
    `destroyTooltipOnHide` or the removed `arrowPointAtCenter`, Popover no longer passes
    `overlayInnerStyle`, and Splitter no longer passes `layout`. The Lowdefy properties keep working.
  - The Modal `content` cssKey and the Tooltip `inner` cssKey styled nothing, because antd 6 renamed
    those parts to `container`. Modal `header`, `footer` and `content` styles were not passed.
  - The Popover `inner`, `title` and `content` cssKeys were never wired.
  - ConfirmModal ignored `theme` and never fired its `onClose` event.
  - ConfigProvider ignored its `theme` property; it is now merged into the design tokens, with
    `token` taking precedence.
  - ConfigProvider `componentSize: middle` and Flex `gap: middle` now reach antd as `medium`, the
    name antd 6 uses.
  - Corrected documented defaults and descriptions: Drawer size (378px), Message duration (3s) and
    status (`success`), Popover placement (`top`) and hover delays (seconds), Masonry `fresh`, and
    the Flex theme tokens (the gap preset tokens `paddingXS`, `padding` and `paddingLG`).
  - The MasonryList docs page linked to the antd List component instead of Masonry.
  - Message and Notification `theme`, Notification `top` and `bottom`, and Masonry and MasonryList
    `sequential` never had an effect. They stay valid, and their descriptions now say so: set
    Message and Notification tokens app-wide under `theme.antd.components` in `lowdefy.yaml`, and
    move notifications with the `--notification-top` and `--notification-bottom` CSS variables on
    `.ant-notification`.

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

- 1227e62: feat: Table, grid, Anchor and HTML links carry `pathParams`

  Links set as block properties fill a page path's placeholders with `pathParams`, next to `urlQuery`. In TableLight, Table and AgGrid cell and row links the values are row field paths, as `urlQuery` values are there: `link: { pageId: ticket, pathParams: { ticket_id: _id } }`. A relation cell defaults `urlQuery` to `{ _id: _id }` only when neither `urlQuery` nor `pathParams` is set. `Anchor` takes `pathParams`, and an HTML link takes `data-path-params` as a JSON object: `<a data-page-id="ticket" data-path-params='{"ticket_id":"1"}'>`.

  AgGrid link and avatar link cells now build their href through the Lowdefy Link, so it includes the app's `basePath`. A plain click still emits `onCellLink` without navigating.

- ae6afbf: Added a `padding` property for denser, edge-to-edge layouts. It takes `default`, `compact` or `none`.

  - **Page layouts** (`PageHeaderMenu`, `PageSiderMenu`, `PageSidebarLayout`): `compact` cuts the space around the page content from 40px to 16px. `none` removes it, so a table or grid can fill the page. The breadcrumb keeps its own inset.
  - **`Card`**: `compact` sets the body padding to 12px and lines the header up with it, while keeping the header height. `none` removes the body padding so a list, table or image runs to the card edges.
  - **`Drawer`**: `compact` tightens the header and body. `none` removes the body padding.
  - **`Modal`**: `compact` tightens the modal to 16px. `none` removes the body padding; the header and footer keep theirs.
  - **`Collapse`**: `compact` tightens the panel body. `none` removes it.

  `default` keeps the current spacing, and styles set on the block's CSS keys still override these values.

- 81bd4f0: feat(blocks-antd): new `EventLog` block

  A virtualised log viewer for any array of records - audit trails, job runs, deploys or
  application events. Rows are searchable, filtered by severity and expandable to show the actor,
  a rich detail body and a flattened context table that can be copied as JSON. The record shape is
  mapped with the `fields` property, event types are labelled, coloured and iconed with
  `eventTypeConfig`, severity is read from an explicit `level`, and every string the block renders
  can be changed with the `text` property. Large logs can be set imperatively with the `setData`
  method.

- 1bb3012: feat(blocks-antd): Sider header slots in `PageSidebarLayout`, and a drawer header slot in `MobileMenu`.

  `PageSidebarLayout` takes two new slots above the sider menu: `siderHeader` while the sider is expanded and `siderHeaderClosed` while it is collapsed. They sit between the collapse toggle and the menu, outside the menu's scroll box, so they stay in place while a long menu scrolls. The `siderHeader` css key styles the box that holds them. A `mobileDrawerHeader` slot puts content above the menu in the mobile drawer, drawn by the new `drawerHeader` slot on `MobileMenu`. A page that sets none of them renders as before.

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

- 9de3cf9: feat(blocks-table): Collapsible column groups

  A `Table` column group with `collapsible: true` shows a chevron in its header that collapses the group to a summary column and expands it to its breakdown columns, as AG Grid's `columnGroupShow` does. `collapsed: true` starts the group collapsed. Each column or inner group takes `showWhen`: `closed` shows it while its group is collapsed, `open` while it is expanded, and `always` (the default) in both. Collapsing an outer group also hides an inner group with `showWhen: open`.

  The collapsed groups are the view's `collapsedColumnGroups`, saved and persisted with the view. A column its group hides is not displayed, searched or exported, and the column manager lists it as unavailable. `TableLight` refuses the three keys with a message naming `Table`.

- 3f3a320: `Table` enrichment columns

  Columns that compute per row from other columns: `enrichment` (a provider endpoint of the app), `ai` (a prompt), `formula` (a template filled in the browser) and `extract` (a value from another column's result), with a run state per cell, header progress, an add-column picker (`addColumn`, `providers`), column management for user-defined columns, runs of a column, row, selection or cell, a cell details panel, "+ New row" (`addRow`) and CSV import (`importCsv`). Live results arrive with `applyTransaction({ update })`. Whole documents, such as a change stream's `fullDocument`, merge shallow, so fields the server removed disappear. `merge: 'deep'` is for partial patches.

  - The feature loads in its own chunk, only for tables that use it; the picker, details panel and import dialog load on first use.
  - Formula templates and AI prompts take `{{ column }}` placeholders only, filled in as plain text, never a template engine.
  - A user-defined column with an invalid config renders as an error column with Edit and Delete, instead of breaking the table. User-defined columns are limited to text-safe types (no html, image, avatar, link or buttons), and any `cell` or template tooltip on them is dropped.
  - CSV import parses in time slices and refuses files over 50 MB or 100,000 rows.
  - `inputFieldPrefix` puts new input columns' values under a path, so `onRowAdd` and `onImport` values are all at field paths.
  - `TableInput` takes formula columns; the other enrichment keys are `Table` only, and `TableInput` refuses them with a message naming `Table`.
  - Enrichment and ai inputs read input, data, enrichment and ai columns: the picker offers only those as provider inputs and prompt placeholders, and a column reading a formula or extract column is refused (a declared one is a config error, a user-defined one an error column).
  - A cell's error tooltip says "Failed after N attempts" with the stored message, shortened, below the cell; the details panel has the whole message. Store messages users can read in your worker and provider endpoints, not a connection's error (see the guide).
  - Header progress chips take their most severe status' colour (errors red) and collapse to fit beside the title: the full counts, an icon and count per status, or a dot, with the counts in the tooltip.
  - The details panel titles each input by its provider input and column ("Full name ← Person"), and the raw result tree colours keys and values, cuts values to its width and shows an always-visible "+" to add a node as a column.
  - CSV import suggests columns for common synonyms and close spellings of a header, marked until changed.
  - AI tag and tags answers take `{ value, color }` options; the picker gives each a distinct tone. A user-defined column's option colours must be tone names.
  - Run states use the cell's font size on the text baseline; Run selected and the new-row editor leave out hidden columns; the select-all checkbox lines up with the row checkboxes; the Run submenu shows a right chevron.

- ecdfb65: feat(blocks-table): Show a total row from data in the Table summary footer

  `summaryRow` takes one row object, such as a report total computed by the request, and the summary footer shows it in place of the aggregates. Each column renders it as it renders a body row, with its type, cell options and rules. Use it for totals the table can not compute from its rows, such as a rate whose total is not the sum or average of the rows' rates.

  The row is not a data row: sorting, filtering, search, selection and the record count leave it out, it stays in view under `height`, and `exportCsv` adds it as the last line. Group headers keep their aggregates. `TableLight` refuses `summaryRow` with a message naming `Table`.

- 4a69885: feat(blocks-antd): `TitleInput` and `ParagraphInput` edit in place like a proper inline title. Click the text to edit it where you clicked. The text keeps its font, size and position while editing, and gets a focus ring instead of a bordered box that jumped 12px into the margin with an enter glyph. Hovering editable text shows a soft background, and the text can be focused with Tab and edited with Enter or F2. Enter saves, Escape cancels without closing a surrounding modal, and clicking away saves. `onChange` fires only when the value changed.

  No edit icon is shown by default any more. Set `editable.icon` (for example `icon: edit`) to add one. Edit and copy icons are muted, sized to the text instead of the heading font (so an `h1` no longer gets a heading-sized pencil), and drawn with the app's icon set. The new `placeholder` property (default `Untitled` for `TitleInput`, `Empty` for `ParagraphInput`) is shown when the value is empty, instead of a lone pencil. With no icon, `editable.tooltip` shows on the text. `onCopy` now also fires for `copyable: true`, and `ParagraphInput` fires `onExpand` (not `onCopy`) when its ellipsis is expanded.

### Patch Changes

- f0162f4: fix(blocks-antd): Accept numeric title margins and avatar sizes.

  - The `titleMarginTop` and `titleMarginBottom` theme tokens of Title, TitleInput, Paragraph and
    ParagraphInput accept a number of pixels as well as a CSS length, as antd does.
  - The `size` of the avatars in an Avatar group, and of the profile avatar on Header,
    PageHeaderMenu, PageSidebarLayout and PageSiderMenu, accepts a pixel number as well as
    `default`, `small` or `large`.

- 2bdb855: A block property that resolves to `null` now falls back to the antd default, the same as when it is not set. `_state`, `_get` and the other getter operators return `null` for a missing key, and antd applies a default only to an `undefined` prop, so a `null` used to reach antd as a real value. Fixed:

  - Errors and hangs: QRCode `errorLevel`, Flex `component`, Result `status`, Watermark `font` and DropdownMenu `placement` threw, and a Carousel `slidesToScroll` froze the page. Carousel now leaves every `null` setting out.
  - Layout: `variant` on the text inputs, NumberInput, the date selectors, the selectors, AutoComplete and Card (the border disappeared), Slider `min`, `max` and `step`, NumberInput `step`, `precision` and `mode`, Modal `width`, Drawer `placement`, Tooltip and Popover `placement`, Popover and ColorSelector `trigger` (the popup never opened), and Progress `type`, `showInfo`, `strokeLinecap` and circle `size`.
  - Smaller fallbacks: QRCode `size`, `status`, `bordered`, `bgColor` and `type`, Statistic `groupSeparator`, Descriptions `colon`, Calendar `mode`, Menu `mode`, Steps `status`, `percent` and `variant`, Alert `type`, FloatButton `type`, `shape` and `htmlType`, ColorSelector `placement` and `format`, and Watermark `rotate` and `zIndex`.

- 80c0ad2: fix(blocks-antd): Pagination wraps on a narrow row, SegmentedSelector selects nothing for an unmatched value, Sider ignores null widths

  - **Pagination**: antd 6 lays the pagination out as one flex row that does not wrap. When the total text, page buttons and size changer were wider than their container, the total text collapsed to one word per line and the rest overflowed to the right. The row now wraps onto a second line and the total text stays on one line.
  - **SegmentedSelector**: a value that matches none of the options (or an empty value) no longer draws the first option as selected. antd's `Segmented` fell back to its first option when it received no value, and clicking that option then fired no `onChange`. Now no option is selected and every option can be picked.
  - **Sider** (and `PageSidebarLayout`, `PageSiderMenu`): a `null` `collapsedWidth`, `width` or `breakpoint`, as an unset property of a module var gives, now leaves antd's default in place. Before, the sider wrote a width of `"null"`, so it kept its expanded width when collapsed, or had no width at all when the page loaded collapsed.

- 6144814: Allow only safe link schemes in block hrefs

  An `href` is used only when its scheme is one DOMPurify allows by default (`http`, `https`, `ftp`, `ftps`, `mailto`, `tel`, `callto`, `sms`, `cid`, `xmpp`, `matrix`), or it is a relative path, a query or a fragment. Any other value, including one with leading whitespace or control characters, renders no link. This applies to `Button`, `Tag` and `FloatButton`, the url cell of table, AgentChat message and tool result links, `TiptapMentionInput` mention links, and every `href` given to the Lowdefy `Link` component, which covers table and ag-grid link, avatar and relation cells. A `Link` whose `href` is refused renders a span without navigating, and does not fall back to its `pageId` or `url`; the `Link` action with such an `href` throws "Invalid Link: no target resolved." as it does for a `url` it cannot resolve.

  `@lowdefy/helpers` exports the check as `getSafeHref(href)`, which returns the href or `undefined`; `@lowdefy/block-utils` re-exports it.

- cfc8f71: fix(blocks-antd): Export the e2e helpers of ColorSelector, ConfigProvider, Flex, FloatButton, Masonry, MasonryList, PageSidebarLayout, QRCode, SegmentedSelector, Splitter, Tour and Watermark

  These blocks had e2e helpers that `@lowdefy/blocks-antd/e2e` did not export, so
  `ldf.block(...)` on them failed with "does not have e2e helpers".

- 10bee50: fix(blocks-antd): Place the PageSiderMenu footer at the bottom of the page

  PageSiderMenu rendered its footer inside the padded content area, directly after the page content, so on a short page the footer floated halfway up the screen and was offset by the content padding. The footer is now a sibling of the content, as in PageHeaderMenu: the content grows to fill the viewport and the footer sits centered at the bottom, below the page padding. The content and footer are wrapped in a new `{blockId}_main` layout element. Fixes #959.

- cb3551c: fix(blocks): Clicks inside a Modal or Drawer no longer fire the parent block's onClick

  React bubbles events through the component tree, so a click inside a Modal, Drawer or dropdown also reached the Box, Card, Span or Dynamic block that contained it in config, even though the popup renders elsewhere in the document. A Modal placed in a clickable Box that opens it would reopen as soon as its Cancel, OK or close button was clicked. These blocks now fire `onClick` (and Box `onPaste`) only for events from DOM they contain, using the new `isEventFromDomDescendant` helper from `@lowdefy/block-utils`. Fixes #1188.

- db1a4d3: fix(client): Keep browser storage per app and clear user data at sign-out

  Every key Lowdefy writes to the browser's local storage now names the app it belongs to (its `slug` and base path), so apps served from one origin no longer read or overwrite each other's values. The dark mode, locale and sider open preferences are kept per app and stay across sign-outs; a preference stored before this change is moved to the app's key the first time it is read.

  Data that belongs to a person is also kept per signed-in user: the `Search` block's recent searches. It is cleared when the user signs out with `Logout`, and on page load when a different user, or nobody, is signed in on the browser. The scroll positions Lowdefy keeps in session storage are cleared at the same time.

  Blocks reach the keys through two new block methods, `methods.getAppStorageKey(name)` and `methods.getUserStorageKey(name)`, and actions through `methods.getAppStorageKey(name)`.

- 5852b65: The `Drawer` block (used by `PageHeaderMenu`'s mobile menu) no longer logs antd 6 deprecation warnings for `width`, `height` and `classNames.content` on every page load. It passes antd's `size` and `classNames.section` / `styles.section` internally; the block's own config properties and rendered output are unchanged.
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

- 2ffac21: fix: Clear antd 6 deprecation warnings from the block console.

  Four blocks passed props that antd 6.3.1 marks `@deprecated`, so every dev console carried
  `[antd: <Component>] ...` noise that crowded out real errors. The Lowdefy-facing property names
  are unchanged — `showArrow`, `destroyInactivePanel`, `mask` and `maskClosable` are still the
  app's API; only what reaches antd changed:

  - `PhoneNumberInput` now passes `popupMatchSelectWidth` instead of `dropdownMatchSelectWidth`.
  - `Collapse` now passes `destroyOnHidden` instead of `destroyInactivePanel`.
  - `Selector`, `MultipleSelector` and `PhoneNumberInput` no longer pass `showArrow`. antd shows the
    arrow by default, so `showArrow: false` now hides it by clearing the suffix icon.
  - `Drawer` now passes antd's object mask form, `mask={{ closable: ... }}`, instead of the
    deprecated top-level `maskClosable`.

  A new e2e spec, `e2e/tests/no-antd-deprecations.e2e.spec.js`, opens every page of the blocks-antd
  e2e app and fails on any `[antd` console message.

- a2b5466: fix: Block meta now declares the events and properties the components already support.

  The `EChart` block declares all 35 ECharts events it wires through, not just `onClick`, so they are valid config and appear on the docs page. `AgGrid`, `Tabs` and `DropdownButton` mark themselves as firing event names authored in their own properties.

  Several property schemas were narrower than the components that read them and are widened to match: numeric `Avatar` and `Spinner` sizes, `Collapse` `defaultActiveKey` arrays, `Layout` `hasSider`, `SkeletonInput` `label`, `SkeletonButton` `shape`, `ProgressBar` `progress`, `PhoneNumberInput` `showFlags`, `ColorSelector` `label` and `title`, `Sider` and `Menu` theme strings, `TimelineList` pending text, `SegmentedSelector` middle size, selector option values of any type, and the AgGrid grid-option passthrough and cell types.

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

- 81bd4f0: feat(plugin-posthog): new PostHog product analytics plugin

  A default plugin that wraps the `posthog-js` browser SDK, so no script tag or snippet is
  needed. `posthog-js` is loaded lazily by `PostHogInit`, so an app with `enabled: false`
  never downloads it. Run `PostHogInit` from the app's root `events.onInitAsync`, which runs
  once per app load on whichever page opens first; repeat calls with the same `apiKey` do nothing.

  Adds `PostHogInit`, `PostHogCapture`, `PostHogPageview`, `PostHogCapturePageLeave`,
  `PostHogIdentify`, `PostHogSetPersonProperties`, `PostHogAlias`, `PostHogGroup`,
  `PostHogReset`, `PostHogOptIn`, `PostHogOptOut`, `PostHogFeatureFlag` and
  `PostHogReloadFeatureFlags`, each with a params schema.

  With PostHog disabled every other action is a silent no-op, so analytics can never break an
  app, but invalid params still throw and an action that runs before `PostHogInit` logs a
  console warning. `PostHogIdentify` reads the identity `posthog-js` holds and resets before
  identifying a different person on a shared browser.

  - **Lowdefy semantics** — every event gets `lowdefy_page_id` (the page id, also on a page with a
    path pattern) and `lowdefy_path_params` (the page's path values, `{}` without a pattern).
    Autocaptured clicks, rage clicks and dead clicks also get `lowdefy_block_id`,
    `lowdefy_block_type`, `lowdefy_block_ids`, `lowdefy_option` on a dropdown option, `lowdefy_row`
    and `lowdefy_column` inside a grid, and `lowdefy_text`: the text of the control the click
    reached (a button, menu item, option or label), even when the click lands on its icon, a child
    or a wrapper.
  - **Event failures** — a `lowdefy_event_failed` event is captured when a block or app event fails,
    with ids only, never messages or values, and at most 50 per app load. Failures in the app's
    `onInit` are captured too, although `PostHogInit` runs later in `onInitAsync`. Set
    `captureEventFailures: false` on `PostHogInit` to turn it off.
  - **Click text masking** — on by default. Click text (`$el_text`, `lowdefy_text`, `text` entries in
    `$elements_chain` and `$elements`, `$selected_content` and link targets) is kept only when the
    config of the page it was clicked on, the menus, the i18n messages or the antd locale spell it
    out. Grid and table cell values, options and menu items filled by requests, labels built from
    records and `Dynamic` block output are removed; button, menu, tab, column header and literal
    option labels stay. Element attributes other than structural ones (tag, classes, `class`,
    `role`, `type`, `row-index`, `col-id`, `nth-child`, `nth-of-type`) are removed, including
    `title`, `aria-label` and `data-*`, and `id` is kept only as a block wrapper id. Classes and
    `data-ph-capture-attribute-*` values are not masked, so apps must not build them from data. URLs
    are not masked. Set `maskDataText: false` on `PostHogInit` to send full click text, or
    `options.mask_all_text: true` to send none.
  - **Deployment environments** — `PostHogInit` registers the current environment as the
    `environment` super property on every event, and `posthog.enabled: false` in an environment
    turns PostHog off there (`PostHogInit` behaves as `enabled: false`), alongside the `cron`,
    `email` and `sentry` switches.

  For plugin authors: action plugins receive a `trace` argument for observing completed events and
  the read-only app metadata as `lowdefyApp`; the engine trace gains `isConfigText({ text, pageId })`,
  and `@lowdefy/helpers` exports `filterElementsChain`.

  AutoComplete and PhoneNumberInput render their dropdowns inside the block, like Selector.

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
  - @lowdefy/nunjucks@7.0.0

## 6.1.0

### Patch Changes

- ae9803e: feat(blocks): icon-only buttons get tooltips. A Button with `hideTitle: true` (or a circle button with no visible title) now shows its `title` on hover, and a buttons cell in an AgGrid does the same for each icon-only button, so a row of glyphs says what each one does. A `tooltip` property on either sets its own hover text.
- Updated dependencies [ea69869]
- Updated dependencies [6d6f8fa]
- Updated dependencies [1d3a0b8]
- Updated dependencies [6d6f8fa]
  - @lowdefy/block-utils@6.1.0
  - @lowdefy/helpers@6.1.0
  - @lowdefy/nunjucks@6.1.0

## 6.0.0

### Minor Changes

- ef707bd: feat(blocks-antd): Add the `TagSelector` and `TagMultipleSelector` input blocks.

  Two input blocks rendered as a row of toggleable tag pills, wrapped in the standard input label. They share the same pill rendering and stable per-value coloring, and differ only in value semantics.

  - `TagSelector` is single-select: its value is one option value. Clicking a pill selects it; clicking the selected pill clears the value (sets it to `null`).
  - `TagMultipleSelector` is multi-select: its value is the array of selected option values, and toggling a pill adds or removes it.
  - Both fire `onChange` on every change, and accept `options` as primitives or `{ label, value, color, disabled }`.
  - Each option gets a stable color (an explicit `color` wins, otherwise a color is picked from a fixed palette based on the option's value), so a given value keeps the same hue on every render. Selected pills are filled with auto-contrast text; unselected pills are outlined with a hint of their color.
  - Set `colored: false` for single-accent pills that use the primary color.
  - Both support `title`, `label`, `size`, and `disabled` like the other selector blocks, plus per-option `disabled`.

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

- ae5f618: fix(blocks-antd): Default logo width switches at the same breakpoint as the logo image.

  PageHeaderMenu and PageSiderMenu swapped the desktop/mobile logo image at 577px but the default width classes switched at 640px, so between those widths the desktop wordmark rendered squeezed into the mobile slot.

- 01d7552: fix(blocks-antd): Label, Search and ControlledList styles now apply in production builds.

  The `Label` (form-item layout), `Search` (results dropdown) and `ControlledList` (remove icon)
  styles are global stylesheets, but they were shipped as CSS Modules (`style.module.css`) imported
  for side effect (`import './style.module.css'`) with every rule wrapped in `:global(...)`. The Vite
  dev server injected them, but the production client build dropped them — so on `lowdefy build` +
  `lowdefy start` (and on Vercel) these blocks rendered with missing styling while `lowdefy dev`
  looked correct. (Same class of bug fixed in `@lowdefy/blocks-tiptap`.)

  The three files are now plain `.css` (the redundant `:global()` wrappers removed, since the
  selectors are already global), which the production build includes reliably. No config or markup
  changes. Also removed an unused CSS-module import in `MarkdownWithCode`.

- 629837d: fix(blocks-antd): Read `disabledDates` on the calendar's clock.

  `disabledDates` compared instants while reading its own bounds in local time, so in a timezone ahead
  of UTC the same calendar date could be disabled or allowed depending on which clock the date arrived
  on. On `DateSelector`, `DateRangeSelector`, `MonthSelector` and `WeekSelector` that meant a date was
  disabled in an empty picker but allowed once the block had a value, because the panel then works in
  the UTC wall clock the block reads its value in.

  Bounds and dates are now compared as the calendar dates they name, so `disabledDates.min:
'2026-07-15'` disables everything before 15 July on every clock and in every timezone. Apps in a
  timezone ahead of UTC that relied on the off-by-one boundary will see the bound move to the date it
  names.

  `disabledDates.ranges` is documented as a list of `{ from, to }` objects, but only an array of the
  two dates was read and anything else was dropped, so a range written the documented way disabled
  nothing:

  ```yaml
  disabledDates:
    ranges:
      - from: 2026-03-10
        to: 2026-03-14
      - ['2026-03-20', '2026-03-24'] # still works
  ```

  Both shapes are now read. Config that is neither raises an error instead of being dropped, and the
  same applies to the rest of `disabledDates`: a `min`, `max` or `dates` entry that is not a date, and
  a `dates` or `ranges` value that is not an array, were all ignored silently and now report where
  they are wrong. An app carrying one of these mistakes will surface an error on the block where it
  previously rendered a picker that quietly disabled nothing.

- fb80e0a: PageSidebarLayout's header slot row now stretches to the full header width, so header blocks can use `layout: grow` spacers to position content (e.g. push an item to the far right). A new `headerContent` cssKey allows overriding the slot row's style, matching PageHeaderMenu and PageSiderMenu.
- 0e71ebd: The Search block now shows a loading spinner while its search data is still loading, instead of incorrectly reporting "No results found." When documents arrive while the modal is open — for example a request that resolves after the user opens search — the index now rebuilds live and the current query re-runs, so results appear without closing and reopening the modal. A new `loading` cssKey styles the spinner container.
- c2e0823: The Search block's keyboard shortcut badge now sits at the end of the trigger button when the trigger is styled wider than its content, with the label left-aligned filling the space between.
- Updated dependencies [742a900]
- Updated dependencies [6446ae6]
  - @lowdefy/nunjucks@6.0.0
  - @lowdefy/helpers@6.0.0
  - @lowdefy/block-utils@6.0.0

## 5.6.0

### Minor Changes

- 9399e4e: feat(blocks-antd): Add `columns` and `gutter` to `CheckboxSelector` and `RadioSelector`.

  A long list of options flowed across the row and wrapped wherever the labels happened to run out of room, so it could not be read down a column. The only even alternative was `direction: vertical` — one option per line — which does not scale past a handful of options.

  Set `columns` to lay the options out in an even grid instead: `columns: 2` gives two equal-width columns. Use a count that divides 24 evenly (1, 2, 3, 4, 6, 8 or 12), or a responsive breakpoint object such as `{ xs: 1, md: 3 }`. `gutter` sets the spacing between options, as a number or a `[horizontal, vertical]` pair, and defaults to matching the spacing the flowed layout produced.

  `align`, `direction` and `wrap` describe the flowed layout and are ignored while `columns` is set. With `columns` unset, both blocks render exactly as before.

  The `theme.marginXS` description on `CheckboxSelector` is also corrected — it claimed to be the horizontal gap between checkboxes, which was never what that token affected.

### Patch Changes

- 508708d: fix(blocks-antd): Honour `label.hasFeedback: false`.

  The Label rendered the validation status icon (and message) regardless of `hasFeedback`, so an input configured with `label.hasFeedback: false` still showed a detached grey icon after `Validate`. Both the icon and the feedback message are now gated on `hasFeedback`; validation itself and the input's error/warning styling are unchanged.

- 3ead269: fix(helpers): Deep merges replace arrays instead of merging them index-by-index.

  Wherever Lowdefy deep-merges configuration — block property defaults, `AxiosHttp` connection
  and request config, theme tokens, i18n message catalogs — an array value is now treated as a
  single value. A later array replaces an earlier one; it no longer merges element-by-element
  at matching indices.

  This is what most overrides already assumed, and it matches a plain object spread. Two
  places where the old behaviour was visible:

  - `RatingSlider`'s `CheckboxInput.options` — overriding it previously inherited the default
    element's `label: 'N/A'`. It no longer does; specify the full option object.
  - The layout blocks (`PageHeaderMenu`, `PageSiderMenu`, `PageSidebarLayout`, `MobileMenu`) —
    if you set the same array (`selectedKeys`, `defaultOpenKeys`, `links`) on both `menu` and a
    breakpoint variant such as `menuLg` or `menuMd`, the breakpoint value now replaces the base
    value outright rather than overlaying it index-by-index.

  Two smaller semantic changes come with this. A later `undefined` now replaces an earlier value
  instead of being skipped — `mergeObjects([{ a: 1 }, { a: undefined }])` was `{ a: 1 }` and is now
  `{ a: undefined }`, so a caller that means "no override" must omit the key rather than set it to
  `undefined`. And a single-object merge no longer passes its input through: `mergeObjects([x]) === x`
  was `true` and is now `false`, so memoise at the call site if a stable reference is needed across
  renders. Both are reachable only from code that calls `mergeObjects` — plugin and connection authors
  — not from YAML, which has no `undefined`; a config `null` merges as it always did.

  Also fixed: merging no longer mutates its inputs. `AxiosHttp` previously wrote merged request
  config back into the shared connection config, leaking values such as the HTTP agent between
  requests.

  `lodash.merge`, the last remaining lodash dependency in Lowdefy, has been removed.

- Updated dependencies [3ead269]
- Updated dependencies [79bbd84]
- Updated dependencies [824f4be]
- Updated dependencies [824f4be]
- Updated dependencies [3ead269]
- Updated dependencies [1a6223f]
- Updated dependencies [6785e0e]
- Updated dependencies [3ead269]
  - @lowdefy/helpers@5.6.0
  - @lowdefy/nunjucks@5.6.0
  - @lowdefy/block-utils@5.6.0

## 5.5.1

### Patch Changes

- 59cae71: fix: Keep long sidebar menus fully reachable.

  Two related sidebar scrolling issues are fixed:

  - When the sidebar is collapsed, hovering a menu group with a long nested list opened a
    flyout whose top was pushed above the screen, so the first items were cut off and
    unreachable — most noticeable for groups low down the menu on shorter screens. Flyout
    menus now stay within the viewport and scroll, so every item is reachable.
  - When the sidebar is expanded with a menu taller than the screen, the last item could be
    hidden behind the logo/profile footer with no way to scroll it into view. The menu now
    scrolls between a fixed toggle and footer, so the last item is always reachable.
  - @lowdefy/block-utils@5.5.1
  - @lowdefy/helpers@5.5.1
  - @lowdefy/nunjucks@5.5.1

## 5.5.0

### Patch Changes

- @lowdefy/block-utils@5.5.0
- @lowdefy/helpers@5.5.0
- @lowdefy/nunjucks@5.5.0

## 5.4.0

### Minor Changes

- c2c3a7f: feat(blocks-antd): Add a data-driven way to populate selectors, with `valueKey` and `primaryKey`.

  Every selector — `Selector`, `MultipleSelector`, `ButtonSelector`, `RadioSelector`,
  `CheckboxSelector`, `SegmentedSelector` and `ListSelector` — can now be driven two ways:

  - **`options`** (the original way): an array of primitives or `{ label, value }` pairs. Unchanged
    and fully backward compatible.
  - **`data` + `html`**: pass raw rows and render each option label with a Nunjucks template, instead
    of building label/value pairs in your query.

  New properties:

  - `data` — raw rows, an alternative to `options`.
  - `html` — Nunjucks template for each option label (context: `item`, `index`).
  - `valueKey` — field stored as the value. With `options` it names the value field (defaults to
    `value`, so existing apps are unaffected); with `data` it names the field stored on select (omit to
    store the whole row).
  - `primaryKey` — field used to match the current value (e.g. set with `SetState`) back to an option
    for highlighting. Defaults to `valueKey`.

  Selecting an option stores `valueKey`'s value, and setting that value (or array of values for the
  multi-value selectors) via `SetState` highlights the matching option(s). Object options no longer
  require a `value` field (relaxed to support `valueKey`). Adds the shared `getSelectorOptions` and
  `getSelectedIndex` helpers; `getUniqueValues`/`getValueIndex` remain for `PhoneNumberInput`.

  Every selector also gains a **`setData`** method (call it with `CallMethod` from the block's
  `onMount` event, after a request loads the rows) to supply `data` imperatively. The dataset is held
  in the block instead of `properties`, so the engine no longer re-parses and re-serializes every row
  on each update cycle — keeping pages with very large selectors responsive. The selector still falls
  back to `properties.data`/`properties.options` until `setData` is called.

- 25225ab: feat(blocks-antd): Add `ListSelector` input block.

  Data-driven vertical list that doubles as a single-select input. Each item is rendered into a headerless antd `Card` whose body comes from a Nunjucks template against the row. Clicking a card sets the block value (the whole item, or the `valueKey` field when set) and highlights the selected card with a `colorPrimary` ring that follows the app theme. Clicking the selected card again clears the value (`allowDeselect`, on by default). Set `selectable: false` to turn selection off and render a read-only card list. Use `valueKey` to store a single field (e.g. `id`) as the value, and `primaryKey` (defaults to `valueKey`) to match a `SetState`-controlled value back to a card for highlighting.

  Backed by `react-virtuoso` so thousands of variable-height cards render smoothly with only the visible window in the DOM, and rows are `React.memo`'d via a stable `methodsRef` so unrelated parent re-renders don't bust the cache. Selection state lives in the block value, so the selected card stays correct as rows scroll in and out of the virtual window.

  Properties: `data`, `html` (Nunjucks), `valueKey`, `primaryKey`, `selectable`, `allowDeselect`, `bordered`, `hoverable`, `size`, `gap`, `height`, `overscan`, `noData`, `theme`, and an optional `search` object (`placeholder`, `fields`, `caseSensitive`, `debounce`, `sticky`, `allowClear`, `minLength`, `noResultsText`). Search defaults to matching every field path via `JSON.stringify`; supply `fields: ['user.name', 'email']` to restrict. Filtering preserves the original `index` in the template context and event payloads. Built-in loading skeleton renders when `loading` is truthy. A text-only no-results placeholder appears when the filter matches zero items, and a `noData` placeholder renders in place of the list when the `data` array is empty.

  Events: `onChange` (`{ value, index, item }`, fires on selection change when `selectable` is true), `onClick` (`{ index, item }`), and `onSearch` (`{ value, resultCount }`, fires on debounced query change when `search` is set).

  `@lowdefy/helpers`: renames the built-in i18n message keys `blocks.cardList.search.placeholder` / `blocks.cardList.search.noResults` to `blocks.listSelector.search.*` to match the block, and adds `blocks.listSelector.noData` ("No data").

- 2aaf365: feat(blocks-antd): Rename `TreeSelector` → `TreeInput`, add `TreeSelector` and
  `TreeMultipleSelector` dropdown blocks, and give all three the data-driven selector model.

  The inline tree block (antd `Tree`) is renamed **`TreeSelector` → `TreeInput`**. **Migration:**
  update `type: TreeSelector` → `type: TreeInput` in your YAML. `TreeInput` is now driven by the same
  flat model as the other selectors — `data` + `html` + `valueKey` + `primaryKey` + `parentKey` (or
  `options`) — and stores a **single** `valueKey` value (previously a root-to-node path array), matched
  back to a node by value. It also gains a `setData` method. (Nested `children` options are no longer
  used; build the hierarchy from a flat array via `primaryKey`/`parentKey`.)

  New **`TreeSelector`** (single, `valueType: any`) and **`TreeMultipleSelector`** (multiple,
  `valueType: array`) wrap antd `TreeSelect` as searchable dropdowns, sharing the same model. Build a
  flat `data`/`options` array where each row's `parentKey` references the parent row's `primaryKey`;
  the tree is assembled with `treeDataSimpleMode`. Selecting stores the `valueKey` value; a
  `SetState`-controlled value highlights the matching node(s). `showSearch`, `treeDefaultExpandAll`;
  the multiple variant adds `checkable`, `showCheckedStrategy`, `maxTagCount`. Both register a
  `setData` method (call it from the block's `onMount`) for large trees.

  All three blocks support antd design-token `theme` overrides, and the dropdowns localise their
  `placeholder` / not-found text via the `blocks.treeSelector.*` / `blocks.treeMultipleSelector.*`
  i18n message keys.

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

- 5f00be7: feat(blocks-antd): Per-item styling and new props for menu items.

  Menu items in `Menu` and `DropdownMenu` now support the same `class` and slot-keyed `style` ergonomics as other Lowdefy blocks, plus the missing antd MenuItem props.

  - **Per-item `class`** (Tailwind / arbitrary CSS) on `MenuLink`, `MenuGroup`, and `MenuDivider`. Flat string/array applies to the item wrapper; objects with dot-prefixed slot keys (`.element`, `.icon`, `.label`, and `.popup` on `MenuGroup` for the floating SubMenu popup) target specific parts.
  - **Slot-keyed `style`** on the same item types using `.element` / `.icon` / `.label`. Flat objects continue to work as a shorthand for `.element`.
  - **New item properties:** `properties.disabled` (greys out the item and blocks clicks), `properties.tooltip` (text shown when the menu is collapsed — maps to antd's `title`), and `properties.extra` (free-form right-aligned label on a `MenuLink`, e.g. `beta`, `soon`).
  - **`shortcut` badge moved to the far right.** The existing `properties.shortcut` already auto-rendered a kbd badge and wired the key handler — the badge is now floated to the far right of the item to match common menu conventions (previously inline next to the title). When `extra` and `shortcut` are both set on the same item, `extra` sits to the left of the shortcut badge.
  - **`extra` rendering note:** rendered inside the `<Link>` via `float: right` rather than antd's `extra` prop. The antd `extra` prop triggers a `display: inline-flex; width: 100%` layout on `.ant-menu-title-content-with-extra` that collapses Lowdefy-wrapped labels, so we bypass it.
  - **Unified internals:** `Menu` and `DropdownMenu` now share one item builder, eliminating the prior divergence in icon CSS keys and which props were plumbed.

  Block-level `properties.theme` on `Menu` is unchanged; pair it with `properties.danger: true` on a `MenuLink` to theme danger items via `dangerItem*` tokens. See the updated theming docs.

- 27659ef: feat: per-option `color` on selector options.

  Object options now accept a `color`, applied when that option is selected. It falls back to the block-level color when not set, and overrides it for that option when set.

  - **ButtonSelector** — the selected option uses its own color: `solid` fills the button (with auto-contrast text), `outline` colors the border/text plus a low-opacity tint.
  - **CheckboxSelector** / **RadioSelector** — each selected box tick / radio dot and its label render in the option's color (multiple checked boxes can each show a different color).
  - **Selector** — the whole input is colored with the selected option's color. A `variant` of `solid` fills the input (with auto-contrast text); `outlined` colors the border/text. Dropdown options are tinted.
  - **MultipleSelector** — each selected value's tag/pill renders in the option's color, controlled by `variant`: `solid` → filled tags, `outlined` → outlined tags (hex colors use auto-contrast text, dark-mode safe). An explicit `tag.color` still takes precedence, and per-option tag colors no longer require `renderTags`.

  `Selector` and `MultipleSelector` gain `solid` as a `variant` option (alongside the antd input variants). `CheckboxSelector`/`RadioSelector` have no variant — they only apply the per-option color.

  ```yaml
  - id: priority
    type: ButtonSelector
    properties:
      variant: outlined
      options:
        - { label: Low, value: low, color: '#16a34a' }
        - { label: Medium, value: medium, color: '#d97706' }
        - { label: High, value: high, color: '#dc2626' }
  ```

- 4e189a0: feat: Tabs block now supports per-tab dynamic events.

  Each entry in the Tabs `tabs[]` array can declare an `eventName`. When that tab becomes active, the named event is triggered (with `{ key }` of the now-active tab) in addition to the generic `onChange`. This mirrors the per-button `eventName` pattern used by the AgGrid blocks and lets each tab run its own actions without branching inside `onChange`.

  The Tabs event surface is `onChange` (fires on any tab change → `{ activeKey }`) plus these per-tab events.

  ```yaml
  - id: settings_tabs
    type: Tabs
    properties:
      tabs:
        - key: profile
          title: Profile
          eventName: onProfileTab
        - key: billing
          title: Billing
          eventName: onBillingTab
    events:
      onChange: # fires on any tab change → { activeKey }
        - id: log_change
          type: SetState
          params:
            activeTab:
              _event: true
      onProfileTab: # fires only when the Profile tab is selected → { key }
        - id: load_profile
          type: Request
          params: get_profile
      onBillingTab:
        - id: load_billing
          type: Request
          params: get_billing
  ```

- 27659ef: feat: ButtonSelector gains a `variant` (`solid` | `outlined`) property matching the Button block, and `color` now applies consistently across both styles.

  The `buttonStyle` (`solid` | `outline`) property is deprecated in favor of `variant`; it still works as an alias. `color` fixes:

  Previously `color` was applied as a Radio component-level token, so antd did not re-derive the dependent tokens — the selected solid background, hover/active states, and outline border/text kept using the default primary color, and the selected solid button could render low-contrast text on the colored background.

  - `color` is now applied as a global `colorPrimary` token, so the full palette (solid background, hover/active, outline border/text) is re-derived from it. This also means it works correctly under `darkModeToggle` / `darkAlgorithm` — the nested `ConfigProvider` inherits the parent algorithm.
  - The selected button's text now auto-contrasts (black or white, chosen by the background color's luminance) so it stays readable on any `color`, including light/pastel values.
  - In `outline` mode the selected item now gets a low-opacity tint of the active color as its background, giving it visual emphasis. The tint also applies with the default primary color when no `color` is set.

- e324c72: Label and input blocks no longer show an unwanted browser tooltip duplicating the label, which previously leaked raw HTML markup on hover when the label title contained HTML.

  Tooltips are now opt-in via a new `tooltip` label property, which shows an icon beside the label with an accessible Ant Design tooltip. It accepts either a string (the tooltip text, supports HTML) or an object to also customize the icon and color:

  ```yaml
  label:
    tooltip:
      title: More information # supports HTML
      icon: AiOutlineInfoCircle # defaults to AiOutlineQuestionCircle
      color: '#1677ff'
  ```

  A new `onTooltipClick` event fires when the tooltip icon is clicked. This applies to the `Label` block and all label-based inputs (ButtonSelector, Selector, CheckboxSelector, RadioSelector, TextInput, etc.).

### Patch Changes

- 0027a41: fix(blocks-antd): Display object-valued selector options correctly.

  Selectors whose value is an object (an option `value`, or a `data` row, that is an object rather than a scalar) now render the selected value again — both when an option is picked and when the value is pre-populated via `SetState` (e.g. an edit form), including when matched by `primaryKey`. Previously the value was stored correctly but no tag/value rendered.

  Selection matching and option de-duplication now compare values by identity — projecting `primaryKey` when set, otherwise the whole value — and ignore build-time location markers, so an object value defined in config matches the same value arriving from state or a request. Scalar-valued selectors are unaffected.

- f8a5d80: fix(blocks-antd): Correct nested `links` placement in Menu meta schemas.

  The Menu and MobileMenu meta schemas declared the third-level `links` array inside the user-facing `properties` field instead of as a sibling of it. The schema shape now matches the runtime, so block-property validation and editor autocomplete report the correct structure for three-level menu configs.

- 60c193c: fix: PageHeaderMenu active menu item underline now sits exactly on the header's bottom border.

  The horizontal menu was vertically centered in the header, so the active item's underline floated half a pixel above the header's bottom divider — two disconnected lines under the selected tab. The menu now reserves the header's 1px bottom border when sizing its line box, so the active underline lands precisely on the divider, forming a single continuous line across the full page width (including the logo) and matching the single-border look of Sider / PageSiderMenu.

- Updated dependencies [25225ab]
- Updated dependencies [f11addd]
- Updated dependencies [0108f38]
  - @lowdefy/helpers@5.4.0
  - @lowdefy/block-utils@5.4.0
  - @lowdefy/nunjucks@5.4.0

## 5.3.0

### Patch Changes

- 54d30f7: fix(blocks-antd): Add default header border to PageHeaderMenu.

  PageHeaderMenu now has a default `borderBottom` matching the existing default borders on PageSiderMenu and PageSidebarLayout, for visual consistency across the page menu blocks. The default can still be overridden via `styles.header`.

  - @lowdefy/block-utils@5.3.0
  - @lowdefy/helpers@5.3.0

## 5.2.0

### Minor Changes

- 01e249b: feat(blocks-antd): `ControlledList` now fires `onAdd` / `onRemove` events and defaults the remove icon to the antd error color at a standard size.

  **Events.** Both events fire **after** the list mutation completes. The event payload is `{ index, item }`:

  - `onAdd` — `index` is where the new row was inserted (`0` for `addToFront: true`, else `list.length`). `item` is the newly added value (typically `undefined` for an empty row).
  - `onRemove` — `index` is the removed row's position. `item` is the row value captured before removal, so handlers can reference the deleted data (e.g., `_event: item._id` to delete from a backend).

  ```yaml
  - id: tags
    type: ControlledList
    events:
      onRemove:
        - id: notify
          type: DisplayMessage
          params:
            content:
              _string.concat: ['Removed at index ', { _event: index }]
    blocks:
      - id: tags.$.label
        type: TextInput
  ```

  **Remove icon styling.** The remove icon now defaults to `var(--ant-color-error)` at `var(--ant-font-size-lg)`, with `--ant-color-error-hover` / `--ant-color-error-active` on hover/press — no more hardcoded hex colors, and the size no longer swings with `properties.size`. Override via `class.removeIcon` / `style.removeIcon` (both slots target the icon wrapper). Existing configs that hardcoded `color: '#ff4d4f'` on `removeItemIcon` can drop it — the default is already danger.

  **`@lowdefy/client`** also now passes the list's current state value to list-type block components via a `value` prop, so any list block can read its own array data.

### Patch Changes

- 6ec2cd9: fix(PageSidebarLayout): Pin the sider to the viewport so the bottom actions stay visible.

  The sider is now `position: sticky` with `height: 100vh`, so the menu, notifications, profile avatar, dark-mode toggle, and logo remain on screen as the page content scrolls. The sticky footer container fades from transparent to the container background so content passing behind it doesn't cut off abruptly.

- fd1604f: feat(blocks-antd): `DropdownButton` now supports the standard Lowdefy event-shortcut schema (`events.<eventName>.shortcut`) for item shortcuts, alongside the existing item-level `shortcut` property.

  When a shortcut is configured via the event, the framework-level shortcut manager binds and fires it — consistent with `Button`. The shortcut badge renders next to the item label in both cases. If both are set on the same item, the event-level shortcut wins. The split-button's main action now also renders a badge when `events.onClick.shortcut` is configured.

  **Event-level (preferred, matches `Button`):**

  ```yaml
  - id: actions
    type: DropdownButton
    properties:
      items:
        - title: Undo
          eventName: onUndo
    events:
      onUndo:
        shortcut: mod+z
        try:
          - id: undo
            type: ...
  ```

  **Item-level (still supported):**

  ```yaml
  - id: actions
    type: DropdownButton
    properties:
      items:
        - title: Undo
          eventName: onUndo
          shortcut: mod+z
    events:
      onUndo:
        - id: undo
          type: ...
  ```

- cea34ac: fix(PageSidebarLayout): Render notifications, profile, and dark-mode toggle as labeled, left-aligned rows when the sider is expanded.

  When the sider is open, the bottom actions now render as `[icon] [label]` rows that match the visual style of the menu items above (e.g. "Notifications", "Profile", "Light mode"). When the sider is collapsed, the actions remain as a centered icon stack. Two new optional schema fields — `notifications.title` (default `Notifications`) and `profile.title` (default `Profile`) — let consumers customise the expanded labels; consumers can also bind `_user: name` to `profile.title` to show the authenticated user's name.

  The profile dropdown's default `trigger` now depends on whether the sider is expanded: `click` when expanded (the labeled row invites click), `hover` when collapsed (original small-avatar behavior). Consumers passing `profile.trigger` explicitly are unaffected.

  No change to `PageSiderMenu` or `PageHeaderMenu` — their header-bar rendering still uses the icon-only layout and `hover` trigger.

  - @lowdefy/block-utils@5.2.0
  - @lowdefy/helpers@5.2.0

## 5.1.0

### Minor Changes

- 95388a581: feat(blocks-antd): DataDiff gains `sideBySide`, `timeline`, and `gitDiff` modes, plus depth-aware nested rendering.

  - `mode: sideBySide` — two aligned antd `Descriptions` panels (Before / After) that respond to breakpoints.
  - `mode: timeline` — antd `Timeline` with one item per change, colour-coded and breadcrumb-labelled for context.
  - `mode: gitDiff` — unified-diff YAML patch rendering with +/− line markers; for technical users who want to see every line of change. Ignores the structured-rendering props (`labels`, `format`, `maxDepth`) but still honours `hide` / `show`.
  - list mode now sub-groups array-of-objects changes into per-item sections with their own summary chips, and breadcrumbs deeply-nested row labels (`Order 1 › Customer › Name` instead of just `Name`).
  - New `maxDepth` property (default `4`) collapses changes deeper than the cap into a single JSON-rendered row at the cap, keeping deep payloads legible.

- 573b90369: feat(blocks-antd): Add `DataDiff` block for rendering user-friendly diffs.

  `DataDiff` compares two objects (`before` / `after`) and renders the differences using antd primitives (`Descriptions`, `Collapse`, `Tag`, `Empty`). v1 ships a polished `list` mode: grouped by top-level key, with `+N` / `−N` / `~N` summary chips per group, icon- and color-coded change rows, and a collapsed-JSON fallback for entirely-new nested objects. All colors come from antd semantic tokens (`colorSuccess`, `colorError`, `colorWarning`) so the block respects dark mode and `theme` overrides automatically.

  Per-path value formatters — `date`, `datetime`, `boolean` (Yes/No tag), `currency` (Intl.NumberFormat), `json` (pretty inside a subtle collapse), `code`, and `enum` (value → `{ label, color }` map) — turn raw field values into something end-users can read. `labels` maps dotted paths to display names; `hide` / `show` accept exact paths, `prefix.*`, or `*.leaf` patterns. Built on `microdiff` (~1 kB, zero deps).

  ```yaml
  - id: order_audit
    type: DataDiff
    properties:
      before: _state.original
      after: _state.current
      labels:
        status: Order status
        total: Total
      format:
        total: { type: currency, currency: USD }
        status:
          type: enum
          map:
            pending: { label: Pending, color: warning }
            paid: { label: Paid, color: success }
      hide:
        - 'internal.*'
  ```

- be367bebd: feat(blocks-antd): Expose `selector` cssKey on Select-based blocks.

  `Selector`, `MultipleSelector`, and `AutoComplete` now expose a `selector` cssKey that targets the inner tag/value container (antd v6's `content` semantic slot, rendered as `.ant-select-content` in the DOM). Use it to cap the tag container height and enable internal scroll on multi-select blocks:

  ```yaml
  style:
    .selector:
      maxHeight: 96px
      overflowY: auto
  ```

  Before this change, users had to reach for Tailwind arbitrary variants or global CSS (e.g. `[&_.ant-select-selector]:max-h-24`) to style the inner container, which leaked antd internals into app YAML and was brittle across antd upgrades.

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

- 447f8ce57: feat: Add PageSidebarLayout block

  New full-page layout block with a full-height sidebar, no top-level header, and mobile drawer navigation. The sider spans the entire viewport height with the logo pinned at the bottom.

  **PageSidebarLayout**

  - Full-height collapsible sider with inline menu
  - Sider collapse state persists in localStorage (configurable key via `siderStorageKey`)
  - Dark mode via app-level ConfigProvider — all components adapt automatically via CSS variables
  - `darkModeToggle`, `notifications`, and `profile` properties shown in the sider on desktop and the mobile header on small screens, matching PageHeaderMenu and PageSiderMenu
  - `theme` property accepts an Ant Design design token object for fine-grained color customization via ConfigProvider
  - Responsive logo: full logo when sider is expanded, square logo when collapsed, auto-swaps between light and dark variants based on dark mode
  - 8 content slots: content, footer, header, siderOpen, siderClosed, mobileExtra, mobileDrawerContent, mobileDrawerFooter

  **Drawer**

  - Added `footer` content slot and `styles.footer` passthrough

  **MobileMenu**

  - Added `logo` property for drawer header branding with dark mode-aware logo switching
  - Added `drawerContent` and `drawerFooter` content slots
  - Changed category from `display` to `container` to support slot resolution

- 36a2d1bca: feat: Persist PageSiderMenu sider open state to localStorage

  PageSiderMenu now persists its sider collapsed/expanded state across page navigations and reloads, matching PageSidebarLayout behavior.

  - Sider open state reads from and writes to `lf-{siderStorageKey}-open` in localStorage
  - New `siderStorageKey` property (default `'sider'`) — shares the same key as PageSidebarLayout by default, so the user's preference survives swapping between layouts
  - New `sider.initialCollapsed` property used as the fallback when no persisted value exists
  - Gracefully handles SSR and privacy-mode localStorage unavailability

### Patch Changes

- 6c6aab961: fix(blocks-antd): PageSiderMenu state sync, setSiderOpen bug, and menu auto-popup.

  Three related fixes so the sider persists correctly and the inline menu doesn't pop open flyouts on page load.

  - **Persistence on hard-refresh / new tab**: PageSiderMenu now feeds its computed `openSiderState` (read from `localStorage['lf-{siderStorageKey}-open']`) into the inner Sider block as `initialCollapsed`. Previously the Sider re-read the media-query-computed `initialCollapsed` independently and ignored the persisted value, so the sider always started collapsed on desktop regardless of the user's preference.
  - **`setSiderOpen({ open })` bug**: the action called the Sider's `_toggleSiderOpen` (a no-arg toggle) with an `{ open }` argument that was silently ignored. Fixed to call `_setSiderOpen({ open })` so the sider lands in the requested state. `toggleSiderOpen` now also uses the explicit setter with the computed next value for symmetry.
  - **Menu auto-popup when sider is collapsed**: the Menu block's `defaultOpenKeys` guard checked `properties.collapsed !== true`, but PageSiderMenu never passes `collapsed` as a prop — antd derives the collapsed state from `SiderContext`. As a result the current page's parent group was added to `defaultOpenKeys`, and antd's Menu auto-popped the flyout for that group on mount. Menu now reads `siderCollapsed` from `Layout._InternalSiderContext` (the same channel antd's own Menu uses) so the group auto-expansion only applies when the sider is expanded.
  - @lowdefy/block-utils@5.1.0
  - @lowdefy/helpers@5.1.0

## 5.0.0

### Major Changes

- f430f02dde: Rename and remove several block properties to match antd v6 API.

  | Block        | Old property            | New property                                 |
  | ------------ | ----------------------- | -------------------------------------------- |
  | Modal        | `visible`               | `open`                                       |
  | Tooltip      | `defaultVisible`        | `defaultOpen`                                |
  | Tooltip      | event `onVisibleChange` | event `onOpenChange`                         |
  | Progress     | `gapPosition`           | `gapPlacement`                               |
  | Carousel     | `dotPosition`           | `dotPlacement`                               |
  | Collapse     | `expandIconPosition`    | `expandIconPlacement`                        |
  | Notification | `message`               | `title`                                      |
  | Progress     | `success` (number)      | `success: { percent, strokeColor }` (object) |
  | Breadcrumb   | children API            | `items` array API                            |

- 29eb199c7f: Restructure block metadata from component static properties to dedicated `meta.js` files.

  ### Breaking Changes

  - **`schema.js` renamed to `meta.js`**: Block definitions moved from `schema.js` to `meta.js`. The `meta.js` files export `category`, `icons`, `valueType`, `cssKeys`, `events`, and `properties` (JSON Schema).
  - **`schemas.js` barrel renamed to `metas.js`**: Block packages export `./metas` instead of `./schemas`.
  - **`.meta` removed from components**: Block components no longer have a `.meta` static property. Metadata is loaded from the `blockMetas.json` build artifact at runtime.
  - **`blockMetas.json` build artifact**: The build pipeline writes `plugins/blockMetas.json` containing category, valueType, and initValue for each block type.
  - **`buildBlockSchema(meta)`**: New function in `@lowdefy/block-utils` generates complete JSON Schema from meta objects with operator support and CSS slot key validation.

- f430f02dde: Replace boolean `bordered` property with enum `variant` on 16 input and display blocks.

  **Migration:**

  - `bordered: true` (default) -> `variant: outlined`
  - `bordered: false` -> `variant: borderless`
  - New option: `variant: filled`

  Affected blocks: AutoComplete, Card, Collapse, Descriptions, DateSelector, DateRangeSelector, DateTimeSelector, MonthSelector, WeekSelector, MultipleSelector, NumberInput, PasswordInput, PhoneNumberInput, Selector, TextArea, TextInput.

- f430f02dde: Replace Button `type`/`danger` properties with `color`/`variant` to match antd v6 API.

  **Migration:**

  | Old             | New                                |
  | --------------- | ---------------------------------- |
  | `type: primary` | `color: primary`, `variant: solid` |
  | `type: dashed`  | `variant: dashed`                  |
  | `type: text`    | `variant: text`                    |
  | `type: link`    | `variant: link`                    |
  | `danger: true`  | `color: danger`                    |

- f430f02dde: Replace `ColorPicker` with `ColorSelector` using antd's native ColorPicker component. The separate `@lowdefy/blocks-color-selectors` package has been removed — `ColorSelector` is now in `@lowdefy/blocks-antd`.
- f430f02dde: Remove the Comment block (dropped upstream in Ant Design v6). Use a Card + Flex + Avatar composition instead.
- 155c0b9724: Replace moment.js with day.js across the monorepo.

  ### Breaking Changes

  - **`_moment` operator removed**: Use `_dayjs` instead. The new `@lowdefy/operators-dayjs` package provides the `_dayjs` operator with the same API patterns.
  - **`@lowdefy/operators-moment` package removed**: Apps using `_moment` must migrate to `_dayjs`.
  - **Nunjucks `date` filter**: Now uses day.js internally. Format strings are day.js compatible (mostly identical to moment).
  - **Date picker blocks**: All date/time picker blocks use day.js instead of moment for value parsing and formatting.
  - **Google Sheets connection**: Date serialization uses day.js internally.
  - **`humanizeDuration` thresholds**: The `thresholds` parameter on `_dayjs.humanizeDuration` is silently ignored (day.js does not support it).
  - **AgGrid cell renderers**: Update `__moment` to `__dayjs` in custom AG Grid cell renderer references.
  - **Date selector UTC handling**: Antd v6 bundles its own dayjs without the UTC plugin. Date selector blocks wrap antd's dayjs instances with the extended dayjs before calling `.utc()` — this is handled internally and requires no user action.

- f430f02dde: Remove Divider `type` property and align with antd v6 API. `orientation` now controls divider direction (`horizontal`/`vertical`). New `titlePlacement` property (`start`/`center`/`end`) controls where title text sits within the divider.

  **Migration:**

  - `type: vertical` -> `orientation: vertical`
  - `orientation: left` -> `titlePlacement: start`
  - `orientation: right` -> `titlePlacement: end`
  - `orientation: center` -> `titlePlacement: center` (or remove, `center` is the default)

- f430f02dde: Replace auto-generated `types.json` with source `types.js` files in all plugin packages.

  ### Breaking Changes

  - **Plugin type resolution**: Plugin types are now read from source `types.js` files instead of auto-generated `types.json`. Block packages derive types from their `metas.js` barrel using the `extractBlockTypes` helper.
  - **`extract-plugin-types` script removed**: The build-time extraction script in `@lowdefy/node-utils` has been deleted. Each plugin package maintains its own `types.js`.

- f430f02dde: Migrate all blocks from `defaultProps` to `withBlockDefaults` wrapper for React 19 compatibility.

  ### Breaking Changes

  - **`defaultProps` removed**: React 19 silently ignores `defaultProps` on function components. All ~101 block components now use a `withBlockDefaults` wrapper from `@lowdefy/block-utils`.
  - **`withBlockDefaults` API**: New export from `@lowdefy/block-utils` that wraps block components with default property injection. Antd blocks use `withTheme` which absorbs defaults; non-antd blocks use the generic wrapper.

- c570982e0f: Remove per-component `header.theme`, `sider.theme`, and `menu.theme` string properties from PageSiderMenu, PageHeaderMenu, Header, and Sider blocks. Dark mode now works automatically via CSS variables from the root ConfigProvider — no manual theme switching needed.

  **Removed properties:**

  | Block          | Removed Property          |
  | -------------- | ------------------------- |
  | PageSiderMenu  | `properties.header.theme` |
  | PageSiderMenu  | `properties.sider.theme`  |
  | PageSiderMenu  | `properties.menu.theme`   |
  | PageHeaderMenu | `properties.header.theme` |
  | PageHeaderMenu | `properties.menu.theme`   |
  | Header         | `properties.theme`        |
  | Sider          | `properties.theme`        |

  **Migration:** Simply remove these properties. Dark mode is handled automatically by the global ConfigProvider. Use `darkModeToggle: true` on page blocks or `SetDarkMode` action for user-facing toggle. Use `properties.theme` (design token object) for fine-grained color customization.

  **Also removed:**

  | Block          | Removed Property                 | Replacement                 |
  | -------------- | -------------------------------- | --------------------------- |
  | PageSiderMenu  | `properties.header.style`        | `style: { .header }`        |
  | PageSiderMenu  | `properties.header.contentStyle` | `style: { .headerContent }` |
  | PageSiderMenu  | `properties.sider.style`         | `style: { .sider }`         |
  | PageSiderMenu  | `properties.footer.style`        | `style: { .footer }`        |
  | PageSiderMenu  | `properties.content.style`       | `style: { .content }`       |
  | PageSiderMenu  | `properties.logo.style`          | `style: { .logo }`          |
  | PageHeaderMenu | `properties.header.style`        | `style: { .header }`        |
  | PageHeaderMenu | `properties.header.contentStyle` | `style: { .headerContent }` |
  | PageHeaderMenu | `properties.footer.style`        | `style: { .footer }`        |
  | PageHeaderMenu | `properties.content.style`       | `style: { .content }`       |
  | PageHeaderMenu | `properties.logo.style`          | `style: { .logo }`          |

  **Events removed:**

  | Block          | Removed Event         | Replacement                               |
  | -------------- | --------------------- | ----------------------------------------- |
  | PageSiderMenu  | `onNotificationClick` | Use `notifications.link` property instead |
  | PageSiderMenu  | `onProfileClick`      | Removed                                   |
  | PageHeaderMenu | `onNotificationClick` | Use `notifications.link` property instead |
  | PageHeaderMenu | `onProfileClick`      | Removed                                   |

  **Other removals:**

  - `collapsible` and `initialCollapsed` properties removed from PageSiderMenu sider
  - Horizontal menu border removed from PageHeaderMenu header

  **Added:**

  - `notifications.link` property for notification item navigation

- f430f02dde: Rename `Segmented` block to `SegmentedSelector` to follow the selector naming convention. Now uses the standard selector value flow, supporting complex option values and HTML option labels.

  **Migration:** Replace `type: Segmented` with `type: SegmentedSelector` in your config.

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

- f430f02dde: Rename Tabs `tabPosition` property to `tabPlacement` to match antd v6 API.

  **Migration:** Replace `tabPosition` with `tabPlacement`. Values `left` and `right` are renamed to `start` and `end` to match antd v6 logical placement (`top`, `start`, `bottom`, `end`).

### Minor Changes

- f430f02dde: Add Avatar.Group support with data-driven avatars and a `+N` overflow indicator via `properties.group` with `maxCount` and `avatars` array.
- 0fe1bc38dd: Add `darkModeToggle` property to PageHeaderMenu and PageSiderMenu. Set `darkModeToggle: true` to render a built-in sun/moon toggle button in the header that switches between light and dark Ant Design themes. The preference is persisted to localStorage and respects the OS dark mode setting as default. A `toggleDarkMode` method is also registered for programmatic control.
- 130a569d36: Add keyboard shortcut support for block events.

  Blocks can now define keyboard shortcuts on events using the `shortcut` property in the event long-form object. Shortcuts are platform-aware (`mod+K` maps to Cmd+K on Mac, Ctrl+K on Windows), support sequences (`g i`), and can be arrays for multiple bindings.

  - **Build validation** warns on duplicate shortcuts within a page and conflicts with browser defaults (e.g. `mod+N`)
  - **ShortcutManager** registers a single global keydown listener via tinykeys with visibility gating and input field suppression
  - **ShortcutBadge** component renders platform-appropriate key symbols (e.g. `⌘ K`) and is available to all blocks via `components.ShortcutBadge`
  - **ShortcutBadge in blocks**: Button, Anchor, Tag, and Search blocks display a platform-aware keyboard shortcut badge (e.g. `⌘S` / `Ctrl+S`) next to the title when the event has a `shortcut` defined

- c3b5b45ec5: feat(blocks-antd): Add Search command palette block with MiniSearch.

  New `Search` display block provides a full-text search command palette (Cmd+K / Ctrl+K) using MiniSearch (~6KB) and antd Modal.

  - **Pre-built index support**: Load a static JSON index via `indexUrl` for zero-config search on static sites
  - **Runtime indexing**: Pass `documents` array with `fields` and `storeFields` for client-side indexing
  - **Grouped results**: Results auto-grouped by configurable field with section headers
  - **Keyboard navigation**: Arrow keys, Enter to select, Escape to close
  - **Term highlighting**: Matched search terms highlighted in results
  - **Recent searches**: localStorage-backed search history with configurable count
  - **14 CSS slots**: Full style customization via `styles`/`classNames` (trigger, modal, input, results, groups, highlights)
  - **Analytics-friendly events**: `onSelect` passes the result item, search `query`, and `resultCount` for click-through tracking; `onSearch` passes the search term and result count on each query change

  ### Docs app integration

  - New search index transformer (`generateSiteAssets.js`) builds a MiniSearch index at build time from page content
  - Replaces Algolia DocSearch with the self-hosted Search block — removes external CDN dependency

  ### Removed

  - `@lowdefy/blocks-algolia` package has been removed. Use the `Search` block in `@lowdefy/blocks-antd` instead.

- c8f4a41063: Add `theme.darkMode` config with system preference support.

  **System Dark Mode (`theme.darkMode`)**

  - New `theme.darkMode` config key accepts `'system'` (default), `'light'`, or `'dark'`
  - When set to `'system'`, the app follows the OS dark mode preference and updates live when it changes
  - When set to `'light'` or `'dark'`, the developer locks the mode — user preferences are stored but not applied

  **SetDarkMode Action**

  - Now accepts string params: `darkMode: 'system' | 'light' | 'dark'`
  - Without params, cycles through light, dark, and system preferences

  **`_media` Operator**

  - New `_media: darkModePreference` returns the user's preference (`'system'`, `'light'`, or `'dark'`)
  - `_media: darkMode` continues to return the effective boolean state

  **Dark Mode Rendering**

  - Notification, Message, and ConfirmModal render with correct dark mode colors via `App.useApp()` hooks
  - Loader blocks (Skeleton, Spinner) use antd design tokens instead of hardcoded colors
  - 404 page and loading states use theme-aware backgrounds
  - Mobile menu drawer background matches the active theme

- f430f02dde: Add 13 new blocks leveraging Ant Design v6 components: Calendar, FloatButton, Tour, QRCode, Watermark, ColorSelector, Flex, Splitter, ConfigProvider, Masonry, MasonryList, DropdownMenu, and DropdownButton.

  **Calendar** — Full-size and compact date calendar with selection events (onChange, onSelect, onPanelChange), disabled dates, valid range, and date cell badge data.

  **DropdownMenu** — Container block that wraps any content with a dropdown menu triggered by click, hover, or right-click (context menu). Supports MenuLink, MenuGroup, and MenuDivider item types with icons, keyboard shortcuts, danger/disabled states, and nested groups.

  **DropdownButton** — Display block rendering a button with an attached dropdown menu. Supports split button mode (separate click and dropdown actions), all antd button variants/colors, and custom color theming via ConfigProvider.

### Patch Changes

- 43528a8b9: fix(blocks-antd): Format PhoneNumberInput phone_number value.

  PhoneNumberInput now strips leading zeros and non-digit characters from user input when building the `phone_number` value. Typing `0821234567` with +27 selected now produces `+27821234567` instead of `+270821234567`. Empty input produces an empty string instead of just the dial code.

- c1b5ddb33a: Add `color` and `iconsColor` properties to Header block.

  Set `color` to change the header background color (defaults to `--ant-color-bg-container`). Set `iconsColor` to control the color of notification, profile, and dark mode toggle icons — useful when using a dark background color. The `iconsColor` property is also available on PageHeaderMenu and PageSiderMenu.

- f430f02dde: Add ErrorBoundary to portal-based blocks (Message, Notification, ConfirmModal, Modal, Drawer, Tour) to prevent uncaught errors in portals from crashing the entire app.
- f430f02dde: Add validation error borders to input blocks. TextArea and AutoComplete now pass `status` for antd validation styling. Group-based inputs (Radio, Checkbox, ButtonSelector, SegmentedSelector) show CSS-based error/warning borders via the Label wrapper.
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

- 18d1c3bfa: feat(blocks-antd): Add do.select() and do.fill() to date picker e2e helpers.

  All five date picker e2e helpers (DateSelector, DateTimeSelector,
  DateRangeSelector, MonthSelector, WeekSelector) now support
  `do.select()` for calendar UI interaction and `do.fill()` for
  typing dates directly. DateTimeSelector also supports time
  selection via the time panel.

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

- 5e03091ee: Add e2e testing package for Lowdefy apps

  **@lowdefy/e2e-utils** (new package)

  - Locator-first API via `ldf` Playwright fixture: `ldf.block('id').do.*`, `ldf.block('id').expect.*`
  - Request mocking with static YAML files (`mocks.yaml`) and inline per-test overrides
  - Request assertion API: `ldf.request('id').expect.toFinish()`, `.toHaveResponse()`, `.toHavePayload()`
  - State and URL assertions: `ldf.state('key').expect.toBe()`, `ldf.url().expect.toBe()`
  - Manifest generation from build artifacts for block type resolution and helper loading
  - `createConfig()` and `createMultiAppConfig()` for Playwright config with automatic build/server management
  - Scaffold command (`npx @lowdefy/e2e-utils`) for project setup with templates and dependency management
  - Block helper factory with auto-provided expect methods (visible, hidden, disabled, validation)

  **@lowdefy/cli**

  - Add `--server` option to `lowdefy build` for server variant selection (e.g., `--server e2e`)

  **@lowdefy/client**

  - Expose `window.lowdefy` when `stage="e2e"` for e2e state/validation access

  **@lowdefy/blocks-antd**

  - Flatten e2e helper APIs for polymorphic proxy compatibility
  - Add TextArea e2e helper

  **@lowdefy/block-dev-e2e**

  - Remove unused srcDir variable

### Patch Changes

- c62468b98: Pass value of inputs to onChange event.
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

- d6c58fe97: Add minItems property to ControlledList block.
- b3a2e6662: Drawer block enhancements. Add afterOpenChange and afterClose methods.
  - @lowdefy/block-utils@4.5.0
  - @lowdefy/helpers@4.5.0

## 4.4.0

### Minor Changes

- bcfbb1a9b: Add autoClearSearchValue property to MultipleSelector block.

### Patch Changes

- @lowdefy/block-utils@4.4.0
- @lowdefy/helpers@4.4.0

## 4.3.2

### Patch Changes

- efefb8ca0: Fix elementId on MultipleSelector.
  - @lowdefy/block-utils@4.3.2
  - @lowdefy/helpers@4.3.2

## 4.3.1

### Patch Changes

- 3e574857c: Bug fix: Randomize popup dom element ids to better attach on block reuse on page.
  - @lowdefy/block-utils@4.3.1
  - @lowdefy/helpers@4.3.1

## 4.3.0

### Patch Changes

- @lowdefy/block-utils@4.3.0
- @lowdefy/helpers@4.3.0

## 4.2.2

### Patch Changes

- e4ec43505: Fix undefined property access in PhoneNumberInput component
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

### Minor Changes

- f14270465: Add Popover and TreeSelector blocks.

### Patch Changes

- f571e90da: Bug fix for `Pagination` block initial `pageSize` value.
- f9d00b4d3: Add `type` property to TextInput to set HTML5 input types.
- 5b3ccc958: Fix Pagination block skip state value. The skip value is now calculated from current and pageSize values if block value is changed using SetState.
  - @lowdefy/block-utils@4.1.0
  - @lowdefy/helpers@4.1.0

## 4.0.2

### Patch Changes

- 628c6e2f6: Bug fix on Breadcrumb.
- 126a61267: Add style property to Modal.
- 126a61267: Add showCount property to TextInput.
- 126a61267: Add notFoundContent and loadingPlaceholder properties to Selector and MultipleSelector.
- bbcf07a27: Bug fix on Pagination block.
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

### Bug Fixes

- **blocks-antd:** Check if option exists before checking tag. ([a72688d](https://github.com/lowdefy/lowdefy/commit/a72688d687674e309f103244eacba9613938293a))

### Features

- Add cover content area to Card block. ([c8a75a9](https://github.com/lowdefy/lowdefy/commit/c8a75a9155c994cc96658933ca4d0b6a5b1afc74))

# [4.0.0-rc.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.14) (2023-11-17)

### Bug Fixes

- **blocks-antd:** Change to controlled tab, closes [#1705](https://github.com/lowdefy/lowdefy/issues/1705) ([c804c18](https://github.com/lowdefy/lowdefy/commit/c804c18c7753782e301b7e1d077f27f4138939a7))
- **blocks-antd:** Control tabs using setActiveKey method. ([1d2845c](https://github.com/lowdefy/lowdefy/commit/1d2845c3a73d8cf536fb081f5c61c823ec98375f))
- **blocks-antd:** Mention html support in title schema. ([6929fa3](https://github.com/lowdefy/lowdefy/commit/6929fa3cc83ca50e4bdd38ce6dc9b1ceb7794ff0))
- **blocks-antd:** Set ant-tabs-tabpane-hidden class to display none. ([c354acb](https://github.com/lowdefy/lowdefy/commit/c354acb0e8937d9c025bb810d34914ca66d57fe1))
- **deps:** Revert less to 4.1.3. ([ea298c9](https://github.com/lowdefy/lowdefy/commit/ea298c9f49d0a30b7877f28c12cde944e2c1b803))

### Features

- **blocks-antd:** Add onFocus and onBlur events to inputs ([ac9f342](https://github.com/lowdefy/lowdefy/commit/ac9f342c6bcd2b0c5df940fc9cc4783013f44714))
- **blocks-antd:** Render HTML in tabs titles. ([28421cc](https://github.com/lowdefy/lowdefy/commit/28421cc2ae644f0924d876d1b276334e20cfdfa3))
- **blocks-antd:** Trigger onChange event when active key changes. ([0c1908e](https://github.com/lowdefy/lowdefy/commit/0c1908e2c4887c4b492a8a2c6994b0bf63eb02b7))

# [4.0.0-rc.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.13) (2023-11-17)

### Bug Fixes

- **blocks-antd:** Change to controlled tab, closes [#1705](https://github.com/lowdefy/lowdefy/issues/1705) ([c804c18](https://github.com/lowdefy/lowdefy/commit/c804c18c7753782e301b7e1d077f27f4138939a7))
- **blocks-antd:** Control tabs using setActiveKey method. ([1d2845c](https://github.com/lowdefy/lowdefy/commit/1d2845c3a73d8cf536fb081f5c61c823ec98375f))
- **blocks-antd:** Mention html support in title schema. ([6929fa3](https://github.com/lowdefy/lowdefy/commit/6929fa3cc83ca50e4bdd38ce6dc9b1ceb7794ff0))
- **blocks-antd:** Set ant-tabs-tabpane-hidden class to display none. ([c354acb](https://github.com/lowdefy/lowdefy/commit/c354acb0e8937d9c025bb810d34914ca66d57fe1))
- **deps:** Revert less to 4.1.3. ([ea298c9](https://github.com/lowdefy/lowdefy/commit/ea298c9f49d0a30b7877f28c12cde944e2c1b803))

### Features

- **blocks-antd:** Add onFocus and onBlur events to inputs ([ac9f342](https://github.com/lowdefy/lowdefy/commit/ac9f342c6bcd2b0c5df940fc9cc4783013f44714))
- **blocks-antd:** Render HTML in tabs titles. ([28421cc](https://github.com/lowdefy/lowdefy/commit/28421cc2ae644f0924d876d1b276334e20cfdfa3))
- **blocks-antd:** Trigger onChange event when active key changes. ([0c1908e](https://github.com/lowdefy/lowdefy/commit/0c1908e2c4887c4b492a8a2c6994b0bf63eb02b7))

# [4.0.0-rc.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.11...v4.0.0-rc.12) (2023-10-19)

### Bug Fixes

- Deepsource style fixes. ([e0804b8](https://github.com/lowdefy/lowdefy/commit/e0804b87999e6d812f2d2378770ed214d4264142))
- Deepsource style fixes. ([2086f5d](https://github.com/lowdefy/lowdefy/commit/2086f5d2e8e5665ec5fd16ce83e59119571f833d))

# [4.0.0-rc.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.10...v4.0.0-rc.11) (2023-10-06)

### Bug Fixes

- **blocks-antd:** Add onChange to DateTimeSelector. ([c0d0b87](https://github.com/lowdefy/lowdefy/commit/c0d0b8788e15359b341b37d4139763ccf40d25b7))
- **blocks-antd:** Fix Statistic decimalSeparator after ant design update. ([8a4c90c](https://github.com/lowdefy/lowdefy/commit/8a4c90c6da905a7bf5ee383edbb7e4a1e6f14be7))
- **blocks:** Add onTextSelection to Paragraph and document. ([7325633](https://github.com/lowdefy/lowdefy/commit/7325633d27adb876734e62140fc3e97b7e4ff119))
- **deps:** Dependencies patch updates. ([adcd80a](https://github.com/lowdefy/lowdefy/commit/adcd80afe8c752e15c900b88eb4d9be8526c7bcd))
- **deps:** Update dependency antd to v4.24.14 ([208acbe](https://github.com/lowdefy/lowdefy/commit/208acbebe44b98e1662deb974d4689d13de26536))
- **deps:** Update dependency rc-motion to v2.9.0. ([a8bf242](https://github.com/lowdefy/lowdefy/commit/a8bf242024ec88785fba3f7185ad31b4e8f4f3db))
- **deps:** Update dependency tinycolor2 to v1.6.0. ([0f21f87](https://github.com/lowdefy/lowdefy/commit/0f21f878c50bd5c67360d58606e42e4fd91faad8))

### Features

- **blocks-antd:** Add renderTags and option to render Tags in MultipleSelector. ([92a28fd](https://github.com/lowdefy/lowdefy/commit/92a28fd4ceb096257c4181a8ea0c5dd8bfbc8c2d))
- **blocks-antd:** Add Tag block. ([07d16cf](https://github.com/lowdefy/lowdefy/commit/07d16cfc31c34bc5f77e5ae76b4851f52f9bfda3))
- **blocks-antd:** Add Tag to docs. ([6a9a29e](https://github.com/lowdefy/lowdefy/commit/6a9a29e458eb52da6b65c8db5b1438ef592aa906))

# [4.0.0-rc.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.9...v4.0.0-rc.10) (2023-07-26)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-rc.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.8...v4.0.0-rc.9) (2023-05-31)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-rc.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.7...v4.0.0-rc.8) (2023-05-19)

### Bug Fixes

- **blocks-antd:** Add regex property to PhoneNumberInput block. ([c1e4080](https://github.com/lowdefy/lowdefy/commit/c1e4080476034704b105421a805e086c162a8e20))
- **blocks-antd:** Add regex property to TextInput block. ([548e7a9](https://github.com/lowdefy/lowdefy/commit/548e7a925bc440436a51c140249e9f85881327f7))
- **blocks-antd:** Rename regex property to replaceInput. ([cd811ae](https://github.com/lowdefy/lowdefy/commit/cd811ae6fae47a8384c73f439fd8fab86d0226ac))
- **blocks-antd:** Update PhoneNumberInput styles.less file to include Select styles. ([8bdd479](https://github.com/lowdefy/lowdefy/commit/8bdd479afdc5afb001c4b8f5485789a94a4aee50))

### Features

- **blocks-antd:** Add Carousel block to default Lowdefy blocks. ([85972d1](https://github.com/lowdefy/lowdefy/commit/85972d1d8e4f3fbd00ac55e386ef0f9a326bbdaa))

# [4.0.0-rc.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.6...v4.0.0-rc.7) (2023-03-24)

### Bug Fixes

- **blocks-antd:** Fix search on PhoneNumberInput block. ([6c97b69](https://github.com/lowdefy/lowdefy/commit/6c97b69064cc41e0bde0e6ba7f4730de135eeec7))

# [4.0.0-rc.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.5...v4.0.0-rc.6) (2023-03-20)

### Bug Fixes

- **blocks-antd:** Update Header and Sider blocks schemas ([6786cdb](https://github.com/lowdefy/lowdefy/commit/6786cdb899a69f2d117aef23bc63942ac4574dee))
- **blocks-antd:** Update PhoneNumberInput ([2cdfe2c](https://github.com/lowdefy/lowdefy/commit/2cdfe2cfa710b08eefeca9773f9aebd73b4b899e))
- Update PhoneNumberInput examples ([ae52024](https://github.com/lowdefy/lowdefy/commit/ae52024395ed5de697b796f5d9dce6943d3fb753))

### Features

- **blocks-antd:** Add PhoneNumberInput block. ([9ef0339](https://github.com/lowdefy/lowdefy/commit/9ef033913aa9726995cb9c3cd1e66cc6311413ba))
- **blocks-antd:** Add tests for PhoneNumberInput. ([eab2338](https://github.com/lowdefy/lowdefy/commit/eab23383d6e3460a68236c50b79e7bee180c6267))

# [4.0.0-rc.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.4...v4.0.0-rc.5) (2023-02-24)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-rc.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.3...v4.0.0-rc.4) (2023-02-21)

### Bug Fixes

- **deps:** Downgrade dependency antd to v4.22.5 ([ec0d911](https://github.com/lowdefy/lowdefy/commit/ec0d911f40282a8445cea0de2268373aadd02bd4))

# [4.0.0-rc.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.2...v4.0.0-rc.3) (2023-02-21)

### Bug Fixes

- **deps:** Downgrade dependency antd to v4.24.5 ([8602e71](https://github.com/lowdefy/lowdefy/commit/8602e719bda786c84086dd13a73287cefea7812a))

# [4.0.0-rc.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.1...v4.0.0-rc.2) (2023-02-17)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-rc.1](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.0...v4.0.0-rc.1) (2023-02-17)

### Bug Fixes

- **deps:** Update dependency @ant-design/icons ([497ff67](https://github.com/lowdefy/lowdefy/commit/497ff672a3f90c3fa00fa1d0839168a71702f456))
- **deps:** Update dependency antd to v4.24.7 ([1348a48](https://github.com/lowdefy/lowdefy/commit/1348a48f361168fa7eaa6b9c6dfa6f513dc139f4))
- **deps:** Update emotion css dependencies. ([7cc5588](https://github.com/lowdefy/lowdefy/commit/7cc5588d5936e7514f2e2a3400ce18f98d92586d))
- **deps:** Update minor versions of util packages. ([2d7a2a5](https://github.com/lowdefy/lowdefy/commit/2d7a2a55c88f0ee33eff49e5ff541f6296ec4337))
- **deps:** Update patch versions of dependencies ([9edaef7](https://github.com/lowdefy/lowdefy/commit/9edaef7e1aa940ff8aa795e60c25fb6369244ca9))
- **tests:** Fix jest mocks for es modules in connections. ([e3fadb2](https://github.com/lowdefy/lowdefy/commit/e3fadb2e4fe3bb4948b5f12a752f9356f20e8eb7))

# [4.0.0-rc.0](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.37...v4.0.0-rc.0) (2023-01-05)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.37](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.36...v4.0.0-alpha.37) (2022-12-07)

### Bug Fixes

- **blocks-antd:** DateTimePicker to use onSelect for better UX. ([6ea10cc](https://github.com/lowdefy/lowdefy/commit/6ea10cc437399c78f781746320e5f5d23cb6c2dd))
- **blocks-antd:** Import tooltip styles on Paragraph and Title for copy. ([ec3ad08](https://github.com/lowdefy/lowdefy/commit/ec3ad0876f4a31d6ee8cad708d9a807439326bb4))
- Fix Radio Selector not working for non-label/value fields. ([f3897c7](https://github.com/lowdefy/lowdefy/commit/f3897c7b63aa30d7b77953ba80e95ce31384b367))

### Features

- **blocks-antd:** Add parser property to NumberInput. ([95fbf13](https://github.com/lowdefy/lowdefy/commit/95fbf1301a59393d693b4f6480596ee17897b9c5))
- **blocks-antd:** Add parser to NumberInput schema file ([88aabdf](https://github.com/lowdefy/lowdefy/commit/88aabdfe08d530467898ed485d42d52a7de7e132))

# [4.0.0-alpha.36](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.35...v4.0.0-alpha.36) (2022-10-14)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.35](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.34...v4.0.0-alpha.35) (2022-10-05)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.34](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.33...v4.0.0-alpha.34) (2022-09-30)

### Bug Fixes

- **blocks-antd:** Breadcrumb should not render defaultTitle as label. ([a8762f0](https://github.com/lowdefy/lowdefy/commit/a8762f05a17e086b8e4ee62e1a67e9b0d46c64a7))
- **blocks-antd:** Fix breadcrumb icon size bug. ([c3b022f](https://github.com/lowdefy/lowdefy/commit/c3b022fd9fb67100f9cb5039500b0e9063930053))

# [4.0.0-alpha.33](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.32...v4.0.0-alpha.33) (2022-09-22)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.32](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.31...v4.0.0-alpha.32) (2022-09-22)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.31](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.30...v4.0.0-alpha.31) (2022-09-21)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.30](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.29...v4.0.0-alpha.30) (2022-09-17)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.29](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.28...v4.0.0-alpha.29) (2022-09-13)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.28](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.27...v4.0.0-alpha.28) (2022-09-12)

### Bug Fixes

- **blocks-antd:** Cleanup styles objects. ([c771cc9](https://github.com/lowdefy/lowdefy/commit/c771cc9a339a14b2f30dac65253f1b46178bba7d))
- **blocks-antd:** Fix issues in PageHeaderMenu and PageSiderMenu. ([81668f0](https://github.com/lowdefy/lowdefy/commit/81668f0e8a9452077c861fdc71cc40257de44bcc))

### Features

- **blocks-antd:** Add logo.srcMobile and logo.breakpoint properties. ([21bbeab](https://github.com/lowdefy/lowdefy/commit/21bbeabc2ce7b8cd81fd9904bc4a0735b4afdd9d))

# [4.0.0-alpha.27](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.26...v4.0.0-alpha.27) (2022-09-08)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.26](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.25...v4.0.0-alpha.26) (2022-08-25)

### Bug Fixes

- **blocks-antd:** Add class for feedback icon margin. ([1e29169](https://github.com/lowdefy/lowdefy/commit/1e29169774e9c70295573bc5051ee91aaeb5e5be))
- **blocks-antd:** Fix autocomplete bug when option is selected. ([2c02f08](https://github.com/lowdefy/lowdefy/commit/2c02f088e592b3a3cd1c48e22a515e655cddc098))
- **blocks-antd:** Fix feedback icon classes so that correct color is shown. ([c1f9b7d](https://github.com/lowdefy/lowdefy/commit/c1f9b7d8e61bfffa3e643955ef8d44468885babd))
- Fix extra bouncing when changing from displaying feedback to displaying extra. ([f5b70a4](https://github.com/lowdefy/lowdefy/commit/f5b70a4e371d01632a75d015ac18ab42a7901e62))
- Revert back to ant classes. ([8bdcfd5](https://github.com/lowdefy/lowdefy/commit/8bdcfd54d42dcffa57a88aaaafc00c6bbbdec850))

### Features

- **blocks-antd:** Add default suffix icon to date selectors. ([997fae8](https://github.com/lowdefy/lowdefy/commit/997fae855d901b36f2fe3e637b2b38ac7193158d))
- **blocks-antd:** Add feedback classes for corresponding colors. ([230570b](https://github.com/lowdefy/lowdefy/commit/230570b0008dfc627b85205d22545ae5f728e7ed))
- **blocks-antd:** Add feedback icon to TextInput and Selectors. ([f7f78e9](https://github.com/lowdefy/lowdefy/commit/f7f78e9aece55b5da3aa95c70b2a8a694db2487a))
- **blocks-antd:** Add feedback icon to WeekSelector. ([2719887](https://github.com/lowdefy/lowdefy/commit/2719887bde4019e109e0e57157389ecc48467fc8))
- **blocks-antd:** Add status to input components. ([91f7532](https://github.com/lowdefy/lowdefy/commit/91f753242b640c3722ef922632e77c5a23d2640b))
- **blocks-antd:** Change content to use named args. ([832f68c](https://github.com/lowdefy/lowdefy/commit/832f68c671e23c30f960792c8dd91164c6742f6a))
- **blocks-antd:** Change feedback icon to be added in label. ([91a1e8b](https://github.com/lowdefy/lowdefy/commit/91a1e8b5e44d8f0e3f7cbc4e945f5dca063de8db))
- **blocks-antd:** Cleanup AutoComplete. ([8732368](https://github.com/lowdefy/lowdefy/commit/8732368ac140a6c9782de942ef66d3b348651b3e))
- **blocks-antd:** Fix autocomplete bugs. ([71523cb](https://github.com/lowdefy/lowdefy/commit/71523cba4365b00ca7d1243a5f36ab77b4b073dc))
- **blocks-antd:** Replace ant feedback classes. ([51ba949](https://github.com/lowdefy/lowdefy/commit/51ba94947fd6b836408ba0dd2cc0fa7d9d42be62))

# [4.0.0-alpha.25](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.24...v4.0.0-alpha.25) (2022-08-23)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.24](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.23...v4.0.0-alpha.24) (2022-08-19)

### Bug Fixes

- **blocks-antd:** Center Label when inline. ([491e4a9](https://github.com/lowdefy/lowdefy/commit/491e4a99c85c106cfc8502ec3dddb8e5d14d73d3))
- **blocks-antd:** Fix RadioSelector not displaying which item is checked. ([8df75e6](https://github.com/lowdefy/lowdefy/commit/8df75e6136597f68f7073a0a26f92ff6a2a51d4a))
- **blocks-antd:** Remove minHight on Label. ([0999baa](https://github.com/lowdefy/lowdefy/commit/0999baaa22f476a01e14e769a30a81953a0b2faf))

# [4.0.0-alpha.23](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.22...v4.0.0-alpha.23) (2022-08-03)

### Bug Fixes

- **blocks-antd:** Remove minHight on Label. ([0999baa](https://github.com/lowdefy/lowdefy/commit/0999baaa22f476a01e14e769a30a81953a0b2faf))

# [4.0.0-alpha.22](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.21...v4.0.0-alpha.22) (2022-07-12)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.21](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.20...v4.0.0-alpha.21) (2022-07-11)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.20](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.19...v4.0.0-alpha.20) (2022-07-09)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.19](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.18...v4.0.0-alpha.19) (2022-07-06)

### Bug Fixes

- Menu selected item issue. ([ac266ec](https://github.com/lowdefy/lowdefy/commit/ac266ece5d7658a3e5e9c212f49b897a30dd278e))

# [4.0.0-alpha.18](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.17...v4.0.0-alpha.18) (2022-06-27)

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.14...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.17](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.16...v4.0.0-alpha.17) (2022-06-24)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.14) (2022-06-19)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.12...v4.0.0-alpha.13) (2022-06-16)

### Bug Fixes

- Update all packages to use @lowdefy/jest-yaml-transform. ([7bdf0a4](https://github.com/lowdefy/lowdefy/commit/7bdf0a4bb8ea972de7e4d4b82097a6fdaebfea56))

### Features

- Package updates. ([e024181](https://github.com/lowdefy/lowdefy/commit/e0241813d1276316f0f04897b664c43e24b11d23))
- React 18 update. ([55268e7](https://github.com/lowdefy/lowdefy/commit/55268e74ea08544ce816e85e205cd2093e0f2319))

# [4.0.0-alpha.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.11...v4.0.0-alpha.12) (2022-05-23)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.10...v4.0.0-alpha.11) (2022-05-20)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.9...v4.0.0-alpha.10) (2022-05-06)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.8...v4.0.0-alpha.9) (2022-05-06)

### Bug Fixes

- **blocks-antd:** Fix button color on focus. ([c56d1e4](https://github.com/lowdefy/lowdefy/commit/c56d1e40433127811b211f3c0736dde52124af1e))
- **blocks-antd:** Fix confirm modal button icons, closes [#1160](https://github.com/lowdefy/lowdefy/issues/1160) ([bba35be](https://github.com/lowdefy/lowdefy/commit/bba35be1dbb6a8e142f70b2415e865dba59de47b))
- **blocks-antd:** Fix menu keys. ([c6b8c69](https://github.com/lowdefy/lowdefy/commit/c6b8c69bb05c013d5112b89523424568faf34005))
- **blocks-antd:** Fix menu width wrapping. ([f71499c](https://github.com/lowdefy/lowdefy/commit/f71499cad248342e9a37584da56c0088aefcb62a))
- **blocks-antd:** Menu to show current selected page. ([72af09c](https://github.com/lowdefy/lowdefy/commit/72af09cf3dab6417d8ee6c0cdcbeec52ba092876))
- **blocks-antd:** remove onEnter and onInit events from schema descriptions. ([c0df169](https://github.com/lowdefy/lowdefy/commit/c0df1699276b6a922792a1d971ab6e596a5524e3))
- **blocks-antd:** Update snapshots. ([c4cc37a](https://github.com/lowdefy/lowdefy/commit/c4cc37acff9ade36a2db84ee395e2dbceb5a13d1))
- **blocks:** Fix icon names in examples. ([0d28534](https://github.com/lowdefy/lowdefy/commit/0d285347cdccd3a5f5c0531b5ee069d0e735287c))
- Fix bugs in icon and icon usage in docs. ([03858f4](https://github.com/lowdefy/lowdefy/commit/03858f43502404de39024b38fac1c5f87d5c99ca))

### Features

- **blocks-antd:** Remove color settings for menu, etc. ([bacaedb](https://github.com/lowdefy/lowdefy/commit/bacaedbbc8911b9ad4eaf36d2ecb7f60e536e331))
- **blocks-antd:** Update snapshots. ([5f5ef00](https://github.com/lowdefy/lowdefy/commit/5f5ef001c203b6c85564184683ece5fd968eea37))
- **blocks:** Add skeletons to blocks meta. ([ba34939](https://github.com/lowdefy/lowdefy/commit/ba349397359d4f54d7850536329ec0682ffcf89c))
- **blocks:** loading to render inputs but disable. ([1662f36](https://github.com/lowdefy/lowdefy/commit/1662f3668402bdce09a7ec814665525fc204f365))
- **blocks:** Remove loading prop from blocks. ([fc2def3](https://github.com/lowdefy/lowdefy/commit/fc2def366c7f23d09622a60e3d716f6c995ef4e6))
- **blocks:** Remove skeleton definition on blocks. ([f938a51](https://github.com/lowdefy/lowdefy/commit/f938a51268a7c0e5fa129c0628662890b635c8c7))

# [4.0.0-alpha.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.7...v4.0.0-alpha.8) (2022-03-16)

### Bug Fixes

- **blocks-antd:** Fix Icon name in switch. ([96e5e46](https://github.com/lowdefy/lowdefy/commit/96e5e460d02ef4016a6bcfa2e613e8e8fe9eee01))
- **blocks-antd:** Icon name corrections. ([7fa29e4](https://github.com/lowdefy/lowdefy/commit/7fa29e4290d533f252390cf48f2059c178ca7c34))
- Revert back to react 17.0.2. ([1b38fd3](https://github.com/lowdefy/lowdefy/commit/1b38fd3e743ee7286468c7c1e2f623838dd5ed84))

# [4.0.0-alpha.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.6...v4.0.0-alpha.7) (2022-02-21)

### Bug Fixes

- **blocks-antd:** Refactored tests to use new Block config. ([1919560](https://github.com/lowdefy/lowdefy/commit/191956023512213203b78f66bfcdebc451202eb0))
- **blocks-antd:** Temporary for schema for TimelineList. ([ce8640d](https://github.com/lowdefy/lowdefy/commit/ce8640d85b5ff7daa3610fe145a4569ec4c91777))
- **deps:** Update dependency react to v18.0.0-rc.0 ([2345330](https://github.com/lowdefy/lowdefy/commit/23453301716f541a1e044f63a740aae09d635237))
- **deps:** Update emotion css packages. ([3380594](https://github.com/lowdefy/lowdefy/commit/33805944e30e919c57e3e7e1876b9c6723c3988d))
- Fix V4 tests. ([d082d0c](https://github.com/lowdefy/lowdefy/commit/d082d0c335eb4426acadbf30a08de64266d9f004))
- Move S3UploadButton to plugin-aws. ([540aa03](https://github.com/lowdefy/lowdefy/commit/540aa035d2ed0672b0f3e233c1cee90e82d4bb52))

### Features

- **blocks:** Implement Link in blocks. ([2bcf600](https://github.com/lowdefy/lowdefy/commit/2bcf600bd1ae477325cf205069952006e3032b63))

# [4.0.0-alpha.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.5...v4.0.0-alpha.6) (2022-01-20)

### Bug Fixes

- **blocks-antd:** Added debounce condition to Selector and MultipleSelector ([910bee0](https://github.com/lowdefy/lowdefy/commit/910bee0837ad1bd55d456f339a7750ed37aa5d0c))
- **blocks-antd:** Swap rc-animation for rc-motion in Label to fix modules build. ([8660b6e](https://github.com/lowdefy/lowdefy/commit/8660b6e1f00c4c28e4ed4b4500b982986c712864))
- **blocks:** Updated block meta, types and buildIcons. ([1d774a3](https://github.com/lowdefy/lowdefy/commit/1d774a310a71e125fc7bf7d0d7ef5171632a56a8))
- Fix antd styles. ([62a752d](https://github.com/lowdefy/lowdefy/commit/62a752d66c9b7cf4ebfd07fcc92d8a195ed43be4))
- Fix static files. ([d2e343e](https://github.com/lowdefy/lowdefy/commit/d2e343eb8b644d953babac628470e785af641237))

### Features

- 404 page working with next server ([270c92e](https://github.com/lowdefy/lowdefy/commit/270c92e16a42a5e9988b890f2abd41b16da6f673))

### BREAKING CHANGES

- The 404 page is now always publically accessible.

# [4.0.0-alpha.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.4...v4.0.0-alpha.5) (2021-11-27)

### Bug Fixes

- Fixes for V4. ([41a9a30](https://github.com/lowdefy/lowdefy/commit/41a9a30b308543605a70f7d830a14f8f7221dd01))
- Refactored blocks for Lowdefy Version 4. ([96f194d](https://github.com/lowdefy/lowdefy/commit/96f194dc5088b864ee6696b97780a0791b5a5a2d))

# [4.0.0-alpha.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.3...v4.0.0-alpha.4) (2021-11-25)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.2...v4.0.0-alpha.3) (2021-11-25)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.1...v4.0.0-alpha.2) (2021-11-25)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.23.1...v4.0.0-alpha.1) (2021-11-25)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.23.1](https://github.com/lowdefy/lowdefy/compare/v3.23.0...v3.23.1) (2021-11-20)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.23.0](https://github.com/lowdefy/lowdefy/compare/v3.23.0-alpha.0...v3.23.0) (2021-11-19)

### Bug Fixes

- **blocksAntd:** Update test snapshots for Selector and MultipleSelector. ([67202c4](https://github.com/lowdefy/lowdefy/commit/67202c452e2187d6c342cd1e5487c8d28b050004))
- Updated MultipleSelector block to include onSearch event. ([0339e63](https://github.com/lowdefy/lowdefy/commit/0339e63ab6ce3fb1c8c95d203e341cbec1eb4660))
- **blocksAntd:** Updated Selector block to include onSearch event. ([5e9ec14](https://github.com/lowdefy/lowdefy/commit/5e9ec1470d9920b8340247ac1ff8d9a681798f1d))

# [3.23.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.22.0...v3.23.0-alpha.0) (2021-11-09)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.22.0](https://github.com/lowdefy/lowdefy/compare/v3.22.0-alpha.1...v3.22.0) (2021-09-27)

### Bug Fixes

- **blocksAntd:** Fix selector option labels and filter function. ([38445a5](https://github.com/lowdefy/lowdefy/commit/38445a58b626287868ad838d3b9885dccb7c720d))

# [3.22.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.22.0-alpha.0...v3.22.0-alpha.1) (2021-09-20)

### Bug Fixes

- **blocksAntd:** Add tests for CheckboxSwitch. ([089150e](https://github.com/lowdefy/lowdefy/commit/089150eacc67e4f27de5f763ad3656d52da40cad))
- **blocksAntd:** Added CheckboxSwitch tests. ([db8c05b](https://github.com/lowdefy/lowdefy/commit/db8c05b0ef546c460f41ab6e7e52de13eb54ff4b))
- **blocksAntd:** Fix CheckboxSwitch color property. ([d2ea3c6](https://github.com/lowdefy/lowdefy/commit/d2ea3c6a7f2d9f13e8a766c76e49a1b3a540d1d9))
- **blocksAntd:** Fix MultipleSelector schema and docs. ([41d25a1](https://github.com/lowdefy/lowdefy/commit/41d25a1e60f403a30824a00626605da37fc5bd3a))
- **blocksAntd:** Fix typo in Paragraph input copyable text property. ([b92621a](https://github.com/lowdefy/lowdefy/commit/b92621a8bae7be6e4d48165b8c54176d2403c592))
- **blocksAntd:** Paragraph and Title blocks copyable error fixed. ([483013d](https://github.com/lowdefy/lowdefy/commit/483013d1715cb97d08ed2f9475606c5b074a6ad3))
- **blocksAntd:** Updated CheckboxSwitch test snapshots. ([025a158](https://github.com/lowdefy/lowdefy/commit/025a1583e902b6edcb94c89ad272761eabd420fe))
- **blocksAntd:** Use updated renderHtml helper function ([5e3de6f](https://github.com/lowdefy/lowdefy/commit/5e3de6f5caa74e549b7f518895708b01a9191ee6)), closes [#820](https://github.com/lowdefy/lowdefy/issues/820)
- **blocksAntd:** Use updated renderHtml in selector blocks ([0da3bd1](https://github.com/lowdefy/lowdefy/commit/0da3bd19512cb0452ac7c559dce2e9ae499288de))

### Features

- **blocksAntd:** Added CheckboxSwitch demo example. ([7187849](https://github.com/lowdefy/lowdefy/commit/718784920d6e5daa69d30601cd88e7fadd94c5d4))
- **blocksAntd:** CheckboxSwitch block has been added. ([838f5ea](https://github.com/lowdefy/lowdefy/commit/838f5ea8852cff9f193e3e0a3dfb16b9c7f1da9e))

# [3.22.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.21.2...v3.22.0-alpha.0) (2021-09-08)

### Bug Fixes

- **blocksAntd:** Updated Password Input tests. ([7f32230](https://github.com/lowdefy/lowdefy/commit/7f322300b7888bc3de51d36483f06a1f68d5d74e))

### Features

- **blocksAntd:** Card block now has an onClick event. ([4263f6b](https://github.com/lowdefy/lowdefy/commit/4263f6b8764bb147e301c3dbba0ac4986959aad8))
- **blocksAntd:** Password Input block has been added. ([9d99ef8](https://github.com/lowdefy/lowdefy/commit/9d99ef82a930adb93b022c42ef765cf8a5022c70))

## [3.21.2](https://github.com/lowdefy/lowdefy/compare/v3.21.2-alpha.0...v3.21.2) (2021-08-31)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.21.2-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.21.1...v3.21.2-alpha.0) (2021-08-31)

### Bug Fixes

- **blocksAntd:** Fix blocks tooltip tests. ([b869fb0](https://github.com/lowdefy/lowdefy/commit/b869fb0f3c352ca6111b2974c719de9de76e8d71))
- **blocksAntd:** Fix undefined Tooltip title showing empty tooltip. ([358e423](https://github.com/lowdefy/lowdefy/commit/358e423bf10d35fab904267225c336749bfd4232))

## [3.21.1](https://github.com/lowdefy/lowdefy/compare/v3.21.0...v3.21.1) (2021-08-26)

### Bug Fixes

- **blocksAntd:** Fix Alert padding. ([9fb9686](https://github.com/lowdefy/lowdefy/commit/9fb9686cd2bfc9ed5028a44a24146d8c587a8ca2))

# [3.21.0](https://github.com/lowdefy/lowdefy/compare/v3.20.4...v3.21.0) (2021-08-25)

### Bug Fixes

- **blocksAntd:** Divider not to render empty title, closes [#790](https://github.com/lowdefy/lowdefy/issues/790) ([790fb89](https://github.com/lowdefy/lowdefy/commit/790fb89522538baccb8617d929dc7e3bcbe2e7fb))
- **blocksBasic:** Test change to new RenderHtml. ([ee9e3f0](https://github.com/lowdefy/lowdefy/commit/ee9e3f0d6150fdcd5ea42d0cfc1c0b6be8cc43a9))

## [3.20.4](https://github.com/lowdefy/lowdefy/compare/v3.20.3...v3.20.4) (2021-08-21)

### Bug Fixes

- **blocksAntd:** Fix Card block title area. ([475aef6](https://github.com/lowdefy/lowdefy/commit/475aef6a817068ee6734cba32b8b684c459e2a7c))
- **blocksAntd:** Fix Card title if no title is specified. ([60074f9](https://github.com/lowdefy/lowdefy/commit/60074f991d5893929cbf21fabe4b428e7eb4dc43))
- **blocksAntd:** Update Card block snapshot tests. ([4c67f41](https://github.com/lowdefy/lowdefy/commit/4c67f41f4299c107257efa1f7a34bc163f78c88f))
- **blocksAntd:** Update schema for Descriptions. ([50bf48c](https://github.com/lowdefy/lowdefy/commit/50bf48c6606ad327c989b34d58f0404406cbf2a3))

## [3.20.3](https://github.com/lowdefy/lowdefy/compare/v3.20.1...v3.20.3) (2021-08-20)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.20.2](https://github.com/lowdefy/lowdefy/compare/v3.20.1...v3.20.2) (2021-08-20)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.20.1](https://github.com/lowdefy/lowdefy/compare/v3.20.0...v3.20.1) (2021-08-20)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.20.0](https://github.com/lowdefy/lowdefy/compare/v3.19.0...v3.20.0) (2021-08-20)

### Bug Fixes

- **blocks-antd:** Fix Descriptions block items schema ([525e8eb](https://github.com/lowdefy/lowdefy/commit/525e8eb8e3927e21e7b886cde0712ccb6d4c5b03))
- **blocks-antd:** Update snapshot tests for basePath ([5add1a7](https://github.com/lowdefy/lowdefy/commit/5add1a72a3bc341761be7aee0626b9e29a5ded67))
- Fixes for configurable basePath. ([63955bb](https://github.com/lowdefy/lowdefy/commit/63955bbd1131da3b27b537d4e0d72dc943119287))
- **blocksAntd:** Add additional properties to Descriptions and use RenderHtml. ([dfc468d](https://github.com/lowdefy/lowdefy/commit/dfc468d1fef7b9aebb611c82ff19285260bc5d7e))
- **blocksAntd:** Add blocks display type to Descriptions schema. ([bd78efc](https://github.com/lowdefy/lowdefy/commit/bd78efc0deb0702fb91bafd154f4aa64662d4f85))
- **blocksAntd:** Add option to define `showTotal` as a string or function. ([9ac3fc9](https://github.com/lowdefy/lowdefy/commit/9ac3fc9711df889a1d58d83a68ed2e6baf8f0946))
- **blocksAntd:** Added string output for ParagraphInput and TitleInput. ([5735bbf](https://github.com/lowdefy/lowdefy/commit/5735bbf1a51f9ea263797e62e69958cb9cfd5b3c))
- **blocksAntd:** Do not close modals and drawer if event is bounced. ([33814b0](https://github.com/lowdefy/lowdefy/commit/33814b04fd70bad08cdca50f40ee8b05f13de9e6))
- **blocksAntd:** Use relative paths with Link. ([f43762f](https://github.com/lowdefy/lowdefy/commit/f43762fc9eccd1876b0f240f3ea1ac64373238a3))
- **blockTools:** RenderHtml should default to display-inline block. ([dcaf615](https://github.com/lowdefy/lowdefy/commit/dcaf61575c09a9f253f1197826ff4ea60bdcd685))

### Features

- **blocksAntd:** Add support for html on all input Label title and extra. ([59979c7](https://github.com/lowdefy/lowdefy/commit/59979c7ed2afd9ffadb97f06d59fca323a1ac589))
- **blocksAntd:** Add support for html to Descriptions and refactor. ([6261355](https://github.com/lowdefy/lowdefy/commit/6261355f313a4d240407373c34c80608b4c1efd3))
- **blocksAntd:** Added onclose action chain error detection to ConfirmModal, Drawer, Modal. ([66e0692](https://github.com/lowdefy/lowdefy/commit/66e0692d9c9dc8a25be9115d2522e4cb77075c50))
- **blocksAntd:** options labels to support html. ([3533a96](https://github.com/lowdefy/lowdefy/commit/3533a96cb2031ba83932135a2d72fb554d9b9c12))
- **blocksAntd:** Selector option.label can be html. ([9200e34](https://github.com/lowdefy/lowdefy/commit/9200e3461ccb719f40578e9f2c15de12fe3c7053))
- Ability to use html in ConfirmModal, Divider, Message, Modal. ([ec69fb7](https://github.com/lowdefy/lowdefy/commit/ec69fb7ed8759c2d84302da87b25ece52c2988e2))
- Added ability to use html in Alert, Descriptions and Notification. ([efa61bd](https://github.com/lowdefy/lowdefy/commit/efa61bd7a08172938a56025b68ca15f08195a088))
- Added ability to use html in Button, Card and Collapse. ([6d4d696](https://github.com/lowdefy/lowdefy/commit/6d4d696ce35c327c22e014929e363aa8cc5c5954))
- Added ability to use html in Paragraph, Result and Statistic. ([483eee6](https://github.com/lowdefy/lowdefy/commit/483eee6eecacffe90f76221e5cb62ddaa07e2649))
- Added ability to use html in Title and Tooltip. ([9329d24](https://github.com/lowdefy/lowdefy/commit/9329d2487edda363a633eb4081914dd8fb7a1c9c))
- Updated antd blocks fields .json that support html. ([c9ae5e7](https://github.com/lowdefy/lowdefy/commit/c9ae5e745fe2010337228a6d6f75ca5903f0c0b0))

# [3.19.0](https://github.com/lowdefy/lowdefy/compare/v3.18.1...v3.19.0) (2021-07-26)

### Bug Fixes

- **blocksAntd:** Update Selector test snapshots. ([417e802](https://github.com/lowdefy/lowdefy/commit/417e802a89a9311578dad467c4580c502ec2c7c4))

### Features

- **blocks-antd:** Make Selector showSearch default true. ([6bf511a](https://github.com/lowdefy/lowdefy/commit/6bf511ab53ffc33676038a24f900aa0a5f30a0b6))

## [3.18.1](https://github.com/lowdefy/lowdefy/compare/v3.18.0...v3.18.1) (2021-06-30)

### Bug Fixes

- **blocksAntd:** Fix S3UploadButton block to new responses schema. ([37a15bf](https://github.com/lowdefy/lowdefy/commit/37a15bf6c56519565ef1b62e38dc021eeea71262))
- **blocksAntd:** Update snapshots. ([43b23f4](https://github.com/lowdefy/lowdefy/commit/43b23f484fd6a00a3029fa9fe6389f6a7f796097))

# [3.18.0](https://github.com/lowdefy/lowdefy/compare/v3.17.2...v3.18.0) (2021-06-17)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.17.2](https://github.com/lowdefy/lowdefy/compare/v3.17.1...v3.17.2) (2021-06-11)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.17.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0...v3.17.1) (2021-06-11)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.17.0](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.3...v3.17.0) (2021-06-11)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.17.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.2...v3.17.0-alpha.3) (2021-06-09)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.17.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.1...v3.17.0-alpha.2) (2021-06-09)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.17.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.0...v3.17.0-alpha.1) (2021-06-09)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.17.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.16.5...v3.17.0-alpha.0) (2021-06-09)

### Bug Fixes

- **blocksAntd:** Add forceSubMenuRender property to menu. ([3f85e6e](https://github.com/lowdefy/lowdefy/commit/3f85e6e6de12e6c7210c8e8daf5a22d022bb69c7))
- **blocksAntd:** Include menu tests for working renders. ([b8fa4d0](https://github.com/lowdefy/lowdefy/commit/b8fa4d090c3ae25502e48a965a4538ebe84a4173))
- **blocksAntd:** Skip menu render test. ([5a321ec](https://github.com/lowdefy/lowdefy/commit/5a321ec7d3bf2a3b4580abbce94601c389e9d32b))

## [3.16.5](https://github.com/lowdefy/lowdefy/compare/v3.16.4...v3.16.5) (2021-05-31)

### Bug Fixes

- **deps:** update dependency classnames to v2.3.1 ([d4c7249](https://github.com/lowdefy/lowdefy/commit/d4c7249814a3b6180a1cce63c0dbbd635df3db10))
- **deps:** update dependency js-yaml to v4.1.0 ([d3954f3](https://github.com/lowdefy/lowdefy/commit/d3954f30dd719deca4bc1383ba23a351a1b3b60b))

## [3.16.4](https://github.com/lowdefy/lowdefy/compare/v3.16.3...v3.16.4) (2021-05-28)

### Bug Fixes

- **blocks-antd:** Fix selector index comparison. ([3f06fcd](https://github.com/lowdefy/lowdefy/commit/3f06fcde4b3e01c35e942c4b0ec0a430c5039b96))

## [3.16.3](https://github.com/lowdefy/lowdefy/compare/v3.16.2...v3.16.3) (2021-05-27)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.16.2](https://github.com/lowdefy/lowdefy/compare/v3.16.1...v3.16.2) (2021-05-26)

### Bug Fixes

- **blocks-antd:** Remove Descriptions example with failing schema ([7e45bb3](https://github.com/lowdefy/lowdefy/commit/7e45bb30bb5fa993e6a580eabf7e9ae049ffe18f))

## [3.16.1](https://github.com/lowdefy/lowdefy/compare/v3.16.0...v3.16.1) (2021-05-26)

### Bug Fixes

- **docs:** Fix Descriptions schema for docs generator. ([dbe1efe](https://github.com/lowdefy/lowdefy/commit/dbe1efec53930f5507abcebb54bc4d21e56ddc94))

# [3.16.0](https://github.com/lowdefy/lowdefy/compare/v3.15.0...v3.16.0) (2021-05-26)

### Bug Fixes

- fix indentation level op events in schema ([4426888](https://github.com/lowdefy/lowdefy/commit/44268886182657a95b7b1f4c1f2e7aa0ec63bcd1))
- **blocksAntd:** Add new-line support to Descriptions, closes [#581](https://github.com/lowdefy/lowdefy/issues/581) ([41bb9ee](https://github.com/lowdefy/lowdefy/commit/41bb9eee438b60d75efe00a433beb99ad98e78b8))
- **blocksAntd:** Fix DateTimeSelector to work for local or utc time, closes [#580](https://github.com/lowdefy/lowdefy/issues/580) # ([30a4764](https://github.com/lowdefy/lowdefy/commit/30a476460859f8b72198bad17ef892ef634cb24d))
- **blocksAntd:** Fix srcSet and media change width. ([4fb991a](https://github.com/lowdefy/lowdefy/commit/4fb991af415ab66dcdee59d233bf43d4c271f99c))
- **docs:** Document context initialization events for context blocks. ([a59bff5](https://github.com/lowdefy/lowdefy/commit/a59bff50f25b79d0468a4a6afc836f264c3263b2)), closes [#576](https://github.com/lowdefy/lowdefy/issues/576)
- Fix Tabs blocks events in schema. ([70a13af](https://github.com/lowdefy/lowdefy/commit/70a13af94d90c6c40276f77fefea8708e7040451)), closes [#576](https://github.com/lowdefy/lowdefy/issues/576)
- **blocksAntd:** Rename selectGMT to selectUTC for DateTimeSelector. ([e817fb1](https://github.com/lowdefy/lowdefy/commit/e817fb1900a66c38487632500302040acd206a46))

### Features

- new Tooltip block and tests ([8717767](https://github.com/lowdefy/lowdefy/commit/871776745a3a4beb60622bb5b3e5aca0a1454a94))

# [3.15.0](https://github.com/lowdefy/lowdefy/compare/v3.14.1...v3.15.0) (2021-05-11)

### Bug Fixes

- **blocksAntd:** Add square logo for mobile menu. Closes [#545](https://github.com/lowdefy/lowdefy/issues/545) ([296c7ec](https://github.com/lowdefy/lowdefy/commit/296c7ecb1ba4ad92684e64816d55cc2863014152))
- **blocksAntd:** Show warning before validation. Closes [#562](https://github.com/lowdefy/lowdefy/issues/562) ([7b4909b](https://github.com/lowdefy/lowdefy/commit/7b4909b07dd4560329aff6515d53c1f283fc9116))

## [3.14.1](https://github.com/lowdefy/lowdefy/compare/v3.14.0...v3.14.1) (2021-04-28)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.14.0](https://github.com/lowdefy/lowdefy/compare/v3.13.0...v3.14.0) (2021-04-26)

### Bug Fixes

- **blocksAntd:** Update snapshots. ([ed6b6e7](https://github.com/lowdefy/lowdefy/commit/ed6b6e76a7d8a2c3c81dc86c7ede82b2908e0fed))
- Make lgtm corrections. ([ef20857](https://github.com/lowdefy/lowdefy/commit/ef2085781aa245bf0d027ddec3511d949403bed9))

# [3.13.0](https://github.com/lowdefy/lowdefy/compare/v3.12.6...v3.13.0) (2021-04-16)

### Bug Fixes

- Update react, react-dom and react-test-renderer to v17.0.2 ([78969ab](https://github.com/lowdefy/lowdefy/commit/78969abd39e8b04a7cddb39472985da6da50c7b9))

## [3.12.6](https://github.com/lowdefy/lowdefy/compare/v3.12.5...v3.12.6) (2021-04-06)

### Bug Fixes

- **blocks-antd:** Fix Pagination block onChange. ([5813ff1](https://github.com/lowdefy/lowdefy/commit/5813ff198ccd730efaefab9ea6a1f0b9865c5f12))
- **blocks-antd:** Fix S3UploadButton state value. ([c11184e](https://github.com/lowdefy/lowdefy/commit/c11184e27b1a31908fbe3aac0055cfc4f1cd07aa))

## [3.12.5](https://github.com/lowdefy/lowdefy/compare/v3.12.4...v3.12.5) (2021-03-31)

### Bug Fixes

- **blocks-antd:** Fix S3UploadButton not uploading files. ([7005a8f](https://github.com/lowdefy/lowdefy/commit/7005a8f547f2d5390d7fe58e903c48d6704e7622))

## [3.12.4](https://github.com/lowdefy/lowdefy/compare/v3.12.3...v3.12.4) (2021-03-30)

### Bug Fixes

- **blocks-antd:** Fix S3UploadButton file uploads. ([2fa854b](https://github.com/lowdefy/lowdefy/commit/2fa854b1b0563f480dede2986e9f4b64868449e1))

## [3.12.3](https://github.com/lowdefy/lowdefy/compare/v3.12.2...v3.12.3) (2021-03-26)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.12.2](https://github.com/lowdefy/lowdefy/compare/v3.12.1...v3.12.2) (2021-03-24)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.12.1](https://github.com/lowdefy/lowdefy/compare/v3.12.0...v3.12.1) (2021-03-24)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.12.0](https://github.com/lowdefy/lowdefy/compare/v3.11.4...v3.12.0) (2021-03-24)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.11.4](https://github.com/lowdefy/lowdefy/compare/v3.11.3...v3.11.4) (2021-03-19)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.11.3](https://github.com/lowdefy/lowdefy/compare/v3.11.2...v3.11.3) (2021-03-12)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.11.2](https://github.com/lowdefy/lowdefy/compare/v3.11.1...v3.11.2) (2021-03-11)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.11.1](https://github.com/lowdefy/lowdefy/compare/v3.11.0...v3.11.1) (2021-03-11)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.11.0](https://github.com/lowdefy/lowdefy/compare/v3.10.2...v3.11.0) (2021-03-11)

### Bug Fixes

- **blocks-antd:** Fix Descriptions bordered property default value ([c2503e1](https://github.com/lowdefy/lowdefy/commit/c2503e167a4185cf23f38955f66e0664fc0c5b1a))

## [3.10.2](https://github.com/lowdefy/lowdefy/compare/v3.10.1...v3.10.2) (2021-02-25)

### Bug Fixes

- **blocksAntd:** Update modal schema. ([f2c6739](https://github.com/lowdefy/lowdefy/commit/f2c673921691132ff7935a2fcae52f0780e81464))

## [3.10.1](https://github.com/lowdefy/lowdefy/compare/v3.10.0...v3.10.1) (2021-02-19)

### Bug Fixes

- **blocks-antd:** Add data prop back to timeline list until lists get value from state ([71eb8be](https://github.com/lowdefy/lowdefy/commit/71eb8bef5c8e63fa7dd21e0f0820d50d7f8784d6))

# [3.10.0](https://github.com/lowdefy/lowdefy/compare/v3.9.0...v3.10.0) (2021-02-17)

### Bug Fixes

- **blocks:** Do not pass methods down to imported blocks. ([ff3f588](https://github.com/lowdefy/lowdefy/commit/ff3f588410a970a65523693f143ba9e80139f2f0))
- **blocks:** Update block tests. ([898fc3c](https://github.com/lowdefy/lowdefy/commit/898fc3c818fd9879a79b48fcc785398c33677731))
- **blocksAntd:** Fix icon in Notification. ([34c03fc](https://github.com/lowdefy/lowdefy/commit/34c03fc7f09c5c28717de059443c819cc1bbfa49))
- **deps:** Update dependency @ant-design/icons to v4.5.0. ([8382bbb](https://github.com/lowdefy/lowdefy/commit/8382bbba7b58ec022109e4d97d1944390a9c09cc))
- **deps:** Update dependency css-loader to v5.0.2. ([6dd6a82](https://github.com/lowdefy/lowdefy/commit/6dd6a82fa4e4975f201e0c22c6b5bf29cd0541e3))
- **deps:** Update dependency html-webpack-plugin to v5.1.0 ([d0dd688](https://github.com/lowdefy/lowdefy/commit/d0dd688816e3e9fc6ff56235698d3af4707eba5f))
- **deps:** Update dependency less to v4.1.1. ([19ec1e2](https://github.com/lowdefy/lowdefy/commit/19ec1e205154974005b741d4a77a89161fad308f))
- **deps:** Update dependency less-loader to v8.0.0. ([465727b](https://github.com/lowdefy/lowdefy/commit/465727bf5e6cd0377e61afa37a38e7e0a1a05e95))
- **deps:** Update dependency webpack to v5.22.0. ([bb9f69e](https://github.com/lowdefy/lowdefy/commit/bb9f69e29cbce728932ab512e12122ce3dc349cc))
- **deps:** Update dependency webpack-cli to v4.5.0. ([445d55c](https://github.com/lowdefy/lowdefy/commit/445d55ca12f720be9f09632a319c319323c7041c))

### Reverts

- fix(deps): Update dependency less to v4.1.1 to v3.13.0. ([2e09287](https://github.com/lowdefy/lowdefy/commit/2e09287f572f78b82eae43cd2f56ef75994a0356))

# [3.9.0](https://github.com/lowdefy/lowdefy/compare/v3.8.0...v3.9.0) (2021-02-16)

### Bug Fixes

- **blocksAntd:** Fix args.icon for Message. ([8a16504](https://github.com/lowdefy/lowdefy/commit/8a165048b8253f06a6c827426d9c5f4dd1e002dd))
- **blocksAntd:** Return the message function. ([6fb2aec](https://github.com/lowdefy/lowdefy/commit/6fb2aec2d82085dab4f6a406c6882b7cd7666ef8))
- **blocksAntd:** Update Timeline to work from value settings. ([c95009b](https://github.com/lowdefy/lowdefy/commit/c95009b44128f234d1c3f4848e823b1d9c4400e2))
- **docs:** Fix schemas for Context Pages. ([2700d68](https://github.com/lowdefy/lowdefy/commit/2700d68c7fd29ad89ba669fcab48ba816211cbcc))

# [3.8.0](https://github.com/lowdefy/lowdefy/compare/v3.7.2...v3.8.0) (2021-02-12)

### Bug Fixes

- **blocks:** Remove react router from render loop where not required. ([7b6970f](https://github.com/lowdefy/lowdefy/commit/7b6970f9b4fcc1b9e35771ba619fab890fa638f5))
- **blocks-antd:** Remove formatter option from Statistic block. ([4c6a3b8](https://github.com/lowdefy/lowdefy/commit/4c6a3b81310418b207521ca790d80ebfe2149f6c))
- **blocksAntd:** Fix Label areas.label bug. ([6bcd258](https://github.com/lowdefy/lowdefy/commit/6bcd2585268302938ab61010bd297a390e0f09aa))
- **blocksAntd:** Fix suffixIcon and label on MonthSelector. ([9547ff5](https://github.com/lowdefy/lowdefy/commit/9547ff5b147620837becea4e05d4b680b5115b0d))
- **blocksAntd:** PageSiderMenu affix toggle button. ([ae46923](https://github.com/lowdefy/lowdefy/commit/ae469234a8fd7daec47c3e9064234ba1bdeebffd))
- **blocksAntd:** PageSiderMenu clean up. ([340a760](https://github.com/lowdefy/lowdefy/commit/340a760a89c1286a7ec7c4e4b4b7457006cfcf49))
- **blocksAntd:** PageSiderMenu collapsed state should not open defaultOpenKeys. ([9172904](https://github.com/lowdefy/lowdefy/commit/91729047988323907c8ed0db4970be89a1c2c9d0))
- **blocksAntd:** Remove open property from Modal and Drawer. ([e5954ff](https://github.com/lowdefy/lowdefy/commit/e5954fffc71a55b4e883ef93d77f1bb439b68d66))
- **blocksAntd:** Update Anchor to use href spec. ([1b9a5b1](https://github.com/lowdefy/lowdefy/commit/1b9a5b1b4c43489be583968480403325c49fdca7))
- **docs:** Add container block docs. ([b490ec7](https://github.com/lowdefy/lowdefy/commit/b490ec767d6ab78c79f8b78836aee88f2f3b3f12))
- **docs:** Add context category block docs. ([39fb6c3](https://github.com/lowdefy/lowdefy/commit/39fb6c3b78eed52a114608186ad16b385cd43828))

## [3.7.2](https://github.com/lowdefy/lowdefy/compare/v3.7.1...v3.7.2) (2021-02-09)

### Bug Fixes

- Fix package lifecycle scripts. ([af7f3a8](https://github.com/lowdefy/lowdefy/commit/af7f3a8ea29763defb20cfb4f28afba3b56d981c))

## [3.7.1](https://github.com/lowdefy/lowdefy/compare/v3.7.0...v3.7.1) (2021-02-09)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.7.0](https://github.com/lowdefy/lowdefy/compare/v3.6.0...v3.7.0) (2021-02-09)

### Bug Fixes

- **blockDefaults:** Change allowClear default to false for TextArea and TextInput. ([30323ea](https://github.com/lowdefy/lowdefy/commit/30323eadf0bd573c7788302727ba5881caa4fe5e))
- **blocksAntd:** Fix Menu default open and selected keys. ([a1f48c5](https://github.com/lowdefy/lowdefy/commit/a1f48c5c1a93e5d47a08c6808416642598282d45))
- **blocksAntd:** Fix placeholder default for DateRangeSelector. ([03b03ad](https://github.com/lowdefy/lowdefy/commit/03b03addd6f07c55476d5db0055294e683ffa090))
- **blocksAntd:** Update styling for ControlledList. ([e5d773b](https://github.com/lowdefy/lowdefy/commit/e5d773b9f43eaaee2ba5d94ddd0c92c80f14e32d))

# [3.6.0](https://github.com/lowdefy/lowdefy/compare/v3.5.0...v3.6.0) (2021-02-05)

### Bug Fixes

- **blocksAntd:** PageHSCF events rename. ([ec4e9ed](https://github.com/lowdefy/lowdefy/commit/ec4e9edc41561414f11ddf62c2d0d0a63905578c))

### Features

- 🐢Redirect all paths to blocks-cdn. ([a45447a](https://github.com/lowdefy/lowdefy/commit/a45447ad1dacf977e487a020bd56080ae2b09792))

# [3.5.0](https://github.com/lowdefy/lowdefy/compare/v3.4.0...v3.5.0) (2021-02-05)

### Bug Fixes

- **blocks:** Add events to all subblocks. ([753ae60](https://github.com/lowdefy/lowdefy/commit/753ae60fc8a150ef2db3a243a2862841c6aad48b))
- **blocks:** Block schema fixes. ([34b5a11](https://github.com/lowdefy/lowdefy/commit/34b5a118024186e0a8ce241e5d05c0b26f84f710))
- **blocks:** Fix NumberInput to not apply default precision. ([f2ddcaa](https://github.com/lowdefy/lowdefy/commit/f2ddcaa7582515eb42464580888676789df73512))
- **blocks:** Fix port setting in webpack config. ([c828740](https://github.com/lowdefy/lowdefy/commit/c82874045dd041fbf3c3a8b4f5cb7dc27a05f39a))
- **blocks:** RatingSlider NA checkkbox to set NA value to state. ([a15693d](https://github.com/lowdefy/lowdefy/commit/a15693d566cee53f4d7c4f5e2461757f89bc7ee4))
- **blocks:** Update block schemas for all blocks. ([9a79743](https://github.com/lowdefy/lowdefy/commit/9a79743174935fd3eb02b3e777165e026e95c7ec))
- **blocks-antd:** Update snapshots for Avatar schema. ([784c0e9](https://github.com/lowdefy/lowdefy/commit/784c0e965f8455287f5b13f8a44c5386c75801ea))
- **blocksAntd:** Alert description only margin issue. Closes [#327](https://github.com/lowdefy/lowdefy/issues/327) ([864e74e](https://github.com/lowdefy/lowdefy/commit/864e74eff0a9b05eed90cd70081b9826b1ae95dc))
- **blocksAntd:** Correct disabledDates typo. Closes [#358](https://github.com/lowdefy/lowdefy/issues/358) ([558becf](https://github.com/lowdefy/lowdefy/commit/558becf243921b6494eaa99a2b307193253391a5))
- **blocksAntd:** Fix top padding on RatingSlider. ([48f9c13](https://github.com/lowdefy/lowdefy/commit/48f9c13962fdc71a815360c62b71c364ff405a8c))
- **blocksAntd:** Maintain cursor position for input blocks. Closes [#344](https://github.com/lowdefy/lowdefy/issues/344) ([7e90fed](https://github.com/lowdefy/lowdefy/commit/7e90fed8c6b12f51054d3c8bc4b3c93579ab097a))
- **deps:** Update dependency @and-design/icons to v4.4.0 ([9189eae](https://github.com/lowdefy/lowdefy/commit/9189eae785d8635cf1f84b17519450fc4f005900))
- **deps:** Update dependency copy-webpack-plugin to v7.0.0. ([901d412](https://github.com/lowdefy/lowdefy/commit/901d4126544dd4ee68d62bf520cdd4cc2b0d1dcc))
- **deps:** Update peer dependencies. ([57e5295](https://github.com/lowdefy/lowdefy/commit/57e52959b6ec507f4d060d8c7260a22761dca328))
- **docs:** Add default values and loading to blocks. ([fcadf76](https://github.com/lowdefy/lowdefy/commit/fcadf76edca9828c8bc0a511ca24cbbb20ccd219))
- **docs:** Convert propertiesFormTransform to work with objects. ([33042ba](https://github.com/lowdefy/lowdefy/commit/33042ba8e5a867338822ba1f4383bf458f801fa1))
- **docs:** Fix merge conflict and S3UploadButton examples ([e496d8c](https://github.com/lowdefy/lowdefy/commit/e496d8c8de04879fc59810ca66cf4182b3788997))
- **docs:** ParagraphInput remove content property. ([83d00ed](https://github.com/lowdefy/lowdefy/commit/83d00ed16c8bfd7b9cfed77c38190f1695cf9213))
- **docs:** Update Pagination tests. ([fa583f2](https://github.com/lowdefy/lowdefy/commit/fa583f23a63ce2c40bd08d5acf0b6a0cf5a0c56d))
- **docs:** Update snapshots for Avatar schema. ([0176a85](https://github.com/lowdefy/lowdefy/commit/0176a85f99ff84e7335a22e72943a52b818bdd6c))

### Features

- **blocks:** Add default block loading. ([d0d1801](https://github.com/lowdefy/lowdefy/commit/d0d1801490c486b19ec49ee9fd50395c9e02bb68))
- **blocks:** Fix disableDates in date selector schemas. ([b2763ee](https://github.com/lowdefy/lowdefy/commit/b2763ee2053df56a79c17e05998e643275e4bf4e))
- **blocks:** Update block schemas and tests. ([30636bd](https://github.com/lowdefy/lowdefy/commit/30636bd744f43652adcad51dd91570b53667dc04))
- **blocks-antd:** Rename block actions to events. ([9d9dce2](https://github.com/lowdefy/lowdefy/commit/9d9dce2ecfb4d9e37349b9f235a53d9724caee00))
- **docs:** Add Alert, Anchor, Avatar and Breadcrumb docs. ([0983607](https://github.com/lowdefy/lowdefy/commit/098360766d95789232050bce9cdfa72ed3405beb))
- **docs:** Add all Selectors. ([f5e65ab](https://github.com/lowdefy/lowdefy/commit/f5e65ab4068e7c6bd413026b2adecb4e4563761e))
- **docs:** Add blocks for Divider, Menu, Icon, Paragraph, Progress, Skeleton, Statistic. ([a2901ec](https://github.com/lowdefy/lowdefy/commit/a2901ec4b1d29a6973093db877a1ab1e741e4a17))
- **docs:** Add date selector docs. ([767f9ac](https://github.com/lowdefy/lowdefy/commit/767f9ac8f3ae0c0ac91bdcd12761c2155b0f5ec8))
- **docs:** Add docs for TextArea. ([102494e](https://github.com/lowdefy/lowdefy/commit/102494ea422bf980e0b1ab82a2535faab1311605))
- **docs:** Add NumberInput docs. ([b05cf14](https://github.com/lowdefy/lowdefy/commit/b05cf143fe687f51938019d235710bbbcd750359))
- **docs:** Add Pagination to docs. ([83a96ab](https://github.com/lowdefy/lowdefy/commit/83a96ab340d52038ddee03dce554e54af476b7df))
- **docs:** Add RatingSlider to docs. ([f64e363](https://github.com/lowdefy/lowdefy/commit/f64e363691d9e1c8a2ddde92f29c7f5f5d48681e))
- **docs:** Add S3UploadButton docs. ([c024488](https://github.com/lowdefy/lowdefy/commit/c024488b6b4d71e500c480889d1116cd6ef5266f))
- **docs:** Add Title block. ([adaa229](https://github.com/lowdefy/lowdefy/commit/adaa229df2e5d9c138770dfe289f9cdb80e9c1b5))
- **docs:** Add TitleInput and ParagraphInput. ([3e5b239](https://github.com/lowdefy/lowdefy/commit/3e5b2393227c579ea957380b78439ff016014385))
- **docs:** Update blocks page template to use transformers ([158539e](https://github.com/lowdefy/lowdefy/commit/158539ef517c4accd35ac3f77830dd43c781bf3c))
- **docs:** Update defaultValueTransformer to pull nested defaults from schemas. ([4ecb396](https://github.com/lowdefy/lowdefy/commit/4ecb3962ee9f4091f0e72975d816fa663940d3f8))
- **docs:** Use transformer fn to create properties from block schema ([faad65c](https://github.com/lowdefy/lowdefy/commit/faad65cae33e5ea92304a7fa854463a436c2557c))

# [3.4.0](https://github.com/lowdefy/lowdefy/compare/v3.3.0...v3.4.0) (2021-01-20)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.3.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.3.0) (2021-01-18)

### Bug Fixes

- **deps:** Update js-yaml from 3.14.1 to 4.0.0. ([1a9e1f9](https://github.com/lowdefy/lowdefy/commit/1a9e1f9e1057c14a3638bdd140de1b50d2721cd0))
- **deps:** Update package @wojtekmaj/enzyme-adapter-react-17 to v0.4.1 ([251102e](https://github.com/lowdefy/lowdefy/commit/251102e986b3e18804a8c94dbde2e93d3a7a85e9))

# [3.2.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.2.0) (2021-01-18)

### Bug Fixes

- **deps:** Update js-yaml from 3.14.1 to 4.0.0. ([1a9e1f9](https://github.com/lowdefy/lowdefy/commit/1a9e1f9e1057c14a3638bdd140de1b50d2721cd0))
- **deps:** Update package @wojtekmaj/enzyme-adapter-react-17 to v0.4.1 ([251102e](https://github.com/lowdefy/lowdefy/commit/251102e986b3e18804a8c94dbde2e93d3a7a85e9))

## [1.1.2](https://github.com/lowdefy/lowdefy/compare/@lowdefy/blocks-antd@1.1.0...@lowdefy/blocks-antd@1.1.2) (2020-12-15)

### Bug Fixes

- **blocks:** webpack --port setting should default to 3002 if no port provided ([ec1f5e8](https://github.com/lowdefy/lowdefy/commit/ec1f5e8a85bd2d326ecdb55a9a5ee628ff9034fa))
- **blocksAntd:** apply ant-form-small and ant-form-large classes to Label. ([1771590](https://github.com/lowdefy/lowdefy/commit/1771590d654a8a638a88ae7daa4d70b02f37fa0c))
- **blocksAntd:** Chagne Label height to 'fit-content' and apply min-height to solve long label overflow. ([69d131a](https://github.com/lowdefy/lowdefy/commit/69d131a76d62982e2bedb2a1b284fd56d39cffed))
- **blocksAntd:** Label height must only be applied to inline labels. ([b87c13b](https://github.com/lowdefy/lowdefy/commit/b87c13b644e52d644c37afc0171f6c1933facc0c))

## [1.1.1](https://github.com/lowdefy/lowdefy/compare/@lowdefy/blocks-antd@1.1.0...@lowdefy/blocks-antd@1.1.1) (2020-12-15)

### Bug Fixes

- **blocks:** webpack --port setting should default to 3002 if no port provided ([ec1f5e8](https://github.com/lowdefy/lowdefy/commit/ec1f5e8a85bd2d326ecdb55a9a5ee628ff9034fa))
- **blocksAntd:** apply ant-form-small and ant-form-large classes to Label. ([1771590](https://github.com/lowdefy/lowdefy/commit/1771590d654a8a638a88ae7daa4d70b02f37fa0c))
- **blocksAntd:** Chagne Label height to 'fit-content' and apply min-height to solve long label overflow. ([69d131a](https://github.com/lowdefy/lowdefy/commit/69d131a76d62982e2bedb2a1b284fd56d39cffed))
- **blocksAntd:** Label height must only be applied to inline labels. ([b87c13b](https://github.com/lowdefy/lowdefy/commit/b87c13b644e52d644c37afc0171f6c1933facc0c))

# 1.1.0 (2020-12-10)

### Bug Fixes

- **blocks:** do not need to target babel node ([6307e9d](https://github.com/lowdefy/lowdefy/commit/6307e9dcef098c12286ba494f650bc9b90ab0e63))
- **blocks:** pass --port option to webpack config ([e60ca16](https://github.com/lowdefy/lowdefy/commit/e60ca165927f3093aa60344b29de1d762fdb78c9))
- **blocksAntd:** remove Timeline and UserAvatar files ([7300e49](https://github.com/lowdefy/lowdefy/commit/7300e49ad94b80abf4aa9453ac5743c27065db44))
- **blocksAntd:** rename mutation to request in S3UploadButton ([f42a971](https://github.com/lowdefy/lowdefy/commit/f42a971bf68ef52c07ac684bd91d2a9f41bb86af))
- **blocksAntd:** set defined height to Label Col based on input size ([9d5c5ee](https://github.com/lowdefy/lowdefy/commit/9d5c5ee60fb816749fa2721682c3680981c398d2))
- **blocksAntd:** type in Button block ([958d760](https://github.com/lowdefy/lowdefy/commit/958d760eaa7b46296055aafd72a62753e91ced81))
- **blocksAntd:** update snapshots ([44b969e](https://github.com/lowdefy/lowdefy/commit/44b969e98ffa83b7e4575b81238690e0b19e7bb9))
- **blocksAntd:** update snapshots due to dep update ([eb75e50](https://github.com/lowdefy/lowdefy/commit/eb75e501771b3a7e7d33017bc006633a19877aeb))
- **blocksAntd:** update snapshots for inputs ([500ae5e](https://github.com/lowdefy/lowdefy/commit/500ae5e301d248e8d082e6501881e15f4f54dfc1))
- **blocksColorSelectors:** add license ([b66aba3](https://github.com/lowdefy/lowdefy/commit/b66aba33d8def92b673cd7932baa8d99e21a4af1))
- **blocksMarkdown:** fix cov paths, improve bad html test ([77211ec](https://github.com/lowdefy/lowdefy/commit/77211ec65b5a427176d095a2eb318bedc6f3d9fd))
- **deps:** update dependency js-yaml to v3.14.1 ([935ad89](https://github.com/lowdefy/lowdefy/commit/935ad894cd221901784360bee684189a60a2d386))
- **deps:** update dependency react-syntax-highlighter to v15.4.3 ([71d4621](https://github.com/lowdefy/lowdefy/commit/71d4621467d353e0543e743d9a37da8545d3c859))
- sanitizeName should use regex global ([af6b7b9](https://github.com/lowdefy/lowdefy/commit/af6b7b9e21b6eaa3cad8a1ce4d7b0e52b9effe42))
- **deps:** update dependency react-syntax-highlighter to v15.3.1 ([15df277](https://github.com/lowdefy/lowdefy/commit/15df277478013b223cb081bf4b148292afe0cea8))

### Features

- **blocks-antd:** use logos from server public assets ([780feeb](https://github.com/lowdefy/lowdefy/commit/780feebcd7bf1a0dc10e4468532f5d10cfaa22e9))
- **blocksAntd:** include es build ([2be5e10](https://github.com/lowdefy/lowdefy/commit/2be5e1072e1e11d273a9fad9b3b7142a0bd175b2))
- **blocksAntd:** mock tests for all files ([9012066](https://github.com/lowdefy/lowdefy/commit/901206629d1836b2a95402cf82da33b06ec72dcc))
- **blocksAntd:** S3UploadButton and basic render tests ([fd16e74](https://github.com/lowdefy/lowdefy/commit/fd16e74a377d7470d88530fa6ff74003a255f1a1))
- **blocksAntd:** S3UploadButton and basic render tests ([ca597f8](https://github.com/lowdefy/lowdefy/commit/ca597f84f1f3762eae6f7f5ee5feced688b809d0))
- **blocksAntd:** Spin and tests ([3b42bff](https://github.com/lowdefy/lowdefy/commit/3b42bffa4afbd6a045eb8256237ab1f93d7f0017))
- **blocksAntd:** Spin and tests ([0d47102](https://github.com/lowdefy/lowdefy/commit/0d4710252b35120bce4235a33a236dd73476e605))
- **blocksMarkdown:** init markdown blocks ([95eb2e4](https://github.com/lowdefy/lowdefy/commit/95eb2e4560788495e995f0b0343aae43b074fd02))
- **blockTools:** improve stubBlockProps with registerAction and actionLog ([fa3654c](https://github.com/lowdefy/lowdefy/commit/fa3654ccb3db8ec6c34591388253babca1c44e32))
- **blockTools:** improve stubBlockProps with registerAction and actionLog ([366dd91](https://github.com/lowdefy/lowdefy/commit/366dd91a48c2e96107b5397cf7839b0265208245))
- **servers:** add logos, favicons and pwa icons ([fc8610e](https://github.com/lowdefy/lowdefy/commit/fc8610e7f529071fd9ce3961b3991cab2d7911bd))
