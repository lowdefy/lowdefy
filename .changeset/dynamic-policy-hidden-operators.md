---
'@lowdefy/api': patch
'@lowdefy/operators': patch
---

fix: Dynamic content can no longer hide an operator from the literal data and policy checks.

- The client runs an object as an operator once one key is left: a key whose value is undefined is never sent, and a key whose operator evaluates to undefined is dropped before its parent is read. So `{ _user: email, x: { _if: { test: false } } }` runs `_user`. A dynamic blocks policy now treats every operator-named key as an operator: it must be in the policy's `operators`, and it makes `properties`, action params, URLs and `pageId` non-literal.
- Data in a Dynamic block's `:return` is checked as the client receives it. An operator next to a key with an undefined value, or next to a `__proto__` key read from JSON, now fails resolution like any other operator in data.
