---
'@lowdefy/plugin-reports': patch
'@lowdefy/build': patch
'@lowdefy/server-dev': patch
---

fix(plugin-reports): page breaks and heading grouping now work at any nesting depth. Page-level layout wrappers (Box, Card, Content) are flattened before the PDF is assembled, so a block's `report.pageBreakBefore` and the rule that keeps a heading with the chart it introduces apply to blocks nested in the app shell, not only to top-level blocks. Row cells are unchanged.

fix(plugin-reports): ▲ ▼ ↑ ↓ ✓ and other arrow, shape and dingbat symbols no longer print as boxes. The plugin ships DejaVu Sans as a symbol fallback font, registered with pdfmake and with the Html renderer, and routes those Unicode blocks to it; pdfkit embeds only the glyphs used, so a PDF grows by a few KB at most.

fix(build, server-dev): a dev-server page rebuild no longer warns that `@lowdefy/plugin-reports` is not declared when it is. The skeleton build writes the declared plugins to `plugins.json` and the JIT page build context restores it.

fix(plugin-reports): the render warning about unrun `onMount` events reports the page's own event as "page onMount" instead of the page id.
