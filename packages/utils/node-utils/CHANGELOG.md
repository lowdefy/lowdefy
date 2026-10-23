# Change Log

## 7.1.0

### Patch Changes

- @lowdefy/errors@7.1.0
- @lowdefy/helpers@7.1.0

## 7.0.0

### Minor Changes

- 14c4764: Coding agents now get their Lowdefy tools from `lowdefy mcp`, a stdio MCP server the agent client starts itself, instead of a dev server URL with a port in it. One checked-in `.mcp.json` entry works in every git worktree, the tools are there from the first moment of a session whether or not a dev server is running, and each call reaches the dev server of the app and worktree the agent is working in — pass `directory` when a repository holds several apps or a subagent works in another worktree. Every result starts with the app and checkout it came from.

  `lowdefy mcp` acts only on apps in the checkout the agent session started in and in the git worktrees of that repository. A `directory` anywhere else is refused with a message naming the session's checkout; when the agent client supports MCP elicitation, `lowdefy mcp` asks you first instead, and your answer holds for the session.

  Agents no longer run `lowdefy dev`, pick ports or kill processes. `lowdefy mcp` starts dev servers through the Lowdefy hub, a small per-user background process whose socket only your user can read and write: it gives each app its own port (4100 and up, kept across restarts), runs the app's own dev script so wrappers such as a secrets manager still apply, reports when the server is ready, and restarts it fully (clearing local plugin code) with `lowdefy_dev_start({ restart: true })`. It only ever stops servers it started — a `lowdefy dev` you run in a terminal is used by agents but never stopped by them. New tools: `lowdefy_dev_start`, `lowdefy_dev_stop`, `lowdefy_dev_status`, `lowdefy_dev_logs` (at most 1000 lines), `lowdefy_dev_list`; new commands: `lowdefy mcp`, `lowdefy hub status|start|stop|logs`. When several `package.json` scripts run `lowdefy dev`, set `cli.devScript` in `lowdefy.yaml` to the one the hub should use.

  The hub keeps few servers running, even when agents hand work to helper agents:

  - **Idle by last use.** The hub stops a server it started once nobody has used it for 15 minutes (any request through its port, or a build; status polls and long-lived event streams do not count) and no browser tab has it open, or once its worktree is removed. A stopped server starts again on the next `lowdefy_` call.
  - **Memory pressure.** When the operating system reports memory pressure (macOS and Linux), the idle limit drops to 5 minutes, or 2 at critical pressure, and a start that would take the hub past four servers first stops the idle ones.
  - **Start slots.** At most two dev servers launch at once across the machine (one at critical pressure); the rest queue in order. A start still queued after two minutes answers `queued` with its place, and calling `lowdefy_dev_start` again keeps it.
  - **Browser slots.** At most three headless browser operations (journeys, screenshots, state inspections, operator evaluations, state loads) run at once across the machine, whichever way they were called.
  - **Agents are told.** The `lowdefy mcp` instructions, and the AGENTS.md and skill that `lowdefy agent-setup` writes, tell an agent to stop the dev server of a git worktree it created when it finishes there, and that a server left running stops after 15 idle minutes.

  Rerun `lowdefy agent-setup` to switch a project over: it replaces the `lowdefy-docs` entry (`http://localhost:<port>/lowdefy-docs/mcp`) and other per-port entries such as `lowdefy-3010` in `.mcp.json` with one `lowdefy` server, and updates the skill and `AGENTS.md` section it wrote before. The `--port` option of `agent-setup` is gone; nothing it writes names a port any more.

  `lowdefy dev` changes:

  - A running dev server records itself in `.lowdefy/instance.json`. A second `lowdefy dev` for the same app exits before it touches `.lowdefy/dev`. A record copied into another git worktree, or left by a killed dev server whose process id has been reused, is ignored. `lowdefy test` runs against an already running dev server.
  - A port you set — `--port`, `PORT` or `cli.port` — is used or the command fails. It no longer moves to the next free port and hands you a server on a port you did not expect; only the default port 3000 still does.
  - `/lowdefy-docs/*` and `/api/dev-inspect/*` refuse requests a browser makes on behalf of another website, so a page you visit can no longer drive the dev tools (run requests and endpoints, load state checkpoints) on your machine. Agents, curl and the dev app's own pages are unaffected.

  Also fixed: CLI error reports were sent to Lowdefy even with `--disable-telemetry` or `cli.disableTelemetry` set. They now respect the opt-out.

- cad92af: feat: The server matches page paths to pages

  - `matchPagePath({ routes, path })` (exported by `@lowdefy/node-utils`, so the journey tools match paths the way the server does) matches a request path to `{ pageId, pathParams }` against the route table. A fixed segment beats a placeholder at the first position where patterns differ; fixed segments match case-sensitively; each segment is decoded once; an empty segment (other than one trailing `/`), an undecodable segment and a `.` or `..` segment match no page.
  - `getPageConfig` takes the request `path` instead of the page id, loads the matched page and returns its `pageId` and `pathParams` with the status. An unmatched path answers as an unknown page id did.
  - `getRootConfig` returns `pagePaths`, the path of every page with one that the caller may open.
  - Dynamic block endpoints receive `pathParams` in their payload next to `urlQuery`.
  - A same-origin navigation URL in Dynamic content is checked on the page its path matches.

- 24383b5: Add `lowdefy test`, which runs an app's config tests: the journeys committed in `tests/journeys/*.yaml`. Each journey names a page, an optional inline user object and a list of declarative steps (`click`, `fill`, `select`, `press`, `wait`, `screenshot`, `expect`). The command boots the development server headless on a free port (or targets a running one with `--url`), runs every journey through `POST /lowdefy-docs/journey`, prints `PASS`/`FAIL` per journey with the failing step's index, `expected` and `actual`, and exits `1` when any journey fails. `--filter <name>` narrows the run. Journey files are validated against a schema; an invalid file is reported as a failed journey without aborting the run.

  - **Journeys fail at the step that causes an app error**: an action that fails with an error that is not a user error, an uncaught exception or an error the page reports, a request or endpoint that throws on the server, or a 5xx from one. Errors raised while the first page opens (its `onInit` and `onMount` requests) fail the journey on open. `lowdefy test` prints the step and each error's kind, message and config file and line; the journey route's result carries them as `failure.errors`, each with a stable finding key. Only errors a journey's own browsers cause count, and they are reported in its result, not in the dev server's build status or event stream. Expected outcomes never fail a journey: a failed `Validate`, a `Throw` action or any other user error, and 401 or 403 refusals. Where an error is the outcome the app means, assert it with `expect: { error: <text> }` straight after the interaction that raises it: it claims that interaction's errors whose message contains the text, and fails when none does.
  - **Every reference is checked before its step runs.** A blockId, request, endpoint or `goto` page the step names that is not in the app's build, or an `as` name that is not a data set user, fails the step naming the unknown id.
  - **`wait: { request }` waits for a fresh call**: one started since the last interaction (or since the page opened, before the first). `wait: 3000` is shorthand for `wait: { ms: 3000 }`.
  - **The step grammar is a JSON schema**: `GET /lowdefy-docs/schema/journey-step/all` returns every step and `/lowdefy-docs/schema/journey-step/wait` one step, the `lowdefy_get_schema` MCP tool takes `kind: "journey-step"`, and `@lowdefy/node-utils` exports it as `journeyStepSchema`.

- f9e483f: feat: The dev server records journeys

  `lowdefy dev` now records how you use your app in the browser, locally, so an agent can turn what you tried into journeys. Recordings stay in `.lowdefy/traces/` on your machine, are kept for 7 days or 200 MB, and never include password fields. Set `LOWDEFY_DEV_RECORD=false` to turn recording off. `lowdefy agent-setup` now also installs a `journeys-from-dev` skill.

- 4cc0f36: feat: Journeys run on named data sets

  Journeys can run on named data sets. Declare one in `tests/data/<name>.yaml` with committed fixtures and named users. A journey with `data:` runs against a fresh in-memory MongoDB database of its own, on the running dev server, and your own browser tabs keep using your real database. `user:` and `as:` can name a data set user.

  Under a data set no request reaches your real data: every connection reads the run's database, is sunk, or fails the journey. Connection plugins gain a `meta.dataSet` declaration:

  - `'redirect'`: the run's database URI and name are merged in (core `MongoDBCollection`).
  - `'walled'`: a type that holds no database URI and reaches MongoDB only through the walled client (`walled(connectionId)` with `getWalledCollection` from `@lowdefy/connection-mongodb/walled`) passes unchanged, and the walled connections it names take the run's database.
  - `'external'`: an outside service (core `AxiosHttp`, `SendGridMail`, `SMTP`, `Stripe`, the AI providers, `Mcp`, `TregConnection`, `AwsS3Bucket`, `AzureBlobContainer` and `GoogleCloudStorageBucket`). Its requests are still validated and checked, then recorded and answered with `null`, never sent. The run's result lists them as `sunk`, with the connection, request and evaluated request properties (secrets scrubbed). Mail sent to the dev server's mail capture still reaches it, so the `email` step works. A request resolver can declare `meta.dataSet: 'external'` itself, so a connection that holds database access sinks only that request type and runs the rest against the run's database.

  A connection whose type declares nothing, such as `Knex`, `Redis`, `Elasticsearch` or `GoogleSheet`, or a redirected connection whose whole `properties` is an operator, fails the journey with an error naming the connection. A data set journey's browser that reaches the dev server on another host fails the step instead of reading your real database. The in-memory store binds a free port from 49152 up, stops with its files removed when the dev server stops, and is replaced after its `mongod` dies.

- ef64856: feat: Seeded `generate` for journey data sets

  A journey data set can generate documents from a small spec beside its fixtures, the same on every machine:

  ```yaml
  generate:
    seed: 7
    invoices_db:
      count: 400
      fields:
        _id: { sequence: { prefix: inv-, start: 1 } }
        status: { oneOf: [draft, sent, paid], weights: [1, 2, 5] }
        amount: { number: { min: 10, max: 5000, decimals: 2 } }
        issued: { date: { from: 2026-01-01, to: 2026-09-30 } }
        customerId: { ref: customers_db }
  ```

  Field kinds are a literal, `oneOf` with optional weights, `number`, `date`, `text`, `name`, `email` (at reserved example domains), `company`, `sequence` and `ref` (an `_id` from another connection's fixtures or generated documents). A generated `_id` that a fixture or another connection naming the same collection also holds is refused. A connection that loads more than 1,000 documents gets a warning, never a refusal. `lowdefy test`, `lowdefy data list` and the `lowdefy_run_journey` result report the documents a data set loads. The format is in the dev server's docs endpoint, so a coding agent can write a generator from a short description.

- cb0acad: feat: Journey data set files and `lowdefy data list`

  Declare a journey data set in `tests/data/<name>.yaml`: committed `fixtures` keyed by connection id, named `users` (injected callers, no credentials), optional `indexes` in the `listIndexes()` shape, and an optional seeded `generate` block for background documents. Everything a data set loads is committed, so it is the same on every machine. `lowdefy data list` prints each data set with the documents it loads and the users it names.

  A data set can extend others with a top-level `extends: [<data set name>, ...]`. The named data sets' fixtures, indexes and users load first, in the order listed, then the file's own. A later fixture with an `_id`, an index with the same `key` or a user of the same name replaces the earlier one. `generate` stays per file: only the named data set's own `generate` runs, and its refs and `_id` checks see the extended fixtures. A set reached twice loads once, and a cycle or an undeclared name is refused.

  Journeys accept `data: <name>` and a data set user name as `user:`, and `lowdefy test` prints the data set a run used once, with its document count.

- 9a92898: feat: `expect: { effect: true }` checks that the interaction before it did something

  A journey step `expect: { effect: true }` fails when the click, open, fill, select, press or back just before it ran no event, changed nothing on the page, called no request or endpoint and left the URL as it was. It must directly follow one of those steps, and `true` is its only value. Put it after a click on a control that should do something, so the journey fails while the control does nothing.

- 0205b5a: The journey grammar accepts `from: recorded | shape`; the runner refuses placeholder values.

  `fill`, `select` and `expect.state` take an optional `from`. `from: recorded` marks a value observed in a recorded trace; the step runs as usual. `from: shape` marks a placeholder, `value: null`, that a trace could not hold (a value typed in production, or a password the dev recorder did not keep). The dev server's journey runner and `lowdefy test` refuse a journey holding one before a browser opens, naming the step: fill it from a data set or the journey's user, then remove `from`. A `fill` or `select` with `value: null` and no `from: shape` is a grammar error.

  The step grammar lives in `@lowdefy/node-utils` and `lowdefy test` checks it before starting a dev server, so a malformed step, or an unknown key on any step or target, is reported as an invalid journey file with its step number. `lowdefy test` also accepts the `open` step.

- 316f5be: feat: Journeys can assert that something is hidden (`expect.hidden`), that a request was sent a given number of times (`expect.calls`), and can double-click (`click.count`)

  - `expect: { hidden: <target> }` passes once nothing the target names is visible.
  - `expect: { calls: { request, pageId, count } }` (or `{ endpoint, count }`) compares, once the page settles, how many times this person's browser called the request or endpoint since the journey started. Counts survive full page loads.
  - `click: { ...target, count: 2 }` clicks twice in quick succession, as a person's double click.

- f9d8520: feat(journeys): journeys record and replay pages with path parameters

  A journey names a visit as a page and its values, never as a raw path. The dev recorder writes each pageview with the page id and `path_params` the server matched to the path, so moving between two records of one patterned page is two visits. A journey that enters on a patterned page carries `pathParams` next to `urlQuery`, the `goto` step takes `pathParams` (an object of strings, one per placeholder), and dev replay builds every URL from the page's path pattern, refusing a journey whose path is missing a value. `lowdefy journeys pull` reads the page from `lowdefy_page_id` and its values from `lowdefy_path_params`, never from the URL path; an event that names no page is dropped as `no_page`. The journey sequence reads the page an `expect.url` path landed on by matching it against the build's route table, so the steps after a navigation by click count on the page they ran on, in recorded segments and committed journeys alike. Journey files, `lowdefy test` and variants carry `pathParams` where they carry `urlQuery`.

- e5b2f83: feat: A journey runs once per user in a `user` list

  A journey's `user` can be a list of data set user names, such as `user: [admin, member]`, on a journey with `data:`. `lowdefy test` and the `lowdefy_run_tests` MCP tool run the journey once as each user, each in a fresh database, and report each run on its own line as `<name> [<user>]`. `--filter` matches that name (`--filter "[member]"` runs one user's run), recordings and coverage see each run apart, and `--repeat` repeats each run. `as:` steps are unchanged: the first actor is the run's user.

  - A list holds distinct data set user names only and needs `data:`; `none` and inline user objects stay single values. Anything else is refused as an invalid journey file before a server starts.
  - `lowdefy test --lint` reads such a journey once, and L5 checks every listed name against the data set.
  - `lowdefy_run_journey` takes the same list and returns `{ passed, runs: [{ user, ... }] }`. `POST /lowdefy-docs/journey` still runs one user per call and refuses a list with a 400.
  - `lowdefy journeys variants` skips the role sets a journey's listed users already have, and a granted role variant's first comment names the user list to set on the original journey. The `journeys-harden` skill keeps a passing granted role variant by adding its user to that list and deleting the variant file, rather than committing a copy of the journey. A refused role stays a journey of its own.

- da76905: `lowdefy test` and the `lowdefy_run_tests` agent tool can run all journeys, a folder or glob of them, or a tagged section.

  - A plain `lowdefy test` reads every sub-folder of `tests/journeys/`. Folders whose name starts with `_`, such as `_candidates/`, are skipped.
  - Paths may be globs, which the CLI expands itself: `lowdefy test 'tests/journeys/review/**'`. They also work in npm scripts on Windows and in the tool's `paths`. A glob that matches nothing is refused, like a missing path.
  - Journeys take an optional `tags` list, such as `tags: [smoke, review]`, and `lowdefy test --tag smoke --tag review` runs the journeys that carry any of the given tags. `--filter` can be repeated in the same way. Paths, tags and filters combine. The tool takes `tags`, and `filter` as a string or a list.
  - When nothing matches, the message names the paths, tags and filters that were given.

- 1766343: feat: One recorded trace format, and the functions that read it

  A recorded trace is a JSONL file of interactions (a click, a change, a key press, on which block) joined to what the app did in response, in one record format (version 1) shared by every recorder.

  `@lowdefy/node-utils` exports the record reader (`parseTraceLines`), the record validator (`validateTraceRecord`), `compileSegments`, which cuts records into the segments and sequences that journey evidence and coverage read, and the journey identity functions (`journeySequence`, `stepIdentity`). `@lowdefy/helpers` exports `pairTraceEvents`, the rule that decides which DOM interaction caused which engine event, and `isMountEventName`. The dev server's `GET /lowdefy-docs/build-status` reports a top-level `buildId`, the build it serves now.

- 9ed1386: feat: The coding agent explores pull requests, with `lowdefy journeys scope` to say what a change touched

  - `lowdefy journeys scope [--base <ref>] [--json]` prints what a change touched: each page the change reached, including pages from modules, why (its own config, a request, an endpoint, a connection, a websocket, an app-wide artifact, or a `_ref`'d file), the blocks added, changed or removed, and who can open the page, with the data set users under `tests/data/` that it admits. It builds the merge base and the working tree with the installed dev server's builder, installing it into `.lowdefy/dev` when none is installed, and needs no running dev server. Without `--base` it lists every page.
  - `lowdefy agent-setup` installs a `journeys-from-pr` skill that has the coding agent explore a pull request itself. For each changed page and role, it looks at the page, writes a journey for every path a user can take, and proves each one with `lowdefy test --repeat 3`. Journeys that pass join the suite. A journey that fails is reported as a finding, with that journey. Given a goal sentence instead, the same skill runs a bug bash.
  - A journey's `name` is at most 100 characters, checked as authored (before a `[user]` suffix). An optional `description`, at most 60 words, states the journey's goal.
  - On a journey with a data set, a click on a block whose events reach a connection the data set cannot run (a type that declares no `meta.dataSet`, a connection with no artifact, or an `external` type with no request types to sink) fails at that step, naming the block and the connection's declaration: `Block "export" reaches connection "reports_db" (Knex, no dataSet declaration), which a data set cannot redirect, so a data-set journey cannot click it.` A click that runs an auth action (`Login`, `Logout`, `SetActiveOrganization`, `UpdateSession` and the rest) fails the step, naming the block and the action, when the action executes; one the click skips (a failed `Validate`, a true `skip:`) passes.

- 73c5e14: feat: `lowdefy journeys pull posthog` brings production analytics into local journey traces; `journeys evidence` and `journeys coverage` report how much real use backs each journey and what no journey covers yet.

  - `lowdefy journeys pull posthog [--since 30d | --from --to]` reads the app's PostHog project over the HogQL query API with your own personal API key (`POSTHOG_PROJECT_ID`, `POSTHOG_API_HOST`, `POSTHOG_PERSONAL_API_KEY` with the Query Read scope) and writes one day of interaction traces per file to `.lowdefy/traces/production/`. A window is at most 30 days. Final days are fetched once, today and yesterday again on every run, and files older than 400 days are removed. Person and organisation ids are hashed, and each clicked element's text is stored as a token (`target.text_token`), never as text, both with a salt that never leaves your machine; typed values, URL query values and element chains are never stored. Options: `--environment`, `--include-test-accounts`, `--org-property`, `--roles-property`, `--page-size`, `--max-rows` and `--refetch`.
  - Coverage and evidence turn a token back into text only when it is text from the app's config (the built pages, menus, i18n messages, block plugins' default messages and antd's locale strings, collected with one build by the installed dev server and cached until the config changes). A click on any other text (a customer's name in a grid cell) is read as its block, row and column with a `tokenised-text` flag, and a journey clicking a data value is backed exactly as one with no text. A day pulled under another salt, or with different filters (project, `--environment`, `--include-test-accounts`), is not mixed in: coverage and evidence name the days and the `--refetch` pull that makes them one set.
  - `lowdefy journeys evidence [--refresh]` counts, for each journey in `tests/journeys/`, the production sessions that did what it does, with people, organisations and failures. `--refresh` writes them into the journey's `evidence` key and changes nothing else in the file, and a hardening run's `.lowdefy/test/mutation.json` adds `evidence.mutation`. Journeys nothing backs are listed beside their mutation numbers and never removed.
  - `lowdefy journeys coverage --source production [--json]` reports interaction, flow, failure, frustration and role coverage, each with what is uncovered ranked by use, and writes them with a production profile to `.lowdefy/test/coverage.json`, which lists per block the clicks, distinct tokens and most-clicked tokens. Journeys with `deprecated: true` are left out of every measure. Sessions are grouped into flows only when the window holds 100,000 production rows or more; below that the summary points to the session logs (`--group` and `--no-group` force either way).
  - `lowdefy journeys session --source production` lists the pulled production sessions (`--since`, `--from`, `--to`, at most 30 days) and prints any one as a log, as dev sessions print: the controls used and what the app did, without typed values, and with clicked text only when it is config text.
  - With a recorded full test run, `journeys coverage` reports the interaction share that run drove beside the static one, and counts a failure as covered only when a journey that passed produced it (`failure.mode: measured`); without one it reports failures as reached. `lowdefy test` and `lowdefy_run_tests` keep which journeys passed in a recorded run in `.lowdefy/test/run.json`.
  - `lowdefy agent-setup` installs a `journeys-from-production` skill that runs the loop with you: it picks the window, pulls, reads each recorded routine with the app's config and code, takes one uncovered failure or flow at a time into a journey proven by three runs, then refreshes evidence. Running `lowdefy journeys usage --json` before and after the refresh, it reports the deprecated flows users still follow, the journeys whose tier changed and those still unranked. It commits nothing, never deletes a journey, and never reads production text or credentials or queries PostHog directly.
  - Journey files accept a strictly validated `evidence` key, and `lowdefy test` (and the `lowdefy_run_tests` MCP tool) print it after each passing journey: `412 sessions · 9 orgs · 11/12 mutants`.

  `@lowdefy/node-utils` exports `isBackedBy`, the one rule for whether a recorded segment did what a journey does, `profileProduction`, `listFailurePaths` and `failurePathKey`. `compileSegments` segments also carry their entry page, pages, failure path and frustrated clicks.

- c3e0d79: feat(cli): `lowdefy journeys session` prints a recorded dev session as a log to write journeys from

  `lowdefy journeys session` lists the sessions the development server recorded, newest first, with each one's id, time span, pages, interactions and failures. `lowdefy journeys session <id>` prints that session as a log, one line per interaction with what the app did in response, such as `click save → Validate failed [priority]` and `click save → ran Validate, request createTicket ok`, with a `page <pageId>` line per page view. A failed attempt and its retry both show, typed values and generated ids show as recorded, and nothing is turned into an assertion. Agents connected to the development server read the same list and logs with the new `lowdefy_journey_session` tool.

  The development recorder records which actions an event ran and which API endpoints its `CallAPI` actions called, so a log can say `endpoint syncInvoices ok`.

- 959ec32: feat: The `_credential` operator keeps a runtime-made credential out of the server logs

  The log scrub only knew the secrets the server holds, so a value a routine made at runtime, such as a new API key or a secret derived with `_hmac`, printed in plain text at debug level in every `:set_state`, `:return`, step result and error `received` that held it. Wrap the value in `_credential` where it is made: it is returned unchanged, so the routine and its caller still get it, and every log line for the rest of that request shows `[REDACTED]` in its place, on the production and development servers alike. Marked values are also scrubbed from the request's Sentry events, and an endpoint run through a `CallApi` step with `detached: true` keeps the marks its dispatcher made. The development server still logs `_secret` values in full.

- ae3541c: feat: Lowdefy servers stop when whatever started them stops

  A Lowdefy server started by a test runner, a script or a coding agent's command could outlive it when that process was killed or timed out, and keep holding a few hundred megabytes of memory for days. Servers now stop with their owner, however it ends.

  - **`lowdefy start`, `lowdefy dev` and `lowdefy test`** start the server with node directly (no `pnpm run start` in between), forward SIGINT, SIGTERM and SIGHUP to it, and hold its stdin, so the server stops even when the CLI is killed outright. The dev server's Vite process stops when the dev manager is killed. A server run directly with `node`, as in a Docker image or on Vercel, behaves as before.
  - **`--exit-with-pid <pid>`** on `lowdefy start` and `lowdefy dev`, or the `LOWDEFY_EXIT_WITH_PID` environment variable, stops the server when that process exits. The variable passes through wrappers such as `pnpm exec`, `npx` or a secrets manager.
  - **Test tools set it for you.** The Playwright configs from `@lowdefy/e2e-utils` and `@lowdefy/block-dev-e2e` tie the server to the Playwright run, so a killed or timed-out run leaves no server behind.
  - **`startServer`** from `@lowdefy/e2e-utils/startServer` builds and starts an app's e2e server for other test runners (a vitest or Jest `globalSetup`) and scripts, tied to the calling process, and returns `stop()`.
  - **`@lowdefy/e2e-utils` no longer reuses a running server by default.** A server left on the port would serve an old build to new tests. Set `LOWDEFY_E2E_REUSE_SERVER=true` to reuse one (for example after `pnpm e2e:server`), and `LOWDEFY_E2E_PORT` to move a run to another port.
  - **`lowdefy hub ps`** lists the Lowdefy servers running on the machine and the process that owns each. **`lowdefy hub prune`** lists the servers whose owner is gone, and `--kill` stops them. It also finds servers kept running by a `lowdefy` CLI whose own starter was killed (such as a `pnpm exec` wrapper killed outright) and servers left running by older Lowdefy versions (including a dev server's Vite process left behind by a killed dev server), and never stops a server whose owner is alive and still has its own starter, or one run as a launchd or systemd service. Servers record themselves in `~/.lowdefy/servers` (moved by `LOWDEFY_HOME`), and the hub prunes servers whose owner is gone each time it starts. On Windows, servers are identified by their process creation time, so `prune` works there for servers that record themselves.

- 99c9dac: feat: `lowdefy build` and `lowdefy dev` build again to run newly installed plugins' rules, and `--skip-plugin-checks` skips plugin rules for one run

  - When a build uses a plugin that is not installed yet, its build check rules cannot run. `lowdefy build` and `lowdefy dev` now install the plugin and run the Lowdefy build once more, so its rules run on a fresh checkout or CI run. The second build runs only when a newly installed plugin owns a block, action or operator type or ships `./checks`. The Vite client build still runs once.
  - An unknown `~ignoreBuildChecks` slug is a warning while some plugin's rules are not installed, and an error once every rule is known.
  - `--skip-plugin-checks` on `lowdefy build`, `lowdefy dev` and `lowdefy journeys scope` skips every plugin build check rule for that run, and each build logs a warning that they were skipped. No second build runs for newly installed plugins. Built-in build checks still run. Use it while a fix ships for a plugin rule that is wrong or too strict.

- 7623c86: The server resolves each request's client address itself, and a new `config.trustedProxies` setting names the proxies it believes.

  - Auth rate limits (sign-in and sign-up: 3 attempts per 10 seconds per address), the session's recorded address and the captcha check use the address the server resolved, not the `X-Forwarded-For` header a client sent. A self-hosted server takes the address from the connection. Behind a reverse proxy, load balancer or ingress, every connection comes from the proxy, so list its addresses or CIDR ranges in `config.trustedProxies`; the server then reads `X-Forwarded-For` from the right, skips trusted hops and takes the first untrusted address. Without it every client shares the proxy's rate limits. The server logs a warning the first time a request carries `X-Forwarded-For` while `trustedProxies` is not set.
  - On Vercel the function entry `lowdefy vercel-output` writes takes the address from `x-real-ip`, which the platform sets on every request.
  - The production request and error logs record the resolved address as `client_address`.
  - `lowdefy build` fails when a `config.trustedProxies` entry is not an IP address or CIDR range.
  - In `lowdefy test` journeys, each actor keeps its own client address.

### Patch Changes

- ebf95f8: fix(server-dev): Cheaper rebuilds and restarts in the dev server

  - **Restarts no longer fail with "Port in use".** A restart now waits for the old server process to exit before it starts the new one (up to 10 s, then a forced stop and up to 5 s more), so the new process never finds the port still taken and the server no longer stays down until the next restart.
  - **No more endless rebuild loop.** An app whose own local plugin package is its config directory (its plugin lives next to `lowdefy.yaml`) rebuilt itself every few seconds when its ref resolvers wrote into `public/`. The local plugin watcher now reacts only to code files (`.js`, `.mjs`, `.cjs`, `.jsx`, `.ts`, `.tsx`, `.json`) and ignores `public/`, `node_modules` and the build directories. YAML and Markdown edits stay with the config watcher, so a page edit no longer runs a full build as well.
  - **Page builds no longer rewrite the whole key maps.** Every page the dev server built rewrote `keyMap.json` and `refMap.json` twice, and the files only grew (tens of MB on large apps, with a full parse after each edit). They now hold only what the config build wrote; each page build writes the keys it added to a small file under `build/jitMaps/`. Error locations, `/lowdefy-docs/find` and the file watcher read those files. A key from a page built before the last two page edits may resolve without a location.
  - **Unchanged build files are left alone.** After a config build, artifacts whose bytes did not change are no longer replaced, so Vite does not reload modules that did not change.
  - **Agents restart less.** The MCP tools and agent guidance now say to restart the dev server only when it seems stuck or build status looks stale, or after secrets a wrapper injects have changed. `.env` edits and local plugin code are picked up without a restart.

- c744e40: fix(cli): Generated servers install as their own pnpm workspace inside a parent workspace

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

- ba86509: feat(cli): Journey production evidence builds up by calendar month

  A journey's `evidence.production` holds one entry per UTC calendar month (`month`, `days`, `sessions`, `persons`, `orgs`, `failures`), so counts build up across pulls and machines without double counting:

  - `lowdefy journeys evidence --refresh` reads every final day of the production cache, gaps included. Today and yesterday count once a later pull marks them final. A routine refresh reads only the current month.
  - A month is rewritten only when the cache holds more final days of it than the committed entry. Refreshing twice changes nothing, a fuller pull from a colleague wins, and a cache that never held a month, or pruned it, leaves that month as committed.
  - A session counts in the month it started, once, even when it crosses midnight. A month read with no backing session is written with `sessions: 0`.
  - A renamed click label keeps its history: clicks resolve to any click text a committed flow already holds.

  Each journey's production evidence also records the flow it was counted for (`sequence`, `pageId` and `flow`). When an edit changes what the journey matches in production (a click's text or block, the step order, a `goto`, or an `expect.url` path that moves later steps), the next refresh moves the counted months to a `deprecated` flow and counts the new flow from the cache. A deprecated flow is never run and is still counted on every refresh, so you can see whether users keep following the old way. Undoing the edit makes it live again. Waits, other expectations, typed values, rows and `nth` do not change the flow. A journey's sequence id and flow read click text by the config text rule used to match production, so a click on a data value is the same flow as a click with no text.

  A journey file accepts `deprecated: true` at its top level, for a flow being retired from the app. Refresh keeps counting it.

  The list of journeys with no production backing reads the last 3 calendar months.

- 31911e7: fix: On Windows, `lowdefy dev` skips ports Windows will not bind

  On Windows, ports in an excluded range (reserved by Hyper-V, WSL or Docker) refuse to bind with `EACCES`. The port check threw on that error, so `lowdefy dev` failed to start when its port or the internal port after it fell in such a range. A port that cannot be bound now counts as taken, and the next free one is used.

- Updated dependencies [f7fa621]
- Updated dependencies [099d412]
- Updated dependencies [4d08b55]
- Updated dependencies [6144814]
- Updated dependencies [db1a4d3]
- Updated dependencies [04077d9]
- Updated dependencies [d42f420]
- Updated dependencies [ebf95f8]
- Updated dependencies [2595439]
- Updated dependencies [f9e483f]
- Updated dependencies [09717e8]
- Updated dependencies [2baefc1]
- Updated dependencies [662eaa9]
- Updated dependencies [bfc6a00]
- Updated dependencies [b226c43]
- Updated dependencies [239a3a7]
- Updated dependencies [1766343]
- Updated dependencies [a34939d]
- Updated dependencies [e6302c6]
- Updated dependencies [aa6bb38]
- Updated dependencies [94fc9e0]
- Updated dependencies [81bd4f0]
- Updated dependencies [2755501]
- Updated dependencies [cac0798]
- Updated dependencies [9512788]
  - @lowdefy/helpers@7.0.0
  - @lowdefy/errors@7.0.0

## 6.1.0

### Minor Changes

- d1bd356: feat: Deployment environments declared once under `config.environments`.

  Everything that differs between an app's deployments — its URL, cron forwarding, the email delivery filter, the Sentry environment — is now declared in one place, and each deployment names the environment it is with the `LOWDEFY_ENVIRONMENT` variable (read at build time):

  ```yaml
  config:
    environments:
      prod:
        url: https://app.example.com
      staging:
        url: https://staging.example.com
        cron:
          secret: STAGING_CRON_SECRET # staging's CRON_SECRET, set on prod
        email:
          filter:
            replaceAddress: team+staging@example.com
  ```

  The current environment supplies the defaults:

  - **`url`** — the `RenderNotification` `serverUrl` (email links and logos) and the auth base URL (`AUTH_URL`) default to it; an explicit value still wins. The dev server always uses the request origin, even with a `LOWDEFY_ENVIRONMENT` that names a deployed environment.
  - **`cron`** — the current environment registers its own schedules. The environment Vercel fires crons on (one without a `cron.secret`) also registers the schedules of every environment with a `cron.secret` and forwards them to that environment's `url`. `cron.enabled: false` registers nothing for an environment. Endpoint `schedules` keyed by environment work as before; the dev server with no current environment runs the `default` schedules.
  - **`email.filter`** — applied to every `SMTPMailSend` and `SendGridMailSend` request unless the connection sets a `filter` of its own with at least one field; an unset connection filter, or one whose fields all resolve to `null`, falls back to it, and the new `filter: false` turns filtering off for a connection, the environment's too (for mail such as invites that must reach the real recipient). Connection resolvers now receive the current environment as `environment`. Auth emails are not filtered.
  - **Logs** — every server log line carries `environment`; the app metadata gains `environment` (`_app: environment`); `logger.sentry.environment` defaults to the environment name.
  - **Switches** — `cron.enabled`, `email.enabled` and `sentry.enabled` set to `false` turn that feature off in one environment: no crons registered or forwarded, no email sent by `SMTPMailSend`/`SendGridMailSend` (each message reports `disabled: true`; auth emails still send), no Sentry on server or client. The switched-off features are listed in the app metadata as `disabled` (`_app: disabled`). Logging has no switch.
  - **Guards** — `guards.secrets` (Lowdefy secret names) and `guards.env` (environment variable names) map to a regular expression the value must match in that environment; the build fails before deploy when a guarded value is unset or does not match, and the production server checks again at startup, so changing it (the prod database URI, say) also takes a config change. Unknown guard kinds fail the build. Values are never printed, and only the current environment's guards are kept, in the server-only `config.json`.

  `cron.secret` is the **name** of a Lowdefy secret, a plain string — not a `_secret` operator.

  - **Browser exposure** — environment settings stay on the server. The client learns only the current environment's name and switched-off features (`_app: environment`, `_app: disabled`); `build/config.json` is no longer bundled into the client (the auth client reads the base path from Vite's `BASE_URL`), and a test allowlists the build artifacts client code may import.

  The new [Deployment environments](https://docs.lowdefy.com/deployment-environments) docs page covers every setting.

  `config.environment` can name the current environment in config for a deployment that sets no `LOWDEFY_ENVIRONMENT`; the variable always wins. With environments declared, the current environment must be one of them, and a production build without one fails (the dev server warns). An `email.filter.regex` that is not a valid regular expression fails the build.

  **Replaces `config.cron.environments` (6.0):** a build with `config.cron` fails with the migration — move the environments to `config.environments`, each `secret` to `cron.secret` and `enabled` to `cron.enabled`, give production its `url`, and set `LOWDEFY_ENVIRONMENT` on each deployment.

### Patch Changes

- 6d6f8fa: Improved error handling: each reader of a server error now gets its own view of it.

  - **Users and app config see the author's message or one generic message.** A server error the app author did not write now reaches the browser as "Something went wrong.", with its `name`, `code`, `statusCode`, `configKey` and a `requestId`. Messages written with `:throw` or `:reject`, failed `ValidateSchema` steps, a plugin's `UserError`, and authentication refusals, are shown as before. This applies to the error toast, `_actions`, `_request_details`, websocket errors, MCP tool results and the AgentChat stream, the same way in development and production. An action whose error toast showed a connection's own message now shows the generic one.
    - The generic message is the built-in `server.genericError` i18n string. Override it per locale under `config.i18n.messages`, for example `server.genericError: 'Etwas ist schiefgelaufen.'`.
    - To show different text for one action, set `messages.error` on the action.
    - To show the real message, read it with the new `_error` operator in the endpoint's `:catch` and send it on, for example `:throw: { _error: message }`.
  - **The dev server shows the full error.** In `lowdefy dev`, the error bar, the browser console and the dev MCP tools show the full server error, with its config location, while app config sees the same generic error as in production. Different failures of the same action are now each shown, instead of only the first.
  - **The browser console prints the request id** under a server error, to find the matching server log line and Sentry event.
  - **Production logs and Sentry keep a fixed set of error fields.** Each logged error keeps its name, message, stack, `code`, `statusCode` and cause, plus Lowdefy's own fields (`configKey`, `source`, `received`, ...) on Lowdefy errors. Fields a library attaches, such as an HTTP client's request config and response, are no longer logged. Values of the app's secrets (`LOWDEFY_SECRET_*`, `CRON_SECRET`, `AUTH_SECRET`) are replaced with `[REDACTED]` in production log lines and Sentry events, and credential-named keys in `received` are masked. Sentry events now carry the error's fields under `extra.error` and a `requestId` tag, and no longer attach incoming request bodies.
  - **An AxiosHttp request that gets a 5xx response now fails with a `ServiceError`**, where it used to fail with a `RequestError`. AxiosHttp now sets `statusCode` on its error, and a 5xx status marks an error as a service failure, like a network error or timeout. Config that checks `name` for `RequestError` on these failures, for example `_eq: [{ _error: name }, 'RequestError']`, should also accept `ServiceError`, or check `statusCode` instead. The server log event for these failures is now `service_error`.

- Updated dependencies [6d6f8fa]
- Updated dependencies [6d6f8fa]
  - @lowdefy/helpers@6.1.0
  - @lowdefy/errors@6.1.0

## 6.0.0

### Minor Changes

- 082acec: feat: Dev DX quick wins — fast warm boots, no mid-session reloads.

  - `lowdefy dev` no longer resets the server `package.json` at boot, so plugin
    packages discovered by previous sessions stay installed — no more
    uninstall/reinstall churn, no install pause when navigating to pages whose
    plugins were already known, and a stable lockfile that preserves Vite's
    dependency optimizer cache across sessions.
  - Installs are skipped entirely when `package.json` is unchanged (hash stored
    inside `node_modules`, so deleting `node_modules` forces a reinstall). Warm
    boots drop from ~30s to a few seconds.
  - The dev server pre-discovers all client dependencies at startup
    (`optimizeDeps.entries`), eliminating mid-session "optimized dependencies
    changed" full page reloads.
  - Tailwind scan inputs are excluded from Vite's watcher — first visits to a
    page no longer force a full browser reload that aborts in-flight requests
    ("Failed to fetch" error walls). CSS recompilation is driven by the
    `tailwind-candidates.css` import, now touched only when a build actually
    changes tailwind content.
  - Build artifact writes skip byte-identical content, so unchanged JIT page
    builds no longer invalidate `clientJsMap.js` (Routing HMR churn) or
    `serverJsMap.js` (SSR graph reloads). New `writeFileIfChanged` and
    `installIfPackageJsonChanged` utilities in `@lowdefy/node-utils`.
  - Polish: dev server shutdown log no longer says "next server"; the missing
    `./messages` plugin export notice logs once per process instead of on every
    rebuild.

### Patch Changes

- 6446ae6: fix: Fix dynamic page navigation and dev server port detection.

  - **lowdefy (CLI)**: Port availability checks now probe loopback addresses (`127.0.0.1`, `::1`) in addition to the wildcard bind, so `dev`/`start` no longer report a port held by another local process as free.
  - **@lowdefy/client**: Fixed a blank page that could appear when navigating to a page with server-resolved dynamic content — the page config is now memoized correctly and the page tree remounts when new dynamic content is resolved.
  - **@lowdefy/helpers**: Added `getOperatorType`, a small shared utility for detecting operator objects in config.
  - **@lowdefy/node-utils**: Added `findAvailablePort` and `isPortAvailable` utilities (moved from the CLI) for reuse across dev tooling.

- Updated dependencies [37c8c14]
- Updated dependencies [6446ae6]
- Updated dependencies [c9bea1c]
  - @lowdefy/errors@6.0.0
  - @lowdefy/helpers@6.0.0

## 5.6.0

### Patch Changes

- 3ead269: feat(helpers): Reject prototype-pollution key names in dot paths and key maps.

  `__proto__`, `constructor`, `prototype`, `__defineGetter__`, `__defineSetter__`,
  `__lookupGetter__` and `__lookupSetter__` are no longer accepted as path segments or as keys
  in maps built from user-supplied values.

  Previously these names were silently _filtered_ on write, which was worse than rejecting
  them: `SetState: { 'a.__proto__.b': 1 }` quietly wrote to `a.b` instead — a different
  location than the one you asked for. Reads could also walk up the prototype chain.

  What you will see now:

  - `:set_state` and the `SetState` action raise a config error naming the offending key and
    pointing at the line in your YAML.
  - Data-reading operators (`_state`, `_get`, `_user`, `_payload`, ...) return their default
    instead of a value.
  - A module entry id, an agent or endpoint id, or a `LOWDEFY_SECRET_*` environment variable
    using one of these names now fails at build or boot with a message naming it, instead of
    silently vanishing.

  Apps that do not use these names are unaffected. If you have a form field, state key, or API
  response property named `constructor`, rename it.

  Deep merges of configuration are hardened the same way, but skip reserved keys rather than
  raising — a reserved name arriving inside a merged _value_ is dropped so a single poisoned
  field can't abort an otherwise valid merge.

  `@lowdefy/helpers` also now exports `isReserved(key)`, so plugin and connection authors can
  test a key against this policy directly instead of catching a `ReservedKeyError`.

- Updated dependencies [3ead269]
- Updated dependencies [79bbd84]
- Updated dependencies [824f4be]
- Updated dependencies [824f4be]
- Updated dependencies [3ead269]
- Updated dependencies [1a6223f]
- Updated dependencies [3ead269]
  - @lowdefy/helpers@5.6.0
  - @lowdefy/errors@5.6.0

## 5.5.1

### Patch Changes

- @lowdefy/errors@5.5.1
- @lowdefy/helpers@5.5.1

## 5.5.0

### Patch Changes

- @lowdefy/errors@5.5.0
- @lowdefy/helpers@5.5.0

## 5.4.0

### Patch Changes

- Updated dependencies [25225ab]
- Updated dependencies [f11addd]
- Updated dependencies [0108f38]
- Updated dependencies [302e330]
  - @lowdefy/helpers@5.4.0
  - @lowdefy/errors@5.4.0

## 5.3.0

### Patch Changes

- @lowdefy/errors@5.3.0
- @lowdefy/helpers@5.3.0

## 5.2.0

### Patch Changes

- @lowdefy/errors@5.2.0
- @lowdefy/helpers@5.2.0

## 5.1.0

### Patch Changes

- @lowdefy/errors@5.1.0
- @lowdefy/helpers@5.1.0

## 5.0.0

### Major Changes

- f430f02dde: Replace auto-generated `types.json` with source `types.js` files in all plugin packages.

  ### Breaking Changes

  - **Plugin type resolution**: Plugin types are now read from source `types.js` files instead of auto-generated `types.json`. Block packages derive types from their `metas.js` barrel using the `extractBlockTypes` helper.
  - **`extract-plugin-types` script removed**: The build-time extraction script in `@lowdefy/node-utils` has been deleted. Each plugin package maintains its own `types.js`.

### Patch Changes

- Updated dependencies [905d5d406]
  - @lowdefy/helpers@5.0.0
  - @lowdefy/errors@5.0.0

## 4.7.3

### Patch Changes

- @lowdefy/errors@4.7.3
- @lowdefy/helpers@4.7.3

## 4.7.2

### Patch Changes

- @lowdefy/errors@4.7.2
- @lowdefy/helpers@4.7.2

## 4.7.1

### Patch Changes

- @lowdefy/errors@4.7.1
- @lowdefy/helpers@4.7.1

## 4.7.0

### Patch Changes

- Updated dependencies [4543688f7]
- Updated dependencies [dea6651a1]
  - @lowdefy/helpers@4.7.0
  - @lowdefy/errors@4.7.0

## 4.6.0

### Minor Changes

- aa0d6d363e: feat: Config-aware error tracing and Sentry integration

  **Config-Aware Error Tracing (#1940)**

  - Errors now trace back to exact YAML config locations with file:line
  - Clickable VSCode links in terminal and browser
  - Build-time validation catches typos with "Did you mean?" suggestions
  - Service vs Config error classification

  **Plugin Error Refactoring**

  - Operators throw simple error messages without formatting
  - Parsers (WebParser, ServerParser, BuildParser) format errors with received value and location
  - Removed redundant "Operator Error:" prefix from error messages
  - Consistent error format: "{message} Received: {params} at {location}."
  - Actions and connections also simplified: removed inline `received` from error messages (interface layer adds it)
  - Connection plugins (axios-http, knex, redis, sendgrid) no longer expose raw response data in errors

  **Error Class Hierarchy**

  - Unified error system in `@lowdefy/errors` with all error classes
    - `@lowdefy/errors/build` - Build-time classes with sync location resolution
  - Error classes: `LowdefyError`, `ConfigError`, `ConfigWarning`, `PluginError`, `ServiceError`
  - `ConfigWarning` supports `prodError` flag to throw in production builds
  - `ServiceError.isServiceError()` detects network/timeout/5xx errors
  - `~ignoreBuildChecks` cascades through descendants to suppress warnings/errors

  **Build Error Collection**

  - Errors collected in `context.errors[]` instead of throwing immediately
  - `tryBuildStep()` wrapper catches and collects errors from build steps
  - All errors logged together before summary message for proper ordering

  **Sentry Integration (#1945)**

  - Zero-config Sentry support - just set SENTRY_DSN
  - Client and server error capture with Lowdefy context (pageId, blockId, config location)
  - Configurable sampling rates, session replay, user feedback
  - Graceful no-op when DSN not set

### Patch Changes

- Updated dependencies [aa0d6d363e]
- Updated dependencies [aebca6ab51]
- Updated dependencies [ab19b1bb77]
- Updated dependencies [8ec5f1be05]
- Updated dependencies [f673e3ab3]
  - @lowdefy/errors@4.6.0
  - @lowdefy/helpers@4.6.0

## 4.5.2

### Patch Changes

- @lowdefy/helpers@4.5.2

## 4.5.1

### Patch Changes

- @lowdefy/helpers@4.5.1

## 4.5.0

### Patch Changes

- @lowdefy/helpers@4.5.0

## 4.4.0

### Patch Changes

- @lowdefy/helpers@4.4.0

## 4.3.2

### Patch Changes

- @lowdefy/helpers@4.3.2

## 4.3.1

### Patch Changes

- @lowdefy/helpers@4.3.1

## 4.3.0

### Patch Changes

- @lowdefy/helpers@4.3.0

## 4.2.2

### Patch Changes

- @lowdefy/helpers@4.2.2

## 4.2.1

### Patch Changes

- a1f47d97c: Fix Github actions release.
- Updated dependencies [a1f47d97c]
  - @lowdefy/helpers@4.2.1

## 4.2.0

### Patch Changes

- @lowdefy/helpers@4.2.0

## 4.1.0

### Patch Changes

- @lowdefy/helpers@4.1.0

## 4.0.2

### Patch Changes

- @lowdefy/helpers@4.0.2

## 4.0.1

### Patch Changes

- @lowdefy/helpers@4.0.1

## 4.0.0

### Patch Changes

- 84e479d11: Fix show branding logic.
  Change invalid license throws to return invalid license objects.
  - @lowdefy/helpers@4.0.0

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0-rc.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.14...v4.0.0-rc.15) (2023-12-05)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-rc.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.14) (2023-11-17)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-rc.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.13) (2023-11-17)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-rc.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.11...v4.0.0-rc.12) (2023-10-19)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-rc.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.10...v4.0.0-rc.11) (2023-10-06)

### Bug Fixes

- **deps:** Dependencies patch updates. ([adcd80a](https://github.com/lowdefy/lowdefy/commit/adcd80afe8c752e15c900b88eb4d9be8526c7bcd))

# [4.0.0-rc.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.9...v4.0.0-rc.10) (2023-07-26)

### Bug Fixes

- **deps:** update dependency fs-extra to v11.1.1 ([e70fc3e](https://github.com/lowdefy/lowdefy/commit/e70fc3e8e5de3091f5c0acd8dde279434f958bcf))

# [4.0.0-rc.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.8...v4.0.0-rc.9) (2023-05-31)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-rc.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.7...v4.0.0-rc.8) (2023-05-19)

### Features

- Remove support for setting base path using an environment variable ([ec7052d](https://github.com/lowdefy/lowdefy/commit/ec7052dab152645b4a5ed9098320e46488041034))

# [4.0.0-rc.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.6...v4.0.0-rc.7) (2023-03-24)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-rc.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.5...v4.0.0-rc.6) (2023-03-20)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-rc.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.4...v4.0.0-rc.5) (2023-02-24)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-rc.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.3...v4.0.0-rc.4) (2023-02-21)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-rc.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.2...v4.0.0-rc.3) (2023-02-21)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-rc.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.1...v4.0.0-rc.2) (2023-02-17)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-rc.1](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.0...v4.0.0-rc.1) (2023-02-17)

### Bug Fixes

- **deps:** Update dependency fs-extra to v11.1.0 (major version) ([0f388d7](https://github.com/lowdefy/lowdefy/commit/0f388d7a977fb524467af8a8f6bc328076d7f47e))
- Fix jest testsfor es modules in operators and utils packages ([e239727](https://github.com/lowdefy/lowdefy/commit/e239727d1e9b74cd8945037cee462f8ec4afcdb3))
- Rename copyDirectory util to copyFileOrDirectory. ([b7d3884](https://github.com/lowdefy/lowdefy/commit/b7d38844c8e29cafa0d29852d034e391b8dfdf9d))

# [4.0.0-rc.0](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.37...v4.0.0-rc.0) (2023-01-05)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.37](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.36...v4.0.0-alpha.37) (2022-12-07)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.36](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.35...v4.0.0-alpha.36) (2022-10-14)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.35](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.34...v4.0.0-alpha.35) (2022-10-05)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.34](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.33...v4.0.0-alpha.34) (2022-09-30)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.33](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.32...v4.0.0-alpha.33) (2022-09-22)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.32](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.31...v4.0.0-alpha.32) (2022-09-22)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.31](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.30...v4.0.0-alpha.31) (2022-09-21)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.30](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.29...v4.0.0-alpha.30) (2022-09-17)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.29](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.28...v4.0.0-alpha.29) (2022-09-13)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.28](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.27...v4.0.0-alpha.28) (2022-09-12)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.27](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.26...v4.0.0-alpha.27) (2022-09-08)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.26](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.25...v4.0.0-alpha.26) (2022-08-25)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.25](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.24...v4.0.0-alpha.25) (2022-08-23)

### Bug Fixes

- **server-dev:** Simplify server-dev manager code. ([e4101d0](https://github.com/lowdefy/lowdefy/commit/e4101d019b47d8cf1d5065116f003bcdf8a38fdf))

### Features

- CLI output improvements. ([f00bb9b](https://github.com/lowdefy/lowdefy/commit/f00bb9b32e03e77ef1ef19c69055da4b05880cd8))
- **cli:** Add log level option. ([5903c8e](https://github.com/lowdefy/lowdefy/commit/5903c8e4165334eb31f80580c3816a34ac36592d))
- Improved logging WIP. ([0bbf19d](https://github.com/lowdefy/lowdefy/commit/0bbf19d69926440930995d457514544608ec5b5b))

# [4.0.0-alpha.24](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.23...v4.0.0-alpha.24) (2022-08-19)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.23](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.22...v4.0.0-alpha.23) (2022-08-03)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.22](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.21...v4.0.0-alpha.22) (2022-07-12)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.21](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.20...v4.0.0-alpha.21) (2022-07-11)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.20](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.19...v4.0.0-alpha.20) (2022-07-09)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.19](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.18...v4.0.0-alpha.19) (2022-07-06)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.18](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.17...v4.0.0-alpha.18) (2022-06-27)

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.14...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.17](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.16...v4.0.0-alpha.17) (2022-06-24)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.14) (2022-06-19)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.12...v4.0.0-alpha.13) (2022-06-16)

### Bug Fixes

- Fix license typo. ([972acbb](https://github.com/lowdefy/lowdefy/commit/972acbb46b9b1113053797f82a41c5f9032dd8b0))

### Features

- Package updates. ([e024181](https://github.com/lowdefy/lowdefy/commit/e0241813d1276316f0f04897b664c43e24b11d23))
- Package Updates. ([0f9d8cd](https://github.com/lowdefy/lowdefy/commit/0f9d8cd89186e12c66e5f833c13c12472f52eaee))

# [4.0.0-alpha.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.11...v4.0.0-alpha.12) (2022-05-23)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.10...v4.0.0-alpha.11) (2022-05-20)

### Bug Fixes

- **cli:** Do not copy node_modules in plugin folders. ([a5a131d](https://github.com/lowdefy/lowdefy/commit/a5a131de06d6a8d28926aa709a57af0a7e7adb5f))

# [4.0.0-alpha.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.9...v4.0.0-alpha.10) (2022-05-06)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.8...v4.0.0-alpha.9) (2022-05-06)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.7...v4.0.0-alpha.8) (2022-03-16)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.6...v4.0.0-alpha.7) (2022-02-21)

### Bug Fixes

- Fix util package tests. ([9d0cc45](https://github.com/lowdefy/lowdefy/commit/9d0cc45cffd3a373492bc842ba54a7254f7c509f))
- Fix V4 tests. ([d082d0c](https://github.com/lowdefy/lowdefy/commit/d082d0c335eb4426acadbf30a08de64266d9f004))
- **node-utils:** Convert writeFile function prototype. ([5371430](https://github.com/lowdefy/lowdefy/commit/53714307123f3477240767a91c5332a70a292d93))
- **node-utils:** Do not throw if readFile path is not resolved. ([b451c29](https://github.com/lowdefy/lowdefy/commit/b451c29b4a904bfdbaa31e9316b488935bdf8571))

### Features

- **build:** Add buildPath to config. ([1cce024](https://github.com/lowdefy/lowdefy/commit/1cce024339bc89e4192d86f09d1a9ec233663f02))
- **node-utils:** Add copyDirectory. ([852a77a](https://github.com/lowdefy/lowdefy/commit/852a77a6277f0fe9c98cb39e329f60dccdb0793e))
- **node-utils:** Replace rimraf with fs-extra. ([e15031d](https://github.com/lowdefy/lowdefy/commit/e15031d32de3bc60eef5248b9f8440fc14ea11ef))

# [4.0.0-alpha.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.5...v4.0.0-alpha.6) (2022-01-20)

### Features

- Add server manager and file watcher in reload event stream. ([8474aaf](https://github.com/lowdefy/lowdefy/commit/8474aaf63c0475cb19a76ca3df9459c05f263986))
- **server-dev:** Updates to dev server manager. ([b4861d0](https://github.com/lowdefy/lowdefy/commit/b4861d0892ee9a91ff49b3bb72498d8c42c02778))

# [4.0.0-alpha.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.4...v4.0.0-alpha.5) (2021-11-27)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.3...v4.0.0-alpha.4) (2021-11-25)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.2...v4.0.0-alpha.3) (2021-11-25)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.1...v4.0.0-alpha.2) (2021-11-25)

**Note:** Version bump only for package @lowdefy/node-utils

# [4.0.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.23.1...v4.0.0-alpha.1) (2021-11-25)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.23.1](https://github.com/lowdefy/lowdefy/compare/v3.23.0...v3.23.1) (2021-11-20)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.23.0](https://github.com/lowdefy/lowdefy/compare/v3.23.0-alpha.0...v3.23.0) (2021-11-19)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.23.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.22.0...v3.23.0-alpha.0) (2021-11-09)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.22.0](https://github.com/lowdefy/lowdefy/compare/v3.22.0-alpha.1...v3.22.0) (2021-09-27)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.22.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.22.0-alpha.0...v3.22.0-alpha.1) (2021-09-20)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.22.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.21.2...v3.22.0-alpha.0) (2021-09-08)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.21.2](https://github.com/lowdefy/lowdefy/compare/v3.21.2-alpha.0...v3.21.2) (2021-08-31)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.21.2-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.21.1...v3.21.2-alpha.0) (2021-08-31)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.21.1](https://github.com/lowdefy/lowdefy/compare/v3.21.0...v3.21.1) (2021-08-26)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.21.0](https://github.com/lowdefy/lowdefy/compare/v3.20.4...v3.21.0) (2021-08-25)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.20.4](https://github.com/lowdefy/lowdefy/compare/v3.20.3...v3.20.4) (2021-08-21)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.20.3](https://github.com/lowdefy/lowdefy/compare/v3.20.1...v3.20.3) (2021-08-20)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.20.2](https://github.com/lowdefy/lowdefy/compare/v3.20.1...v3.20.2) (2021-08-20)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.20.1](https://github.com/lowdefy/lowdefy/compare/v3.20.0...v3.20.1) (2021-08-20)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.20.0](https://github.com/lowdefy/lowdefy/compare/v3.19.0...v3.20.0) (2021-08-20)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.19.0](https://github.com/lowdefy/lowdefy/compare/v3.18.1...v3.19.0) (2021-07-26)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.18.1](https://github.com/lowdefy/lowdefy/compare/v3.18.0...v3.18.1) (2021-06-30)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.18.0](https://github.com/lowdefy/lowdefy/compare/v3.17.2...v3.18.0) (2021-06-17)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.17.2](https://github.com/lowdefy/lowdefy/compare/v3.17.1...v3.17.2) (2021-06-11)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.17.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0...v3.17.1) (2021-06-11)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.17.0](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.3...v3.17.0) (2021-06-11)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.17.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.2...v3.17.0-alpha.3) (2021-06-09)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.17.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.1...v3.17.0-alpha.2) (2021-06-09)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.17.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.0...v3.17.0-alpha.1) (2021-06-09)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.17.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.16.5...v3.17.0-alpha.0) (2021-06-09)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.16.5](https://github.com/lowdefy/lowdefy/compare/v3.16.4...v3.16.5) (2021-05-31)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.16.4](https://github.com/lowdefy/lowdefy/compare/v3.16.3...v3.16.4) (2021-05-28)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.16.3](https://github.com/lowdefy/lowdefy/compare/v3.16.2...v3.16.3) (2021-05-27)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.16.2](https://github.com/lowdefy/lowdefy/compare/v3.16.1...v3.16.2) (2021-05-26)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.16.1](https://github.com/lowdefy/lowdefy/compare/v3.16.0...v3.16.1) (2021-05-26)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.16.0](https://github.com/lowdefy/lowdefy/compare/v3.15.0...v3.16.0) (2021-05-26)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.15.0](https://github.com/lowdefy/lowdefy/compare/v3.14.1...v3.15.0) (2021-05-11)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.14.1](https://github.com/lowdefy/lowdefy/compare/v3.14.0...v3.14.1) (2021-04-28)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.14.0](https://github.com/lowdefy/lowdefy/compare/v3.13.0...v3.14.0) (2021-04-26)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.13.0](https://github.com/lowdefy/lowdefy/compare/v3.12.6...v3.13.0) (2021-04-16)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.12.6](https://github.com/lowdefy/lowdefy/compare/v3.12.5...v3.12.6) (2021-04-06)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.12.5](https://github.com/lowdefy/lowdefy/compare/v3.12.4...v3.12.5) (2021-03-31)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.12.4](https://github.com/lowdefy/lowdefy/compare/v3.12.3...v3.12.4) (2021-03-30)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.12.3](https://github.com/lowdefy/lowdefy/compare/v3.12.2...v3.12.3) (2021-03-26)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.12.2](https://github.com/lowdefy/lowdefy/compare/v3.12.1...v3.12.2) (2021-03-24)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.12.1](https://github.com/lowdefy/lowdefy/compare/v3.12.0...v3.12.1) (2021-03-24)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.12.0](https://github.com/lowdefy/lowdefy/compare/v3.11.4...v3.12.0) (2021-03-24)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.11.4](https://github.com/lowdefy/lowdefy/compare/v3.11.3...v3.11.4) (2021-03-19)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.11.3](https://github.com/lowdefy/lowdefy/compare/v3.11.2...v3.11.3) (2021-03-12)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.11.2](https://github.com/lowdefy/lowdefy/compare/v3.11.1...v3.11.2) (2021-03-11)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.11.1](https://github.com/lowdefy/lowdefy/compare/v3.11.0...v3.11.1) (2021-03-11)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.11.0](https://github.com/lowdefy/lowdefy/compare/v3.10.2...v3.11.0) (2021-03-11)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.10.2](https://github.com/lowdefy/lowdefy/compare/v3.10.1...v3.10.2) (2021-02-25)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.10.1](https://github.com/lowdefy/lowdefy/compare/v3.10.0...v3.10.1) (2021-02-19)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.10.0](https://github.com/lowdefy/lowdefy/compare/v3.9.0...v3.10.0) (2021-02-17)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.9.0](https://github.com/lowdefy/lowdefy/compare/v3.8.0...v3.9.0) (2021-02-16)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.8.0](https://github.com/lowdefy/lowdefy/compare/v3.7.2...v3.8.0) (2021-02-12)

**Note:** Version bump only for package @lowdefy/node-utils

## [3.7.2](https://github.com/lowdefy/lowdefy/compare/v3.7.1...v3.7.2) (2021-02-09)

### Bug Fixes

- Fix package lifecycle scripts. ([af7f3a8](https://github.com/lowdefy/lowdefy/commit/af7f3a8ea29763defb20cfb4f28afba3b56d981c))

## [3.7.1](https://github.com/lowdefy/lowdefy/compare/v3.7.0...v3.7.1) (2021-02-09)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.7.0](https://github.com/lowdefy/lowdefy/compare/v3.6.0...v3.7.0) (2021-02-09)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.6.0](https://github.com/lowdefy/lowdefy/compare/v3.5.0...v3.6.0) (2021-02-05)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.5.0](https://github.com/lowdefy/lowdefy/compare/v3.4.0...v3.5.0) (2021-02-05)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.4.0](https://github.com/lowdefy/lowdefy/compare/v3.3.0...v3.4.0) (2021-01-20)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.3.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.3.0) (2021-01-18)

**Note:** Version bump only for package @lowdefy/node-utils

# [3.2.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.2.0) (2021-01-18)

**Note:** Version bump only for package @lowdefy/node-utils

## [1.0.4](https://github.com/lowdefy/lowdefy/compare/@lowdefy/node-utils@1.0.2...@lowdefy/node-utils@1.0.4) (2020-12-15)

**Note:** Version bump only for package @lowdefy/node-utils

## [1.0.3](https://github.com/lowdefy/lowdefy/compare/@lowdefy/node-utils@1.0.2...@lowdefy/node-utils@1.0.3) (2020-12-15)

**Note:** Version bump only for package @lowdefy/node-utils

## 1.0.2 (2020-12-10)

### Bug Fixes

- **node-utils:** add path tests to writeFile ([8bb51c3](https://github.com/lowdefy/lowdefy/commit/8bb51c383c8ed32e0c016144ef11077cc5b3a49d))
- move file helpers to new node-utils package ([0a6ef8d](https://github.com/lowdefy/lowdefy/commit/0a6ef8d09b6f1a75c8a8ceb1749f7dfe14c46b5f))
