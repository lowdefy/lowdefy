---
'@lowdefy/blocks-antd': minor
'@lowdefy/blocks-table': minor
---

feat(blocks-table): Collapsible column groups

A `Table` column group with `collapsible: true` shows a chevron in its header that collapses the group to a summary column and expands it to its breakdown columns, as AG Grid's `columnGroupShow` does. `collapsed: true` starts the group collapsed. Each column or inner group takes `showWhen`: `closed` shows it while its group is collapsed, `open` while it is expanded, and `always` (the default) in both. Collapsing an outer group also hides an inner group with `showWhen: open`.

The collapsed groups are the view's `collapsedColumnGroups`, saved and persisted with the view. A column its group hides is not displayed, searched or exported, and the column manager lists it as unavailable. `TableLight` refuses the three keys with a message naming `Table`.
