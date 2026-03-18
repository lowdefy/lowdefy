---
'@lowdefy/operators-js': patch
---

Fix `_function` callback template being mutated in-place by `evaluateOperators`, causing `_build.array.map` and similar operators to produce duplicate results from repeated callback invocations.
