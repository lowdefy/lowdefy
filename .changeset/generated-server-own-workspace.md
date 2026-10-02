---
'lowdefy': minor
'@lowdefy/node-utils': patch
---

fix(cli): Generated servers install as their own pnpm workspace inside a parent workspace

An app inside a pnpm workspace had to list its `.lowdefy/*` server directories as workspace members, so the servers picked up workspace plugins and the root's overrides and patches. Those directories are gitignored, so the committed root `pnpm-lock.yaml` depended on which servers happened to exist, and churned by thousands of lines between `lowdefy dev`, `lowdefy build` and a fresh clone.

`lowdefy dev`, `lowdefy build`, `lowdefy emails` and `lowdefy test` now give the server its own `pnpm-workspace.yaml`, with a lockfile inside the gitignored server directory, even when the app sits in a parent workspace:

- Every setting in the parent's `pnpm-workspace.yaml` except `packages` is carried over (`overrides`, `patchedDependencies`, `supportedArchitectures`, `minimumReleaseAge`, `nodeLinker` and the rest), along with the settings pnpm 10 reads from the root `package.json` `pnpm` field and `resolutions`. Paths are rebased so they point at the same files: patches, `link:` and `file:` specs in `overrides`, catalogs and `packageExtensions`, `pnpmfile` (a `.pnpmfile.cjs` or `.pnpmfile.mjs` at the parent root is used too) and `onlyBuiltDependenciesFile`. `$name` overrides are resolved against the parent's root `package.json`. The file is rewritten on every run, so build allowlists for plugin dependencies belong in the parent's `pnpm-workspace.yaml`.
- The parent's `.npmrc` (scoped registries, auth) is copied into the server's `.npmrc`, ahead of the server package's own lines. Credentials that reference an environment variable (`${NPM_TOKEN}`) stay references; a credential written out in the file is not copied, and the CLI warns which key it left out.
- Plugins with a `workspace:` version are installed as `link:` paths to their package in the parent workspace.
- The parent's `packageManager` pnpm version is set on the server's `package.json`.
- The server reinstalls when its `pnpm-workspace.yaml` or `.npmrc` changes, not only its `package.json`.
- `lowdefy docker-output` and `lowdefy vercel-output` still trace from the parent workspace root, so linked plugins are included.

To stop the lockfile churn, remove the `.lowdefy/*` globs from the parent's `pnpm-workspace.yaml` `packages`. If the parent's patches only apply to the servers, set `allowUnusedPatches: true` in the parent too.
