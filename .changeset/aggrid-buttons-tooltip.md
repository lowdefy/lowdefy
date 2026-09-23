---
'@lowdefy/blocks-aggrid': patch
'@lowdefy/blocks-antd': patch
---

feat(blocks): icon-only buttons get tooltips. A Button with `hideTitle: true` (or a circle button with no visible title) now shows its `title` on hover, and a buttons cell in an AgGrid does the same for each icon-only button, so a row of glyphs says what each one does. A `tooltip` property on either sets its own hover text.
