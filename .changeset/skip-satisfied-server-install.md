---
'@lowdefy/node-utils': patch
'lowdefy': patch
---

perf(cli): Skip server installs the last install already satisfies

`lowdefy build` and `lowdefy emails` reset the server's `package.json` before each build, so for an app using plugins outside the server's base list every rebuild ran two installs: the first removed the app's plugins and the second put them back. Each install now records what it installed in `node_modules/.lowdefy-install-state.json`, and these commands skip an install when every dependency in `package.json` is already installed at the same spec and the install settings (`pnpm-workspace.yaml`, `.npmrc` and the rest of `package.json`) are unchanged. A rebuild with unchanged plugins runs no install. A new or changed plugin still installs, and a plugin the app stopped using is pruned at the next install. `installIfPackageJsonChanged` takes the new `skipIfInstalled` option; without it, behaviour is unchanged.
