---
'@lowdefy/blocks-antd': minor
---

feat(blocks-antd): Add the PageRailLayout page block

Apps whose places each have their own menu or list drew that menu inside the page, beside a sider that held only a handful of links, so the work started halfway across the screen. PageRailLayout is a page block with a slim rail of labelled places that never expands, with badges (`badges`) and a foot for search or an assistant (`footItems`), notifications and the profile. Beside the rail, the `panel` slot holds a page's own menu or list under an optional `panelHeader`; its edge drags between `panel.minWidth` and `panel.maxWidth`, steps with the arrow keys, and the width is remembered in the browser and shared by every page of the app. A `contentHeader` slot and breadcrumb sit above the content, and an `aside` slot docks on the right. Below 1100px the panel becomes a drawer over the content, and below 768px the rail becomes a bottom tab bar with a More sheet. The rail's sizes and colours are CSS variables that default to antd tokens, so an app can theme them.
