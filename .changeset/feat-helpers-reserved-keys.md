---
'@lowdefy/helpers': minor
'@lowdefy/api': patch
'@lowdefy/build': patch
'@lowdefy/engine': patch
'@lowdefy/operators': patch
'@lowdefy/ai-utils': patch
'@lowdefy/node-utils': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
'lowdefy': patch
---

feat(helpers): Reject prototype-pollution key names in dot paths and key maps.

`__proto__`, `constructor`, `prototype`, `__defineGetter__`, `__defineSetter__`,
`__lookupGetter__` and `__lookupSetter__` are no longer accepted as path segments or as keys
in maps built from user-supplied values.

Previously these names were silently _filtered_ on write, which was worse than rejecting
them: `SetState: { 'a.__proto__.b': 1 }` quietly wrote to `a.b` instead — a different
location than the one you asked for. Reads could also walk up the prototype chain.

What you will see now:

- `:set_state` and the `SetState` action raise a config error naming the offending key and
  pointing at the line in your YAML.
- Data-reading operators (`_state`, `_get`, `_user`, `_payload`, ...) return their default
  instead of a value.
- A module entry id, an agent or endpoint id, or a `LOWDEFY_SECRET_*` environment variable
  using one of these names now fails at build or boot with a message naming it, instead of
  silently vanishing.

Apps that do not use these names are unaffected. If you have a form field, state key, or API
response property named `constructor`, rename it.

Deep merges of configuration are hardened the same way, but skip reserved keys rather than
raising — a reserved name arriving inside a merged _value_ is dropped so a single poisoned
field can't abort an otherwise valid merge.

`@lowdefy/helpers` also now exports `isReserved(key)`, so plugin and connection authors can
test a key against this policy directly instead of catching a `ReservedKeyError`.
