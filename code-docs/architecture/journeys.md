# Journeys

How Lowdefy's config tests (journeys) are built in code: the grammar, selection, the runner, data sets, app errors, traces and session logs, production evidence and tiers, hardening, and pull request scope. What a journey does for an app developer, and every command option, is in the user docs under `packages/docs/testing/`: `config-tests.md`, `journey-data-sets.md` and `explore-pull-request.md`. This page names where each piece lives and the rules that are not visible from those docs. How to run the framework's own journey suites is in [testing.md](../testing.md).

The designs behind it are in Pelican, under the LDF-133 (Journey loop) project.

## Where the code lives

| Area                                                          | Location                                                                                                                                                         |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Grammar, data set reader, trace format, compiler, session log | `packages/utils/node-utils/src/` (`journeyGrammar/`, `journeyTrace/`, `journeyCompiler/`, `journeyEvidence/`, `journeyText/`, `sessionLog/`, `dataSetGenerate/`) |
| Target selectors, trace pairing                               | `packages/utils/helpers/src/` (`journeyTargetSelectors.js`, `pairTraceEvents.js`)                                                                                |
| `lowdefy test`, selection, lint                               | `packages/cli/src/commands/test/`                                                                                                                                |
| `lowdefy journeys ...` commands                               | `packages/cli/src/commands/journeys/`                                                                                                                            |
| Agent skills that write journeys                              | `packages/cli/src/commands/agentSetup/skills/`                                                                                                                   |
| Runner, data sessions, rails, app errors, mutants, recorder   | `packages/servers/server-dev/` (`lib/docs/`, `lib/server/`, `client/`)                                                                                           |
| Fixture app                                                   | `apps/journey-fixture`                                                                                                                                           |

## The grammar

One grammar, in `node-utils/src/journeyGrammar/`. Everything that checks a step imports it, so the CLI, the dev server's runner, `screenshotPage`, the journey REST route, lint and variants agree.

- `validateJourneySteps.js` exports `validateJourneySteps`, `STEP_KEYS`, `TARGET_KEYS`, `INTERACTION_STEP_KEYS` and `getStepKey`. Interaction steps are click, open, fill, select, press and back. `expect.error` and `expect.effect` must directly follow one (`validatePlacement`).
- `journeyStepSchema.js` holds the same grammar as JSON Schema (`journeyStepSchema`, `JOURNEY_STEP_SCHEMAS`). The dev server serves it at `GET /lowdefy-docs/schema/journey-step/<step|all>` and through `lowdefy_get_schema` with `kind: "journey-step"` (`server-dev/lib/docs/getSchema.js`).
- `journeyStepExamples.js` ends every step error with an `Example: ...` line.
- `normaliseJourneySteps.js` expands shorthands (`wait: 3000` becomes `{ wait: { ms: 3000 } }`). `runJourney` and `screenshotPage` call it after validation.
- `validateJourneyTags.js` (`JOURNEY_TAG_PATTERN`, the data set name pattern) and `validateJourneyUser.js` check `tags` and `user`. `findPlaceholderStep.js` finds a `from: shape` placeholder. `normaliseBlockId.js` turns list indices into `$`.

The CLI checks a journey file in `cli/src/commands/test/validateJourney.js`: the ajv shape check from `journeySchema.js` (step keys from `STEP_KEYS`, `name` at most 100 characters, `description` at most 60 words), then `evidence.mutation` (killed at most total), then `validateJourneyUser`, `validateJourneyTags` and `validateJourneySteps`. A malformed file is an invalid result before any server starts. The name limit applies to the name as written, never to a persona run's `<name> [<user>]`.

## Selecting journeys

`lowdefy test` and the `lowdefy_run_tests` agent tool (`cli/src/commands/mcp/runAppTests.js`) share one selection in `cli/src/commands/test/`:

1. `parseTestSelection` reads paths, tags, filters, tier and usage window.
2. `resolveJourneyPaths` turns paths into files. With no paths, `discoverJourneys` reads `tests/journeys/` through `listJourneyFiles` with `skipUnderscored`. A named folder is read whole, `_` folders included. A path that does not exist and contains `*`, `?` or `[` is expanded with `fs.globSync`, so npm scripts on Windows behave the same. A glob matching nothing, a path outside the config directory, or a glob matching only non-journey files is refused.
3. `selectTests` applies tags and filters (each repeatable, any match counts; paths, tags and filters combine with AND) and expands user lists into persona runs (`expandPersonas`).
4. `selectTier` (async) cuts the tier over that selection and returns `deprecated: true` journeys as skipped. `--lint` returns before it, so lint ignores `--tier`.
5. `formatNoTestsMatched` explains an empty selection.

The MCP tool resolves `paths` against the config directory, the CLI against the current directory. The MCP tool always reads `tests/journeys/`; `--journeys-directory` is CLI only.

`isFullSuiteRun` is true only for a run with no paths, filters or tags, tier `full`, and only for its first repetition. Only such a run records `journey` traces and `.lowdefy/test/run.json`. Skipping deprecated journeys keeps a run whole.

## Users and persona runs

`validateJourneyUser` is the one rule for `user`: absent, an inline user object, `none`, a data set user name, or a non-empty list of distinct data set user names, which needs `data`. The dev server refuses the combinations that cannot work in `server-dev/lib/docs/dataSets/resolveJourneyDataSet.js` (the user docs list them). With no `user`, an active mock user acts; an explicit `user` wins over it (`getBrowser.js`, `openPage`).

A journey with a list runs once per user. `expandPersonas` makes one item per user, `{ filePath, journeyIndex, journey, persona, personaOf }`, where `journey` is `personaJourney`: the same journey with that one `user`, named `<name> [<user>]`. Everything downstream keys on that name: result lines, `--filter`, `--repeat`, the recording's `run.journey`, the `run.json` and `exercised.json` keys and harden baselines. Each run posts one `user`, so each gets a fresh data session. A tier is cut once per journey, and all its persona runs go with it.

Where a journey is read rather than run, it is read once: lint through `collapsePersonas`, and the first user's run stands for it (`measuredJourney`) in lint and evidence. L5 still checks every listed name. Variants are written from the first user and replayed once per user.

`lowdefy_run_journey` takes a list and calls `runJourneyAsUsers`, returning `{ passed, runs: [{ user, ... }] }`. `POST /lowdefy-docs/journey` runs one user per call and refuses a list with a 400.

`as:` opens another actor (`createJourneyActors.js`, `switchTo` and `userFor`): `main` is the run's user, a data set user name opens as that user, and any other name opens as the journey's `user`. `checkActorName` in `checkStepReferences.js` checks the name before the step runs.

## Running a journey

`POST /lowdefy-docs/journey` (`server-dev/src/routes/docs/journey.js`) and `lowdefy_run_journey` (`server-dev/lib/docs/createDocsMcpServer.js`) call `runJourney` (`server-dev/lib/docs/runJourney.js`). In order, it:

1. checks the origin, `pageId`, `pathParams` and `urlQuery`,
2. runs `validateJourneySteps`, then `normaliseJourneySteps`,
3. refuses a placeholder step (`findPlaceholderStep`),
4. checks the state selection, the timeout and mail use (`validateJourneyMail`),
5. builds the page URL (`buildPageUrl`) and resolves the data set (`resolveJourneyDataSet`),
6. inside a browser slot (`withBrowserSlot`): opens the data session, the browser and the recording identity, registers the run's error buffer, creates the app error watcher, opens the page, creates the click rails, runs the steps (`runJourneySteps.js`), reads the final state and collects the exercised path.

A refusal returns `{ error, refused: true }`, which the route answers with 400; other errors are 502; a mutant run on a stale build is 409. The result is `{ pageId, passed, steps: [{ index, step, status, durationMs }], screenshots, state | stateOmitted, exercised, failure?, data?, warnings?, sunk? }`, with `ready: false` and a `note` when the page never settled. `failure` is `{ index, step, expected, actual, message }` (`toFailure`); step indices are zero-based. `state` is left out over 10,000 characters (`stateOmitted`) or with `state: false`. A mutant run adds `mutant: { id, applied, misses }`. The MCP tool returns screenshots as image blocks and trims `exercised` to `{ counts, note }` unless asked for it (`selectExercised.js`).

Before each step, `checkStepReferences` fails a step whose block, request, endpoint, `goto` page or `as` name is not in the build. On a data set run a click also passes the click rails first (see below).

### How a target resolves

`runJourneySteps.js` resolves targets with the selectors in `@lowdefy/helpers`' `journeyTargetSelectors`.

- `blockId`, `row` and `column` give the scope: the `#bl-<id>` wrapper, its `.ag-row[row-index]`, its `.ag-cell[col-id]`.
- `text` matches visible interactive controls whose text is exactly it. With no `blockId` it searches the front-most open layer that holds one: the last open `[role="menu"]`, then the last `[role="dialog"]`, then the page.
- A `blockId` target without `row` or `column` that uses `text` or `containing`, and `expect.text`, also search the block's Modal or Drawer portal, which carries the class `ldf-portal-<id>` (`journeyTargetSelectors.portalClass`, set in the antd `Modal` and `Drawer` blocks).
- `containing` matches visible elements whose text contains it. `nth` alone picks the nth interactive control in the scope. A target with none of these is the scope, clicked on its first control.
- Before choosing, a click or open waits for the control to be visible, for lazy blocks to load and for tables to clear a held loading skeleton (`waitForLoadingBlocks` on `window.__lowdefyLazyLoads` and `window.__lowdefySkeletonHolds`, the same counts `isPageReady` reads). A held skeleton gives way to the rows on a pointer press, so a click started on it would land on nothing.
- **Action targets must name one element.** For click, open, fill and select, `resolveActionTarget` waits for a first match, looks again and counts. More than one visible match without `nth` fails the step at once, naming the count and where it looked. Expectations accept any match.

The recorder agrees: `describeElement` (engine `trace/createDescribeElement.js`) gives `nth` whenever the scope holds several matches, `0` included, and `null` only for a unique one. `resolveTargetInDocument` (`@lowdefy/e2e-utils/targets`) is the jsdom mirror the round-trip tests use; it resolves an ambiguous target to nothing, and handles `text` only (no `containing`, no portals).

## App errors fail a journey

A journey fails at the step that causes an app error its own browsers raised, even when every expectation holds.

- **Attribution.** Every run carries a verified recording identity: a recorded run the one its caller sends, any other run its own `{ source: 'journey', run: { id, by, journey: null }, record: false }` (`journeyRunRecording.js`). `clientErrorStore` and `serverErrorStore` hand any entry stamped by a journey run (`isRunErrorEntry`) to that run's buffer (`lib/docs/runErrorBuffers.js`: `registerRunBuffer`, `recordRunError`, `takeRunErrors`, `releaseRunBuffer`, keyed by run id and `run.journey`, kept on `globalThis`). Those entries never reach the shared error rings or the dev event bus, and an entry for a released buffer is dropped. So a journey's errors never reach build status, and a developer's own tab's errors never fail a journey.
- **Windows.** `createJourneyAppErrors` (`lib/docs/observe/`) hooks every actor context through `watchJourneyContext`: page errors, app API requests and responses, aborted requests and client error reports in flight. `runJourneySteps` judges contiguous windows: the page open (`judgeOpen`, a failure with `phase: 'open'` and every step skipped), each step (`judgeStep`, which waits for client error reports except after `expect`, `wait` and `screenshot`, though an `expect.error` step does wait), and a final drain after the last step when nothing has failed. `screenshotPage` runs without the watcher.
- **One classifier.** Each window goes through `evaluateInvariants`. Kinds `action-error`, `client-error`, `server-error` and `request-failed` are errors; `dead-click` is a warning; `environment` is info. A finding with severity error, or of kind environment, fails the step; when any environment finding is present, the others are dropped. Findings are deduplicated by `findingKey`. Expected outcomes are not findings: the error names in `@lowdefy/errors`' `expectedErrorNames` (`UserError`, `AuthenticationError`, `AuthorizationError`, `TwoFactorEnrolmentRequiredError`), a failed `Validate` and a `Throw`. On a `goto` step, fetch failures are dropped when the window saw an aborted request (`isCausedByGoto`), since navigating away aborts the old page's requests.
- **Failure shape** (`toAppErrorFailure`, `withAppErrors`): `{ index, step, kind: 'app-error', message, expected: 'no app error', actual: ['<kind>: <message>'], errors: [{ kind, message, source, configKey, key }] }`, with `source` relative to the config directory. A step that also failed on its own keeps its message as `stepMessage`.
- **`expect.error`.** When the next step is `expect.error`, the interaction's findings are held. `claimExpectedErrors` claims held and its own window's findings whose message contains the text, plus any `action-error` once something matched (the trace carries no values, so an action error never holds the text). No match fails the expect step; anything unclaimed fails the interaction.
- **`expect.effect`.** Reads the previous window (`previousWindow`) and fails when `hasNoEffect`: no event, no DOM change, no app request, URL unchanged. The dead-click invariant uses the same check.
- **CLI.** `formatJourneyResult` prints an app error failure as `step N: <step>` or `on open`, and `formatAppErrors` prints one line per error with kind, message and `file:line`.

## Data sets

The file format and its rules are in `journey-data-sets.md`. `parseDataSet` (node-utils) is the one reader for the dev server, lint, variants, scope and coverage. It reads the files with `readDataSetFile` (which also refuses a `snapshot:` key), follows `extends` with `readDataSetFiles`, merges them with `mergeDataSetFiles`, then validates and expands `generate` (`validateDataSetGenerate`, `generateDataSetDocuments` in `dataSetGenerate/`). `adviseDataSetSize` gives the size advice.

The dev server reads a data set through `lib/docs/dataSets/readDataSet.js`, which adds the checks that need the build, among them `checkSharedCollectionIds.js` for connections that share a collection. `openDataSession` opens a database on the dev server's own data store, and `loadDataSetCollection` loads indexes, then generated documents, then fixtures. A result's `data` is `{ name, loadMs, documents }`.

The agent dev tools take `user` and `data` in the journey forms, without lists: `resolveToolCaller` and `withDataSession` (`lib/docs/`) give `lowdefy_screenshot_page`, `lowdefy_inspect_state`, `lowdefy_eval_operator`, `lowdefy_load_state`, `lowdefy_run_request` and `lowdefy_run_endpoint` a data session.

### Data-set modes

Under a data session every connection read goes through one gate, `lib/server/applyDataSetRedirect.js`, which reads the connection type's `meta.dataSet`:

- `redirect` merges the session database over the properties. A connection whose properties have a top-level operator key is refused.
- `walled` passes unchanged: the type holds no database URI and reaches MongoDB only through the walled client (`walled(connectionId)` from `packages/api/src/routes/request/createWalledResolver.js`, with `getWalledCollection` from `@lowdefy/connection-mongodb/walled`). The walled connections it names are read through the same gate and redirected.
- `external` keeps its target, and its requests are sunk (below).
- Anything else refuses. A read after the session closed throws.

The tenant wall's unwalled-reach verdict (`packages/api/src/routes/connections/resolveUnwalledReach.js`) reads the build directly, so it is the same in and out of sessions.

**Sinks.** `lib/server/sinkExternalConnections.js`, wired in `createLowdefyContext`, replaces every request resolver of an `external` connection type, and any single resolver that declares `external` on its own `meta`, with a sink. Each sunk request is recorded on the data session as `{ connectionId, connectionType, requestType, requestId, pageId, endpointId, request }`, with secrets scrubbed, and `runJourney` returns the list as `sunk`.

**Origin guard.** `guardJourneyOrigin.js` fails a data set journey that sends a request to the dev server under another host (`Journey left its origin ...`).

### Click rails

On a data set run, `runJourney` sets `journey.dataSetRails` from `createDataSetRails({ buildDirectory, connections })` (`lib/docs/rails/`), with the connection plugin map from `readConnectionPlugins`. Each page's lists are read from the build once per run.

- **Before a click acts**, `checkClickRails` reads the clicked block (the nearest `#bl-` wrapper of the element the target resolved to, so `text` and `containing` targets are covered) and `findExternalBlocks` lists, per block, the connections it reaches through a `Request` or a `CallAPI` into endpoint routines that a data set cannot run. An `external` type with request resolvers is left off the list, since its requests are sunk (`isSunk`). Which declarations are refused, and the messages, are in `journey-data-sets.md`.
- **While the click runs**, `armAuthActionRecorder` (`checkAuthActionsRan.js`) installs `installAuthActionRecorder` in the page, which wraps each auth engine method listed in `authEngineMethods.js` and notes calls in session storage. After the click settles, `checkAuthActionsRan` reads the record (`readAuthActionRecorder`) and fails the step only if an auth action ran.

## Journey cookies

One helper writes and reads every cookie the dev server's headless browser sets on a journey context: `server-dev/lib/server/journeyCookies.js` re-exports `writeJourneyCookie`, `readJourneyCookie`, `forwardJourneyCookies` and `JOURNEY_COOKIES` from `lib/server/journeyCookies/`. Each value is `<token>.<payload>`, the token minted once per process (`lib/server/auth/journeyActor.js`). `readJourneyCookie` compares the prefix with `timingSafeEqual`, so a cookie from anywhere else is ignored. The production server reads none of them.

| Cookie      | Name                     | Kind     | Forwarded on loopback |
| ----------- | ------------------------ | -------- | --------------------- |
| `actor`     | `lowdefy_journey_actor`  | inline   | no                    |
| `recording` | `lowdefy_recording`      | inline   | no                    |
| `data`      | `lowdefy_journey_data`   | registry | yes                   |
| `mutant`    | `lowdefy_journey_mutant` | registry | yes                   |

An inline cookie carries its meaning (an actor's client address, a recording label); a registry cookie carries the id of an in-memory entry for one run. `createLowdefyContext` is the one writer of `context.loopbackHeaders` (`{ cookie }` of the verified forwarded cookies, `{}` when none), which a detached `CallApi` carries, so a detached hop still reads the data set and the mutant. `forwardJourneyCookies` also forwards a data cookie for a data session a dev tool call opened itself.

## The exercised path

Every journey result carries `exercised`: `pages`, `appEvents`, `requests` (with call counts), `endpoints` (nested `CallApi` targets as `via` with `calls: null`), `unfollowed` (computed endpoint ids), a `write` flag on each request and endpoint (from the request type's `meta.checkWrite`, transitive through nested endpoints), `events` and `rendered` (`collectExercised.js`, `addNestedEndpoints.js`, `addWriteFlags.js`).

- Network: one `context.on('request')` counter per actor (`createNetworkCounter`), which survives full page loads. `expect.calls` reads it.
- Page side: `createJourneyActors` exposes a `__lowdefyJourneyObserve` binding on each actor context. `client/JourneyObserver.jsx`, rendered beside `Inspector`, starts `client/journeyObserver/startJourneyObserver.js` only where that binding exists. It subscribes to the engine trace hook without state and samples visible blocks (`lib/client/collectVisibleBlockIds.js`: a shown `bl-` wrapper with size, or a Modal or Drawer while one of its `ar-<id>-<slot>` wrappers is shown) in the frame after any DOM change. The runner samples again at each settle. List indices normalise to `$`.
- `lowdefy test` keeps each journey's newest path in `.lowdefy/test/exercised.json`: `{ version: 1, buildId, journeys: { "<file>#<name>": { hash, passed, exercised } } }` (`writeExercised.js`). An entry is ignored once the journey's hash changes.

## Traces and session logs

A **trace** is JSONL of v1 records (`node-utils/src/journeyTrace/`: `validateTraceRecord`, `validateTraceEvent`, `validateTraceTarget`, `TRACE_VERSION`). Sources are `production`, `dev` and `journey`; only a `journey` record carries `run`. A record is one DOM interaction (`pageview`, `click`, `change`, `key`, `back`, `pageleave`) joined to the engine event it caused, or one `engine` record no interaction caused (scope `page` or `app`).

- `event` has three states: an object, `null` (watched, none ran) or absent (production cannot see successes; only production may leave it out, and production may not use `null`).
- A dev event lists the action types it ran (`actions`), the requests and endpoints it called (`requests`, `endpoints`, each `{ id, ok, ms }`), its state writes, invalid blocks, URL after, and error. The engine stamps the calling action's id on each `CallAPI` response, as on request calls.
- Production records carry no values and no query values (`hasQueryValues`). They carry `path_params` on page views, `frustration` (rage or dead click), and hashed person and organization ids.
- `pairTraceEvents` (`@lowdefy/helpers`) is the one rule for which interaction caused which event: an ancestor block, the latest interaction within `debounceMs + 1000` ms; mount and app events never pair; within a pair the innermost block's event comes first. The web and phone dev recorders (`@lowdefy/client-core` `recorder/createPairingBuffer.js`) and the production pull (`journeys/pull/pairFailures.js`) all call it.
- Layout: dev and journey traces are `.lowdefy/traces/<source>/<yyyy-mm-dd>/<id>.jsonl` (`lib/server/recording/appendRecords.js`); production is `.lowdefy/traces/production/<day>.jsonl` with `<day>.manifest.json` and the `salt` file. `isRecordingEnabled` reads `LOWDEFY_DEV_RECORD`; `manager/utils/startRecordingPruner.mjs` runs `pruneRecordings.mjs` over dev and journey traces at start and then hourly.

**Session logs.** The coding agent writes journeys from session logs and proves each with `lowdefy test --repeat 3`; no command writes journey files. `formatSessionLog` (`node-utils/src/sessionLog/`) validates one session's records, folds them as the compiler does (`normaliseRecords`, `segmentSession`, `foldInteractions`) and renders each through `describeLogRecord` as one line: the step's verb, target and value, then `→` what the app did. It throws unless the records hold exactly one session, and returns `{ id, start, end, lines }`. `summariseSessions`, `buildSessionReport` and `formatSessionReport` serve `lowdefy journeys session` (`cli/src/commands/journeys/session/`); with `--source dev`, `--from` and `--to` are refused. The `lowdefy_journey_session` dev tool reads the app's own dev traces (`server-dev/lib/docs/readJourneySession.js`).

**Segments.** `compileSegments` (`node-utils/src/journeyCompiler/`, pure; sources `production` and `journey`) groups records by session, filters source and window, cuts each tab into segments (`segmentSession`: 5 minutes idle, or an uncaused page view), folds DOM noise, compiles each segment to steps (`compileSegment`) and hashes its `journeySequence` (sha1, 8 hex). A segment with no interaction step is dropped. Each segment also carries its failure path, frustrations, text clicks and person, organization and role sets. Evidence refresh, coverage and the measured test run (`readMeasuredRun.js`) read it.

**Identity.** `stepIdentity` is the verb (`open` reads as `click`), the list-normalised block id, column, click text and press chord, as a JSON array. `journeySequence` is `[{ page, identity }]` per interaction step. It moves pages at `goto`, and at an `expect.url` path only through the route table (`loadRouteTable`: the build's routes and base path); steps after an `email` step are skipped until the next page move. Both take an optional `isConfigText`: with it, a click's text enters the identity only when it is config text.

## Production text

The PostHog plugin's `before_send` masks clicked text the page config does not spell out, unless `PostHogInit` sets `maskDataText: false` (see [posthog.md](../plugins/plugins/posthog.md)). On the CLI side, clicked text is never stored either. `lowdefy journeys pull posthog` (`cli/src/commands/journeys/pull/`, the HogQL query API) writes `target.text_token` and no `target.text`. `tokenText` gives `t_` and 16 hex of HMAC-SHA256 under the trace salt over `text:` and the text normalised by `normaliseClickText`. The text is `lowdefy_text`, falling back to `$el_text`. Person and organization ids are `p_` and `o_` HMACs (`hashId`). Each day manifest has `text_rule: 'token'`, the salt's `salt_id` (first 8 hex of its SHA-256, `readTraceSalt`) and the pull's filters (`project_id`, `environment`, `filter_test_accounts`). A target needs a `block_id`, a `text` or a `text_token`.

**The config text set** is every string the built config can show: page string leaves (operator arguments included), `menus.json`, every locale's i18n messages and labels, every plugin's default messages, and antd's locale strings (`en_US` for a locale with no antd name, and without i18n). The installed dev server's builder (`server-dev/lib/configTree/buildConfigTree.mjs`, collected by `collectConfigText.mjs`) writes it as `configText.json`, spawned through `cli/src/commands/journeys/configBuilder/` and shared with `journeys scope`. `readConfigText` caches it under `.lowdefy/journeys/config-text/<hash>/`, keyed on the config files (not `tests/`, `.lowdefy/`, `node_modules/`, `.git`), the `--ref-resolver` option and the builder version. A cached read costs a hash of the config files; a stale one costs a full config build.

**Resolving tokens.** `createTokenResolver`, applied per record by `resolveRecordText`, turns a token back into text only when it is the token of a known string, and always deletes `target.text`. Session logs and coverage resolve against the config text set. Evidence refresh also resolves against the click texts the committed journeys' live and deprecated flows already hold (`evidence/committedFlowTexts.js`), so a renamed label's old clicks still back the old flow. `countTextTokens` gives, per page, block and column, the clicks, distinct unresolved tokens and the top 5 tokens with persons; `profileProduction` adds them to `coverage.json` as `production.textTokens`.

**Readers.** `readProductionTrace` (async, a window with no gaps) serves production session logs and coverage through `readProductionSegments.js`: a missing day is an error naming the pull to run, and a window that mixes days pulled with different filters is refused (`checkPullFilters`). `readProductionMonths` reads whole months, gaps allowed, plus the final day just outside each month, for evidence refresh. A day hashed under another salt is read by neither: the strict reader names it missing, and `listFinalDays` leaves it out. Pull, session logs and coverage refuse a window over 30 UTC days (`parseTraceWindow` with `MINING_WINDOW_MAX_DAYS`).

**Upgrade.** `removeUntokenisedTraces` runs at the start of a pull and before every production read, evidence refresh included. When a day manifest lacks `text_rule: 'token'` it deletes those days, `tests/journeys/_candidates/production/` and `.lowdefy/test/coverage.json`. It also deletes what a stopped pull left (`.tmp` files, a day file with no manifest) once it is 10 minutes old.

## Coverage

`lowdefy journeys coverage --source production` (`journeysCoverage.js`, `coverageReport/`) writes `.lowdefy/test/coverage.json`, version 2 (`coverageReportVersion.js`; a report of another version reads as none). It holds `generated`, `source`, `window`, `flowGrouping`, five measures (interaction, flow, failure, frustration, role) with ranked uncovered lists, the production profile, each journey's sequence and an optional `mutation` score.

- Two pure functions in `node-utils/src/journeyEvidence/` carry it. `isBackedBy`: a segment backs a journey when the journey's sequence is an in-order subsequence of the segment's, from the segment's first entry on the journey's page; an empty journey sequence is never backed. `profileProduction`: ranked flows per entry page, failure paths, frustrated blocks, role sets per page, entry pages and text tokens.
- Sessions are grouped into flows only from `FLOW_GROUPING_MIN_ROWS` (100,000) rows in the window, or with `--group`; `--no-group` never groups (`decideFlowGrouping` returns `{ grouped, rows, threshold, forced }`). Ungrouped, `measures.flow` is null and `production.flows` is empty.
- `deprecated: true` journeys are left out of every measure. The role measure reads data set user names as role sets (`readJourneyDataSetUsers.js`).
- Other commands read the report instead of profiling production again: `journeys scope` uses `production.entryPoints` for app-wide changes, variants use `production.roleMatrix`, and `journeys usage` lists uncovered flows from it (`readUncoveredFlows.js`).

## Production evidence

`lowdefy journeys evidence --refresh` (`journeysEvidence.js`, `evidence/`) is the only writer of a journey's `evidence` key, and splices only that node into the file (`writeEvidenceNode`, one flow-style line per month). Without `--refresh` it prints the changes. A journey's `evidence` holds `production`, `mutation` (copied from `.lowdefy/test/mutation.json` by `readMutationReport`) and `refreshed`; `journeySchema.js` refuses any other key, and a `dev` key with a message to delete it.

`evidence.production` is `{ sequence, pageId, flow, months, deprecated? }`, each month `{ month, days, sessions, persons, orgs, failures }`.

- `days` is how many final days of the month the refresh read. `listFinalDays` returns the days whose manifest says `final: true` (the pull re-pulls today and yesterday) and whose `salt_id` is this machine's, as `{ days, otherSalt }`, and refuses a cache pulled with mixed filters.
- `sessions` counts backing segments that started in the month (`bucketByMonth` on `first_seen`); `failures` those with a failed event; `persons` and `orgs` are distinct within the month. A month read with no backing segment is written with `sessions: 0`; a month never read is absent.
- `selectMonthsToRead` picks a month where some counted flow has no entry or fewer days than the cache, every cached month for a live flow rehashed under a new matcher, and the current month (and the previous one across a month boundary). `readProductionMonths` reads them, and `compileSegments` compiles them.
- `mergeMonths` writes the cache's numbers for a month only when the cache holds more final days than the committed entry, or as many on a recount. So refreshing twice changes nothing, a fuller cache on another machine wins, and a pruned or never-pulled month keeps its committed values. With no readable final day, production evidence is kept as committed.
- The older window shape (`sessions`, `share`, `window`) still validates (`legacyProductionSchema`), and the next refresh replaces it with months.
- `formatZeroBacked` lists the journeys nothing backs over the last 3 months, beside their mutation numbers. No command removes a journey for low traffic.

**The sequence id** is `v<SEQUENCE_VERSION>-` and `hashSequence({ pageId, sequence })` (`evidence/sequenceId.js`, which exports `SEQUENCE_VERSION`, 1; `sequenceVersion.js` reads the version back out of a stored id), over `journeySequence` with `isConfigText` and the route table. `flowLines` gives the `<page> <identity>` lines it hashes, stored as `flow`; `parseFlowLines` turns them back into a sequence for `isBackedBy`, so a flow is still counted after its steps are gone.

**Deprecated flows.** `reconcileFlows` compares a journey's current id with its stored one. The same id moves nothing. Another id at the same version moves the committed months to a new `deprecated` entry `{ sequence, pageId, flow, replaced, months }` and starts the live flow empty, unless the current id equals one of the journey's deprecated entries, which becomes live again with its months. An older version (a matcher change) is rehashed without deprecating, and its months are recounted. Deprecated flows are counted on every refresh; one stored under an older version stays uncounted (`isCountedFlow`). No command deletes a deprecated entry.

## Tiers and usage

`computeTiers` (`cli/src/commands/journeys/usage/`) is the one ranking that `journeys usage` and `selectTier` read.

- **Rate.** A journey's `sessions` over the `days` of its months inside the usage window: the last N calendar months (`parseUsageWindow`, default `3m`) ending at the newest month any selected journey's live flow holds (`newestMonth`), so a run ranks over one calendar (`windowUsage`).
- **Cut.** Ranked journeys sort by rate, then file, then name. Tier pX is the shortest prefix whose summed rate reaches X% of the total (`tiers.js`: `common` 50, `wide` 80, `edge` 95, `full` 0), with journeys tied at the cut included. Every match counts, so a tier's share is a share of journey matches, not of sessions.
- **Thin data.** Fewer than 100 matches in the window (`MIN_MATCHES`), or no ranked journey with days, refuses every tier but `full`.
- **Unranked journeys** have no counts for their current flow: never refreshed, the older shape, or edited since the last refresh. `isUnranked` first compares the id read with every click text against the stored one, and only then the id read with `isConfigText`. `readTierConfigText` reads the config text set only when some live journey's id differs from its stored one, and `selectTier` skips it for tier `full`, so a full run never pays for a config build. An unranked journey is in every tier, outside the ranking and the total (`inTier.js`).

`selectTier` keeps the selected items in the tier and returns deprecated journeys as skipped. The PASS line comes from `formatEvidence`, a skipped journey's line from `formatSkippedJourney`. A tiered run is not a full-suite run, so it records nothing. The advice to run `tier: common` first and `edge` before calling a change done is one text, `TESTING_RULES` in `agentSetup/testingRules.js`, written into AGENTS.md and the `lowdefy-config` skill.

`journeys usage` (`journeysUsage.js`) selects as `lowdefy test` does, then `committedJourneys`. `buildUsageRows` adds to each `computeTiers` row `allTime { sessions, failures }`, its months and its deprecated flows with their window use. `--json` prints `{ windowMonths, anchor, matches, rows, uncovered }`, where `uncovered` is `{ window, flowGrouping, flows }` from the coverage report, or `null` when there is no report of the current version. With `--tier` and a refusal it exits 1.

## Hardening

**Replay.** `lowdefy test --repeat <n>` (1 to 10, `parseRepeat.js`) runs each journey n times (`runRepeated.js`) and `classifyRuns` marks it PASS, FLAKY or FAIL, with `phase: 'open'` for a failure at open. A refused journey fails once.

**Lint.** `lowdefy test --lint` (`cli/src/commands/test/lint/`, one file per rule, L1 to L7) reads data sets from their files and needs no server. L2 and L4 read the newest measured run from `exercised.json`. A journey with a user list is linted once (`collapsePersonas`).

**Config mutants.** `POST /lowdefy-docs/mutants` (`server-dev/src/routes/docs/mutants.js`) builds the pages first (a page that fails to build is a 422 with its errors; a page no longer in the app lists nothing), reads the build id, and lists mutants (`drop-action`, `skip-validate`, `flip-visible`, `swap-if`, `drop-payload`, `retarget-link`, `drop-block`, `drop-step`) on the artifacts a set of runs exercised. Each is addressed by `~k` within one build, with a build-independent `id`, an `anchor`, `source` and `config`. `groupMutantCopies` (`lib/server/mutants/`) folds the copies a `_ref` puts on several pages into one mutant kept on the first page, listing the rest as `copies` and `copyTargets: [{ artifact, key, anchor, pointer }]`. A journey POST with `mutant` (which may carry `pointer` and `nodeHash`, to find the node again after a page rebuild) opens a run in `mutantRuns` (a registry on `globalThis`), writes the mutant cookie on every actor, and `createMutantReadConfigFile` serves that run's requests a mutated copy of one artifact, counting `applied` and `misses`. A stale build id is a 409.

**`lowdefy journeys harden`** (`cli/src/commands/journeys/harden/`, options in `parseHardenOptions.js`):

1. `selectJourneys` leaves out journeys without `data:` with an error, and exits 1 when none is left. `--page` narrows the baseline through `exercised.json` (`narrowBaseline.js`).
2. Baseline each journey, each persona run of a journey with a user list.
3. List mutants on the union of the baselines' paths, keep those on a journey's path (`isOnPath`), and run each against the copy that journey reached (`findOnPathCopy`). Sample by sha1 of seed and id.
4. Run (mutant, journey) pairs on workers: a journey never beside itself, mail journeys alone. Verdicts are killed, survived, unapplied and error; an error runs once more. Progress lines come from `createProgress.js`, the `--list` estimate from `estimateRun.js`.
5. Carry verdicts over config edits (`carryOverVerdicts`); the third change stops the run.
6. Score and write `.lowdefy/test/mutation.json` (`buildMutationReport`): `{ version, generated, buildId, rebuilds, killed, total, sampled: { max, of, seed }, operators, mutants, journeys: [{ file, name, killed, total, unique }] }`. Each mutant is `{ id, operator, artifact, source, config, describe, copies, status, ranBy: [{ file, name, verdict, failure, misses }] }`, status one of killed, survived, unapplied, errored, changed or not run (`mutantStatus.js`). The report merges per journey (`writeMutationReport.js`, `mergeMutationReport.js`): an earlier mutant is kept only while the dev server still lists it (`requestCurrentMutantIds.js`). A `--mutant` run writes nothing.

**`lowdefy journeys variants`** (`cli/src/commands/journeys/variants/`, one generator per kind in `generators/`) writes candidates under `tests/journeys/_candidates/variants/<source>/`, each with `variant: { of, kind, detail }` and a header line holding a hash of what was generated, and replays each three times. A granted role variant skips the role sets the journey's listed users already hold.

## Pull request scope

`lowdefy journeys scope [--base <ref>] [--json]` (`cli/src/commands/journeys/scope/`, driven by `journeysScope.js`) needs no running dev server, only the installed one under `.lowdefy/dev`, which it installs first (`ensureDevServer.js`, the installer `lowdefy dev` uses, starting no server) until an install has finished (`node_modules/.lowdefy-install-hash`; a `lowdefy: local` server is left alone), and otherwise writes only its caches:

1. `pruneScopeDirectory` drops cache entries unused for 14 days.
2. `resolveRevisions`: the merge base with `--base`, the working tree as head (with a `dirty` flag).
3. `materialiseTree` writes the base commit into `.lowdefy/scope/trees/<sha>/`.
4. `buildConfigTrees` builds both with the head's builder (`server-dev/lib/configTree/buildConfigTree.mjs`), cached under `.lowdefy/scope/builds/<sha>-<builderVersion>/`; a dirty head builds into a per-run folder removed afterwards.
5. `readBuildArtifacts`, `diffBuilds` and `selectTargets` (which fills each page's `blocks` with `diffPageBlocks`). Reasons are `page`, `request:`, `endpoint:`, `connection:`, `websocket:`, `app-wide`, `base-not-built`, and `head` when there is no `--base` (`selectHeadPages`, every page but `404`). A `_ref` change shows on every page whose artifact holds it. App-wide changes target the top 3 production entry pages from `coverage.json`, else the home page (`readCoverage`).
6. `readPluginSets`, `readDataSetUsers` and `describePageRoles` (`{ access: public | signed-in | roles, roles, users: [{ dataSet, user, roles }] }`), then `createScope`.

## Agent skills

`lowdefy agent-setup` writes the journey skills from `agentSetup/skills/` (`index.js` lists them): `journeys-from-dev`, `journeys-from-production`, `journeys-from-pr` (also the bug bash, given a goal sentence), `journeys-harden` and `journeys-autopilot`. Each keeps only journeys that pass `lowdefy test --repeat 3`. The skills read session logs, scope and config and write the journeys themselves.

## Fixture app

`apps/journey-fixture` backs the real-Chromium suites (`pnpm --filter=@lowdefy/server-dev test:fixture` and `pnpm --filter=lowdefy test:fixture`; see [testing.md](../testing.md#journey-fixture-app)).

| Feature                                           | Page / data set                                             | Test                                                                    |
| ------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| App errors, failure on open                       | `explore`, `app_errors`, `app_errors_open`                  | `server-dev/test/journeyFixture/appErrors.test.mjs`                     |
| Failure at the page root                          | `explore_guarded`                                           | `pageRoot.test.mjs`                                                     |
| Strict action targets                             | `targets`                                                   | `targets.test.mjs`                                                      |
| Path params                                       | `ticket` (`tickets/{ticket_id}`)                            | `pathParams.test.mjs`                                                   |
| Step timing and settle                            | `timing`                                                    | `timing.test.mjs`                                                       |
| `expect.effect`                                   | `home`, `second`, `explore`                                 | `effect.test.mjs`                                                       |
| Click rails, sunk external request                | `rails` page and data set                                   | `rails.test.mjs`                                                        |
| Walled data-set mode                              | `walled` page and data set, `plugins/walled-fixture`        | `walled.test.mjs`                                                       |
| Object storage declared `external`                | `storage` page and data set                                 | `storage.test.mjs`                                                      |
| Generated documents                               | `generated` page and data set                               | `dataSetGenerate.test.mjs`                                              |
| A second user sees the first one's write          | `handoff` page and data set                                 | `crossUser.test.mjs`                                                    |
| Recorder and session log end to end               |                                                             | `sessionLog.test.mjs`                                                   |
| Grammar, references, observer, exercised, mutants |                                                             | `grammar`, `references`, `observer`, `exercised`, `mutants` `.test.mjs` |
| Persona runs                                      | `personas` data set                                         | `cli/test/journeyFixture/personas.test.mjs`                             |
| Selection                                         |                                                             | `cli/test/journeyFixture/select.test.mjs`                               |
| Harden, shared copies                             | `shared_alpha`, `shared_beta`, `shared/`, `harden` data set | `cli/test/journeyFixture/harden.test.mjs`                               |
| PR scope                                          | `explore_pr`                                                | `cli/test/journeyFixture/scope.test.mjs`                                |
