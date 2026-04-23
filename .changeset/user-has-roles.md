---
'@lowdefy/operators-js': patch
'@lowdefy/docs': patch
---

feat(operators-js): Add `_user.hasRole`, `_user.hasSomeRoles`, and `_user.hasAllRoles` methods to check user roles against the `user.roles` array. `hasRole` takes a single role string; `hasSomeRoles` and `hasAllRoles` take an array of role strings. All return a boolean.
