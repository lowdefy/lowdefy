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

import { jest } from '@jest/globals';

import createAxiomAdapter from './createAxiomAdapter.js';

function createFetch(body, { ok = true, status = 200 } = {}) {
  return jest.fn(async () => ({
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }));
}

test('createAxiomAdapter posts APL to the legacy endpoint with the read token', async () => {
  const fetchImpl = createFetch({ matches: [] });
  const adapter = createAxiomAdapter({
    url: 'https://api.axiom.co/',
    token: 'read-only',
    dataset: 'lowdefy-prod',
    fetchImpl,
  });
  await adapter.query({ where: [['event', 'eq', 'request_failed']], limit: 5 });
  const [url, init] = fetchImpl.mock.calls[0];
  expect(url).toBe('https://api.axiom.co/v1/datasets/_apl?format=legacy');
  expect(init.headers.Authorization).toBe('Bearer read-only');
  expect(JSON.parse(init.body).apl).toBe(
    "['lowdefy-prod'] | where event == 'request_failed' | order by _time asc | limit 5"
  );
});

test('createAxiomAdapter flattens the legacy matches envelope into rows', async () => {
  const adapter = createAxiomAdapter({
    url: 'https://api.axiom.co',
    token: 't',
    dataset: 'd',
    fetchImpl: createFetch({
      matches: [{ _time: '2026-09-01T09:00:00Z', data: { event: 'request_failed', rid: 'r1' } }],
    }),
  });
  await expect(adapter.query({})).resolves.toEqual([
    { event: 'request_failed', rid: 'r1', _time: '2026-09-01T09:00:00Z' },
  ]);
});

test('createAxiomAdapter flattens the legacy buckets envelope into groups', async () => {
  const adapter = createAxiomAdapter({
    url: 'https://api.axiom.co',
    token: 't',
    dataset: 'd',
    fetchImpl: createFetch({
      buckets: {
        totals: [
          {
            group: { config_key: 'key-a' },
            aggregations: [{ op: 'count', value: 7 }],
          },
        ],
      },
    }),
  });
  await expect(
    adapter.aggregate({ group_by: ['config_key'], metrics: ['count'] })
  ).resolves.toEqual([{ config_key: 'key-a', count: 7 }]);
});

test('createAxiomAdapter surfaces the sink status and body on a failed query', async () => {
  const adapter = createAxiomAdapter({
    url: 'https://api.axiom.co',
    token: 't',
    dataset: 'd',
    fetchImpl: createFetch({ message: 'forbidden' }, { ok: false, status: 403 }),
  });
  await expect(adapter.query({})).rejects.toThrow('Ops sink query failed with 403');
});
