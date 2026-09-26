---
'@lowdefy/blocks-antd': minor
'@lowdefy/docs-content': patch
---

feat(blocks-antd): Sider header slots in `PageSidebarLayout`, and a drawer header slot in `MobileMenu`.

`PageSidebarLayout` takes two new slots above the sider menu: `siderHeader` while the sider is expanded and `siderHeaderClosed` while it is collapsed. They sit between the collapse toggle and the menu, outside the menu's scroll box, so they stay in place while a long menu scrolls. The `siderHeader` css key styles the box that holds them. A `mobileDrawerHeader` slot puts content above the menu in the mobile drawer, drawn by the new `drawerHeader` slot on `MobileMenu`. A page that sets none of them renders as before.
