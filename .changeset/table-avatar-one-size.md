---
'@lowdefy/blocks-antd': patch
'@lowdefy/blocks-table': patch
---

fix(blocks-antd): Table avatars are one size, round and readable

In `Table` and `TableLight` an `avatar` cell with a `descriptionField` drew a 32px avatar, and a row
without the description drew a 24px one, so a column mixed two sizes. The one-line avatar was also
cut flat at the top and bottom, because the single-line cell wrapper clipped the avatar where it
overhangs the text line. Every avatar in `avatar` and `people` cells is now 24px with the same gap
to the name, and these cells no longer clip their avatars.

Initials are 10px (were 11px), so two letters no longer fill the circle edge to edge. A `people`
group shows its avatars side by side with a 2px gap instead of overlapping them, so no avatar or
its ring cuts into the initials of the one before.
