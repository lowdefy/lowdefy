---
'@lowdefy/engine': patch
---

fix(engine): A block event name that is not one of the block's own events fires nothing. `ClickableHtml` fires the event its HTML names in `data-event`, so a value like `__proto__` or `constructor` reached an inherited object property: `__proto__` set `loading` on `Object.prototype` for the whole page and then threw.
