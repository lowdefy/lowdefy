---
'@lowdefy/build': minor
'lowdefy': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
---

feat: Add `lowdefy check` — production-stage validation without a build.

`lowdefy check` runs every validation pass of `lowdefy build` against the production rules and stops before anything is written: no build artifacts, no client bundle, no server. Warnings that only fail a production build (`prodError`) come back as errors, so the command answers "would `lowdefy build` refuse this?" in seconds, offline. Output groups problems by source file with line numbers and check slugs, and ends with `N errors, M warnings` or `No problems found.`; `--json` prints the `{ errors, warnings }` report and nothing else. Exit code is 1 when there are errors, 0 otherwise (warnings never fail).

- `@lowdefy/build` gains a `validateOnly` build option (skips the write phase, `writeBuildArtifact` becomes a no-op) and a `check(options)` entry point exported from both `@lowdefy/build` and `@lowdefy/build/dev`. A new `checks/` registry hosts check rules; the `_js` lint moved from `jsMapParser` into the registry as the first rule (`js-lint`, still failing normal builds).
- `@lowdefy/server` ships `lowdefy/check.mjs` and the `check:lowdefy` script the CLI runs; it writes `build/checkReport.json` and always exits 0.
- `@lowdefy/server-dev` adds the `lowdefy_check` MCP tool, which runs the same check against the dev server's config and returns the located report.
