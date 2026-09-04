---
'@lowdefy/layout': patch
'@lowdefy/client': patch
'@lowdefy/blocks-basic': patch
'@lowdefy/docs': patch
---

Fix child sizing in the `Row`, `Grid` and `Stack` blocks. These containers lay their children out with their own CSS, but their content slot was rendering the layout row, which wrapped every child in a column; that wrapper, not the child's own element, became the flex or grid item, so `class: grow`, `ml-auto` or `md:col-span-2` on a child did nothing. A content slot can now declare that it lays itself out (`content.<slot>(style, { selfLayout: true })`, honoured by `areaIsRendered`), and the three arrangement blocks use it: their children's own root elements are the direct flex or grid items and the classes on them apply. A child that sets `layout:` keys of its own still gets its column, and only that child.
