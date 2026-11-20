---
'@lowdefy/server-dev': minor
---

feat(server-dev): The browser journey runner resolves `rowKey` and `control` targets

A `{ blockId, rowKey }` click finds the grid row by its key and clicks its first displayed cell; with `column`, that row's cell. A generated row key (`__row_<n>`) fails the step before it acts, naming the grid and the fix, and a key several rows carry fails with the count. A `{ blockId, control }` click finds the one visible control marked with the block and key (and row key), in a modal footer, a confirm dialog or a dropdown popup. When none shows it hovers the row (for hover-only Table buttons) and opens the dropdown in the cell, row or block first: a hover dropdown (`DropdownMenu`'s default, or `trigger: hover`) by hovering, a `trigger: contextMenu` one by right-clicking, any other by clicking. `open` hovers a hover dropdown too, so the block in a `DropdownMenu`'s content is no longer clicked. `expect.visible`, `hidden` and `text` resolve a row or cell by key. On a data-set journey the click rails check a `control` or `rowKey` click against its own block, so a modal's OK button is checked where it was skipped before, and a dropdown item's block is checked before the runner opens the dropdown.
