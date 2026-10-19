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
import TregCatalogGet from './TregCatalogGet.js';

const TOKEN = 'tok_live_5ecret_value';

let mock;
let connection;

beforeEach(async () => {
  mock = await startMockTreg((request) => {
    if (request.path.endsWith('/access')) {
      return {
        status: 200,
        body: { tier: 'platform', estimated_cost_micro: 4000, estimated_cost_usd: 0.004 },
      };
    }
    return {
      status: 200,
      body: { id: 'treg.people.email.find', kind: 'routed', params: { full_name: {} } },
    };
  });
  connection = { token: TOKEN, baseUrl: mock.baseUrl };
});

afterEach(async () => {
  await mock.close();
});

test('TregCatalogGet reads one catalog endpoint', async () => {
  const result = await TregCatalogGet({
    connection,
    request: { endpoint: 'treg.people.email.find' },
  });
  expect(mock.requests.map((request) => request.path)).toEqual([
    '/catalog/endpoints/treg.people.email.find',
  ]);
  expect(result).toEqual({
    id: 'treg.people.email.find',
    kind: 'routed',
    params: { full_name: {} },
  });
});

test("TregCatalogGet adds the team's access and price with access: true", async () => {
  const result = await TregCatalogGet({
    connection,
    request: { endpoint: 'treg.people.email.find', access: true },
  });
  expect(mock.requests.map((request) => request.path)).toEqual([
    '/catalog/endpoints/treg.people.email.find',
    '/catalog/endpoints/treg.people.email.find/access',
  ]);
  expect(mock.requests[1].headers['x-treg-token']).toBe(TOKEN);
  expect(result.access).toEqual({
    tier: 'platform',
    estimated_cost_micro: 4000,
    estimated_cost_usd: 0.004,
  });
});

test("TregCatalogGet throws treg's unknown-endpoint answer", async () => {
  mock.setHandler(() => ({
    status: 404,
    headers: { 'x-treg-error': '1' },
    body: { detail: { error: "unknown endpoint 'nope'", did_you_mean: [] } },
  }));
  await expect(TregCatalogGet({ connection, request: { endpoint: 'nope' } })).rejects.toThrow(
    `treg answered 404 for "nope": unknown endpoint 'nope'`
  );
});

test('TregCatalogGet throws when the access read fails', async () => {
  mock.setHandler((request) =>
    request.path.endsWith('/access') ? { status: 401, body: {} } : { status: 200, body: {} }
  );
  await expect(
    TregCatalogGet({ connection, request: { endpoint: 'a.b', access: true } })
  ).rejects.toThrow('treg rejected the connection token (401).');
});

test('TregCatalogGet schema only accepts endpoint ids', () => {
  const { schema } = TregCatalogGet;
  expect(() => validate({ schema, data: { endpoint: '../orgs/1/balance' } })).toThrow(
    'TregCatalogGet request property "endpoint" should be a treg endpoint id'
  );
  expect(() => validate({ schema, data: {} })).toThrow(
    'TregCatalogGet request should have required property "endpoint".'
  );
});
