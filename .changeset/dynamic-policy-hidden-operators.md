---
'@lowdefy/api': patch
'@lowdefy/operators': patch
---

fix: Dynamic content can no longer hide an operator from the literal data and policy checks.

- The client runs an object as an operator once one key is left: a key whose value is undefined is never sent, and a key whose operator evaluates to undefined is dropped before its parent is read. So `{ _user: email, x: { _if: { test: false } } }` runs `_user`. A dynamic blocks policy now treats an operator-named key as an operator whenever every other key in its object can vanish: it must be in the policy's `operators`, and it makes `properties`, action params, URLs and `pageId` non-literal. Data next to a literal, such as `{ _score: 0.5, title: 'x' }`, is still allowed.
- Data in a Dynamic block's `:return` is checked as the client receives it. An operator next to a key with an undefined value, or next to a `__proto__` key read from JSON, now fails resolution like any other operator in data.
- Both checks read Dynamic content in the serialized form the page sends to the client. An operator inside a serialized value such as an error is found like any other, and a dynamic blocks policy refuses keys that start with `~`, other than a date's.
