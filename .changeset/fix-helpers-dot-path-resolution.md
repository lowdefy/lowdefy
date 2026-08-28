---
'@lowdefy/helpers': minor
'@lowdefy/operators': patch
'@lowdefy/operators-js': patch
'@lowdefy/engine': patch
'lowdefy': patch
---

fix(helpers): Dot paths resolve own properties only, and prefer a nested match to a literal dotted key.

A key that contains dots still resolves without escaping, at every depth. `_url_query:
my_object.subfield` against `?my_object.subfield=x` reads as before, and a JWT `claimMapping` of
`resource_access.com.example.api.roles` against `{ resource_access: { 'com.example.api': { roles:
['admin'] } } }` still returns `['admin']`. **No path needs a `\.` added unless a plain key or a
shorter dotted key overlaps the dotted key it resolves through; where one does, escaping is now the
way — see below.**
What changed is how ties and misses resolve: `get`, `set` and `unset` now walk the path in a single
forward pass, look only at own properties, and no longer try the whole path as one key ahead of the
walk. The accepted breaks:

**A nested match now wins over a literal dotted key.** With both present,
`get({ a: { b: 2 }, 'a.b': 1 }, 'a.b')` was `1` and is now `2`, and `unset` deletes the nested `b`
rather than the literal `'a.b'` key. A present segment also blocks the join even when it cannot be
descended: `get({ a: 1, 'a.b': 2 }, 'a.b')` was `2` and is now the default. Where two dotted keys
overlap the shorter one wins: `get({ 'a.b': {}, 'a.b.c': 1 }, 'a.b.c')` was `1` and is now the
default. Escaping (`a\.b`) is the way to address a literal dotted key past a nested match.

**Reads and writes see own properties only, never anything inherited from a prototype.** A data
operator whose key was `toString`, `valueOf` or `hasOwnProperty` used to reach the built-in
`Object.prototype` function and then fail while copying it, raising `SyntaxError: "undefined" is not
valid JSON`; `_state: toString` now returns the operator default instead. Writes were worse off:
`SetState: { 'toString.x': 1 }` wrote `x` onto `Object.prototype.toString` — making `x` readable on
every object in the process — and left state untouched. It now writes `{ toString: { x: 1 } }` into
state, as asked. Own-only applies to every prototype, not just `Object.prototype`, so any value
reached through an inherited accessor is now unreachable — the realistic case being a class getter.
Given a `Thing` class whose `derived` getter returns `'g'`, `get({ t: new Thing() }, 't.derived')` was
`'g'` and is now the default. YAML config holds no class instances, so that shape reaches a path only
from a custom plugin or connection.

**A path no longer steps _through_ a function value.** Given an `f` carrying an `f.z` of `3`,
`get({ f }, 'f.z')` was `3` and is now the default. Config data holds no functions, so this is
reachable only from a custom plugin.

**`get` no longer accepts `separator`, `split`, `join` or `isValid`, and paths must be strings.**
`get({ a: { b: 1 } }, 'a/b', { separator: '/' })` was `1` and is now the default, and `isValid` is
ignored rather than consulted. Array paths are gone from all three helpers:
`get({ a: { b: 1 } }, ['a', 'b'])` was `1` and is now the default, `set({}, ['a', 'b'], 1)` wrote
`{ a: { b: 1 } }` and is now a no-op, and `unset(obj, ['a', 'b'])` threw a `TypeError` and is now a
no-op. Nothing in Lowdefy passed any of these, so this too is a custom-plugin concern. (`set`'s
`options` parameter is removed outright — see its own entry.)

**`unset` no longer skips a delete because the value looks empty, and no longer throws on a dotted
key at depth.** Hiding a block clears its state field, so both are reachable from config. A hidden
_nested_ block whose value was an empty string or `undefined` used to keep its field —
`unset({ parent: { child: '' } }, 'parent.child')` left `child` in place and now removes it — so a
cleared, hidden input no longer leaves a stale key behind in `_state`. The same applied to an empty
`Map` or `Set`, an empty-source `RegExp`, and a blank-message `Error`. And a block id written with an
escaped dot used to crash the delete: `unset({ 'a.b': { c: 1 } }, 'a\.b.c')` threw
`TypeError: Cannot read properties of undefined` and now deletes `c`.

**The dot-path escape grammar now covers the backslash itself.** `\.` remains a literal dot and `\\`
is now a literal backslash, so `joinPath` can escape a segment that ends in a backslash — before, it
only escaped dots, and `joinPath(['a\\', 'b'])` produced a path `splitPath` read back as the single
key `a.b`. Any other backslash is still an ordinary character, so a key such as `a\b` needs no
escaping. The one observable change is a doubled backslash directly before a dot:
`splitPath('a\\\\.b')` used to yield `['a\\.b']` and now yields `['a\\', 'b']`.
