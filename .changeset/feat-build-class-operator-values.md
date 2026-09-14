---
'@lowdefy/build': minor
---

An operator at a block's `class` is now evaluated at runtime instead of being silently dropped. Previously `class: { _if: [...] }` was read as a CSS slot map with a slot named `_if`, so the classes were applied to a slot nothing renders. The operator is now kept under the block slot, and its result may be a string, an array of strings, or an object of `{ class: boolean }`.
