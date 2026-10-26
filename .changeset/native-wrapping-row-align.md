---
'@lowdefy/client-native': patch
'@lowdefy/layout-native': patch
---

fix: Blocks aligned in a wrapping row on mobile take their content's height

A block's inner view grew to fill its placement, so in a wrapping row with `align` set every line took the whole row's height and the lines after the first drew over the next block. The inner view now grows only when its placement is taller than its content: stretched by a row, or grown in a column (`fillsPlacement` in `@lowdefy/layout-native`).
