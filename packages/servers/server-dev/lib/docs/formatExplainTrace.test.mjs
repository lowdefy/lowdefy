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

import formatExplainTrace from './formatExplainTrace.js';

const user = { id: 'u1', organization_id: 'org_a', roles: ['admin'], email: 'u1@example.com' };
const secrets = {
  API_TOKEN: 'tok_abcdefghijklmnop',
  DB_URI: 'mongodb+srv://user:pw@cluster/app',
  SHORT: 'dev',
};

test('formatExplainTrace floors the caller to id, organization_id and roles', () => {
  const explain = formatExplainTrace({
    trace: { rewritten: [], dispatched: true, effective: {} },
    user,
  });
  expect(explain.caller).toEqual({ id: 'u1', organization_id: 'org_a', roles: ['admin'] });
});

test('formatExplainTrace redacts a resolved secret nested in a request header', () => {
  const explain = formatExplainTrace({
    trace: {
      rewritten: [],
      dispatched: true,
      requestType: 'AxiosHttp',
      properties: {
        url: 'https://api.example.com/v1/orders',
        headers: {
          Authorization: 'Bearer tok_abcdefghijklmnop',
          'x-api-key': 'tok_abcdefghijklmnop',
        },
        data: [{ uri: 'mongodb+srv://user:pw@cluster/app' }],
      },
    },
    secrets,
    user,
  });
  expect(explain.properties).toEqual({
    url: 'https://api.example.com/v1/orders',
    headers: {
      Authorization: 'Bearer [redacted secret]',
      'x-api-key': '[redacted secret]',
    },
    data: [{ uri: '[redacted secret]' }],
  });
});

test('formatExplainTrace redacts a resolved secret in the effective query', () => {
  const explain = formatExplainTrace({
    trace: {
      rewritten: [],
      dispatched: true,
      requestType: 'MongoDBFind',
      effective: { filter: { token: 'tok_abcdefghijklmnop' } },
    },
    secrets,
    user,
  });
  expect(explain.effective).toEqual({ filter: { token: '[redacted secret]' } });
});

test('formatExplainTrace leaves a value that merely contains a short secret alone', () => {
  const explain = formatExplainTrace({
    trace: {
      rewritten: [],
      dispatched: true,
      properties: { collection: 'dev_orders', env: 'dev' },
    },
    secrets,
    user,
  });
  // A short secret occurs by chance; only an exact match is redacted.
  expect(explain.properties).toEqual({ collection: 'dev_orders', env: '[redacted secret]' });
});

test('formatExplainTrace names the request type, not the connection type, when no effective query is reported', () => {
  const explain = formatExplainTrace({
    trace: { rewritten: [], dispatched: true, requestType: 'MongoDBFind' },
    requestType: 'MongoDBCollection',
    user,
  });
  expect(explain.effective).toBeNull();
  expect(explain.note).toBe('Request type MongoDBFind does not report an effective query.');
});

test('formatExplainTrace says the request did not reach the driver when the run failed before the resolver', () => {
  const explain = formatExplainTrace({
    trace: { rewritten: [], requestType: 'MongoDBFind' },
    user,
  });
  expect(explain.effective).toBeNull();
  expect(explain.note).toBe(
    'The request did not reach the driver — it failed before the resolver ran, so there is no effective query.'
  );
});

test('formatExplainTrace keeps the step id first for an endpoint step trace', () => {
  const explain = formatExplainTrace({
    trace: { stepId: 'find_orders', rewritten: [], dispatched: true, effective: {} },
    user,
  });
  expect(Object.keys(explain)[0]).toBe('stepId');
  expect(explain.note).toBeUndefined();
});
