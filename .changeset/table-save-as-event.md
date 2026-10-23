---
'@lowdefy/blocks-table': minor
---

feat(blocks-table): A Table can hand Save as to the app with `onViewSaveAs`

The Table's Save as opened its own popover with a title field and a Shared box, so saving a new view could ask for nothing else: not a unique name, a description, or a count of the rows it matches. A Table with `onViewSaveAs` actions now fires `onViewSaveAs { view }` from Save as instead of opening the popover, so the app opens its own dialog, stores the view and updates `views` and `activeView` as after `onViewSave`. Without `onViewSaveAs` actions, Save as works as before.
