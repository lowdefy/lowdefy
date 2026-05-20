---
'@lowdefy/e2e-utils': minor
---

feat(e2e-utils): Support list-child blocks in `ldf.block()` and add `ldf.list()` helper.

Manifest now records list children under their templated id (`listId.$.childId`) by
reading block category from `plugins/blockMetas.json`. At runtime `ldf.block()` falls
back from the literal id to the template by replacing integer-only path segments with
`$`, so `ldf.block('legal_rows.0.toggle').do.toggle()` resolves to the Switch helper
without app authors writing raw `page.locator(...)`. `ldf.list(listId)` adds
`.count()`, `.row(i)`, `.rowBy(key, value)` and `.rowWhere(predicate)` sugar.
