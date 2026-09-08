---
---

chore: Pin `better-sqlite3` to 12.11.1 so CI installs on Node 26.

`better-sqlite3` versions before 12.11.0 ship no Node 26 (N-API v147) prebuilt binary, so
`pnpm install --frozen-lockfile` on Node 26 fell back to a source build. That build fails on the
Windows CI runner because node-gyp cannot detect Visual Studio under Node 26, and with the default
fail-fast matrix it cancelled the remaining Node 26 jobs. Added a pnpm `overrides` entry (the package
is transitive via `knex`) so the Node 26 prebuild is used and no compilation is needed.
