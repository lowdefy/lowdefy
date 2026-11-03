---
'@lowdefy/build': patch
---

fix(build): A `_js` function that only parses a date is no longer volatile

Dependency tracking re-evaluates a block whose `_js` is volatile on every update. Any mention of `Date` used to make a function volatile, so every block that formatted a stored date with `new Date(value)` re-evaluated on every state change. Now `Date` counts as reading the clock only in `Date.now()`, `Date()` and `new Date()` with no arguments, or when it is aliased or indexed. `new Date(value)`, `Date.parse`, `Date.UTC` and `instanceof Date` are pure.
