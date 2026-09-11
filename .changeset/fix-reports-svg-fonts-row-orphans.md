---
'@lowdefy/plugin-reports': patch
---

fix(plugin-reports): three PDF rendering defects found on a real dashboard.

- Chart labels render in Roboto again. pdfmake's SVG font callback handed svg-to-pdfkit the virtual-filesystem file name, which pdfkit tried to open from disk, so every `<text>` fell back to Helvetica with a `failed to open font` warning. The font is now registered with pdfkit under that name the first time it is asked for.
- Side-by-side sections stay together. A `row` whose cells hold an unbreakable node (a chart, image or stat) is itself unbreakable, under the same 90% page-height cap as heading grouping, so two `[heading, chart]` columns no longer print the headings at the foot of one page and the charts on the next.
- ECharts value labels placed outside a bar no longer print near-white. Their white under-stroke (`paint-order="stroke"`), which svg-to-pdfkit paints over the glyphs, is stripped from those `<text>` elements.
