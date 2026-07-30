---
'@lowdefy/helpers': minor
---

fix(helpers): Remove `set`'s `options` parameter; restore dotted-key resolution in `set`.

`set(target, path, value, options)` becomes `set(target, path, value)`. `options.merge` was the only
option read and had no callers in the repo; it merged shallowly, turned arrays into objects, and was
silently skipped when either side was not traversable. Use
`set(o, path, mergeObjects([get(o, path), value]))` instead.

`set` now resolves a literal dotted key already present on the target rather than always creating a
nested twin: `set({'a.b': {c: 1}}, 'a.b.c', 2)` writes `{'a.b': {c: 2}}`. The strict segment still
wins when present, so no path that resolves today changes.
