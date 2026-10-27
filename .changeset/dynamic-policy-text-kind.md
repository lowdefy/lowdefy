---
'@lowdefy/api': minor
'@lowdefy/blocks-antd': patch
'@lowdefy/blocks-table': patch
---

feat(api): A block schema marks how it draws a string with `textKind` (`html` through `renderHtml`, `text` as escaped text), and a Dynamic blocks policy judges a marked value by it. In an HTML-drawn property, a markdown link target, a protocol-relative word (`//x.example`) and, unless the policy allows HTML, a CSS `url()` are words, not URLs; the `html` rule still applies. In a text-drawn property tag syntax is words too. A whole value with a loaded or script scheme (`https:`, `javascript:`, ...) is still checked, and unmarked values keep every check. `Descriptions` titles, labels and values, `Paragraph` and `Title` content, input titles and labels, `Selector`, `MultipleSelector` and `ButtonSelector` option labels and `Table` column titles, header tooltips and `emptyText` are marked `html`; the `ControlledList` title is marked `text`.
