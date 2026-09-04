---
'@lowdefy/operators': minor
---

feat(operators): operator-closure emitter and parity harness (not yet wired)

`emitOperatorClosures` compiles a post-build config tree into an ES module of closures keyed by `~k`, and `evaluateWebClosures` / `evaluateClosures` run them with the exact `{ output, errors }` contract of `WebParser.parse` and `ServerParser.parse`: same output, same provenance markers, same errors with `received`, `location` and `configKey`. Nothing is wired into the build, client or engine yet; this is the gate a compiled-operator path must pass, and it runs green over every page in the build's fixture suite.
