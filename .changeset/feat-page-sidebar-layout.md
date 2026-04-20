---
'@lowdefy/blocks-antd': minor
---

feat: Add PageSidebarLayout block

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
