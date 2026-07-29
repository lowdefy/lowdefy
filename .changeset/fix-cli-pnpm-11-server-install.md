---
'lowdefy': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

fix(cli): Write a pnpm-workspace.yaml into the server directory so installs succeed on pnpm 11.

`lowdefy dev` and `lowdefy build` failed with `Dependency installation failed.` on pnpm 11 (`ERR_PNPM_IGNORED_BUILDS`), because dependency build scripts (sharp, better-sqlite3) were only allowed via the `pnpm.onlyBuiltDependencies` field in the server package.json — a field pnpm no longer reads (and strips at publish), while pnpm 11 turns ignored build scripts into a hard install error. The CLI now writes a `pnpm-workspace.yaml` with the build allowlist into the server directory before installing, covering pnpm 9 (`packages`), pnpm 10 (`onlyBuiltDependencies`), and pnpm 10.29+/11 (`allowBuilds`). An existing file is never overwritten, so users can extend the allowlist for their own plugins' native dependencies. The dead `pnpm` fields were removed from the server packages. Fixes #2191.
