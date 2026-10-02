---
'lowdefy': minor
'@lowdefy/node-utils': patch
---

fix(cli): Generated servers install as their own pnpm workspace inside a parent workspace

An app inside a pnpm workspace had to list its `.lowdefy/*` server directories as workspace members, so the servers picked up workspace plugins and the root's overrides and patches. Those directories are gitignored, so the committed root `pnpm-lock.yaml` depended on which servers happened to exist, and churned by thousands of lines between `lowdefy dev`, `lowdefy build` and a fresh clone.

`lowdefy dev`, `lowdefy build`, `lowdefy emails` and `lowdefy test` now give the server its own `pnpm-workspace.yaml`, with a lockfile inside the gitignored server directory, even when the app sits in a parent workspace:

- The parent's `overrides`, `packageExtensions`, `peerDependencyRules`, `allowBuilds`, `onlyBuiltDependencies`, `ignoredBuiltDependencies`, `catalog`, `catalogs` and `patchedDependencies` (with patch paths rebased) are carried over, read from the parent's `pnpm-workspace.yaml` or its root `package.json` `pnpm` field. The file is rewritten on every run, so build allowlists for plugin dependencies belong in the parent's `pnpm-workspace.yaml`.
- Plugins with a `workspace:` version are installed as `link:` paths to their package in the parent workspace.
- The parent's `packageManager` pnpm version is set on the server's `package.json`.
- The server reinstalls when its `pnpm-workspace.yaml` changes, not only its `package.json`.
- `lowdefy docker-output` and `lowdefy vercel-output` still trace from the parent workspace root, so linked plugins are included.

To stop the lockfile churn, remove the `.lowdefy/*` globs from the parent's `pnpm-workspace.yaml` `packages`. If the parent's patches only apply to the servers, set `allowUnusedPatches: true` in the parent too.
