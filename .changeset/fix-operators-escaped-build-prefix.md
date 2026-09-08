---
'@lowdefy/operators': minor
---

fix(operators): Recognise escaped build prefixes in evaluateOperators guards.

Nested build operators run under escaped prefixes (`__build.`, `___build.`, …) inside a
`_build.function` body, but four guards in `evaluateOperators` compared the operator prefix
exactly to `_build.`. A dynamic operator (e.g. `_function`) nested inside a `_build.function`
body was deferred unevaluated instead of evaluated at build time, leaking raw operator objects
into the built output — either failing the build (`_array.concat must be evaluated on an array
instance`) or silently corrupting output such as MongoDB aggregation pipelines. Any build-prefix
escape depth now evaluates at build time, matching v4 behaviour.

Note: an unknown operator under an escaped build prefix now raises a build `ConfigError` where
it previously deferred silently. Two shapes can turn a currently-succeeding build into a failing
one:

- A typo, e.g. `__build.arrry.map` inside a `_build.function`, surfaces as a new build failure.
- A branch that is never taken. `evaluateOperators` visits all children before the operator
  runs, so both `then` and `else` of a `__build.if` are checked. A non-build operator in the
  discarded branch (e.g. `{ __build.if: { test: …, then: { __build.string.concat: … }, else: {
  __build.user: id } } }`) previously had its raw object thrown away, and now errors even though
  that branch is never selected. `_user`, `_state`, `_secret` and `_js` are not build operators,
  so escaped references to them must be removed or moved out of the build-time branch.
