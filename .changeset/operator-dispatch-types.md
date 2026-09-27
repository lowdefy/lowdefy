---
'@lowdefy/build': patch
---

fix(build): The operators `_operator` names are loaded with the page. `_operator` calls the operator in its `name` through the operator registry, so with per-page plugin code a page whose only use of `_sum` was `_operator: { name: _sum }` did not load it, and the call failed with "Invalid operator name" on a direct visit. Names written in `name`, including the names an `_if` chooses between, are now counted like any other operator. The `_operator` docs used `operator:` for the name; the property is `name`.
