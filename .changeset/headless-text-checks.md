---
'@lowdefy/journey-headless': minor
'@lowdefy/node-utils': minor
'@lowdefy/block-utils': minor
'@lowdefy/build': patch
'lowdefy': patch
---

feat(journey-headless): Headless `expect: { text }` reads the text blocks draw

- An `expect: { text: { blockId, contains } }` runs headless. It reads the text a browser's check reads in the block from each block type's text model: `Html`, `ClickableHtml`, `DangerousHtml`, `Title`, `Paragraph`, the Markdown blocks, `Button`, `Tag`, `Alert`, `Card`, `Descriptions`, `Statistic`, `Divider`, `Modal` and `Drawer`, with `Box`, `Span`, `List`, `Flex`, `Icon` and `Img` drawing none of their own. A block inside the checked one counts while it is shown, in the areas its component draws; a `Modal` or `Drawer` inside it is drawn in its own portal and does not.
- The check passes once the text is drawn as written. While no layout could show it, it waits and fails at the timeout with the browser's message. It goes to the browser at run time, naming why, when the block holds a block with no text model (a grid, an input, a `DropdownMenu`, a plugin block), or the text may show in a way the run cannot read (across elements a layout may break, under a hiding or case class, in text an html enhancer writes, behind an ellipsis, or a `Modal`'s footer labels in an app with i18n locales).
- A plugin block's meta can declare `headlessText`, the paths of the properties it draws as text. Any other value fails the build, naming the block type.
- `classifyJourney` lists `expect.text` as needing a browser only with `text`, `containing`, `row`, `rowKey`, `column` or `nth` beside its `blockId`.
