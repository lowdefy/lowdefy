---
'@lowdefy/operators-js': minor
---

`_menu` operator now returns the `links` array directly instead of the full menu object. Supports dot-path access: `_menu: profile_menu.0.pageId`. `_menu: true` and `{ all: true }` still return the full menus array.
