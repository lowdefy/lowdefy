---
'@lowdefy/operators': minor
---

Client operator evaluation compiles each config tree it parses repeatedly.

The browser evaluated every block's config by round-tripping it through `JSON.stringify` and `JSON.parse` on every update, including config with no operators. Now `WebParser` compiles a config tree the second time it is parsed into closures that build the same result directly, and uses them from then on. Output is identical, including operator results of `undefined`, hidden config keys and errors. Anything the JSON round trip would change is not compiled and evaluates as before.

On the docs app, parser time per update drops 2.2–3.4× (1.7× on the page dominated by operator work), and a whole engine update is 1.5–1.8× faster. No config changes; dev and production both use it.
