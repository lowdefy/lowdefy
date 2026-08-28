---
'@lowdefy/helpers': patch
'@lowdefy/operators': patch
'@lowdefy/operators-js': patch
'@lowdefy/engine': patch
'lowdefy': patch
---

fix(operators): Read fields inside an error value by dot path.

Dot-path reads stopped at an error, so a field on it silently returned the operator default even
though the value was there. Mapping a sign-in failure to a friendly message with `_actions:
login.error.cause.code` always fell through to the default branch; it now reads the code.
`_actions: login.error.message` was the default and now returns the message.

Errors are the only kind of value this opens up. `Date`, `URL`, `Map`, `Set`, `RegExp`, `Promise`,
`Buffer` and typed arrays are still not traversable — a path into one returns the default, exactly
as before — and a class instance's own fields were already readable, so nothing changed there.

A lookup on an error reads the error's serializable form, which brings that form's limits with it:

- An own field holding a class instance or a function arrives as a marker string —
  `'[Object: Socket]'`, `'[Function: handler]'` — not as a live object.
- The `cause` chain resolves three levels. `_actions: x.error.cause.cause.cause.message` reads; a
  fourth `cause` is the literal string `'[Truncated]'`. Lowdefy's own wrap (`ActionError` →
  `RequestError` → `ServiceError` → driver error) fits inside that.
- A non-enumerable own property is not readable. `AggregateError`'s `errors` array is
  non-enumerable, so `_actions: x.error.errors` returns the default.

An error that is the _end_ of the path is unchanged — `_actions: x.error` still hands over the error
itself, not its extracted form. This entry only adds readable values; for the reads that this
release does change, see the dot-path resolution entry.

Also in this release, `@lowdefy/helpers`' `type` utility identifies `Date` and `Error` with
`instanceof` rather than duck-typing, so a `Date` or `Error` constructed in another JavaScript realm
(a `vm` context, iframe, or worker) is no longer detected as one; `type.isRegExp` is unchanged and
still detects a foreign `RegExp`. Lowdefy itself never constructs a value in another realm, so this
is reachable only from a custom plugin that introduces one. No `type` predicate was removed.
`type.typeOf` returns coarser answers for four kinds of value: a generator function is now
`'function'` (was `'generatorfunction'`), a generator object and an `arguments` object are now
`'object'` (were `'generator'` and `'arguments'`), and the map, set, array and string iterators are
all now `'iterator'` (were `'mapiterator'`, `'setiterator'`, `'arrayiterator'` and
`'stringiterator'`). `typeOf(Buffer.from('x'))` still returns `'buffer'`.
