/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { validate } from '@lowdefy/ajv';

const mockRaw = jest.fn(() => {
  return Promise.resolve({ rows: [{ name: 'name' }], _types: 'types' });
});

jest.unstable_mockModule('knex', () => {
  return {
    default: jest.fn(() => ({
      raw: mockRaw,
    })),
  };
});

const request = {
  query: 'SELECT * FROM "table" WHERE "name" = :name',
  parameters: { name: 'name' },
};
const connection = {
  client: 'pg',
  connection: 'connection',
};

test('knexRaw', async () => {
  const knex = (await import('knex')).default;
  const KnexRaw = (await import('./KnexRaw.js')).default;
  const res = await KnexRaw({ request, connection });
  expect(knex.mock.calls).toEqual([
    [
      {
        client: 'pg',
        connection: 'connection',
      },
    ],
  ]);
  expect(mockRaw.mock.calls).toEqual([
    [
      'SELECT * FROM "table" WHERE "name" = :name',
      {
        name: 'name',
      },
    ],
  ]);
  expect(res).toEqual({
    rows: [
      {
        name: 'name',
      },
    ],
  });
});

test('valid request', async () => {
  const KnexRaw = (await import('./KnexRaw.js')).default;
  const schema = KnexRaw.schema;
  let request = {
    query: 'SELECT * FROM "table"',
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
  request = {
    query: 'SELECT * FROM "table" WHERE "name" = :name',
    parameters: { name: 'name' },
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
  request = {
    query: 'SELECT * FROM "table" WHERE "name" = ?',
    parameters: ['name'],
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('query missing', async () => {
  const KnexRaw = (await import('./KnexRaw.js')).default;
  const schema = KnexRaw.schema;
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'KnexRaw request should have required property "query".'
  );
});

test('checkRead should be false', async () => {
  const KnexRaw = (await import('./KnexRaw.js')).default;
  const { checkRead } = KnexRaw.meta;
  expect(checkRead).toBe(false);
});

test('checkWrite should be false', async () => {
  const KnexRaw = (await import('./KnexRaw.js')).default;
  const { checkWrite } = KnexRaw.meta;
  expect(checkWrite).toBe(false);
});
