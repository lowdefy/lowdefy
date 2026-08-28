---
'@lowdefy/helpers': minor
'@lowdefy/logger': patch
'@lowdefy/api': patch
'@lowdefy/client': patch
'lowdefy': patch
---

fix(helpers): Serialized errors mark the values they cannot carry instead of dropping them.

An error is turned into plain data in three places: the `err` field of a server log line, an error
sent to a browser or API caller, and — new in this release — a dot-path read of an error value from
config. That conversion used to lose fields silently and let a few live values through. Every own
field of an error now appears, with anything unserializable replaced by a marker string:

- A field holding a class instance no longer vanishes. A Node error carrying a `socket`, `agent` or
  similar field had that key dropped from the log line altogether, which is indistinguishable from
  the error not having the field; it now logs as `'[Object: Socket]'`. The instance's internals are
  still never expanded.
- A field holding a function, a bigint or a symbol was passed through live. That leaked a closure
  over server state into serialized output, and a bigint field made `JSON.stringify` of the result
  throw `TypeError: Do not know how to serialize a BigInt`. These are now `'[Function: handler]'`,
  `'[BigInt: 10]'` and `'[Symbol: s]'`.
- A circular `cause`, or an own field pointing back at the error itself, had its key dropped. Both
  are now `'[Circular]'`.
- A `cause` chain longer than three levels ended with the fourth `cause` key simply absent. It is
  now `'[Truncated]'`.

The markers are literal strings, so they show up wherever the serialized error does: a log line's
`err.agent` reads `[Object: Socket]`, and `_actions: someAction.error.someField` can now resolve to
`'[Object: Socket]'` rather than to the operator default.

`extractErrorProps` also takes a new `omit` option — `extractErrorProps(error, { omit: (error) =>
['stack'] })`, called once per error node in the `cause` walk so a policy can key on the node it is
looking at. `serializer.serialize` accepts the same function as `omitErrorProps` and passes it down.
This is plugin and server API; app config is unaffected by it.
