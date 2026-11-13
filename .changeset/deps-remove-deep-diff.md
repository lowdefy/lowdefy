---
'@lowdefy/operators-diff': patch
---

fix(deps): Remove the deprecated deep-diff package

`@lowdefy/operators-diff` no longer depends on `deep-diff`, which npm marks as no longer supported and which has had no release since 2018. The `diff` function `_diff.deep` used from deep-diff 1.0.2 is now part of the package (MIT licence notice kept), so `_diff.deep` returns exactly the same records as before: the same `kind`, `path`, `lhs`, `rhs`, `index` and `item` fields, in the same order, for every input.
