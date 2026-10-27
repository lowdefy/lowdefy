---
'@lowdefy/blocks-table': patch
---

fix(blocks-table): The filter builder keeps its grouping when edits apply late

The Table's column filter, filter builder and options quick filter keep their own copy of the filter while the table applies each edit. They remembered only the latest edit they sent, so an earlier edit that the table applied after a newer one was taken as a filter change from outside and replaced the editor's copy. The column filter's builder then showed the whole condition wrapped in an extra "All of these conditions" group, one level deeper, which also cost a level of nesting. The editors now treat any edit they sent that the table has not caught up with as their own.
