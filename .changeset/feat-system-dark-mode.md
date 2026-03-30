---
'@lowdefy/client': minor
'@lowdefy/build': minor
'@lowdefy/actions-core': minor
'@lowdefy/operators-js': minor
'@lowdefy/blocks-antd': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
---

Add `theme.darkMode` config with system preference support.

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
