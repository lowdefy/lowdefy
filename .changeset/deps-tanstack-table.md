---
'@lowdefy/blocks-table': patch
---

fix(deps): Update TanStack Table to 9.3.1 and TanStack Virtual to 3.14.26

TanStack Table 9.3.1 bundles less code for features a table does not use. TanStack Virtual 3.14.26 fixes scroll-to-row commands being lost or overshooting, rows mounted by a re-rendering child staying unpositioned, and ResizeObserver loop errors when rows mount during a resize.
