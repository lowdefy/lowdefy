---
'@lowdefy/operators': minor
'@lowdefy/build': minor
'@lowdefy/errors': minor
---

feat(build): Add `${ … }` expression syntax that compiles to operators at build time.

A scalar written as a single `${ … }` is compiled, at parse time, into an ordinary operator tree, so
a two-clause condition reads as one line instead of eight nested operator lines:

```yaml
visible: "${ state.answer_detail.source == 'ai' && len(state.evidence_ids) > 0 }"
```

compiles to `{ _and: [{ _eq: [{ _state: answer_detail.source }, ai] }, { _gt: [{ _array.length: {
_state: evidence_ids } }, 0] }] }`. Because compilation happens in `addLineNumbers`, before operator
counting and every build check, the compiled operators flow through unknown-operator validation, the
`_state` contract, tenant audits and `lowdefy check` unchanged — the feature adds no runtime code, as
every construct maps to an operator that already ships.

The grammar covers literals; the roots `state. request. payload. user. event. actions. step. item.
global. url_query. var.`; comparison (`== != < <= > >=`), boolean (`&& || !`), `??`, ternary `?:`
(boolean condition required), member/index access, `.length`, and the functions `len`, `has`,
`lower`. Expressions are never compiled inside `_js` or `_nunjucks` bodies. Write a literal leading
`${` as `$${`. Compiled nodes carry the source line, column and the original expression, so an error
in `${ state.adress.city }` reports `file:line:column` with the expression in the message.
`@lowdefy/errors` gains an `expression` check slug, a `columnNumber` on `ConfigError`, and renders
`file:line:column`; `@lowdefy/operators` exports `compileExpression`, `isExpression` and
`stampPosition`.

Non-goals in this release: arithmetic, string interpolation (`foo ${x}`), string `.length`, function
definitions, and JSON-ref support (YAML only).
