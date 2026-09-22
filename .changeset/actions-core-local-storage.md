---
'@lowdefy/actions-core': minor
---

feat(actions-core): new `SetLocalStorage`, `GetLocalStorage` and `RemoveLocalStorage` actions

Read and write the browser's local storage from an event chain. Values are serialized, so
objects, arrays and dates are read back as the types that were stored. `GetLocalStorage`
returns the stored value, or the optional `default` when the key is not set.
