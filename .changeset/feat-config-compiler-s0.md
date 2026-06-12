---
'@lowdefy/compile': minor
'@lowdefy/operators-js': minor
'@lowdefy/operators-nunjucks': minor
---

feat: Config compiler S0 — YAML compiles to ES module factories.

New `@lowdefy/compile` package (config-compiler design, stage S0): every
config file compiles 1:1 to an ES module exporting an async factory;
composition is import + call. Covers `_ref` path/vars/key/transformer
forms with the walker's exact operation order (transformer before key
pluck, `~ignoreBuildChecks` propagation), all `_var` forms with
caller-scope evaluation, `_build.*` operators through the same
evaluateOperators engine, runtime-operator passthrough with compiled
children, dynamic operator-built ref paths with run-time cycle guards,
static import-cycle detection with inclusion chains, module scope
helpers (`_module.var`, `_module.*Id` with per-registration binding),
S1 error-site locations and S2 lexical `~k` keys with
resolveConfigLocation-compatible keyMap/refMap output, and `.yaml.njk`
rejection pointing at the migration codemod.

A walker-parity suite runs identical fixtures through both the existing
build walker and the compiler asserting deep-equal output. Supporting
operators: `_array.compact` (conditional list membership) and a
`_build.nunjucks` export on operators-nunjucks (string-built ids).
