---
'@lowdefy/block-utils': minor
'@lowdefy/docs-content': patch
---

feat(block-utils): `data-avatar-seed` picks an HTML avatar's colour from an id

`data-avatar` always coloured an avatar by the name, while an `avatar` cell with `idField` colours by the record's id, so the same person could show in two colours on one page. `<span data-avatar="Jane Doe" data-avatar-seed="c-42">` now takes its colour from `c-42`, the same colour as an `avatar` cell whose `idField` resolves to `c-42`. The initials and the accessible name still come from `data-avatar`; an empty or missing seed colours by the name, as before. The initials that replace a broken `<img data-avatar>` keep the seed.
