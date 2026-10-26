---
'@lowdefy/blocks-table': patch
---

fix(blocks-table): The Table header has one group row per level of the column groups it shows.

A collapsible column group with nested column groups made the header draw a group row for every level of the deepest group, even while the group was collapsed and its nested groups were hidden, so the collapsed table showed an empty band above the column titles. The number of group rows now follows the columns on screen: a collapsed group takes one row for its own title, and expanding it adds the rows its nested groups need. Hiding every column of a group from the column picker also removes the row it no longer needs.
