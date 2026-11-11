# @lowdefy/test-utils

Runs a built Lowdefy app's authorization gate, API endpoints and page requests inside a Node test,
and holds the data session code journeys run on.

**Source:** `packages/utils/test-utils/`
**User docs:** `packages/docs/testing/endpoint-tests.md`
**How to run its tests:** [testing.md](../testing.md#endpoint-test-harness)

## Purpose

An app installs it as a dev dependency and writes endpoint tests: Node tests that call the app's
built endpoints and requests as a named user, on an in-memory MongoDB, and read the database back.
It gives a test level below journeys, for logic, permissions and writes, which need no browser.
[testing.md](../testing.md#test-levels) says which level proves what.

| Export       | Holds                                                                                                 | Used by                          |
| ------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------- |
| `.`          | `openTestApp`: the access table and endpoint test sessions                                            | an app's tests                   |
| `./assert`   | `assertEquals`, `assertMatches` and matchers, with no imports beyond Node                             | an app's tests, under any runner |
| `./dataSets` | the data store, data sessions, the `tests/data` loaders and the gate connections pass under a session | `@lowdefy/server-dev` (journeys) |

## Decisions it is built on

- **In process, on a production build.** A test calls `callEndpoint`, `callRequest`,
  `runDetachedEndpoint` and `getPageConfig` from `@lowdefy/api` in its own process, with
  `mode: 'prod'`. No server starts and no port is used. The cost is a build after every config
  edit, so the edit loop stays on the dev server (`lowdefy_run_endpoint` with `user` and `data`)
  and endpoint tests run once before a change is called done. The agent rules say so
  (`packages/cli/src/commands/agentSetup/testingRules.js`).
- **Access is checked at the gate, not over HTTP.** The access table asks `authorizeOutcome`, which
  the page and endpoint routes both ask. It gives up the redirect a browser sees and which surface
  serves a page.
- **One implementation of data sessions.** Journeys and endpoint tests load data sets and gate
  connections with the code in `src/dataSets/`. The rules fail closed, and two copies would drift.
  The dev server still starts and owns the journey data store.
- **The server's own packages.** Everything that touches the build loads from
  `<serverDirectory>/node_modules`, never from this package's dependencies.

## `openTestApp`

`openTestApp({ configDirectory, serverDirectory, secrets })` (`src/openTestApp.js`):

1. `removeSecretsFromEnv` deletes `LOWDEFY_SECRET_*` and `CRON_SECRET` from `process.env`, before
   any package or plugin loads.
2. `getDirectories` resolves the config directory (default: the working directory) and the server
   directory (default: `<config>/.lowdefy/server`). The build does not record where its config
   is, and the stale check and `tests/data` both need it.
3. `checkBuildExists` refuses a build with no `appMeta.json`, or a server with no `node_modules`.
4. `importServerModule` loads `@lowdefy/helpers` from the server's install, for the serializer.
   It requires the package in `<server>/node_modules` itself, since Node's resolution would go on
   to folders above the server and to `NODE_PATH`, and load another copy.
5. `checkBuildVersion` refuses when `appMeta.lowdefyVersion` differs from this package's version.
   `local` (an app on a Lowdefy checkout) is not compared, as in the CLI.
6. `checkBuildFresh` refuses when the root `lowdefy.yaml` or a file `refMap.json` lists is newer
   than `refMap.json`. **Best effort**: it does not see a changed plugin, an environment value read
   at build (`_build.env`) or what a ref resolver reads, since the build's inputs cannot all be
   listed.
7. `@lowdefy/api` and `@lowdefy/errors` load from the server's install.

Every refusal names `lowdefy build --no-client-build` (`buildCommand.js`). The harness reads only
`build/` and the server's `node_modules`, so it takes a build of `@lowdefy/server` or
`@lowdefy/server-e2e`.

The plugin maps, built config and test secrets load at the first session (`loadSessionRuntime`),
so an app opened only for the access table does not pay for them.

## The access table

`app.accessMatrix({ data })` (`src/accessMatrix.js`) needs no session, database or plugin map:

- Users come from the data set with `parseDataSet` (`@lowdefy/node-utils`), plus a signed out
  caller, `none`.
- `createCallerGate` builds each caller's gate with `createInjectedApiContext` (`@lowdefy/api`),
  which sets the organization policy and the gate's enforcement facts from the built `auth.json`,
  as the dev and e2e servers do for an injected caller.
- `readAccessConfig` lists every page from `routes.json` and every endpoint from `api/*.json`.
- `getEndpointOutcome` answers `deny` for an `InternalApi` endpoint without asking the gate.
  `callEndpoint` refuses one before the gate, and most are built `auth.public: true`, so the
  gate's answer would read `allow`.
- Keys are sorted (`sortByKey`), so the table is the same on every run and fits a snapshot.

An outcome is `allow`, `deny` or `enrol_required`. A data set user gets `enrol_required` only when
it carries `two_factor_enrolled: false`.

## Sessions

`app.openSession({ data })` (`src/openSession.js`) reads the data set (`readDataSet`, or
`readEmptyDataSet` without `data`), joins the run's data store (`getSessionStore`) and opens a
data session on it (`openDataSession`): one database per database target, indexes first, then
generated documents and fixtures.

### A call

`session.as(user).call`, `.request` and `session.system().call` all go through `answerCall`,
which runs one `@lowdefy/api` call in a context of its own, as a server runs one request.

`createCallContext` builds that context with the fields the production server's middleware sets
(`packages/servers/server/src/middleware/apiContext.js`). What differs:

| Field         | In a test                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------- |
| caller        | Injected by `createInjectedApiContext`. No auth engine runs, so auth steps fail.                  |
| `connections` | The app's real map, behind the data session's gate and sink (`createSessionConnections`).         |
| `secrets`     | `test-secret-<NAME>` for every secret the build names, with `openTestApp({ secrets })` over them. |
| `agents`      | Empty, so an agent call fails before it reaches a model provider.                                 |
| origin        | None, and `CRON_SECRET` is gone, so a `detached: true` `CallApi` fails.                           |
| `waitUntil`   | `trackSessionWork`, which `session.settled()` and `reset()` wait on.                              |
| `handleError` | `createFaultSink`: lists the fault on the answer's `faults`, with its config `source`.            |

The answer is `{ status, success, response, error, body, faults }`:

- `createResultAnswer` answers a call the route would answer 200. A routine that failed is a 200
  with `success: false`.
- `createErrorAnswer` answers a call that threw. An expected outcome takes its status from
  `expectedAnswers` in `@lowdefy/errors`, the table the servers' error handlers read. Anything
  else is a fault: 500, with the redacted error the wire carries.
- `toWirePayload` passes the payload through the serializer and JSON, as a client and route do.
- In production mode `error.message` of a fault is generic. The real message is in `faults`.

`session.system().call` passes `runDetachedEndpoint` a system principal: no user, endpoint auth
passes and `InternalApi` is callable. It waits for the routine and answers 200 with its result,
where the detached route answers 202 first.

`session.as(user).page(path)` answers `{ status, pageId, pathParams }` from `getPageConfig` and
leaves the page config out.

### Connections

The harness adds no rule of its own to what a connection type's `meta.dataSet` declares
(`createSessionConnections.js`, over `sinkExternalConnections` and `applyDataSetRedirect`):

| Declaration | Under a session                                                                |
| ----------- | ------------------------------------------------------------------------------ |
| `redirect`  | Session database merged over the connection's properties (`MongoDBCollection`) |
| `walled`    | Runs unchanged; the walled connections it names are redirected                 |
| `external`  | Validated, recorded in `session.sunk`, answers `null`                          |
| none        | Refused, naming the connection                                                 |

The one exception is a stub. `session.stub(connectionType, requestType, fn)` answers that request
type (`createStubResolver`), and on an undeclared type it lets the type through the gate with
every other request type refusing (`createRefusingResolver`). A stub is called with the record
`sunk` holds, never the connection's properties, which hold its credentials. The real resolver's
`schema` and `meta` stay on the stub, so the request is still validated.

### Pause gates

`session.pauseBefore(stepId)` holds request steps only. `holdAtStep` wraps every request resolver:
the first routine to reach a step with a waiting gate stops with its request built and not yet
sent. `@lowdefy/api` has no hook before a `CallApi` or control step. One gate holds one routine,
so a test can run a second call through the same step.

### Reset and close

`session.reset()` releases held routines, waits for background work, empties every collection and
loads the data set again (`reloadDataSession`), and empties `sunk`. Collections and indexes are
kept, which is what makes it several times cheaper than a new session. Stubs stay.

`app.close()` ends the sessions, closes the MongoDB plugin's driver clients (`closeClients` from
`@lowdefy/connection-mongodb/clients`, loaded from the server's install) and this app's client on
the data store. The store itself stops with the run.

## Data sessions (`./dataSets`)

`src/dataSets/` holds what moved from `server-dev`: the data store (`getDataStore` for the dev
server, `getRunDataStore` for a test run), `openDataSession`, `readDataSet` and the loaders, and
the gate (`applyDataSetRedirect`, `createDataSetRefusal`, `sinkExternalConnections`,
`trackSessionWork`). The journey cookie, `readDataSession` and `resolveJourneyDataSet` stay in
`server-dev`. See "Data sets" in [journeys.md](../architecture/journeys.md) for the rules, and
[The data store of a test run](../testing.md#the-data-store-of-a-test-run) for the one `mongod`
the files of a `node --test` run share.

## Assertions (`./assert`)

`assertEquals` (equal at every depth) and `assertMatches` (actual holds everything expected names)
share `compareValues`. The matchers `any`, `anything`, `objectContaining`, `arrayContaining` and
`stringMatching` stand for the values they accept. The entry imports no package, not even
`@lowdefy/helpers`, so a test file can use it under any runner.

## Docs samples

Every code sample on the user docs page runs in `test/fixtureApps/docsSamples.test.mjs`, part of
`test:fixture`. The test reads the page, writes its `js` samples as test files into a copy of the
built `apps/journey-fixture`, and runs them with the script and the snapshot command the page
gives. So the page uses that app's ids, and its rules are in the test's first comment: a `js`
sample that calls `openTestApp` is a whole file starting with its path, any other `js` sample
joins the file before it, and a `yaml` sample names the app file it must match. Change the page
and run `pnpm --filter=@lowdefy/test-utils test:fixture docsSamples`.
