---
'@lowdefy/blocks-antd': minor
---

feat(blocks-antd): Add `darkModeToggle` property to PageHeaderMenu and PageSiderMenu.

Set `darkModeToggle: true` to render a built-in moon/sun toggle button in the header that switches between light and dark Ant Design themes. The preference is persisted to localStorage and respects the OS dark mode setting as default. A `toggleDarkMode` method is also registered for programmatic control.
