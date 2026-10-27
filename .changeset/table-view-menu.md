---
'@lowdefy/blocks-table': minor
'@lowdefy/blocks-antd': patch
---

feat(blocks-table): A Table's saved view tab menu takes its items from `viewMenu`

A saved view tab's menu offered only Delete view, and the only way to hide it was `locked`, which also hid Save. An app that archives views, because other features read them, could not offer Archive in place of Delete. `viewMenu: [{ key, label, danger, confirm }]` now sets the menu's items: picking one fires `onViewMenu { key, id }` with the view's id, after a confirmation when the item has `confirm` (`true` for "Are you sure?", or a message). Without `viewMenu` the menu is Delete view, firing `onViewDelete`, as before. `locked` still hides Save and disables only the default Delete. TableLight names `viewMenu` as a Table-only property.
