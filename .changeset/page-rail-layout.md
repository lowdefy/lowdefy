---
'@lowdefy/blocks-antd': minor
---

feat(blocks-antd): Add the PageRailLayout page block

Apps whose places each have their own menu or list drew that menu inside the page, beside a sider that held only a handful of links, so the work started halfway across the screen. PageRailLayout gives every place one shape: a slim rail, a panel and the work.

- The rail holds labelled places that never expand, with badges (`badges`) and a foot for search or an assistant (`footItems`), notifications and the profile. Clicking the place that is open toggles its panel.
- A bar over the page holds a panel toggle, a breadcrumb whose leading crumbs can be switchers (`crumbs[].switcher`: an organisation, a workspace or a filter, with a filter box, marks, counts and actions) and the page's actions (`header` slot).
- The `panel` slot holds the page's own menu or list. On a desktop its edge drags between `panel.minWidth` and `panel.maxWidth`, resists below the smallest width and collapses the panel when dragged far past it. A click on the collapsed edge, the bar button or Ctrl/Cmd with backslash opens it again, and a double-click resets the width. The width and the collapse are remembered in the browser and shared by every page of the app.
- Below `panel.drawerBreakpoint` (1100px) the panel is a drawer that Escape, the scrim, a swipe or following a link inside it closes; `panel.startOpen` opens it on a page with nothing picked yet. Below `mobileBreakpoint` (768px) the rail becomes a bottom tab bar with a More sheet, and the switchers move into a sheet behind a pill in the bar.
- The panel's blocks are rendered once and moved by CSS between these layouts, so they keep their state when the window is resized.
- Sizes, colours and motion are CSS variables that default to antd tokens, so an app can theme the block.
