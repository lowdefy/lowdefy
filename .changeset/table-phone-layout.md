---
'@lowdefy/blocks-table': minor
---

feat(blocks-table): A Table's view tabs and filter builder fit a phone

On a phone the saved view tabs ran off the screen and the filter builder opened as a popover too small to edit. Below 768px (antd's `md` breakpoint) the tabs are now one select showing the active view, with its menu and the changed-view strip beside it, and the toolbar's Filter button opens the builder as a full-height sheet with the record count at its foot, which follows each edit.
