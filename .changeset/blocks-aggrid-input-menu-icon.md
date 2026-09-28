---
'@lowdefy/blocks-aggrid': patch
---

fix(blocks-aggrid): Bundle the default menu cell icon for the AgGrid input blocks

The menu cell falls back to the `more-vertical` icon when a column's menu sets no icon. The display AgGrid blocks declared that icon so the build bundled it, but the AgGridInput blocks, which render the same menu cell, declared no icons, so the default menu button rendered without its icon. The input blocks now declare it too. Fixes #2393.
