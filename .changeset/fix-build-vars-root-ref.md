---
'@lowdefy/build': patch
---

fix: Resolve refs at the root of reference vars.

A `_ref` used directly as the value of `vars` (e.g. `vars: { _ref: config.yaml }`) was not evaluated, so `_var` lookups in the referenced file returned null. Refs at the root of `vars` are now resolved again, restoring pre-v5 behavior.
