---
'@lowdefy/helpers': minor
---

fix(helpers): Remove `set`'s `options` parameter; restore dotted-key resolution in `set`.

`set(target, path, value, options)` becomes `set(target, path, value)`. It read three options, none of
which had callers in the repo. `merge` merged shallowly, turned arrays into objects, and was silently
skipped when either side was not traversable — use `set(o, path, mergeObjects([get(o, path), value]))`
instead. `separator` and `split` chose the path separator, so `set({}, 'a/b', 1, { separator: '/' })`
wrote `{a: {b: 1}}` and now writes the literal key `{'a/b': 1}`. `.` is the only separator and `\.` the
only escape.

`set` now resolves a literal dotted key already present on the target rather than always creating a
nested twin: `set({'a.b': {c: 1}}, 'a.b.c', 2)` writes `{'a.b': {c: 2}}`. The strict segment still
wins when present.

One write that resolved before now resolves differently, and the old behaviour was a prototype
pollution bug: a path whose segment named an inherited member wrote _through_ it onto the prototype.
`set({}, 'toString.x', 1)` left the target empty and set `x` on `Object.prototype.toString`, visible
on every object in the process. It now writes `{toString: {x: 1}}` on the target and touches no
prototype.
