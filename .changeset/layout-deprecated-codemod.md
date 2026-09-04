---
'@lowdefy/build': minor
'@lowdefy/errors': minor
'@lowdefy/codemods': minor
'@lowdefy/layout': patch
'@lowdefy/docs': patch
---

feat: per-block `layout:` is deprecated in favour of `Row`, `Grid` and `Stack`; nothing is removed

`layout:` keeps working exactly as before. `lowdefy check` reports every block with a `layout:` key and every container slot with area-level layout keys under the `layout-deprecated` slug, naming the wrapper that site needs (siblings with `span`/`offset` → a `Grid` of 24 columns with `col-span-N` classes, `flex`/`grow`/`shrink`/`size` → a `Row` with Tailwind flex utilities, a `direction: column` area → a `Stack`, `selfAlign` → `self-*`), and finishes with a count of sites and files. Operator-valued `layout:` is reported as a hand conversion. `lowdefy upgrade` offers an optional `layout-to-containers` codemod for v8, backed by a deterministic core that rewrites the YAML in place with comments intact, accumulates `offset` across each 24-column row into `col-start-N`, and reports rather than guesses at every dynamic or responsive site. Suppress the check per config object with `~ignoreBuildChecks: [layout-deprecated]`.
