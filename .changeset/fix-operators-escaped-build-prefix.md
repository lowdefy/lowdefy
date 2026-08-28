---
'@lowdefy/operators': patch
---

fix(operators): Recognise escaped build prefixes in evaluateOperators guards.

Nested build operators run under escaped prefixes (`__build.`, `___build.`, …) inside a
`_build.function` body, but four guards in `evaluateOperators` compared the operator prefix
exactly to `_build.`. A dynamic operator (e.g. `_function`) nested inside a `_build.function`
body was deferred unevaluated instead of evaluated at build time, leaking raw operator objects
into the built output — either failing the build (`_array.concat must be evaluated on an array
instance`) or silently corrupting output such as MongoDB aggregation pipelines. Any build-prefix
escape depth now evaluates at build time, matching v4 behaviour.

Note: an unknown operator under an escaped build prefix (e.g. a typo like `__build.arrry.map`
inside a `_build.function`) now raises a build `ConfigError` where it previously deferred
silently. This can surface pre-existing typos in real configs as new build failures.
