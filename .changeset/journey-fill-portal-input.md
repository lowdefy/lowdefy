---
'@lowdefy/server-dev': patch
'@lowdefy/blocks-antd': patch
---

feat(server-dev): A journey `fill` step types into a block whose input is rendered in a portal, such as the Search modal

A journey could open a `Search` block but not type into it: the `fill` step looked for the input inside the block's own element, while the modal renders it outside. A block-scoped `fill` now also looks in the portal the block marks with its portal class, so a journey can open the search, fill the query, pick a result and run its `onSelect` actions. The `Search` modal now carries that mark and its result rows are buttons a journey can click by their text.
