---
'@lowdefy/block-utils': patch
---

fix(deps): Update tailwind-merge to 3.7.0

tailwind-merge 3.7.0 adds Tailwind CSS 4.3 support and fixes several class conflicts: `px` now overrides `ps`/`pe`, `columns-auto` conflicts with other `columns` classes, `max-h-none` merges with other max heights, and `color()`/`light-dark()` arbitrary values are treated as colours.
