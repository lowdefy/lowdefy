An **endpoint test** is a Node test on `@lowdefy/test-utils`: it runs your app's built API endpoints and page requests as a named user, on an in-memory MongoDB, and reads the database back. It needs a build of the app and nothing else: no server, no browser and no port.

It is the escape hatch. Endpoint and server logic is a [page-less journey](/config-tests#page-less-journeys): data scope, case tables, outside answers and forced failures, races, cron and internal endpoints, and webhooks all have a journey form. Write an endpoint test only for what a journey cannot say:

- a value computed in code, where a journey would write it into a [case row](/config-tests#case-tables),
- an outside answer computed from the request, where a journey's [stub](/config-tests#stubs-and-forced-failures) answers as written,
- thousands of rows or payloads generated in code, property-based tests and scale runs,
- a check that reads below the routine's own connections, or a clock a journey cannot set.

Each test file says at its top why a journey can't express it:

```js
// tests/endpoints/activity.test.mjs
// Why not a journey: the sources are generated in code, and a stub answers from the request.
import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { openTestApp } from '@lowdefy/test-utils';

const app = await openTestApp();
let session;

before(async () => {
  session = await app.openSession({ data: 'explore' });
});
beforeEach(() => session.reset());
after(() => app.close());

test('every one of 100 generated sources is logged once', async () => {
  const sources = Array.from({ length: 100 }, (_, index) => `source-${index}`);
  for (const source of sources) {
    const answer = await session.as('member').call('log_activity', { source });
    assert.equal(answer.status, 200);
  }

  const logged = await session.collection('fixture_db').distinct('source', { kind: 'activity' });
  assert.deepEqual(logged.sort(), sources.sort());
});
```

The test calls this endpoint, which writes through the app's `fixture_db` MongoDB connection:

```yaml
# api/log_activity.yaml
id: log_activity
type: Api
routine:
  - id: insert_activity
    type: MongoDBInsertOne
    connectionId: fixture_db
    properties:
      doc:
        kind: activity
        source:
          _payload: source
  - ':return':
      logged: true
```

It runs on a [data set](/journey-data-sets), the same `tests/data/` files journeys use, so one data set serves both kinds of test:

```yaml
# tests/data/explore.yaml
fixtures:
  fixture_db:
    - { _id: item-1, kind: item, page: home, name: Fixture item }
users:
  member: { id: u_member, roles: [member] }
```

## Setting up

Add `@lowdefy/test-utils` to the app's dev dependencies, at the Lowdefy version in `lowdefy.yaml`, and a script that builds and then runs the tests:

```json
{
  "scripts": {
    "test:endpoints": "lowdefy build --no-client-build && node --test --test-concurrency=4 'tests/endpoints/**/*.test.mjs'"
  }
}
```

- **`lowdefy build --no-client-build`** builds the config and installs the server. It leaves out the client bundle, which no endpoint test opens.
- **`node --test`** is Node's own test runner. It runs each test file in a process of its own. The harness only returns values, so another runner works too.
- **`--test-concurrency=4`** runs four files at a time. A test process of a small app uses about 260 MB, and four at a time ran 20 files in under 9 seconds. Node's default of one process per core was about a fifth faster for more than twice the memory.
- Run the script from the app's config directory, the folder that holds `lowdefy.yaml`.

The first run downloads a MongoDB binary once. Set `MONGOMS_VERSION` to match your cluster's MongoDB version.

## A config edit needs a build first

Endpoint tests run the build, not your YAML files. After a config edit, build before you run them, as the script above does. A build takes about 10 seconds for a small app and more than a minute for a large one, so endpoint tests are too slow to run after every edit:

- **While editing**, call the endpoint or request on the running dev server, with the `lowdefy_run_endpoint` and `lowdefy_run_request` [agent tools](/ai-agent-docs). Pass `user` and `data` to act as a data set user on a database of its own.
- **Before you call a change done**, run the endpoint tests once.

`openTestApp` refuses a build that is older than a config file, and names the command to run. **This check is best effort.** It compares the build's time with the root `lowdefy.yaml` and every file a `_ref` loaded in that build. It does not see:

- a plugin that changed,
- an environment value the build read (`_build.env`) that changed,
- anything a ref resolver reads.

When one of those changed, build yourself. A run that builds first, as the script and CI do, is never stale.

`openTestApp` also refuses a missing build, and a build of another Lowdefy version than the installed `@lowdefy/test-utils`.

## Opening the app

`openTestApp(options)` loads the build once per test file. Every option is optional:

| Option            | Description                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `configDirectory` | The folder that holds `lowdefy.yaml`. Default: the working directory.                            |
| `serverDirectory` | The built server. Default: `<configDirectory>/.lowdefy/server`, where `lowdefy build` writes it. |
| `secrets`         | Values for the app's secrets, by name. See [Secrets](#secrets).                                  |

It returns the app:

| Call                        | Description                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| `app.openSession({ data })` | Opens a [session](#sessions) on fresh databases, loaded with the data set `data` names.        |
| `app.close()`               | Ends the app's sessions, drops their databases and closes its connections. Call it in `after`. |

## Sessions

A session is a set of fresh in-memory databases, one for each database your connections name, loaded with the data set `tests/data/<data>.yaml`. Leave `data` out for empty databases.

Calling, failing, stubbing and holding have a journey form: `call` and `request` steps, `as: system`, `webhook`, `stubs` and `hold`. Use them from code only in a test that is code for another reason.

Open one session per file and call `session.reset()` before each test. Resetting is several times cheaper than opening a new session. Each test file has databases of its own, so files never see each other's writes.

| Call                                                            | Description                                                                                                                                                                         |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session.as(user)`                                              | A caller. `user` is the name of a user in the data set, a user object such as `{ id: 'u1', roles: ['admin'] }`, or `'none'` for a signed out caller.                                |
| `session.as(user).call(endpointId, payload)`                    | Calls an API endpoint.                                                                                                                                                              |
| `session.as(user).request(pageId, requestId, payload)`          | Calls a page request.                                                                                                                                                               |
| `session.as(user).page(path)`                                   | What the page route decides for a path.                                                                                                                                             |
| `session.system().call(endpointId, payload)`                    | Calls an endpoint as a scheduled or detached run does: no user, the endpoint's `auth` is not checked, and an `InternalApi` endpoint can be called.                                  |
| `session.collection(connectionId)`                              | The MongoDB driver's collection behind a `MongoDBCollection` connection. It reads what is stored, past the tenant wall.                                                             |
| `session.seed(connectionId, docs)`                              | Inserts documents as given, for what a test builds on top of its data set.                                                                                                          |
| `session.sunk`                                                  | The requests to outside services, in order. See [Outside services](#outside-services).                                                                                              |
| `session.webhook(endpointId, { body, query, headers })`         | Posts to a `webhook` endpoint as its sender does, so its `verify` gate runs. `body` is sent as raw text: a string as written, anything else as JSON.                                |
| `session.stub(connectionType, requestType, fn)`                 | Answers a request type with a function of the test's own.                                                                                                                           |
| `session.fail({ requestId, endpoint, pageId, message, times })` | Makes the next matching request throw with `message` before it runs, on any connection. `times` fails the next n, or `'all'`.                                                       |
| `session.unfiredFailGates()`                                    | The fail gates no request has reached yet, as `{ requestId, endpoint, pageId, message, times }`.                                                                                    |
| `session.pauseBefore(stepId)`                                   | Holds a routine before a request step, for a test of two calls that race.                                                                                                           |
| `session.settled()`                                             | Waits for background work, such as the routine of an `async: true` endpoint. A server answers before that work ends, so wait here before reading what it wrote.                     |
| `session.reset()`                                               | Puts the databases back to the data set, empties `sunk` and the fail gates, and releases held routines. Stubs stay. Throws, after resetting, naming any fail gate that never fired. |

The examples below go in the same file as the first test, so they share its `app` and `session`.

### Answers

`call` and `request` resolve to the same object, whether the call worked or not. They never throw for what the app answered.

| Field      | Description                                                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `status`   | The HTTP status a server would answer: 200, 400 for a payload the endpoint's `payloadSchema` refuses, 401 signed out, 403 refused, 500 for a fault.     |
| `success`  | `true` when the endpoint or request succeeded.                                                                                                          |
| `response` | What the endpoint returned, or the request's response, as the client reads it. `null` when it failed.                                                   |
| `error`    | The error as the client reads it, or `null`.                                                                                                            |
| `body`     | The JSON body a server would send.                                                                                                                      |
| `faults`   | The errors a server would log, each with its `message` and the config `source` it came from. One the routine's own `:catch` handled has `caught: true`. |

The app runs in production mode, as a deployed server does. So the `error` of a fault carries a generic message, and the real message is in `faults`:

```js
test('a failing routine names the config line that failed', async () => {
  const answer = await session.as('member').call('explode');
  assert.equal(answer.success, false);
  assert.equal(answer.faults.length, 1);
  assert.equal(answer.faults[0].source, 'api/explode.yaml:6');
  assert.match(answer.faults[0].message, /MongoDBAggregation/);
});
```

Payloads and answers pass through the serializer and JSON, as they do between a browser and a server, so a date in a payload arrives as a date.

### Page requests

`request(pageId, requestId, payload)` runs a page's request. `payload` is what the page would send: the request's `payload` config, which a browser evaluates. No page is open in a test, so pass the values the request's `_payload` operators read. `seed` adds documents the data set does not hold:

```js
test('the notes page reads back a saved note', async () => {
  await session.seed('fixture_db', [
    { _id: 'n1', kind: 'handoff', note: 'Seeded', written_by: 'u_seed' },
  ]);
  await session.as('member').request('handoff', 'save_note', { note: 'Ship on Friday' });

  const notes = await session.as('member').request('handoff', 'get_notes');
  assert.deepEqual(
    notes.response.map((note) => [note.note, note.written_by]),
    [
      ['Seeded', 'u_seed'],
      ['Ship on Friday', 'u_member'],
    ]
  );
});
```

`page(path)` answers `{ status, pageId, pathParams }`. `status` is `ok`, `not_found`, `unauthenticated`, `unauthorized`, `enrol_required` or `wrong_surface`. It says whether a caller may open one path. What the page shows is a journey's to test.

```js
test('a ticket path opens the ticket page', async () => {
  assert.deepEqual(await session.as('member').page('/tickets/42'), {
    status: 'ok',
    pageId: 'ticket',
    pathParams: { ticket_id: '42' },
  });
});
```

### Outside services

A test never reaches a real service. Each connection does what its type declares for a data set, [as under a journey](/journey-data-sets#how-a-journey-reaches-its-database):

| Connection type                                                               | In an endpoint test                                                                                         |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `MongoDBCollection`                                                           | Reads and writes the session's database.                                                                    |
| Outside services: HTTP APIs, email, payments, AI providers, object storage    | The request is checked against its schema, recorded in `session.sunk`, and answers `null`. Nothing is sent. |
| A plugin type that declares `walled`                                          | Runs unchanged. The `MongoDBCollection` connections it names read and write the session's database.         |
| A type that declares nothing: `Knex`, `Redis`, `Elasticsearch`, `GoogleSheet` | Refused, naming the connection.                                                                             |

Each record in `sunk` is `{ connectionId, connectionType, requestType, requestId, pageId, endpointId, request }`:

```js
test('the hook is recorded, not sent', async () => {
  const answer = await session.as('member').request('rails', 'call_external');
  assert.equal(answer.response, null);
  assert.equal(session.sunk.length, 1);
  assert.equal(session.sunk[0].connectionId, 'rails_external');
  assert.deepEqual(session.sunk[0].request, { url: '/hook' });
});
```

`null` breaks a routine that reads the answer. A journey's `stubs` answer as written; `session.stub(connectionType, requestType, fn)` computes the answer from the request. `fn` is called with the record `sunk` holds, and what it returns is the request's response. What it throws is the request's failure.

```js
test('a stub answers for the outside service', async () => {
  session.stub('AxiosHttp', 'AxiosHttp', ({ request }) => ({
    status: 200,
    data: { echoed: request.url },
  }));
  const answer = await session.as('member').request('rails', 'call_external');
  assert.deepEqual(answer.response, { status: 200, data: { echoed: '/hook' } });
});
```

- A stub stays for the rest of the session, through `reset()`. Set it once for a file's tests.
- A stubbed request is still recorded in `sunk`.
- A stub on a type that declares nothing lets that request type through, and only that one.

### Secrets

Real secrets are never read. When the app opens, `LOWDEFY_SECRET_*` and `CRON_SECRET` are removed from the test process's environment. Every secret the build names gets the value `test-secret-<NAME>`, so connections still pass their schema. `openTestApp({ secrets: { NAME: 'value' } })` replaces a value by name, for a routine that reads one.

### System runs and races

A journey runs these with `call` `as: system` and with `hold` and `release`. In code, `session.system().call` runs an endpoint that no user calls, such as a scheduled routine or an `InternalApi` endpoint. It waits for the routine and answers its result:

```js
test('the detached log writes as the system', async () => {
  const answer = await session.system().call('detached_log');
  assert.deepEqual(answer.response, { logged: true });
});
```

`session.pauseBefore(stepId)` holds the next routine that reaches a request step, just before the request runs. It returns `{ reached, release }`: `reached` resolves once a routine is held, and `release()` lets it go on. One gate holds one routine, so a second call runs straight through. `stepId` is the id of a request step in an endpoint routine, or a page request's id. Other steps, such as `CallApi`, are not held.

```js
test('a second call finishes while the first is held', async () => {
  const gate = session.pauseBefore('insert_activity');
  const first = session.as('member').call('log_activity', { source: 'first' });
  await gate.reached;

  await session.as('member').call('log_activity', { source: 'second' });
  const items = session.collection('fixture_db');
  assert.equal(await items.countDocuments({ kind: 'activity' }), 1);

  gate.release();
  await first;
  assert.equal(await items.countDocuments({ kind: 'activity' }), 2);
});
```

### Assertions

Any assertion library works. `@lowdefy/test-utils/assert` adds two that fit answers and stored documents, with no dependencies:

- `assertEquals(actual, expected)` passes when the two are equal at every depth.
- `assertMatches(actual, expected)` passes when `actual` holds everything `expected` names. An object may carry more keys, so a test names only the fields it is about.

Both take matchers in `expected`: `any(Type)`, `anything()`, `objectContaining(object)`, `arrayContaining(array)` and `stringMatching(pattern)`.

```js
import { any, assertMatches, stringMatching } from '@lowdefy/test-utils/assert';

test('the stored activity has an id and its source', async () => {
  await session.as('member').call('log_activity', { source: 'import' });
  const logged = await session.collection('fixture_db').findOne({ kind: 'activity' });
  assertMatches(logged, { _id: any(Object), source: stringMatching(/^imp/) });
});
```

## The access table

Who can reach which page and endpoint is checked by `tests/access.yaml`, which `lowdefy test` compares with the build. Do not snapshot it in an endpoint test. See [the access table](/access-table).

## What endpoint tests do not cover

- **The HTTP server, sessions and the auth engine.** Callers are injected, so nothing signs in, and a step that calls the auth engine fails. Test sign-up and sign-in with a [journey](/config-tests#testing-sign-up-and-sign-in).
- **The client.** Blocks, actions, operators the browser evaluates and what a page shows are a journey's to test.
- **Atlas Search.** The in-memory MongoDB has no `$search`.
- **Agents and detached calls.** No agent is loaded, so an agent call fails and no model provider is reached. A `CallApi` with `detached: true` fails for want of `CRON_SECRET`. Call the endpoint it starts with `session.system().call`. A routine that catches the failure answers as usual, with the fault listed as `caught: true`.
- **Code that reaches out without a connection.** A plugin's own `fetch` is not sunk and reaches the real service.
- **Development mode.** The app runs in production mode only.

## Data store

Under `node --test`, every test file of a run shares one in-memory `mongod`, each file on databases of its own. It stops when the runner exits, also when the runner is killed. Under another runner, each test process starts its own.
