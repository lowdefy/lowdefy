/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { afterAll, beforeAll, beforeEach, expect, test, vi } from 'vitest';

import openTestApp from '../../src/openTestApp.js';
import copyFixtureApp from './copyFixtureApp.mjs';
import fixtureApps from './fixtureApps.mjs';
import writeSessionFixtures from './writeSessionFixtures.mjs';

// Endpoint test sessions over real builds: the app's endpoints and requests run in this
// process, on the run's data store (this worker's own: no `node --test` runner started it).
// `fixture` is apps/journey-fixture as built; `changed` is a copy of that build with what the
// app does not have (writeSessionFixtures); `tenant` is apps/auth-reference-tenant.

const auditor = { id: 'u_auditor', roles: ['auditor'] };
const detachedMessage =
  'CallApi with "detached: true" requires the CRON_SECRET environment variable — the /api/detached route fails closed without it.';

let copy;
let fixture;
let changed;
let tenant;

async function readAll(session, connectionId, query = {}) {
  const collection = await session.collection(connectionId);
  return collection.find(query).sort({ _id: 1 }).toArray();
}

beforeAll(async () => {
  fixture = await openTestApp(fixtureApps.journeyFixture);
  tenant = await openTestApp(fixtureApps.authReferenceTenant);
  copy = copyFixtureApp({ app: fixtureApps.journeyFixture });
  writeSessionFixtures(copy);
  changed = await openTestApp(copy);
});

beforeEach(() => {
  globalThis.testLedgerReached = [];
});

afterAll(async () => {
  await Promise.all([fixture, changed, tenant].map((app) => app?.close()));
  copy?.remove();
  vi.unstubAllEnvs();
});

// apps/journey-fixture

test('a call as an allowed role writes to the session database, and the test reads it back', async () => {
  const session = await changed.openSession({ data: 'explore' });
  const at = new Date('2026-05-06T07:08:09Z');
  const answer = await session.as(auditor).call('log_activity', { source: at });
  expect(answer).toEqual({
    status: 200,
    success: true,
    response: { logged: true },
    error: null,
    body: { response: { logged: true }, status: 'success', success: true },
    faults: [],
  });
  const written = await readAll(session, 'fixture_db', { kind: 'activity' });
  expect(written).toHaveLength(1);
  // The payload went through the serializer and JSON, as over the wire: the date is a date.
  expect(written[0].source).toEqual(at);
});

test('the same call as another role answers 403 and signed out 401, with nothing written', async () => {
  const session = await changed.openSession({ data: 'explore' });
  const refused = await session.as('member').call('log_activity', { source: 'member' });
  expect(refused.status).toEqual(403);
  expect(refused.success).toBe(false);
  expect(refused.response).toBeNull();
  expect(refused.error.name).toEqual('AuthorizationError');
  // A refusal reveals nothing: the same message as an endpoint that does not exist.
  expect(refused.body).toEqual({
    name: 'AuthorizationError',
    message: 'API Endpoint "log_activity" does not exist.',
  });
  expect(refused.faults).toEqual([]);

  const signedOut = await session.as('none').call('log_activity', { source: 'none' });
  expect(signedOut.status).toEqual(401);
  expect(signedOut.error.name).toEqual('AuthenticationError');

  expect(await readAll(session, 'fixture_db', { kind: 'activity' })).toEqual([]);
});

test('reset restores the data set, empties sunk and keeps the session usable', async () => {
  const session = await fixture.openSession({ data: 'explore' });
  const dataSet = [{ _id: 'item-1', kind: 'item', page: 'home', name: 'Fixture item' }];
  expect(await readAll(session, 'fixture_db')).toEqual(dataSet);

  const collection = await session.collection('fixture_db');
  await session.as('member').call('log_activity', { source: 'before reset' });
  await session.as('member').request('rails', 'call_external');
  await collection.deleteOne({ _id: 'item-1' });
  await collection.updateMany({}, { $set: { touched: true } });
  expect(session.sunk).toHaveLength(1);

  await session.reset();
  expect(await readAll(session, 'fixture_db')).toEqual(dataSet);
  expect(session.sunk).toEqual([]);

  const again = await session.as('member').call('log_activity', { source: 'after reset' });
  expect(again.status).toEqual(200);
  expect(await collection.countDocuments()).toEqual(2);
});

test('two sessions of one app have databases of their own', async () => {
  const first = await fixture.openSession({ data: 'explore' });
  const second = await fixture.openSession();
  await first.as('member').call('log_activity', { source: 'first' });
  expect(await (await first.collection('fixture_db')).countDocuments()).toEqual(2);
  expect(await (await second.collection('fixture_db')).countDocuments()).toEqual(0);
  expect((await first.collection('fixture_db')).dbName).not.toEqual(
    (await second.collection('fixture_db')).dbName
  );
  expect((await first.collection('fixture_db')).dbName).toMatch(
    new RegExp(`^ld_p${process.pid}_[0-9a-f]{12}_0$`)
  );
});

test('seed adds documents a page request reads, and collection reads what a request wrote', async () => {
  const session = await fixture.openSession({ data: 'handoff' });
  await session.seed('fixture_db', [
    { _id: 'n1', kind: 'handoff', note: 'seeded', written_by: 'u_seed' },
  ]);
  const saved = await session.as('writer').request('handoff', 'save_note', { note: 'from writer' });
  expect(saved.status).toEqual(200);
  const read = await session.as('reader').request('handoff', 'get_notes');
  expect(read.success).toBe(true);
  expect(read.response.map(({ note, written_by: writtenBy }) => [note, writtenBy])).toEqual([
    ['seeded', 'u_seed'],
    ['from writer', 'u_writer'],
  ]);
  expect(await readAll(session, 'fixture_db', { written_by: 'u_writer' })).toHaveLength(1);
  await expect(session.seed('fixture_db', { _id: 'n2' })).rejects.toThrow(
    'seed takes an array of documents.'
  );
  await expect(session.collection('rails_external')).rejects.toThrow(
    'Connection "rails_external" (type AxiosHttp) has no collection to read'
  );
  await expect(session.collection('nope')).rejects.toThrow(
    'Connection "nope" is not a connection in this app.'
  );
});

test('as refuses a user the data set does not have, and takes a user object in its place', async () => {
  const session = await fixture.openSession({ data: 'explore' });
  expect(() => session.as('auditor')).toThrow(
    'User "auditor" is not in data set "explore". Its users are "member".'
  );
  const admitted = await session.as(auditor).call('auditor_only');
  expect(admitted.response).toEqual({ admitted: true });
  expect((await session.as('member').call('auditor_only')).status).toEqual(403);
});

test('page answers what the page route decides for a path', async () => {
  const session = await fixture.openSession({ data: 'explore' });
  expect(await session.as('member').page('/tickets/42')).toEqual({
    status: 'ok',
    pageId: 'ticket',
    pathParams: { ticket_id: '42' },
  });
  expect(await session.as('none').page('no-such-page')).toEqual({
    status: 'not_found',
    pageId: null,
    pathParams: null,
  });
});

test("a payload the endpoint schema refuses is the caller's mistake, a 400", async () => {
  const session = await fixture.openSession();
  const refused = await session.as(auditor).call('typed_order', { quantity: 'three' });
  expect(refused.status).toEqual(400);
  expect(refused.error.name).toEqual('UserError');
  expect(refused.faults).toEqual([]);
  expect((await session.as(auditor).call('typed_order', { quantity: 3 })).response).toEqual({
    ordered: true,
  });
});

test('a routine that fails answers 200 with success false, and the fault names the config line', async () => {
  const session = await fixture.openSession({ data: 'explore' });
  const answer = await session.as('member').call('explode');
  expect(answer.status).toEqual(200);
  expect(answer.success).toBe(false);
  // Production mode: the wire carries the error's name and a generic message.
  expect(answer.error.name).toEqual('RequestError');
  expect(answer.error.message).not.toContain('MongoDB');
  expect(answer.faults).toHaveLength(1);
  expect(answer.faults[0].message).toContain('MongoDB rejected the MongoDBAggregation command');
  expect(answer.faults[0].source).toEqual('api/explode.yaml:6');
});

// Refusals

test('a real MongoDB URI in the environment is never read: it is removed, and the write lands in the session database', async () => {
  // Nothing listens on port 9: a request that read this URI would fail to connect.
  vi.stubEnv('LOWDEFY_SECRET_FIXTURE_DATABASE_URI', 'mongodb://127.0.0.1:9/production');
  vi.stubEnv('LOWDEFY_SECRET_LEDGER_PASSWORD', 'the-real-password');
  const app = await openTestApp(copy);
  expect(process.env.LOWDEFY_SECRET_FIXTURE_DATABASE_URI).toBeUndefined();
  expect(process.env.LOWDEFY_SECRET_LEDGER_PASSWORD).toBeUndefined();
  const session = await app.openSession({ data: 'explore' });

  const secrets = await session.as('member').call('read_secrets');
  expect(secrets.response).toEqual({
    database: 'test-secret-FIXTURE_DATABASE_URI',
    ledger: 'test-secret-LEDGER_PASSWORD',
    unnamed: 'test-secret-REPORTS_TOKEN',
  });

  const written = await session.as(auditor).call('log_activity', { source: 'safe' });
  expect(written.status).toEqual(200);
  expect(written.faults).toEqual([]);
  expect(await readAll(session, 'fixture_db', { source: 'safe' })).toHaveLength(1);
  await app.close();
});

test('openTestApp secrets replace the stand-ins by name', async () => {
  const app = await openTestApp({ ...copy, secrets: { LEDGER_PASSWORD: 'ledger-test-value' } });
  const session = await app.openSession();
  expect((await session.as('none').call('read_secrets')).response).toEqual({
    database: 'test-secret-FIXTURE_DATABASE_URI',
    ledger: 'ledger-test-value',
    unnamed: 'test-secret-REPORTS_TOKEN',
  });
  await app.close();
});

test('a connection type that declares nothing refuses, naming the connection, and its resolver never runs', async () => {
  const session = await changed.openSession({ data: 'explore' });
  const answer = await session.as('member').request('ledger', 'query_ledger', { account: 'A-1' });
  // A page request has no routine to catch the refusal: it is a fault, a 500.
  expect(answer.status).toEqual(500);
  expect(answer.success).toBe(false);
  expect(answer.error.name).toEqual('ConfigError');
  expect(answer.faults).toHaveLength(1);
  expect(answer.faults[0].message).toEqual(
    'Connection "ledger" (type TestLedger) cannot run under data set "explore": its type does not say how to redirect it.'
  );
  expect(globalThis.testLedgerReached).toEqual([]);
  expect(session.sunk).toEqual([]);

  // A session opened without a data set refuses the same way.
  const empty = await changed.openSession();
  const refused = await empty.as('none').request('ledger', 'query_ledger', { account: 'A-1' });
  expect(refused.faults[0].message).toContain(
    'Connection "ledger" (type TestLedger) cannot run under data set "(no data set)"'
  );
});

test('a stub on an undeclared type answers that request type and lets no other request type through', async () => {
  const session = await changed.openSession({ data: 'explore' });
  session.stub('TestLedger', 'TestLedgerQuery', ({ request }) => [
    { account: request.account, balance: 125 },
  ]);

  const read = await session.as('member').request('ledger', 'query_ledger', { account: 'A-1' });
  expect(read.success).toBe(true);
  expect(read.response).toEqual([{ account: 'A-1', balance: 125 }]);
  expect(session.sunk).toEqual([
    {
      connectionId: 'ledger',
      connectionType: 'TestLedger',
      requestType: 'TestLedgerQuery',
      requestId: 'query_ledger',
      pageId: 'ledger',
      endpointId: null,
      request: { account: 'A-1' },
    },
  ]);

  const posted = await session.as('member').call('post_ledger', { amount: 5 });
  expect(posted.success).toBe(false);
  expect(posted.faults[0].message).toEqual(
    'Connection "ledger" (type TestLedger) cannot run under data set "explore": its type does not say how to redirect it, and request type "TestLedgerPost" has no stub.'
  );
  expect(globalThis.testLedgerReached).toEqual([]);
  expect(() => session.stub('Knex', 'KnexRaw', () => [])).toThrow(
    'Connection type "Knex" is not used by this app.'
  );
});

test('an external request is recorded in sunk and answers null, or what its stub answers', async () => {
  const session = await fixture.openSession({ data: 'rails' });
  const sunk = await session.as('member').request('rails', 'call_external');
  expect(sunk).toEqual({
    status: 200,
    success: true,
    response: null,
    error: null,
    body: { id: 'request:rails:call_external', success: true, type: 'AxiosHttp', response: null },
    faults: [],
  });
  const record = {
    connectionId: 'rails_external',
    connectionType: 'AxiosHttp',
    requestType: 'AxiosHttp',
    requestId: 'call_external',
    pageId: 'rails',
    endpointId: null,
    request: { url: '/hook' },
  };
  expect(session.sunk).toEqual([record]);

  session.stub('AxiosHttp', 'AxiosHttp', async ({ request }) => ({
    status: 200,
    data: { echoed: request.url },
  }));
  const stubbed = await session.as('member').request('rails', 'call_external');
  expect(stubbed.response).toEqual({ status: 200, data: { echoed: '/hook' } });
  expect(session.sunk).toEqual([record, record]);

  // The stub's failure is the request's failure.
  session.stub('AxiosHttp', 'AxiosHttp', () => {
    throw new Error('connect ECONNREFUSED');
  });
  const failed = await session.as('member').request('rails', 'call_external');
  expect(failed.status).toEqual(500);
  expect(failed.success).toBe(false);
  expect(failed.faults).toHaveLength(1);
});

test('an agent call fails with its message: no agent type is loaded, so no model provider is reached', async () => {
  const session = await changed.openSession();
  const answer = await session.as('none').call('ask_helper', { question: 'Is it done?' });
  expect(answer.status).toEqual(200);
  expect(answer.success).toBe(false);
  expect(answer.response).toBeNull();
  expect(answer.faults).toHaveLength(1);
  expect(answer.faults[0].name).toEqual('ConfigError');
  expect(answer.faults[0].message).toEqual('Agent type "Agent" can not be found.');
  expect(session.sunk).toEqual([]);
});

test('a detached CallApi fails with its message, CRON_SECRET having been removed, and its target never runs', async () => {
  vi.stubEnv('CRON_SECRET', 'the-real-cron-secret');
  const app = await openTestApp(fixtureApps.journeyFixture);
  expect(process.env.CRON_SECRET).toBeUndefined();
  const session = await app.openSession({ data: 'explore' });
  const answer = await session.as('member').call('notify');
  expect(answer.status).toEqual(200);
  expect(answer.success).toBe(false);
  expect(answer.faults).toHaveLength(1);
  expect(answer.faults[0].message).toEqual(detachedMessage);
  expect(answer.faults[0].source).toEqual('api/notify.yaml:12');
  await session.settled();
  // The step before the detached one ran; the detached target did not.
  expect(await readAll(session, 'fixture_db', { kind: 'activity' })).toHaveLength(1);
  expect(await readAll(session, 'fixture_db', { kind: 'detached' })).toEqual([]);
  await app.close();
});

// Races, background work and system runs

test('pauseBefore holds a routine at a step while a second call runs, then releases it', async () => {
  const session = await fixture.openSession({ data: 'explore' });
  const gate = session.pauseBefore('insert_activity');
  const held = session.as('member').call('log_activity', { source: 'held' });
  await gate.reached;

  // The second call runs to its end, through the same step, while the first one waits.
  const second = await session.as('member').call('log_activity', { source: 'second' });
  expect(second.status).toEqual(200);
  const whileHeld = await readAll(session, 'fixture_db', { kind: 'activity' });
  expect(whileHeld.map((activity) => activity.source)).toEqual(['second']);

  gate.release();
  expect((await held).response).toEqual({ logged: true });
  const sources = (await readAll(session, 'fixture_db', { kind: 'activity' })).map(
    (activity) => activity.source
  );
  expect(sources.sort()).toEqual(['held', 'second']);
});

test('reset releases a routine a test left held, so the next test starts clean', async () => {
  const session = await fixture.openSession({ data: 'explore' });
  const gate = session.pauseBefore('insert_activity');
  const held = session.as('member').call('log_activity', { source: 'left held' });
  await gate.reached;
  await session.reset();
  expect((await held).status).toEqual(200);
  const again = await session.as('member').call('log_activity', { source: 'next test' });
  expect(again.status).toEqual(200);
});

test('settled waits for the background work of an async endpoint', async () => {
  const session = await changed.openSession({ data: 'explore' });
  const gate = session.pauseBefore('insert_slow');
  const answer = await session.as('member').call('slow_log');
  expect(answer.status).toEqual(200);
  expect(answer.response).toEqual({ accepted: true });
  await gate.reached;
  expect(await readAll(session, 'fixture_db', { kind: 'slow' })).toEqual([]);

  gate.release();
  await session.settled();
  expect(await readAll(session, 'fixture_db', { kind: 'slow' })).toHaveLength(1);
  expect(answer.faults).toEqual([]);
});

test('system runs an InternalApi endpoint with no user, which no caller can call', async () => {
  const session = await changed.openSession({ data: 'explore' });
  const asAuditor = await session.as(auditor).call('nightly', { night: 'mon' });
  // As a missing endpoint: a fault for a signed in caller, a 401 signed out.
  expect(asAuditor.status).toEqual(500);
  expect(asAuditor.faults[0].message).toEqual('API Endpoint "nightly" does not exist.');
  expect((await session.as('none').call('nightly', { night: 'mon' })).status).toEqual(401);
  expect(await readAll(session, 'fixture_db', { kind: 'nightly' })).toEqual([]);

  const ran = await session.system().call('nightly', { night: 'tue' });
  expect(ran.status).toEqual(200);
  expect(ran.response).toEqual({ ran: true });
  const written = await readAll(session, 'fixture_db', { kind: 'nightly' });
  expect(written).toHaveLength(1);
  expect(written[0].night).toEqual('tue');
  expect(written[0].ran_by).toBeNull();
});

test('a session of a closed app refuses calls', async () => {
  const app = await openTestApp(fixtureApps.journeyFixture);
  const session = await app.openSession({ data: 'explore' });
  const caller = session.as('member');
  await app.close();
  await expect(caller.call('log_activity')).rejects.toThrow('The session is closed');
  await expect(session.reset()).rejects.toThrow('The session is closed');
  await expect(app.openSession()).rejects.toThrow('The test app is closed.');
});

// apps/auth-reference-tenant: organizations policy tenant, the notes connection behind the wall.

test('a caller with no organization is refused by the tenant wall, and nothing is written', async () => {
  const session = await tenant.openSession({ data: 'roles' });
  const refused = await session
    .as({ id: 'u_no_org', roles: [] })
    .request('notes', 'add_note', { text: 'no organization' });
  expect(refused.status).toEqual(401);
  expect(refused.success).toBe(false);
  expect(refused.error.message).toEqual(
    'Request "add_note" writes to tenant connection "notes" but no caller organization resolved. Strategy callers and callers with no active organization carry none - the wall fails closed for them.'
  );
  expect(await readAll(session, 'notes')).toEqual([]);
});

test('a stamped write carries the tenant stamp, and another organization does not read it', async () => {
  const session = await tenant.openSession({ data: 'roles' });
  const added = await session.as('member').request('notes', 'add_note', { text: 'ours' });
  expect(added.status).toEqual(200);
  const stored = await readAll(session, 'notes');
  expect(stored).toHaveLength(1);
  expect(stored[0].text).toEqual('ours');
  expect(stored[0].organization_id).toEqual('org_a');

  const own = await session.as('workspace_admin').request('notes', 'get_notes');
  expect(own.response.map((note) => note.text)).toEqual(['ours']);
  const other = await session
    .as({ id: 'u_other', roles: [], organization_id: 'org_b' })
    .request('notes', 'get_notes');
  expect(other.status).toEqual(200);
  expect(other.response).toEqual([]);
});

test('page answers the gate of a protected app for each caller', async () => {
  const session = await tenant.openSession({ data: 'roles' });
  expect((await session.as('none').page('/notes')).status).toEqual('unauthenticated');
  expect((await session.as('member').page('/workspace-settings')).status).toEqual('unauthorized');
  expect((await session.as('workspace_admin').page('/workspace-settings')).status).toEqual('ok');
  expect((await session.as('none').request('notes', 'get_notes')).status).toEqual(401);
});
