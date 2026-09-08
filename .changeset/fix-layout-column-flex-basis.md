---
'@lowdefy/layout': patch
---

fix(layout): Blocks in column-direction areas size their height by content.

Blocks inside a `direction: column` area no longer get a percentage flex-basis on the vertical axis. This fixes blocks wrapping into a phantom side-by-side column whenever the area's height became definite — most visibly in dev annotated screenshots, where lists shifted out of their panel, and in column areas with an explicit height. `span` still controls block width in column areas.
