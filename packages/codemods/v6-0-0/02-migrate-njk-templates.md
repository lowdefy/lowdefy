# Migration: Convert structural `.yaml.njk` templates to operators

## Context

Lowdefy v6 compiles every config file ahead of time (the config compiler is
now the only build path). **Structural Nunjucks templating — `.yaml.njk` /
`.yml.njk` files whose `{{ }}` / `{% %}` tags shape the YAML before it parses —
is removed.** A build that encounters a `.yaml.njk` config file now fails with:

```
Structural nunjucks templates (.yaml.njk) are no longer supported — "<file>".
Run the v6 migration codemod: {{ var }} becomes _var, string-built ids become
_build.nunjucks or _build.string.concat, {% if %} becomes _build.if with
_build.array.compact for conditional list membership. The runtime _nunjucks
operator is unchanged.
```

**Unchanged, explicitly kept:** the runtime `_nunjucks` operator (rendering
strings at request/render time), the `_build.nunjucks` build operator
(string-built ids and values at build time), and the `@lowdefy/nunjucks`
package. Only the *structural* `.yaml.njk` file form is gone.

## Critical: this is a **report-only** codemod

Structural templates rewrite YAML text before parsing, so there is no safe
mechanical 1:1 transform — `{% for %}` over a block list, conditional keys, and
interpolated ids each map to a *different* operator depending on what the
template produced. **Do not auto-rewrite any template.** Produce a report with
one entry per `.yaml.njk` file and migrate each by hand against the patterns
below, confirming the rendered output is unchanged.

## Pattern map

| `.yaml.njk` construct | v6 replacement |
| --- | --- |
| `{{ myVar }}` substituting a whole value | `_var: myVar` (rename the file to `.yaml`; the `_ref` that includes it passes `vars`) |
| `id: prefix_{{ name }}` (string-built id/value) | `_build.nunjucks: { template: 'prefix_{{ name }}', on: { _var: name } }` or `_build.string.concat: [prefix_, { _var: name }]` |
| `{% if cond %} ...block... {% endif %}` (conditional list membership) | put the block in the list wrapped with `_build.array.compact` and `_build.if`: `_build.array.compact: [{ _build.if: { test: { _var: cond }, then: <block>, else: null } }]` |
| `{% if cond %}a{% else %}b{% endif %}` (conditional value) | `_build.if: { test: { _var: cond }, then: a, else: b }` |
| `{% for item in items %} ...block... {% endfor %}` (repeat blocks) | `_build.array.map` over `{ _var: items }` producing the block per item (or `_ref` the block file with per-iteration `vars`) |
| `{{ items | dump | safe }}` (inject a resolved array/object) | `_var: items` directly (the compiler injects the resolved value — no dump/safe needed) |

## Files to search

Glob: `**/*.{yaml.njk,yml.njk}`

For each file the report should include:

- File path.
- The Nunjucks constructs found (`{{ }}` interpolations, `{% if %}`, `{% for %}`, filters).
- The proposed operator replacement per construct.
- The `_ref` site(s) that include the file (the `vars` they pass become the
  `_var` inputs) — found by grepping for the file path in `_ref:` definitions.
- A checkbox for the reviewer to confirm the rendered output matches.

## Notes

- After migration, rename the file from `.yaml.njk` to `.yaml` and drop the
  Nunjucks-specific `| dump | safe` filters — the compiler resolves `_var` and
  `_build.*` to real values, no string round-trip.
- Lowdefy's own documentation app was migrated off structural `.yaml.njk` using
  exactly these patterns; the docs `concepts/references-and-templates` page
  shows the operator equivalents in context.
- If a template only interpolated strings (no structural `{% %}`),
  `_build.nunjucks` is the closest 1:1 — it runs the same Nunjucks engine on a
  string template at build time.
