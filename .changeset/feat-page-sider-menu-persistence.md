---
'@lowdefy/blocks-antd': minor
---

feat: Persist PageSiderMenu sider open state to localStorage

PageSiderMenu now persists its sider collapsed/expanded state across page navigations and reloads, matching PageSidebarLayout behavior.

- Sider open state reads from and writes to `lf-{siderStorageKey}-open` in localStorage
- New `siderStorageKey` property (default `'sider'`) — shares the same key as PageSidebarLayout by default, so the user's preference survives swapping between layouts
- New `sider.initialCollapsed` property used as the fallback when no persisted value exists
- Gracefully handles SSR and privacy-mode localStorage unavailability
