---
'lowdefy': minor
'@lowdefy/node-utils': patch
'@lowdefy/build': patch
---

fix(cli): Generated servers install as their own pnpm workspace inside a parent workspace

An app inside a pnpm workspace had to list its `.lowdefy/*` server directories as workspace members, so the servers picked up workspace plugins and the root's overrides and patches. Those directories are gitignored, so the committed root `pnpm-lock.yaml` depended on which servers happened to exist, and churned by thousands of lines between `lowdefy dev`, `lowdefy build` and a fresh clone.

`lowdefy dev`, `lowdefy build`, `lowdefy emails` and `lowdefy test` now give the server its own `pnpm-workspace.yaml`, with a lockfile inside the gitignored server directory, even when the app sits in a parent workspace:

- Every setting in the parent's `pnpm-workspace.yaml` except `packages` is carried over (`overrides`, `patchedDependencies`, `supportedArchitectures`, `minimumReleaseAge`, `nodeLinker` and the rest). When pnpm 10 installs the server (the parent's `devEngines.packageManager` or `packageManager` pin, or the `pnpm` on the path), the root `package.json` `pnpm` field and `resolutions` are carried too, over the yaml as pnpm 10 applies them; pnpm 11 ignores them, so they are left out. Paths are rebased so they point at the same files: patches, `link:` and `file:` specs in `overrides`, catalogs and `packageExtensions`, `pnpmfile` (a `.pnpmfile.cjs` or `.pnpmfile.mjs` at the parent root is used too, unless pnpm 10 takes `pnpmfile` from the parent's `.npmrc`), `onlyBuiltDependenciesFile`, and `storeDir`, `cacheDir`, `stateDir`, `globalDir`, `globalBinDir` and `globalPnpmfile`, so a parent `storeDir: .pnpm-store` keeps one store. `$name` overrides are resolved against the parent's root `package.json`: a `workspace:` version becomes a `link:` to the workspace package and a `catalog:` version takes the catalog entry. The file is rewritten on every run, keeping the `minimumReleaseAgeExclude` entries pnpm 11 adds when it installs a release younger than its default `minimumReleaseAge` (so a second `lowdefy build` or `lowdefy dev` on a new Lowdefy release no longer fails with "The lockfile contains entries that the active policies reject"), so build allowlists for plugin dependencies belong in the parent's `pnpm-workspace.yaml`.
- The parent's `.npmrc` (scoped registries, auth) is copied into the server's `.npmrc`, ahead of the server package's own lines, with relative paths (`store-dir`, `pnpmfile`, `cafile`, `certfile`, `keyfile` and the like) rebased. Credentials that reference an environment variable (`${NPM_TOKEN}`) stay references; a credential written out in the file is not copied, and the CLI warns which key it left out.
- Plugins with a `workspace:` version are installed as `link:` paths to their package in the parent workspace, including plugins a `lowdefy dev` rebuild adds while the server runs.
- The parent's pnpm pin (`packageManager` and `devEngines.packageManager`) is set on the server's `package.json`, and removed from it when the parent drops it.
- The server reinstalls when its `pnpm-workspace.yaml` or `.npmrc` changes, not only its `package.json`.
- `lowdefy docker-output` and `lowdefy vercel-output` still trace from the parent workspace root, so linked plugins are included.

Server installs no longer fail on pnpm 11 with `ERR_PNPM_IGNORED_BUILDS` for `@sentry/cli`, in standalone apps too: the generated `pnpm-workspace.yaml` skips its install script, which only downloads a binary the platform optional dependency already provides.

To stop the lockfile churn, remove the `.lowdefy/*` globs from the parent's `pnpm-workspace.yaml` `packages`. If the parent's patches only apply to the servers, set `allowUnusedPatches: true` in the parent too.
