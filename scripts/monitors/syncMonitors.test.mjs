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

import syncMonitors from './syncMonitors.mjs';

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

function createFetch({ existing = [] } = {}) {
  const calls = [];
  async function fetchImpl(url, options) {
    calls.push({
      url,
      method: options.method,
      body: options.body ? JSON.parse(options.body) : null,
    });
    if (options.method === 'GET') {
      return { ok: true, json: async () => existing };
    }
    return { ok: true, json: async () => ({ id: 'new-id' }) };
  }
  return { fetchImpl, calls };
}

const args = { app: 'invoices', dataset: 'ds', token: 't', orgId: 'o', log: () => {} };

test('syncMonitors creates a monitor that does not exist yet', async () => {
  const { fetchImpl, calls } = createFetch();
  const { results } = await syncMonitors({ monitors: [monitor('a')], fetchImpl, ...args });
  assert.deepEqual(
    calls.map((call) => call.method),
    ['GET', 'POST']
  );
  assert.equal(calls[1].body.name, 'lowdefy:invoices:a');
  assert.equal(results[0].action, 'created');
});

test('syncMonitors updates in place when a monitor with the same name exists', async () => {
  const { fetchImpl, calls } = createFetch({
    existing: [{ id: 'm1', name: 'lowdefy:invoices:a', notifierIds: ['n1'] }],
  });
  const { results } = await syncMonitors({ monitors: [monitor('a')], fetchImpl, ...args });
  assert.deepEqual(
    calls.map((call) => call.method),
    ['GET', 'PUT']
  );
  assert.equal(calls[1].url, 'https://api.axiom.co/v2/monitors/m1');
  assert.equal(results[0].action, 'updated');
});

test('syncMonitors keeps the notifiers an operator attached to an existing monitor', async () => {
  const { fetchImpl, calls } = createFetch({
    existing: [{ id: 'm1', name: 'lowdefy:invoices:a', notifierIds: ['pagerduty'] }],
  });
  await syncMonitors({ monitors: [monitor('a')], fetchImpl, ...args });
  assert.deepEqual(calls[1].body.notifierIds, ['pagerduty']);
});

test('syncMonitors is idempotent: a second run issues no create', async () => {
  const created = [];
  async function fetchImpl(url, options) {
    if (options.method === 'GET') return { ok: true, json: async () => created };
    if (options.method === 'POST') {
      const body = JSON.parse(options.body);
      created.push({ id: `id-${created.length}`, name: body.name, notifierIds: [] });
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
    ['GET']
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
  assert.match(logged[0], /"name": "lowdefy:invoices:a"/);
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
