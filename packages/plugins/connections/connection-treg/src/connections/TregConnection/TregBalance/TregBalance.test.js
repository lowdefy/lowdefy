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
import TregBalance from './TregBalance.js';

const TOKEN = 'tok_live_5ecret_value';

const balanceBody = {
  org_id: 7,
  balance_micro: 1250000,
  balance_usd: 1.25,
  blocks: [],
  holds: [
    { call_id: 'c1', endpoint_id: 'a.b', amount_micro: 4000 },
    { call_id: 'c2', endpoint_id: 'a.c', amount_micro: 1000 },
  ],
  entries: { limit: 20, offset: 0, items: [{ id: 1, kind: 'charge', amount_micro: -4000 }] },
};

let mock;
let routes;

beforeEach(async () => {
  routes = {};
  mock = await startMockTreg((request) => routes[request.path] ?? { status: 404, body: {} });
});

afterEach(async () => {
  await mock.close();
});

test('TregBalance reads the team of a per-team token from /auth/me and returns its balance', async () => {
  routes['/auth/me'] = { status: 200, body: { email: 'bot@x', org_id: 7, org: 'acme' } };
  routes['/orgs/7/balance'] = { status: 200, body: balanceBody };
  const result = await TregBalance({
    connection: { token: TOKEN, baseUrl: mock.baseUrl },
    request: {},
  });
  expect(result).toEqual({
    orgId: 7,
    org: 'acme',
    balance: { micro: 1250000, usd: 1.25 },
    held: { micro: 5000, usd: 0.005 },
    holds: balanceBody.holds,
    entries: balanceBody.entries.items,
  });
  expect(mock.requests.map((request) => request.path)).toEqual(['/auth/me', '/orgs/7/balance']);
  expect(mock.requests[1].query).toEqual({ limit: '20' });
});

test("TregBalance finds the connection org among an identity token's teams", async () => {
  routes['/auth/me'] = { status: 200, body: { email: 'ada@x' } };
  routes['/orgs'] = {
    status: 200,
    body: [
      { org_id: 3, slug: 'other', active: true },
      { org_id: 9, slug: 'acme', active: false },
    ],
  };
  routes['/orgs/9/balance'] = { status: 200, body: { balance_micro: 0, holds: [] } };
  const result = await TregBalance({
    connection: { token: TOKEN, baseUrl: mock.baseUrl, org: 'acme' },
    request: { limit: 5 },
  });
  expect(result.orgId).toBe(9);
  expect(result.org).toBe('acme');
  expect(result.entries).toEqual([]);
  expect(mock.requests[2].headers['x-treg-org']).toBe('acme');
  expect(mock.requests[2].query).toEqual({ limit: '5' });
});

test('TregBalance uses the active team of an identity token without an org', async () => {
  routes['/auth/me'] = { status: 200, body: { email: 'ada@x' } };
  routes['/orgs'] = {
    status: 200,
    body: [
      { org_id: 3, slug: 'other', active: false },
      { org_id: 4, slug: 'main', active: true },
    ],
  };
  routes['/orgs/4/balance'] = { status: 200, body: { balance_micro: 10 } };
  const result = await TregBalance({
    connection: { token: TOKEN, baseUrl: mock.baseUrl },
    request: {},
  });
  expect(result.orgId).toBe(4);
  expect(result.holds).toEqual([]);
});

test('TregBalance asks for the org when an identity token has several teams and none is active', async () => {
  routes['/auth/me'] = { status: 200, body: { email: 'ada@x' } };
  routes['/orgs'] = {
    status: 200,
    body: [
      { org_id: 3, slug: 'a' },
      { org_id: 4, slug: 'b' },
    ],
  };
  await expect(
    TregBalance({ connection: { token: TOKEN, baseUrl: mock.baseUrl }, request: {} })
  ).rejects.toThrow('Set the TregConnection "org" to the team slug.');
});

test('TregBalance says when the token is not in the connection org', async () => {
  routes['/auth/me'] = { status: 200, body: { email: 'ada@x' } };
  routes['/orgs'] = { status: 200, body: [{ org_id: 3, slug: 'a', active: true }] };
  await expect(
    TregBalance({ connection: { token: TOKEN, baseUrl: mock.baseUrl, org: 'acme' }, request: {} })
  ).rejects.toThrow('The treg token is not a member of the team "acme".');
});

test('TregBalance throws the token error when treg rejects the token', async () => {
  routes['/auth/me'] = { status: 401, body: { detail: 'no session' } };
  await expect(
    TregBalance({ connection: { token: TOKEN, baseUrl: mock.baseUrl }, request: {} })
  ).rejects.toThrow('treg rejected the connection token (401).');
});

test('TregBalance throws when the team list or the balance can not be read', async () => {
  routes['/auth/me'] = { status: 200, body: {} };
  routes['/orgs'] = { status: 403, body: {} };
  await expect(
    TregBalance({ connection: { token: TOKEN, baseUrl: mock.baseUrl }, request: {} })
  ).rejects.toThrow('refused the call to the balance (403)');

  routes['/auth/me'] = { status: 200, body: { org_id: 7 } };
  routes['/orgs/7/balance'] = { status: 403, headers: { 'x-treg-error': '1' }, body: {} };
  await expect(
    TregBalance({ connection: { token: TOKEN, baseUrl: mock.baseUrl }, request: {} })
  ).rejects.toThrow('treg refused the call to the balance (403).');
});

test('TregBalance schema bounds limit', () => {
  const { schema } = TregBalance;
  expect(validate({ schema, data: {} })).toEqual({ valid: true });
  expect(() => validate({ schema, data: { limit: 0 } })).toThrow(
    'TregBalance request property "limit" should be at least 1.'
  );
});
