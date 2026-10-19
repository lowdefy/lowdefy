---
'@lowdefy/server-dev': minor
'@lowdefy/engine': patch
'@lowdefy/e2e-utils': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

feat: Journey action steps fail when their target matches more than one element

A `click`, `open`, `fill` or `select` whose `text` or `containing` target has no `nth` must now match exactly one visible element. Before, the runner used the first match, so a journey could click the wrong row's button and still pass, or start failing at a later step when an unrelated change added a second match. The step now fails at once and says how to fix it, for example:

```
Matched 3 controls with text "Delete" in the page; add nth: 0..2, or a blockId/row to narrow it.
```

Add `nth`, or narrow the target with `blockId`, `row` or `column`. A page-wide `text` still searches only the front-most open layer, so a confirm dialog's button over a grid of same-label buttons is one match. Expectations are unchanged: `expect.visible` passes when any match is visible and `expect.hidden` when none is.
