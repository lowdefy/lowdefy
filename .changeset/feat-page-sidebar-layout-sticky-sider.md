---
'@lowdefy/blocks-antd': patch
---

fix(PageSidebarLayout): Pin the sider to the viewport so the bottom actions stay visible.

The sider is now `position: sticky` with `height: 100vh`, so the menu, notifications, profile avatar, dark-mode toggle, and logo remain on screen as the page content scrolls. The sticky footer container fades from transparent to the container background so content passing behind it doesn't cut off abruptly.
