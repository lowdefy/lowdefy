---
'@lowdefy/blocks-antd': minor
'@lowdefy/blocks-aggrid': minor
---

feat: Add icon placement to buttons and expose more antd 6.6 features on button, menu, navigation and page layout blocks.

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
