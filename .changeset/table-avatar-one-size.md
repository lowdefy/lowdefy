---
'@lowdefy/blocks-antd': patch
'@lowdefy/blocks-table': patch
---

fix(blocks-antd): Table avatars are one size and never clipped

In `Table` and `TableLight` an `avatar` cell with a `descriptionField` drew a 32px avatar, and a row
without the description drew a 24px one, so a column mixed two sizes. The one-line avatar was also
cut flat at the top and bottom, because the single-line cell wrapper clipped the avatar where it
overhangs the text line. Every avatar in `avatar` and `people` cells is now 24px with the same gap
to the name, and these cells no longer clip their avatars.
