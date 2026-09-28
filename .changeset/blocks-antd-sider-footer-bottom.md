---
'@lowdefy/blocks-antd': patch
---

fix(blocks-antd): Place the PageSiderMenu footer at the bottom of the page

PageSiderMenu rendered its footer inside the padded content area, directly after the page content, so on a short page the footer floated halfway up the screen and was offset by the content padding. The footer is now a sibling of the content, as in PageHeaderMenu: the content grows to fill the viewport and the footer sits centered at the bottom, below the page padding. The content and footer are wrapped in a new `{blockId}_main` layout element. Fixes #959.
