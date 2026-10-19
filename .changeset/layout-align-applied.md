---
'@lowdefy/layout': patch
---

`layout.align` is applied instead of being silently dropped. It sets the vertical alignment of a block's own content area (the v5 replacement for `layout.contentAlign`; v4's self-alignment `align` is now `layout.selfAlign`). It was previously discarded, with a console warning on every render, unless `layout.selfAlign` happened to be set as well, so a correctly migrated `layout: { align: middle }` did nothing at all. `layout.contentAlign` is now also accepted at runtime, for parity with `gap`, `justify`, `direction`, `wrap` and `overflow`.

Blocks that set `layout.align` without `layout.selfAlign` will now align their content area where they previously did not.
