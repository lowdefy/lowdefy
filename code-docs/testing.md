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

Git state that is _not_ per worktree: branches, tags and the stash. Avoid `git stash` when
several worktrees (or agents) work at once, since one worktree's `git stash pop` can apply
another's entry. Compare against the base with `git diff` or `git show HEAD:<file>` instead.

## Unit tests

```bash
pnpm test                                           # every package except the two below
pnpm --filter=@lowdefy/api test                     # one package
pnpm --filter=@lowdefy/api test --testPathPattern=endpoint --no-coverage
```

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
- Block e2e (`pnpm --filter=@lowdefy/blocks-basic e2e`) builds and starts the app from
  `e2e/app` on the package's port (3001–3014, one per package). Set `LOWDEFY_E2E_PORT` to
  run the same package from two worktrees at once. An already running server is reused only
  when `LOWDEFY_E2E_REUSE_SERVER=true`, so a run never tests another checkout's server by
  accident.

Block packages share `packages/servers/server` for their e2e builds, so run block e2e
suites one at a time within a worktree (`pnpm e2e` already does).

## Dev server and hub

- The dev hub (`lowdefy hub`, `lowdefy mcp`) keeps state in `~/.lowdefy`. Point
  `LOWDEFY_HOME` at a temporary directory in tests so they never touch the real hub.
- A running dev server records itself in `<app>/.lowdefy/instance.json`; tests that start
  one should stop it and remove the file.

## Block tests

Block unit tests are disabled. Cover block behaviour with e2e specs
(`src/blocks/<Block>/tests/*.e2e.spec.js`) instead.
