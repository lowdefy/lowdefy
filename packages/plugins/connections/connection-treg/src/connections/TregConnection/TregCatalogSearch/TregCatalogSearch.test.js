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

import { validate } from '@lowdefy/ajv';

import startMockTreg from '../../../test/startMockTreg.js';
import TregCatalogSearch from './TregCatalogSearch.js';

const TOKEN = 'tok_live_5ecret_value';

let mock;

beforeEach(async () => {
  mock = await startMockTreg(() => ({
    status: 200,
    body: {
      query: 'find a work email',
      count: 1,
      total: 4,
      results: [{ id: 'treg.people.email.find', kind: 'routed', cost: { usd: 0.004 } }],
      hints: [],
    },
  }));
});

afterEach(async () => {
  await mock.close();
});

test("TregCatalogSearch searches the catalog with q and limit and returns treg's answer", async () => {
  const result = await TregCatalogSearch({
    connection: { token: TOKEN, baseUrl: mock.baseUrl },
    request: { q: 'find a work email', limit: 5 },
  });
  expect(mock.requests[0].method).toBe('GET');
  expect(mock.requests[0].path).toBe('/catalog/search');
  expect(mock.requests[0].query).toEqual({ q: 'find a work email', limit: '5' });
  expect(mock.requests[0].headers['x-treg-token']).toBe(TOKEN);
  expect(result.results[0].id).toBe('treg.people.email.find');
});

test('TregCatalogSearch sends no limit when the request sets none', async () => {
  await TregCatalogSearch({
    connection: { token: TOKEN, baseUrl: mock.baseUrl },
    request: { q: 'backlinks' },
  });
  expect(mock.requests[0].query).toEqual({ q: 'backlinks' });
});

test('TregCatalogSearch throws the mapped error for a failed search', async () => {
  mock.setHandler(() => ({ status: 500, body: {} }));
  await expect(
    TregCatalogSearch({ connection: { token: TOKEN, baseUrl: mock.baseUrl }, request: { q: 'x' } })
  ).rejects.toThrow('treg: The provider answered 500 for the catalog search.');
});

test('TregCatalogSearch schema requires q and bounds limit', () => {
  const { schema } = TregCatalogSearch;
  expect(() => validate({ schema, data: {} })).toThrow(
    'TregCatalogSearch request should have required property "q".'
  );
  expect(() => validate({ schema, data: { q: 'x', limit: 101 } })).toThrow(
    'TregCatalogSearch request property "limit" should be at most 100.'
  );
  expect(validate({ schema, data: { q: 'x', limit: 100 } })).toEqual({ valid: true });
});
