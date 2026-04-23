---
'@lowdefy/blocks-antd': minor
---

feat(blocks-antd): DataDiff gains `sideBySide`, `timeline`, and `gitDiff` modes, plus depth-aware nested rendering.

- `mode: sideBySide` — two aligned antd `Descriptions` panels (Before / After) that respond to breakpoints.
- `mode: timeline` — antd `Timeline` with one item per change, colour-coded and breadcrumb-labelled for context.
- `mode: gitDiff` — unified-diff YAML patch rendering with +/− line markers; for technical users who want to see every line of change. Ignores the structured-rendering props (`labels`, `format`, `maxDepth`) but still honours `hide` / `show`.
- list mode now sub-groups array-of-objects changes into per-item sections with their own summary chips, and breadcrumbs deeply-nested row labels (`Order 1 › Customer › Name` instead of just `Name`).
- New `maxDepth` property (default `4`) collapses changes deeper than the cap into a single JSON-rendered row at the cap, keeping deep payloads legible.
