---
'@lowdefy/blocks-basic': minor
'@lowdefy/docs': patch
---

feat(blocks-basic): `Row`, `Grid` and `Stack` container blocks

`Row` arranges its children in a flex row (`gap`, `wrap`, `align`, `justify`), `Stack` in a flex column (`gap`, `align`), and `Grid` on a CSS grid (`columns`, defaulting to 24 to match the existing 24-column `layout.span` grid, plus `columnsSm`, `columnsMd`, `rows` and `gap`). The container says how its children are arranged; each child says how big it is with an ordinary Tailwind class of its own (`class: col-span-8 md:col-span-12`, `class: grow`, `class: w-64`), so a layout reads the same way in the config as it does in the DOM. Per-block `layout:` keeps working unchanged; these blocks are the replacement it will eventually point to.
