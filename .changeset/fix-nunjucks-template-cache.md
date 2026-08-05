---
'@lowdefy/nunjucks': patch
---

fix(nunjucks): Fix a template cache that could return the wrong render function.

Templates whose source was exactly `toString`, `constructor`, or a handful of other names
inherited from `Object.prototype` previously rendered a built-in instead of their own
source, silently. A template source of `__proto__` was worse: writing it re-parented the
cache itself, so every template rendered afterwards could be affected. All of these now
render as the literal string you wrote.

This also fixed a second, separate collision: `nunjucksFunction({ x: 1 })` and
`nunjucksFunction({ y: 2 })` previously returned the same render function, because
non-string templates were cached under a key derived from `Object.prototype.toString`, so
every plain object collided on `"[object Object]"` (and `100` collided with `'100'`). Only
strings are meaningfully cacheable - there is nothing to compile for a non-string template -
so these are no longer cached at all; each call now gets its own render function.

The cache is also now bounded to the 500 most recently used templates instead of growing
without limit. This only matters if your app renders a very large number of distinct,
runtime-computed template strings (for example, templates built from user input rather than
written in your YAML) - older ones are now evicted and recompiled on next use instead of
being retained forever.
