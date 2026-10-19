---
'lowdefy': minor
'@lowdefy/build': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': minor
'@lowdefy/server-e2e': patch
'@lowdefy/docs-content': patch
---

feat: `lowdefy build` and `lowdefy dev` build again to run newly installed plugins' rules, and `--skip-plugin-checks` skips plugin rules for one run

- When a build uses a plugin that is not installed yet, its build check rules cannot run. `lowdefy build` and `lowdefy dev` now install the plugin and run the Lowdefy build once more, so its rules run on a fresh checkout or CI run. The Vite client build still runs once.
- `--skip-plugin-checks` on `lowdefy build`, `lowdefy dev` and `lowdefy journeys scope` skips every plugin build check rule for that run, and each build logs a warning that they were skipped. No second build runs for newly installed plugins. Built-in build checks still run. Use it while a fix ships for a plugin rule that is wrong or too strict.
