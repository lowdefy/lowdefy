---
'@lowdefy/build': major
'@lowdefy/compile': major
---

feat: Config compiler endgame — the compiler is the only build path; structural `.yaml.njk` templates removed.

`lowdefy build` (production and the dev/JIT path) now resolves config
exclusively through `@lowdefy/compile`. The runtime tree-walker
(`buildRefs/`) is deleted, along with the `compiler` build option and the
`LOWDEFY_BUILD_COMPILER` env var.

**Breaking change:** structural Nunjucks template files — `.yaml.njk`,
`.yml.njk`, `.json.njk`, where `{% %}` / `{{ }}` tags shape the YAML
before it parses — are no longer supported. A build that finds one fails
with an error pointing at the migration. Convert them to `_build`
operators inside ordinary `.yaml` files (`_build.if`, `_build.array.map`,
`_build.array.compact`, `_build.nunjucks` / `_build.string.concat`); the
report-only `migrate-njk-templates` codemod lists every file and its
operator equivalents. The runtime `_nunjucks` operator and the
`_build.nunjucks` build operator are unchanged.

Everything else is behaviour-preserving: `_ref` (path, vars, key,
transformer, resolver, module component/menu, dynamic paths, non-YAML
content), `_var`, `_build.*`, `_module.*`, a global `refResolver`, and
resolvers/transformers all work as before. The compiler absorbed the
ref forms that previously delegated to the walker. The dev server
resolves and JIT-builds pages by re-running compiled factories from the
config module graph.
