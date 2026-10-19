---
'@lowdefy/operators-js': minor
'@lowdefy/docs-content': patch
---

feat: `_if` without `test` fails the build

`@lowdefy/operators-js` ships its first build check rule, `if-test`. An `_if` whose params are an object without a `test` key, such as `_if: { _eq: [1, 1], then: a, else: b }`, now fails the build with the file and line instead of failing at runtime with "_if takes a boolean type for parameter test". Params that are one operator, such as `_if: { _state: ifParams }`, still pass. Silence it on a node with `~ignoreBuildChecks: [if-test]`.
