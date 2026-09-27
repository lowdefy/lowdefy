---
'@lowdefy/blocks-antd': minor
'@lowdefy/blocks-aggrid': minor
---

feat: Add icon placement to buttons and expose more antd 6.6 features on button, menu, navigation and page layout blocks.

Buttons can now put their icon after the title. Set `iconPlacement: end` on a `Button`, on a
`DropdownButton` (the main button, in normal and split mode), or on each button of an ag-grid
`buttons` cell. Blocks that pass button properties through to `Button`, such as the
`toggleMenuButton` of `MobileMenu` and the page layout sider toggle buttons, accept it too.

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

Fixes:

- `DropdownButton` and `DropdownMenu` applied the `menu` CSS key through props antd ignores,
  so menu classes and styles never reached the popup. `DropdownButton` also dropped its
  `item` CSS key, and outside split mode, like `DropdownMenu`, its element id, class and style.
- `Tabs` passed its `tabBar`, `tabPane` and `inkBar` CSS keys under names antd 6 does not use,
  so they had no effect.
- `Menu` ignored `collapsed: true` outside a `Sider`.
- A collapsible `Sider`'s trigger did nothing when clicked. It now toggles the sider, and in
  `PageSiderMenu` and `PageSidebarLayout` it toggles the page's sider state.
- `PageHeaderMenu` and `PageSiderMenu` ignored their `theme` property. Like
  `PageSidebarLayout`, they now apply it as global design tokens for the page.
- `Tour` ignored `gap: { x, y }`. It now maps to antd's `gap.offset`.
- `Pagination` passed the wrong `skip` in its `onChange` and `onSizeChange` events (one page
  too many). The event now matches the block value.
- `Steps` no longer logs antd deprecation warnings for `size: default`, `progressDot` and item
  `description`.
- `FloatButton` no longer logs a deprecation warning for `description`, and draws its default
  icon with the app's icons.
- `DropdownButton` passes antd's `medium` size for `size: middle`, which antd deprecates.
- The `Header`, `Footer` and `Content` `theme` docs now say antd only applies Layout tokens
  from the parent `Layout` block.
