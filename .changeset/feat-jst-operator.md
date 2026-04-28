---
'@lowdefy/operators-js': minor
'@lowdefy/build': patch
---

feat(\_jst): Add `_jst` operator for one-line JS template literals.

`_jst` is a shorthand for a [`_js`](/_js) function whose body is a JavaScript template literal. The build wraps the value as ``return `<template>`;`` and rewrites the operator key to `_js`, so runtime behavior, performance, and bundling are identical to `_js`.

```yaml
_jst: Updates (${request('get_counts.0.update') ?? 0})
```

`_jst` is intended for the common case of interpolating a value or two into a label without the ceremony of `return` and backticks. For multi-statement logic or pre-resolved `args`, use [`_js`](/_js). For declarative-only configs that benefit from static analysis, prefer [`_string.format`](/_string#format). Like `_js`, `_jst` is experimental.
