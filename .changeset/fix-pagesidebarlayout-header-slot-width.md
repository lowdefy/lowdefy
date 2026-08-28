---
'@lowdefy/blocks-antd': patch
---

PageSidebarLayout's header slot row now stretches to the full header width, so header blocks can use `layout: grow` spacers to position content (e.g. push an item to the far right). A new `headerContent` cssKey allows overriding the slot row's style, matching PageHeaderMenu and PageSiderMenu.
