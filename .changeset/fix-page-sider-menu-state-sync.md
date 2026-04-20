---
'@lowdefy/blocks-antd': patch
---

fix(blocks-antd): PageSiderMenu state sync, setSiderOpen bug, and menu auto-popup.

Three related fixes so the sider persists correctly and the inline menu doesn't pop open flyouts on page load.

- **Persistence on hard-refresh / new tab**: PageSiderMenu now feeds its computed `openSiderState` (read from `localStorage['lf-{siderStorageKey}-open']`) into the inner Sider block as `initialCollapsed`. Previously the Sider re-read the media-query-computed `initialCollapsed` independently and ignored the persisted value, so the sider always started collapsed on desktop regardless of the user's preference.
- **`setSiderOpen({ open })` bug**: the action called the Sider's `_toggleSiderOpen` (a no-arg toggle) with an `{ open }` argument that was silently ignored. Fixed to call `_setSiderOpen({ open })` so the sider lands in the requested state. `toggleSiderOpen` now also uses the explicit setter with the computed next value for symmetry.
- **Menu auto-popup when sider is collapsed**: the Menu block's `defaultOpenKeys` guard checked `properties.collapsed !== true`, but PageSiderMenu never passes `collapsed` as a prop — antd derives the collapsed state from `SiderContext`. As a result the current page's parent group was added to `defaultOpenKeys`, and antd's Menu auto-popped the flyout for that group on mount. Menu now reads `siderCollapsed` from `Layout._InternalSiderContext` (the same channel antd's own Menu uses) so the group auto-expansion only applies when the sider is expanded.
