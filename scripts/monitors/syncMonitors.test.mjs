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

import assert from 'node:assert/strict';
import test from 'node:test';

import syncMonitors, { NOTIFIERS_URL } from './syncMonitors.mjs';

function monitor(id) {
  return {
    id,
    description: id,
    source: null,
    status: 'active',
    rule: {
      type: 'error_rate',
      window_minutes: 5,
      threshold: 0.05,
      comparison: 'above',
      failure: { event: 'endpoint_failed', filter: { endpoint_id: 'x' } },
      total: { events: ['endpoint_completed', 'endpoint_failed'], filter: { endpoint_id: 'x' } },
    },
  };
}

function createFetch({ existing = [], notifiers = [{ id: 'n1', name: 'oncall' }] } = {}) {
  const calls = [];
  async function fetchImpl(url, options) {
    calls.push({
      url,
      method: options.method,
      body: options.body ? JSON.parse(options.body) : null,
    });
    if (options.method === 'GET') {
      return { ok: true, json: async () => (url === NOTIFIERS_URL ? notifiers : existing) };
    }
    return { ok: true, json: async () => ({ id: 'new-id' }) };
  }
  return { fetchImpl, calls };
}

// Routing is verified on every push, so a test that is not about routing names
// a notifier and keeps the assertions on what it is actually testing.
const args = {
  app: 'invoices',
  dataset: 'ds',
  token: 't',
  orgId: 'o',
  notifiers: ['oncall'],
  log: () => {},
};

test('syncMonitors creates a monitor that does not exist yet', async () => {
  const { fetchImpl, calls } = createFetch();
  const { results } = await syncMonitors({ monitors: [monitor('a')], fetchImpl, ...args });
  assert.deepEqual(
    calls.map((call) => call.method),
    ['GET', 'GET', 'POST']
  );
  assert.equal(calls[2].body.name, 'lowdefy:invoices:a');
  assert.equal(results[0].action, 'created');
});

test('syncMonitors updates in place when a monitor with the same name exists', async () => {
  const { fetchImpl, calls } = createFetch({
    existing: [{ id: 'm1', name: 'lowdefy:invoices:a', notifierIds: ['n1'] }],
  });
  const { results } = await syncMonitors({ monitors: [monitor('a')], fetchImpl, ...args });
  assert.deepEqual(
    calls.map((call) => call.method),
    ['GET', 'GET', 'PUT']
  );
  assert.equal(calls[2].url, 'https://api.axiom.co/v2/monitors/m1');
  assert.equal(results[0].action, 'updated');
});

test('syncMonitors keeps the notifiers an operator attached to an existing monitor', async () => {
  const { fetchImpl, calls } = createFetch({
    existing: [{ id: 'm1', name: 'lowdefy:invoices:a', notifierIds: ['pagerduty'] }],
    notifiers: [{ id: 'pagerduty', name: 'pager' }],
  });
  await syncMonitors({ monitors: [monitor('a')], fetchImpl, ...args, notifiers: [] });
  assert.deepEqual(calls[2].body.notifierIds, ['pagerduty']);
});

test('syncMonitors attaches the requested notifier to every monitor it pushes', async () => {
  const { fetchImpl, calls } = createFetch({
    notifiers: [
      { id: 'n1', name: 'oncall' },
      { id: 'n2', name: 'slack-alerts' },
    ],
  });
  await syncMonitors({
    monitors: [monitor('a')],
    fetchImpl,
    ...args,
    notifiers: ['oncall', 'slack-alerts'],
  });
  assert.deepEqual(calls[2].body.notifierIds, ['n1', 'n2']);
});

test('syncMonitors pushes nothing when a requested notifier does not exist in Axiom', async () => {
  const { fetchImpl, calls } = createFetch();
  await assert.rejects(
    () => syncMonitors({ monitors: [monitor('a')], fetchImpl, ...args, notifiers: ['pager'] }),
    /Axiom has no notifier "pager", requested for monitor "lowdefy:invoices:a"/
  );
  assert.deepEqual(
    calls.map((call) => call.method),
    ['GET', 'GET']
  );
});

test('syncMonitors refuses to create a monitor that would alert nobody', async () => {
  const { fetchImpl, calls } = createFetch();
  await assert.rejects(
    () => syncMonitors({ monitors: [monitor('a')], fetchImpl, ...args, notifiers: [] }),
    /Monitor "lowdefy:invoices:a" has no notifier attached: it would fire and tell nobody\./
  );
  assert.deepEqual(
    calls.map((call) => call.method),
    ['GET', 'GET']
  );
});

test('syncMonitors pushes an unrouted monitor when allowSilent is set', async () => {
  const { fetchImpl, calls } = createFetch();
  const { results } = await syncMonitors({
    monitors: [monitor('a')],
    fetchImpl,
    ...args,
    notifiers: [],
    allowSilent: true,
  });
  assert.equal(results[0].action, 'created');
  assert.deepEqual(calls[2].body.notifierIds, []);
});

test('syncMonitors fails when an existing monitor points at a deleted notifier', async () => {
  const { fetchImpl } = createFetch({
    existing: [{ id: 'm1', name: 'lowdefy:invoices:a', notifierIds: ['gone'] }],
  });
  await assert.rejects(
    () => syncMonitors({ monitors: [monitor('a')], fetchImpl, ...args, notifiers: [] }),
    /is attached to notifier "gone", which no longer exists in Axiom/
  );
});

test('syncMonitors writes no monitor at all when a later monitor fails routing', async () => {
  const { fetchImpl, calls } = createFetch({
    existing: [{ id: 'm1', name: 'lowdefy:invoices:a', notifierIds: ['n1'] }],
  });
  await assert.rejects(
    () =>
      syncMonitors({ monitors: [monitor('a'), monitor('b')], fetchImpl, ...args, notifiers: [] }),
    /Monitor "lowdefy:invoices:b" has no notifier attached/
  );
  assert.deepEqual(
    calls.filter((call) => call.method !== 'GET'),
    []
  );
});

test('syncMonitors is idempotent: a second run issues no create', async () => {
  const created = [];
  async function fetchImpl(url, options) {
    if (options.method === 'GET') {
      if (url === NOTIFIERS_URL)
        return { ok: true, json: async () => [{ id: 'n1', name: 'oncall' }] };
      return { ok: true, json: async () => created };
    }
    if (options.method === 'POST') {
      const body = JSON.parse(options.body);
      created.push({ id: `id-${created.length}`, name: body.name, notifierIds: ['n1'] });
      return { ok: true, json: async () => created[created.length - 1] };
    }
    return { ok: true, json: async () => ({}) };
  }
  const monitors = [monitor('a'), monitor('b')];
  const first = await syncMonitors({ monitors, fetchImpl, ...args });
  const second = await syncMonitors({ monitors, fetchImpl, ...args });
  assert.deepEqual(
    first.results.map((result) => result.action),
    ['created', 'created']
  );
  assert.deepEqual(
    second.results.map((result) => result.action),
    ['updated', 'updated']
  );
  assert.equal(created.length, 2);
});

test('syncMonitors skips entries that have no event to watch and reports them', async () => {
  const { fetchImpl, calls } = createFetch();
  const logged = [];
  const { results, skipped } = await syncMonitors({
    monitors: [
      { id: 'notification:welcome:delivery_failure', status: 'no-event-yet', note: 'n/a' },
    ],
    fetchImpl,
    ...args,
    log: (line) => logged.push(line),
  });
  assert.deepEqual(results, []);
  assert.deepEqual(skipped, ['notification:welcome:delivery_failure']);
  assert.deepEqual(
    calls.map((call) => call.method),
    ['GET', 'GET']
  );
  assert.match(logged[0], /^skip notification:welcome:delivery_failure \(no-event-yet\)/);
});

test('syncMonitors prints payloads and calls nothing on a dry run', async () => {
  const { fetchImpl, calls } = createFetch();
  const logged = [];
  const { results } = await syncMonitors({
    monitors: [monitor('a')],
    fetchImpl,
    ...args,
    dryRun: true,
    log: (line) => logged.push(line),
  });
  assert.deepEqual(calls, []);
  assert.equal(results[0].action, 'dry-run');
  assert.match(logged[0], /^dry-run: no call is made, so notifier routing is not resolved/);
  assert.match(logged[1], /"name": "lowdefy:invoices:a"/);
});

test('syncMonitors reports the Axiom response body when a call fails', async () => {
  async function fetchImpl() {
    return { ok: false, status: 403, text: async () => 'forbidden' };
  }
  await assert.rejects(
    () => syncMonitors({ monitors: [monitor('a')], fetchImpl, ...args }),
    /403: forbidden/
  );
});
