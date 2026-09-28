---
'@lowdefy/operators-js': patch
---

fix(operators-js): `_function` bodies in API routines can read routine state again. Since 5.4.0 routine state is passed to each parse call instead of being held on the server parser, but `_function` did not forward it, so `__state` resolved to `null` inside the function body. `_function` now forwards `state`, and also `items`, so `__item` works inside a `_function` within a `:for` loop.
