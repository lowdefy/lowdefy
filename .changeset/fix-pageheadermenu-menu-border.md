---
'@lowdefy/blocks-antd': patch
---

fix: PageHeaderMenu active menu item underline now sits exactly on the header's bottom border.

The horizontal menu was vertically centered in the header, so the active item's underline floated half a pixel above the header's bottom divider — two disconnected lines under the selected tab. The menu now reserves the header's 1px bottom border when sizing its line box, so the active underline lands precisely on the divider, forming a single continuous line across the full page width (including the logo) and matching the single-border look of Sider / PageSiderMenu.
