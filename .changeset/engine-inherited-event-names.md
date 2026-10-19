---
'@lowdefy/engine': patch
---

fix(engine): Event names are looked up as the block's own events. A `ClickableHtml` `data-event` that names no event declared on the block fires nothing.
