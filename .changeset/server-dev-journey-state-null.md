---
'@lowdefy/server-dev': patch
---

A journey step `expect: { state: { path, equals: null } }` now passes when the path does not exist. Before, it failed while reporting `expected: null` and `actual: null`, so a journey had no way to assert that a value is absent.
