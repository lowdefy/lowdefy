# Testing

How to run and write tests in the monorepo, including from parallel git worktrees. Coding
rules for tests (naming, co-location, ES module mocking) live in `CLAUDE.md`.

## Getting a worktree ready

```bash
pnpm worktree fix/my-change --base origin/v7   # checkout + install + build, ~30s
```

`scripts/worktree.mjs` creates `../lowdefy-wt-<branch-slug>`, installs from the shared pnpm
store and builds every package. An existing local or remote branch is checked out instead
of created. Everything expensive is shared between worktrees by default, so nothing needs
setting up twice:

| Shared resource       | Location                    |
| --------------------- | --------------------------- |
| pnpm packages         | global pnpm store           |
| MongoDB test binaries | `~/.cache/mongodb-binaries` |
| Playwright browsers   | user `ms-playwright` cache  |

Per worktree state stays per worktree: `node_modules`, `dist`, `_server/`, `.lowdefy/`.

Git state that is _not_ per worktree: branches, tags, the stash and the `rerere` cache. Avoid
`git stash` when several worktrees (or agents) work at once, since one worktree's
`git stash pop` can apply another's entry, and a conflict resolved during it is recorded by
`rerere` and replayed on the owner's later pop. Compare against the base with `git diff` or
`git show HEAD:<file>` instead.

## Unit tests

```bash
pnpm test                                           # every package except the two below
pnpm --filter=@lowdefy/api test                     # one package
pnpm --filter=@lowdefy/api test --testPathPattern=endpoint --no-coverage
```

Tests that do real work (build fixtures, child processes) set a generous `testTimeout` so
they survive a loaded machine; don't tune timeouts down to what one idle run needs.

Never pass `--` before jest flags, and never call `pnpm jest` or `npx jest` directly.
Packages import each other from `dist/`, so run `pnpm build` after changing more than one
package.

## MongoDB tests

`@lowdefy/connection-mongodb` runs against a real single-node replica set started by
`mongodb-memory-server` (`@shelf/jest-mongodb` preset, `jest-mongodb-config.js`). The root
`pnpm test` skips it, since it needs a `mongod` binary that the first run downloads. Run it
with:

```bash
pnpm test:mongodb
```

CI does not run it on every push. Start the `MongoDB Tests` workflow from the Actions tab,
or add the `run-mongodb-tests` label to a pull request. Each jest run starts its own
`mongod` on a free port, so worktrees can run it at the same time.

## Ports

Port 3000 is the default for a developer's own dev server; tests and agents never bind it.

- Unit tests that need a socket listen on port `0` or use `findAvailablePort` from
  `@lowdefy/node-utils`.
- A dev app for manual or agent checks: `pnpm app:dev --no-open --port <free port>`.
- A production build of any app (per-page plugin chunks, preloads and cache headers only
  exist there): `node scripts/build.mjs --skip-build --config-directory <app>`, then
  `node scripts/start.mjs --port <free port>`. It builds into the worktree's `_server/prod`.
  Load pages cold (a fresh browser page per URL) as well as by navigation: a type missing
  from a page's chunk only fails on a cold load.
- Block e2e (`pnpm --filter=@lowdefy/blocks-basic e2e`) builds and starts the app from
  `e2e/app` on the package's port (3001–3015, one per package). Set `LOWDEFY_E2E_PORT` to
  run the same package from two worktrees at once. An already running server is reused only
  when `LOWDEFY_E2E_REUSE_SERVER=true`, so a run never tests another checkout's server by
  accident.

## Block e2e server

Each package's e2e run builds and serves its app from its own copy of the production
server, `_server/e2e/<package>` (for example `_server/e2e/blocks-basic`). The Playwright
config from `@lowdefy/block-dev-e2e` runs three commands:

1. `scripts/prepare-e2e-server.mjs` copies `packages/servers/server` there, links the
   `@lowdefy/*` packages to the monorepo and writes an isolated pnpm workspace (the same
   `scripts/lib` helpers as `pnpm app:build`).
2. `lowdefy build --server-directory _server/e2e/<package>` from `packages/cli/dist`
   installs, runs the Lowdefy build and the client build in the copy.
3. `lowdefy start` serves the copy on the package's port.

So an e2e run leaves `git status` clean (it never writes the server's `package.json` or the
root `pnpm-lock.yaml`), and different packages can run their e2e suites at the same time in
one worktree. The same package can't run twice at once in one worktree, since both runs
would share its copy. `pnpm e2e` still runs the suites one after another.

The copy keeps its `node_modules` and lockfile between runs, and the CLI installs again only
when the copy's `package.json` changes, so a repeat run spends its time on the builds.
Delete `_server/e2e/<package>` to force a fresh install. `packages/cli/dist` and the linked
packages' `dist` must be built first (`pnpm build`).

## Dev server and hub

- The dev hub (`lowdefy hub`, `lowdefy mcp`) keeps state in `~/.lowdefy`. Point
  `LOWDEFY_HOME` at a temporary directory in tests so they never touch the real hub.
- A running dev server records itself in `<app>/.lowdefy/instance.json`; tests that start
  one should stop it and remove the file.
- Hub tests pass a port range of their own (`portRange` to `createHub`, `range` to
  `allocatePorts`), away from the real hub's 4100–4999, which hubs started by agents in other
  worktrees bind.

## Block tests

Block unit tests are disabled. Cover block behaviour with e2e specs
(`src/blocks/<Block>/tests/*.e2e.spec.js`) instead.
