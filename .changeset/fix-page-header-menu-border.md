---
'@lowdefy/blocks-antd': patch
---

fix(blocks-antd): Add default header border to PageHeaderMenu.

PageHeaderMenu now has a default `borderBottom` matching the existing default borders on PageSiderMenu and PageSidebarLayout, for visual consistency across the page menu blocks. The default can still be overridden via `styles.header`.
