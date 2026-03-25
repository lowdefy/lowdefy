---
'@lowdefy/blocks-antd': major
---

Remove per-component `header.theme`, `sider.theme`, and `menu.theme` string properties from PageSiderMenu, PageHeaderMenu, Header, and Sider blocks. Dark mode now works automatically via CSS variables from the root ConfigProvider — no manual theme switching needed.

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
