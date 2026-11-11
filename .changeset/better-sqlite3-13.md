---
'@lowdefy/connection-knex': major
'lowdefy': major
---

feat(deps)!: Update better-sqlite3 to 13.0.3

The SQLite driver used by the Knex connection (`client: sqlite` or `client: better-sqlite3`) moves from 12 to 13. It now uses Node's stable native API and ships its compiled binaries inside the package, so installing it no longer downloads or compiles a native module.

**32-bit ARM Linux is no longer supported for SQLite.** better-sqlite3 13 ships binaries for Linux (glibc and musl), macOS and Windows, on x64 and arm64. 12.x also shipped binaries for 32-bit ARM Linux (`linux-arm` and `linuxmusl-arm`, for example a Raspberry Pi on a 32-bit OS). On those machines the install still succeeds, but a SQLite request fails when it first opens the database. Other databases on the Knex connection are not affected.

The `pnpm-workspace.yaml` the CLI writes into the server directory now marks better-sqlite3 as an ignored build (`allowBuilds: better-sqlite3: false`, and in `ignoredBuiltDependencies`) instead of an allowed one. The package sets `gypfile: false`, but pnpm before 11.28 still gives it a `node-gyp rebuild` install script because it contains a `binding.gyp`. Allowed, that script fails the install where node-gyp is not installed (pnpm 10); left out, pnpm 11 before 11.28 fails the install with `ERR_PNPM_IGNORED_BUILDS`. If your app lives in a pnpm workspace that allows better-sqlite3's build, set it to `false` there too.
