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
pnpm test                                           # every package except connection-mongodb
pnpm --filter=@lowdefy/api test                     # one package
pnpm --filter=@lowdefy/api test --testPathPattern=endpoint --no-coverage
```

Tests that do real work (build fixtures, child processes) set a generous `testTimeout` so
they survive a loaded machine; don't tune timeouts down to what one idle run needs.

Never pass `--` before jest flags, and never call `pnpm jest` or `npx jest` directly.
Packages import each other from `dist/`, so run `pnpm build` after changing more than one
package.

## Dependency check

`pnpm test` starts with `pnpm test:dependencies` (one to three seconds). It parses every source
file under `packages/` and fails when a file imports a package that its `package.json` does
not declare. In the monorepo such an import still resolves through another package's
install, so only the published package (or a later lockfile change) breaks.

- Published files (`files` in `package.json`; `src/` counts as `dist/`) may import
  `dependencies`, `peerDependencies` and `optionalDependencies`.
- Tests (`*.test.js`, `test/`, `tests/`, `test-utils/`, `__mocks__/`), unpublished files,
  block e2e helpers (reachable from a package's `./e2e` export) and private packages may
  also import `devDependencies`. So do the servers' `lowdefy/` build scripts and the
  webpack-bundled `@lowdefy/nunjucks`, listed in `scripts/lib/findUndeclaredImports.mjs`.
- Tests that import `@jest/globals` declare it as a devDependency.

The check reads what is declared, not what resolves: ESLint's
`import/no-extraneous-dependencies` skips any import it cannot resolve, which in a pnpm
workspace is most undeclared imports.

## MongoDB tests

`@lowdefy/connection-mongodb` runs against a real single-node replica set started by
`mongodb-memory-server` (`@shelf/jest-mongodb` preset, `jest-mongodb-config.js`). The root
`pnpm test` skips it, since it needs a `mongod` binary that the first run downloads. Run it
with:

```bash
pnpm test:mongodb
```

`pnpm test:mongodb` also runs `@lowdefy/api`'s `*.mongodb.test.js` suites
(`pnpm --filter=@lowdefy/api test:mongodb`, `jest.mongodb.config.js`), which drive engine code
through a real BetterAuth instance and the MongoDB auth adapter, for example the tenant signup
mint under concurrent sessions. Name an api test `*.mongodb.test.js` when it needs a real
server; the plain `pnpm test` run ignores those files. It also runs `@lowdefy/server-dev`'s
`*.mongodb.test.mjs` suites (`pnpm --filter=@lowdefy/server-dev test:mongodb`), such as the
journey data set pull, which spawns `lib/data/pullDataSet.mjs` against a memory server, the
journey data sessions (`lib/docs/dataSets/openDataSession.mongodb.test.mjs`, which start the dev
server's own data store), the data store's port, stop and replacement after its mongod dies
(`getDataStore.mongodb.test.mjs`, which kills that mongod), and the data set journeys end to end
(`dataSetJourneys.chromium.mongodb.test.mjs`: real Chromium over a build of a fixture app with
tenant auth and a local module, with a database on the jest-mongodb server standing in for the
developer's, auth collections included, snapshotted before and compared after; skipped without a
Chromium). To reproduce a race deterministically,
pause one session inside the real adapter (wrap `adapter.create` from `auth.$context`) and
run the other to completion before releasing it.

CI does not run it on every push. Start the `MongoDB Tests` workflow from the Actions tab,
or add the `run-mongodb-tests` label to a pull request. Each jest run starts its own
`mongod` on a free port, so worktrees can run it at the same time.

## Auth journeys

The tenant auth reference app (`apps/auth-reference-tenant`) carries config tests for the
real auth path: sign-up with email verification, sign-in refusals, sign-out, magic link,
invitations (including expired and cancelled ones), tenant isolation, organization
switching and member removal (`tests/journeys/*.yaml`, all `user: none`). Run them with:

```bash
pnpm test:journeys:auth                      # builds first, like pnpm dev
pnpm test:journeys:auth --skip-build         # reuse the current build
pnpm test:journeys:auth --filter invitation  # journeys whose name matches
pnpm test:journeys:auth --app auth-reference # another app (default auth-reference-tenant)
```

The pinned-organization app (`apps/auth-reference`) carries the password reset journey.

`scripts/test-journeys-auth.mjs` starts a single-node memory replica set (fresh every run,
auth indexes provisioned), then this checkout's dev server (`scripts/dev.mjs`) with the
app's secrets, a pinned `BETTER_AUTH_URL`, the dev mail sink (`LOWDEFY_DEV_SMTP_PORT`) and
`INVITATION_EXPIRES_IN=60` (read by the app's build, so invitations expire after the
60 second minimum and the expiry journey can wait one out, about a minute of the run),
runs this checkout's `lowdefy test --url` against it, and stops everything. It uses four
consecutive free ports from `--port` (default 3200): app, internal, mail sink, MongoDB. The
dev server log goes to `apps/<app>/.lowdefy/journeys-dev-server.log`. It
needs no Docker MongoDB or Mailpit, only the shared MongoDB binaries and a Chromium.

An app outside the monorepo runs its own auth journeys against a checkout the same way:
`node scripts/dev.mjs --config-directory <app> --port <port> --no-open` for the server, and
`node packages/cli/dist/index.js test --journeys-directory <dir> --url <url>` for the run.
Keeping such journeys in their own directory (not `tests/journeys/`) keeps them out of the
app's everyday `lowdefy test`, which may run against a shared database.

Like the MongoDB suite, CI does not run it; run it when changing auth, tenancy, the
journey runner or the dev server. It uses `_server/dev`, so run one at a time per
worktree. To iterate on one journey, keep a dev server running with the same environment
and use `node packages/cli/dist/index.js test --config-directory apps/auth-reference-tenant
--url http://localhost:<port> --filter <name>`; a journey that signs up needs an empty
database, since signing up an existing address sends no email.

## Journey fixture app

`apps/journey-fixture` is a small app the journey runner's real-Chromium tests drive through
this checkout's dev server: the exercised path (pages, request counts, nested `CallApi`
endpoints), config mutants reaching the page, request, endpoint and detached routes, and
what later journey features assert. Run it after `pnpm build`:

```bash
pnpm --filter=@lowdefy/server-dev test:fixture   # the runner, the observer, the grammar, mutants
pnpm --filter=lowdefy test:fixture                # `lowdefy journeys harden` from the built CLI
```

Each jest global setup (`test/journeyFixture/globalSetup.mjs` in either package) calls
`scripts/lib/startJourneyFixture.mjs`, which starts a memory replica set for the app's
`fixture_db` connection and `scripts/dev.mjs --skip-build --dev-directory
_server/dev-journey-fixture` with `CRON_SECRET` set, on three free ports from 3300
(`LOWDEFY_JOURNEY_FIXTURE_PORT` moves them), then runs one journey on every page so Vite's
first compile and each page's first build happen before any test. It never touches `_server/dev`, so it runs beside
`pnpm app:dev`; the two packages' suites share `_server/dev-journey-fixture`, so do not run them
at once in one worktree. With no Chromium every test skips.
The dev server log is `apps/journey-fixture/.lowdefy/fixture-dev-server.log`. CI does not
run it; run it when changing the journey runner, journey cookies or mutants.

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

CI does not run block e2e on every push. Start the `Block E2E Tests` workflow from the
Actions tab, or add the `run-block-e2e` label to a pull request; it runs each package's
suite in its own job.

## Enrichment tables e2e

The enrichment tables reference app (`packages/plugins/blocks/blocks-table/e2e/enrichment/app`,
design `code-docs/plans/enrichment-tables.md`) has a suite of its own, apart from the block
suite, since it needs a MongoDB replica set (change streams), mock services and `CRON_SECRET`:

```bash
LOWDEFY_E2E_PORT=3197 pnpm --filter=@lowdefy/blocks-table e2e:enrichment
```

The Playwright config (`e2e/enrichment/playwright.config.js`, ports in `settings.js`) starts,
before the app:

- the mock services (`mocks/mockServices.mjs`) on `LOWDEFY_E2E_MOCK_PORT` (default app port
  plus one): the company and email APIs the providers call, the Anthropic Messages API and
  treg (`/treg/call/…`: routed email find with `X-Treg-Cost-Micro`, `Idempotency-Key` replays,
  a 402, a 503 with `retry_after`, an async task), with a call log, latency settings and fixed
  answers per domain (404, 500, 400, one 429);
- a fresh single-node replica set from the shared binaries (`scripts/e2e-mongodb.mjs`) on
  `LOWDEFY_E2E_MONGODB_PORT` (default 27197), unless `LOWDEFY_SECRET_ENRICHMENT_MONGODB_URI`
  points at one.

It builds into `_server/e2e/blocks-table-enrichment` and runs the specs one at a time, since
they share the database. The API specs call endpoints over `/api/endpoints/<id>` and run the
worker as a cron tick (`/api/cron/enrichment_worker`); the page spec drives the Table. The
app's `api/test/` endpoints (seed, read cells, set a cell) exist for the specs only: each starts
with `api/test/e2e_guard.yaml`, which refuses the call unless `LOWDEFY_SECRET_ENRICHMENT_E2E_SECRET`
(set by the Playwright config) is set and the payload's `e2eSecret` matches it; the specs call
them through `callTestEndpoint`. They are marked "E2E ONLY, DO NOT COPY".

On teardown Playwright stops the app first, with a SIGTERM it waits for (suites with services),
then the replica set; mongod runs in a process group of its own, so the script stops it cleanly.
CI runs the suite in the block e2e workflow (`test-block-e2e.yml`, job `enrichment`, on the
`run-block-e2e` label), with the mongod binaries cached and downloaded before the run.

## Before merging

The root `pnpm test` in CI skips the MongoDB and block e2e suites, so a pull request that
touches them runs them on request (the pull request template lists both):

| Change touches                               | Run                                                  |
| -------------------------------------------- | ---------------------------------------------------- |
| `connection-mongodb`, tenancy, auth adapters | `pnpm test:mongodb` or the `run-mongodb-tests` label |
| blocks, `block-utils`, the engine            | `pnpm e2e` or the `run-block-e2e` label              |

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
