# The CLI

The Lowdefy CLI is used to develop a Lowdefy app locally, and to build Lowdefy apps for deployment.

We recommend running the CLI using `pnpx`, to always use the latest version:

```
pnpx lowdefy@5 <command>
```

or, to use a specific version:

```
pnpx lowdefy@version <command>
```

Alternative, you can install the CLI globally or to a Javascript project (with a `package.json` file) via pnpm.

To install the CLI globally run:

```
pnpm add -g lowdefy
```

The CLI can then be run using `lowdefy` as the executable name:

```
lowdefy <command>
```

# CLI commands

## build

The `build` command runs a Lowdefy build. This builds a production Lowdefy app in the server directory, which can then be started using the `lowdefy start` command. The options are:

- `--config-directory <config-directory>`: Change the config directory. The default is the current working directory.
- `--disable-telemetry`: Disable telemetry.
- `--log-level <level>`: The minimum severity of logs to show in the CLI output. Options are `debug`, `info`, `warn` or `error`. The default is `info`.
- `--no-client-build`: Do not run the Vite client build, and only build the Lowdefy config. Used in some deployment scripts where the client build is done as a separate step. The previous `--no-next-build` flag still works as a deprecated alias.
- `--ref-resolver <ref-resolver-function-path>`: Path to a JavaScript file containing a `_ref` resolver function to be used as the app default `_ref` resolver.
- `--server-directory <server-directory>`: Change the server directory, the directory in which the production server is placed. The default is `<config-directory>/.lowdefy/server`.
- `--skip-codemod-check`: Suppress warnings about pending codemod upgrades.

### Per-page type imports

A production build writes a type-import module per page, listing exactly the blocks, actions and client operators that page uses. The client loads a page's module as it navigates to the page, so the bundler code-splits the block, action and operator packages per page instead of shipping every type an app uses in one chunk. Types used by many pages, and the small set every page needs (the basic and loader blocks, `Message`, `SetDarkMode`, `_not` and `_type`), are hoisted into shared chunks and loaded once.

The app-wide barrels are kept as the fallback. A page that carries a type its module does not list — a [Dynamic block](/dynamic-page-content) whose content is resolved when the page is fetched — loads them once, on demand. The development server always uses the barrels, because it builds pages just in time and cannot know a page's types before serving the client.

Set `config.experimental.perPageImports: false` to turn the split off and serve every type from the barrels.

## check

The `check` command validates a Lowdefy app against production rules without building it — it is the `tsc` of Lowdefy. It runs every validation pass of `lowdefy build` (schema checks, type lookups, id references, operator checks) plus the check-only rules — the `_js` lint and the [tenant wall audits](/organizations#audits) (`tenant: none` reads with no tenant clause, tenant values taken from the caller, unstamped writes, and the inventory of every unscoped request and step) — and then stops: no build artifacts are written, no client is bundled, and no server is started. It is fast and works offline, so it fits a pre-commit hook or a CI step.

Among the check-only rules is the secrets check: every literal `_secret` name the config reads is looked up in the environment the check runs in (`process.env`, which includes the app's `.env` file), and each name that is not set is reported as a warning under the `secrets` check slug, with the environment variable to set. A missing secret is otherwise silent — `_secret` returns `null` at runtime, on the server, with no error. A `_secret` whose name is computed by an operator cannot be checked statically and is counted at `--log-level debug`. A `_secret` that declares a `default` is not reported: the default says the author meant it to be optional. This is a check-only rule and never fails a build, because the environment a build runs in is rarely the environment the app runs in.

The check always runs with the production rules. Some build warnings are only warnings in `lowdefy dev` but fail `lowdefy build` — those are reported by `check` as errors, exactly as a production build would. Warnings never fail a check.

The first run in a fresh clone prepares the server directory (`.lowdefy/server`) the same way `lowdefy build` does, so the app's own plugins are known; every later run reuses it. Running `check` while `lowdefy dev` is running is safe.

The options are:

- `--against <ref>`: Also report what merging this branch into the given git ref would collide on. See below.
- `--config-directory <config-directory>`: Change the config directory. The default is the current working directory.
- `--disable-telemetry`: Disable telemetry.
- `--json`: Print the report as a JSON object, `{ "errors": [...], "warnings": [...] }`, and nothing else on stdout. Each entry has `message`, `name`, `source` (file and line), `config` (the config path), `configKey`, `checkSlug` and `prodError`. With `--against`, the object also has an `against` key, `{ "ref": ..., "errors": [...], "warnings": [...] }`, in the same entry shape.
- `--log-level <level>`: The minimum severity of logs to show in the CLI output. Options are `debug`, `info`, `warn` or `error`. The default is `info`.
- `--ref-resolver <ref-resolver-function-path>`: Path to a JavaScript file containing a `_ref` resolver function to be used as the app default `_ref` resolver.
- `--server-directory <server-directory>`: Change the server directory. The default is `<config-directory>/.lowdefy/server`.

The human-readable output groups problems by source file, one line per problem with its line number, the error name, the message and the check slug in parentheses, and ends with a `N errors, M warnings` summary (or `No problems found.`). A check slug can be used in `~ignoreBuildChecks` to suppress that check on a config node.

### Checking against another branch

Two branches that each add a page id, a request id, a connection or a migration collide silently until they are merged. `lowdefy check --against <ref>` reports those collisions before the merge. It resolves the ref with git, checks the ref and the merge base of `HEAD` and the ref out into temporary worktrees, and compares the ids each side declares:

- An id declared on both sides but **introduced on each side since the merge base** is a collision, reported per kind (page, request, endpoint, connection, component, collection, migration). An id that already exists at the merge base is the same id, not a collision.
- A migration this branch adds that sorts **before** a migration the target branch adds is an error: migration ids sort lexically and lexical order is execution order, so after the merge that migration would be inserted before one that has already run. Rename it with a later id.

These are reported under the `branch-merge` check slug, in a `Merge against <ref>` section of the human output and under the `against` key of `--json`, and they set the exit code to `1` like any other error. The worktrees are removed when the check finishes, including when it fails.

Exit codes:

- `0`: no errors (warnings may have been reported).
- `1`: one or more errors, one or more merge collisions, or the check itself failed to run.

Compared to `lowdefy build`: `build` validates and then writes the production app to the server directory and bundles the client; `check` runs the same validation and stops. `check` is the right command to answer "would `lowdefy build` refuse this?" without waiting for a build.

## dev

The `dev` command starts a Lowdefy development server, running locally. It can be accessed in a browser at [http://localhost:3000](http://localhost:3000). The CLI watches the file system, and rebuilds the app and reloads served pages every time a change is made to any of the files in the project directory. The `dev` command should not be used to serve a production app, the `build` and `start` commands should be used instead.

- `--config-directory <config-directory>`: Change the config directory. The default is the current working directory.
- `--dev-directory <dev-directory>`: Change the dev directory, the directory in which the development server is placed. The default is `<config-directory>/.lowdefy/dev`.
- `--disable-telemetry`: Disable telemetry.
- `--log-level <level>`: The minimum severity of logs to show in the CLI output. Options are `debug`, `info`, `warn` or `error`. The default is `info`.
- `--mock-user [user]`: Start the dev server authenticated as a mock user, bypassing the login flow. Pass a JSON user object to set the identity and roles (e.g. `--mock-user '{"sub":"dev","roles":["admin"]}'`), or use the bare flag for a default user with no roles. This is the same mechanism as `auth.dev.mockUser`. Dev server only. See [Auth Configuration](/auth-configuration#mock-user-for-testing-dev-server-only).
- `--no-open`: Do not open a new tab in the default browser.
- `--port <port>`: Change the port the server is hosted at. The default is `3000`.
- `--ref-resolver <ref-resolver-function-path>`: Path to a JavaScript file containing a `_ref` resolver function to be used as the app default `_ref` resolver.
- `--watch <paths...>`: A list of paths to files or directories that should be watched for changes. Globs are supported. Specify each path to watch separated by spaces.
- `--watch-ignore <patterns...>`: A list of paths to files or directories that should be ignored by the file watcher. Globs are supported. Specify each path to watch separated by spaces.
- `--skip-codemod-check`: Suppress warnings about pending codemod upgrades.

## emails

The `emails` command previews the [notification](/notifications) emails your app renders, using [React Email](https://react.email/)'s preview server. It builds the app, renders each notification from its `testData`, and opens the preview so you can iterate on templates without sending real mail. It warns when a template renders a data key your `testData` is missing (which would show as an empty section), and errors if the app has no `notifications:` section.

The preview tooling (`react-email`) is installed just-in-time by this command — it is never a dependency of your app or its production server.

- `--config-directory <config-directory>`: Change the config directory. The default is the current working directory.
- `--disable-telemetry`: Disable telemetry.
- `--log-level <level>`: The minimum severity of logs to show in the CLI output. Options are `debug`, `info`, `warn` or `error`. The default is `info`.
- `--port <port>`: Change the port the email preview server is hosted at. The default is `3001`.
- `--ref-resolver <ref-resolver-function-path>`: Path to a JavaScript file containing a `_ref` resolver function to be used as the app default `_ref` resolver.
- `--server-directory <server-directory>`: Change the server directory, the directory in which the production server is placed. The default is `<config-directory>/.lowdefy/server`.

## agent-setup

The `agent-setup` command sets up a project for AI coding agents. It writes `.mcp.json` registering the dev server's [`lowdefy-docs` MCP endpoint](/ai-agent-docs), the Lowdefy Claude Code skills into `.claude/skills/` (`lowdefy-config` plus the 28 `lowdefy-<topic>` skills, see [Skills](/ai-agent-docs)), and a `## Lowdefy` section in `AGENTS.md`. Existing files are merged or skipped, not overwritten.

- `--config-directory <config-directory>`: Change the config directory. The default is the current working directory.
- `--disable-telemetry`: Disable telemetry.
- `--log-level <level>`: The minimum severity of logs to show in the CLI output. Options are `debug`, `info`, `warn` or `error`. The default is `info`.
- `--port <port>`: The port your dev server runs on, used in the generated URLs. The default is `3000`.
- `--project-directory <project-directory>`: The directory where agent files are written. The default is the nearest ancestor directory containing `.git`, falling back to the config directory.
- `--skills <names>`: A comma-separated list of topic skills to install alongside `lowdefy-config`, for example `lowdefy-list-pages,lowdefy-filters`. Use `all` (the default) for the full set or `none` for only `lowdefy-config`. An unknown name is an error listing the available skills.

## init

The `init` command initializes a Lowdefy application in the working directory. It writes a small but complete app rather than a single welcome page, so `lowdefy dev` and `lowdefy test` both have something real to run:

| File | What it is |
| --- | --- |
| `lowdefy.yaml` | The app: a [`collections`](/collections) contract for `items`, a `MongoDBCollection` connection reading `MONGODB_URI` with [`_secret`](/_secret), `auth.dev.users` with one `admin` caller, menus and the page and api refs. |
| `pages/items.yaml` | A [`ListPage`](/archetypes) archetype over the `items` collection, with a filter, a search box and a header slot. |
| `pages/welcome.yaml` | A plain page. |
| `api/add-item.yaml` | An [`Api`](/lowdefy-api) endpoint with a `payloadSchema` that inserts an item. |
| `fixtures/items.yaml` | Three documents a request test can seed. |
| `tests/journeys/items-list.yaml` | A browser [journey](/testing) over the list page. |
| `tests/requests/add-item.test.yaml` | Request tests for the endpoint and the generated list request, seeded from the fixture. |
| `README.md` | How to get a database, and what to change next. |
| `.env` | `MONGODB_URI` pointed at `mongodb://localhost:27017/<app name>` and a generated `BETTER_AUTH_SECRET`. Gitignored. |
| `.env.example` | The same keys, empty, to commit. |
| `.gitignore` | Ignores `.lowdefy/*` and `.env`, keeping the [migration ledgers](/migrations). |

The app name is the working directory's name. A file that already exists is kept, never overwritten; an existing `lowdefy.yaml` stops the command.

`lowdefy dev` needs a MongoDB at the `MONGODB_URI` in `.env` — run one locally (`docker run -d -p 27017:27017 mongo:7`) or point it at a cluster. The request tests do not: a test that names a `fixtures:` file runs against an in-memory MongoDB, which needs `mongodb` and `mongodb-memory-server` installed as dev dependencies.

`init` finishes by running [`agent-setup`](#agent-setup) on the new project, so `.mcp.json`, `AGENTS.md` and the Claude Code skills are in place before the first `lowdefy dev`.

- `--no-agent-setup`: Do not run `agent-setup` on the new project.
- `--disable-telemetry`: Disable telemetry.
- `--log-level <level>`: The minimum severity of logs to show in the CLI output. Options are `debug`, `info`, `warn` or `error`. The default is `info`.
- `--port <port>`: The port the dev server runs on, used in the URLs `agent-setup` generates. The default is `3000`.

## init-docker

The `init-docker` command initializes a Dockerfile in the config directory that can be used to build a Docker image of the Lowdefy app.

- `--config-directory <config-directory>`: Change the config directory. The default is the current working directory.
- `--disable-telemetry`: Disable telemetry.
- `--log-level <level>`: The minimum severity of logs to show in the CLI output. Options are `debug`, `info`, `warn` or `error`. The default is `info`.

## docker-output

The `docker-output` command assembles a minimal production runtime at `.lowdefy/docker` from an already-built app. It traces the server's runtime dependency graph and copies only the files the server actually imports, keeping the Docker image small. Run it after `lowdefy build`; the Dockerfile created by `init-docker` runs it for you.

- `--config-directory <config-directory>`: Change the config directory. The default is the current working directory.
- `--server-directory <server-directory>`: Change the server directory. The default is `.lowdefy/server` in the config directory.
- `--disable-telemetry`: Disable telemetry.
- `--log-level <level>`: The minimum severity of logs to show in the CLI output. Options are `debug`, `info`, `warn` or `error`. The default is `info`.

## modules update

The `modules update` command refetches the GitHub refs of your [modules](/modules) and rewrites `lowdefy-modules.lock.yaml`. It deletes the lock entries you name, runs a Lowdefy build so the build re-resolves each ref to the commit it currently points at, and prints one line per module showing what moved. Pass a module entry `id` to update a single module, or no name to update all of them. The client bundle is not rebuilt.

```
lowdefy modules update
lowdefy modules update team-users
```

Commit the updated `lowdefy-modules.lock.yaml`. See [Locking GitHub module versions](/modules#locking-github-module-versions).

- `--config-directory <config-directory>`: Change the config directory. The default is the current working directory.
- `--disable-telemetry`: Disable telemetry.
- `--log-level <level>`: The minimum severity of logs to show in the CLI output. Options are `debug`, `info`, `warn` or `error`. The default is `info`.
- `--server-directory <server-directory>`: Change the server directory, the directory in which the production server is placed. The default is `<config-directory>/.lowdefy/server`.

## init-vercel

The `init-vercel` command initializes the installation scripts needed to deploy an app on [Vercel](https://vercel.com). It creates a directory called deploy, and a script called vercel.install.sh. It also creates a README file with instructions on how to configure Vercel.

- `--config-directory <config-directory>`: Change the config directory. The default is the current working directory.
- `--disable-telemetry`: Disable telemetry.
- `--log-level <level>`: The minimum severity of logs to show in the CLI output. Options are `debug`, `info`, `warn` or `error`. The default is `info`.

## snapshot

The `snapshot` command captures or checks golden snapshots — a screenshot, the rendered DOM and the page state — of the app's pages as each `auth.dev.users` user, written to `snapshots/<pageId>/<user>/`. It starts the development server headless on a free port, takes every snapshot named in `tests/snapshots.yaml` (or every page for every dev user when there is no manifest), stops the server, and exits with code `1` when `--check` finds drift or a snapshot has never been captured. See [Golden Snapshots](/snapshots).

Exactly one of `--check` and `--update` is required.

- `--check`: Compare against the committed snapshots. Prints one line per differing artefact, writes pixel diffs to `.lowdefy/snapshot-diff/<pageId>/<user>/diff.png` and exits with code `1` on any drift.
- `--update`: Write (or overwrite) the committed snapshots.
- `--config-directory <config-directory>`: Change the config directory. The default is the current working directory.
- `--dev-directory <dev-directory>`: Change the dev directory, the directory in which the development server is placed. The default is `<config-directory>/.lowdefy/dev`.
- `--disable-telemetry`: Disable telemetry.
- `--log-level <level>`: The minimum severity of logs to show in the CLI output. Options are `debug`, `info`, `warn` or `error`. The default is `info`.
- `--pages <pageIds>`: Comma-separated page ids to snapshot.
- `--pixel-tolerance <fraction>`: The fraction of changed pixels above which a screenshot counts as drift. The default is `0.001`.
- `--port <port>`: The port to start the development server on. If it is in use, the next free port is used. The default is `3000`.
- `--ref-resolver <ref-resolver-function-path>`: Path to a JavaScript file containing a `_ref` resolver function to be used as the app default `_ref` resolver.
- `--users <names>`: Comma-separated `auth.dev.users` names to snapshot as.

## init-migrations

The `init-migrations` command sets a project up to run its [migrations](/migrations) per environment in GitHub Actions. For each stage it writes a dry-run workflow (`.github/workflows/migrations-dry-run-<stage>.yml`: on pull requests into the stage's branch, plan the pending migrations and post the plan as a PR comment) and a run workflow (`.github/workflows/migrations-run-<stage>.yml`: on push to the stage's branch or on demand, build, apply the pending migrations, and commit the updated ledger `.lowdefy/migrations/<stage>.json` back to the branch, even when a migration fails), plus an empty ledger per stage and the `.gitignore` lines that let the ledgers be committed while keeping `local.json` ignored. Existing files are never overwritten. The branch for `prod` is `main`; every other stage watches the branch of its own name. Each stage needs a GitHub environment of the same name holding the connection secrets.

- `--config-directory <config-directory>`: Change the config directory. The default is the current working directory.
- `--disable-telemetry`: Disable telemetry.
- `--log-level <level>`: The minimum severity of logs to show in the CLI output. Options are `debug`, `info`, `warn` or `error`. The default is `info`.
- `--stages <names>`: Comma-separated stages to generate workflows for. Each becomes a GitHub environment name and a ledger file. The default is `dev,prod`. `local` is reserved and cannot be a stage.

## migrate

The `migrate` command applies the app's [migrations](/migrations) — the files in the `migrations/` directory — against the live database and records them in the stage's ledger file, `.lowdefy/migrations/<stage>.json`. It resolves the stage (`--stage`, then `STAGE` from the environment, then `local`), reads the ordered build index and the ledger, computes the pending set, prints the stage, the ledger path and the pending ids and confirms (unless `--yes`), names each connection the run touches and the database it resolves to, and applies each pending migration in filename order, rewriting the ledger file as each completes. It stops at the first failing migration, names the migration id, the failing step id and the error, and exits non-zero; migrations that completed are already recorded. Migrations are forward-only — there are no down migrations. See [Migrations](/migrations).

The command takes no connection string of its own: every step's connection is named in config and reads its properties (including secrets) from the environment the command runs in. `STAGE` selects the ledger; the environment's secrets select the database. The build must have been made for the same stage. In CI the workflows written by `init-migrations` run `lowdefy migrate --yes` and commit the ledger before the deploy; a serving preflight refuses to serve a build whose ledger does not record every migration.

- `--allow-checksum-mismatch`: Downgrade a checksum mismatch (an already-applied migration file was edited) from an error to a warning, and rewrite the ledger entry's checksum. For a whitespace- or comment-only edit you know is a no-op.
- `--config-directory <config-directory>`: Change the config directory. The default is the current working directory.
- `--disable-telemetry`: Disable telemetry.
- `--dry-run`: Report which migrations would run, in order, and which connections and databases they touch, with no writes and no ledger changes. No step runs and no step properties are evaluated in a dry run.
- `--json`: Print a machine-readable report and nothing else on stdout, mirroring `lowdefy check --json`.
- `--log-level <level>`: The minimum severity of logs to show in the CLI output. Options are `debug`, `info`, `warn` or `error`. The default is `info`.
- `--server-directory <server-directory>`: Change the server directory. The default is `<config-directory>/.lowdefy/server`.
- `--stage <name>`: The environment whose ledger to read and rewrite. Defaults to `STAGE` from the environment, then `local`.
- `--to <id>`: Apply pending migrations up to and including `<id>`. Omit to apply all pending.
- `--yes`: Skip the confirmation prompt. Required in CI.

## test

The `test` command runs the app's config tests — the journeys in `tests/journeys/*.yaml` and the request tests in `tests/requests/*.test.yaml`. It starts the development server headless on a free port, runs every journey through the dev server's journey route and every request test through its request route, prints `PASS`/`FAIL` per test with the failing step, stops the server, and exits with code `1` if any test failed. Journeys are validated against the same step grammar the dev server runs, so a file with a typo — an unknown top-level key, a step with two keys, a `fill` without a `blockId` — is reported with its file path before a browser is opened. See [Config Tests](/config-tests).

- `--config-directory <config-directory>`: Change the config directory. The default is the current working directory.
- `--coverage`: After the run, report journey coverage and write the page-to-journeys index to `.lowdefy/test/journeyIndex.json`. See [Journey coverage](/config-tests).
- `--dev-directory <dev-directory>`: Change the dev directory, the directory in which the development server is placed. The default is `<config-directory>/.lowdefy/dev`.
- `--disable-telemetry`: Disable telemetry.
- `--filter <name>`: Only run journeys and request tests whose `name` contains this string (case-insensitive). Exits with code `1` if nothing matches.
- `--log-level <level>`: The minimum severity of logs to show in the CLI output. Options are `debug`, `info`, `warn` or `error`. The default is `info`.
- `--port <port>`: The port to start the development server on. If it is in use, the next free port is used. The default is `3000`.
- `--ref-resolver <ref-resolver-function-path>`: Path to a JavaScript file containing a `_ref` resolver function to be used as the app default `_ref` resolver.
- `--url <url>`: Run the tests against an already running development server (for example `--url http://localhost:3000` while `lowdefy dev` is running) instead of starting one.

## upgrade

The `upgrade` command upgrades a Lowdefy app to a newer version by walking you through migration prompts that handle breaking changes.

It fetches the latest `@lowdefy/codemods` package, resolves the version chain from your current version to the target, and presents migration prompts phase by phase.

```
pnpx lowdefy@5 upgrade
pnpx lowdefy@5 upgrade --to 6.0.0
```

- `--to <version>`: Target version to upgrade to. Defaults to the latest stable release.
- `--plan`: Show the upgrade plan without executing.
- `--resume`: Resume a previously interrupted upgrade.
- `--config-directory <config-directory>`: Change the config directory. The default is the current working directory.
- `--log-level <level>`: The minimum severity of logs to show in the CLI output. Options are `debug`, `info`, `warn` or `error`. The default is `info`.

### How it works

1. Reads your current version from `lowdefy.yaml`.
2. Queries npm for the latest stable Lowdefy version (or uses `--to`).
3. Fetches `@lowdefy/codemods@latest` — the codemods package containing all migration prompts.
4. Resolves the upgrade chain — which intermediate versions need codemods.
5. Presents migration prompts phase by phase. Each prompt can be copied to clipboard for use with any AI coding tool, viewed as a manual guide, or skipped for later.
6. Updates `lowdefy.yaml` after each phase and suggests a git commit.

See the [Upgrade Guide](/upgrade-guide) for more detail on how the upgrade system works.

## start

The `start` command starts a Lowdefy production server. To start a Lowdefy server, tha app should first be built using the `build` command.

- `--config-directory <config-directory>`: Change the config directory. The default is the current working directory.
- `--disable-telemetry`: Disable telemetry.
- `--log-level <level>`: The minimum severity of logs to show in the CLI output. Options are `debug`, `info`, `warn` or `error`. The default is `info`.
- `--port <port>`: Change the port the server is hosted at. The default is `3000`.
- `--server-directory <server-directory>`: Change the server directory, the directory in which the production server is placed. The default is `<config-directory>/.lowdefy/server`.


#### Examples


Run the dev server, watching a relative directory for file changes:
```txt
pnpx lowdefy@5 dev --watch ../other-project
```

Run the dev server, ignoring the public directory:
```txt
pnpx lowdefy@5 dev --watch-ignore public/**
```



# Module Fetching

When your app uses [modules](/modules), the build automatically fetches module sources during the build phase. GitHub modules are downloaded as tarballs and cached in `.lowdefy/modules/`. Multiple module entries from the same monorepo share a single cache entry. Local `file:` sources are read directly from disk.

For private GitHub repositories, set the `GITHUB_TOKEN` environment variable:

```
GITHUB_TOKEN=ghp_your_token_here
```

The CLI also checks for `gh` CLI credentials and git credential helpers as fallbacks.

In development mode (`lowdefy dev`), local module sources (`file:` paths) are watched for changes and trigger rebuilds automatically.

# Configuration

All the CLI options can either be set as command line options, or the `cli` config object in your `lowdefy.yaml` file. Options set as command line options take precedence over options set in the `lowdefy.yaml` file. The config in the `lowdefy.yaml` cannot be referenced using the `_ref` operator, but need to be set in the file itself.

Options set in the `lowdefy.yaml` should be defined in camelCase. The options that can be set are:
- `devDirectory: string`: Change the dev directory, the directory in which the development server is placed. The default is `<config-directory>/.lowdefy/dev`.
- `disableTelemetry: boolean`: Disable telemetry.
- `logLevel: enum`: The minimum severity of logs to show in the CLI output. Options are `debug`, `info`, `warn` or `error`. The default is `info`.
- `noOpen`: Do not open a new tab in the default browser.
- `port: number`: Change the port the server is hosted at. The default is `3000`.
- `refResolver: string`: Path to a JavaScript file containing a `_ref` resolver function to be used as the app default `_ref` resolver.
- `serverDirectory: string`: Change the server directory, the directory in which the production server is placed. The default is `<config-directory>/.lowdefy/server`.
- `watch: string[]`: A list of paths to files or directories that should be watched for changes.
- `watchIgnore: string[]`: A list of paths to files or directories that should be ignored by the file watcher. Globs are supported.
- `skipCodemodCheck: boolean`: Suppress warnings about pending codemod upgrades during build and dev.

The `--config-directory` option cannot be set from the `lowdefy.yaml` file.

# Telemetry

The CLI collects usage and error information to help us fix bugs, prioritize features, and understand how Lowdefy is being used.

All telemetry can be disabled by setting the `disableTelemetry` flag in `cli` config object in your `lowdefy.yaml` file (this cannot be a reference to another file), or by using the `--disable-telemetry` command line flag.:

###### `lowdefy.yaml`
```yaml
lowdefy: LOWDEFY_VERSION

cli:
  disableTelemetry: true
```

We collect the following information:

- The CLI version.
- The Lowdefy version of your app.
- A random local app id (stored locally in your project folder at `.lowdefy/cli.json`).
- The CLI command used.
- Your IP address.
- Error messages and stack traces for any errors.
