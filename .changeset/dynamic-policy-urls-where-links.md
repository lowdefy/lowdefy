---
'@lowdefy/api': minor
'@lowdefy/blocks-antd': patch
'@lowdefy/blocks-table': patch
---

feat(api): A Dynamic blocks policy checks a value as a URL only where it is used as a link or source (URL keys, `urlKind` marks, `Link` params, markdown links and CSS `url()`); everywhere else a URL is text. Text a block draws as HTML or text (`textKind`) no longer has its whole value judged as a URL. `SetState` values are data (only the operator rules apply), unless an input in the content whose value is an object (rich text, uploads, table inputs) draws them. A new `textKind: data` marks values a block stores but never draws: `Selector`, `MultipleSelector` and shared option `value`s. A new `rowsKind` mark on `Table` and `TableLight` `data` makes the rows data when every column draws its cell as text. Tags stay checked wherever a property draws HTML.
