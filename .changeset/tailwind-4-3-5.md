---
'@lowdefy/build': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

fix(deps): Update tailwindcss to 4.3.5, lightningcss to 1.33.0 and postcss to 8.5.32

Tailwind CSS fixes include `@scope` handling, `color-mix()` without an interpolation method, comments ending in `\*/`, and `@tailwindcss/postcss` rewriting relative `url()`s of inlined stylesheets. Lightning CSS adds `::highlight`, `@position-try` and the `alpha()` color function. PostCSS improves `</style>` escaping.
