---
'@lowdefy/test-utils': minor
---

feat(test-utils): Endpoint test sessions

A test can now run an app's built endpoints and page requests in its own process, as a named user, on an in-memory MongoDB, and read the database back. It needs a build and no server, browser or port.

```js
import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { openTestApp } from '@lowdefy/test-utils';

const app = await openTestApp();
let session;
before(async () => {
  session = await app.openSession({ data: 'billing' });
});
beforeEach(() => session.reset());
after(() => app.close());

test('finance approves a run', async () => {
  const answer = await session.as('finance').call('billing-run-approve', { id: 'BR-1' });
  assert.equal(answer.status, 200);
  assert.equal(answer.error, null);
  const run = await session.collection('billing-runs').findOne({ _id: 'BR-1' });
  assert.equal(run.stage, 'approved');
});
```

Run it with `lowdefy build --no-client-build && node --test --test-concurrency=4 'tests/endpoints/**/*.test.mjs'`.

- `app.openSession({ data })` opens fresh databases, loaded with a `tests/data` data set, the files journeys use. `session.reset()` puts them back between tests.
- `session.as(user)` takes a data set user's name, a user object or `none`, and gives `call(endpointId, payload)`, `request(pageId, requestId, payload)` and `page(path)`. `session.system().call(endpointId, payload)` runs an endpoint as a cron or detached system run does, `InternalApi` endpoints included.
- `call` and `request` answer `{ status, success, response, error, body, faults }`: the HTTP status a server would give, the answer as the client reads it, the JSON body, and the faults a server would log, each with its message and config location. Payloads and answers pass through the serializer and JSON, as over the wire. The app runs in production mode, so a fault's message is in `faults`, not in `error`.
- Connections follow what their type declares, as under a journey: MongoDB reads and writes the session's databases, a request to an outside service is recorded in `session.sunk` and answers `null`, and a type that declares nothing is refused. `session.stub(connectionType, requestType, fn)` answers a request type instead; on an undeclared type it lets only that request type through.
- Real secrets are never read: `LOWDEFY_SECRET_*` and `CRON_SECRET` are removed from the test process's environment when the app opens, and every secret the build names gets the value `test-secret-<NAME>`, which `openTestApp({ secrets })` replaces by name. Agents are not loaded, so an agent call fails, and a `detached: true` `CallApi` fails for want of `CRON_SECRET`.
- `session.collection(connectionId)` and `session.seed(connectionId, docs)` reach a connection's collection through the MongoDB driver. `session.pauseBefore(stepId)` holds a routine before a request step, for a test of two calls that race, and `session.settled()` waits for `async: true` work.
- One `mongod` serves every test file of a run and stops when the runner does, also when it is killed.

`@lowdefy/test-utils/assert` adds `assertEquals`, `assertMatches` and the matchers `any`, `anything`, `objectContaining`, `arrayContaining` and `stringMatching`, with no dependencies.
