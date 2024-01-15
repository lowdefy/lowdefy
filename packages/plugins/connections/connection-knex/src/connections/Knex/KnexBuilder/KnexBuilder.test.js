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

const mockKnexClient = jest.fn(() => mockKnexClient);
const mockKnex = jest.fn(() => mockKnexClient);

mockKnexClient.select = jest.fn(() => mockKnexClient);
mockKnexClient.from = jest.fn(() => mockKnexClient);
mockKnexClient.where = jest.fn(() => mockKnexClient);

jest.unstable_mockModule('knex', () => {
  return {
    default: mockKnex,
  };
});

const connection = {
  client: 'pg',
  connection: 'connection',
};

test('KnexBuilder with tableName', async () => {
  const knex = (await import('knex')).default;
  const KnexBuilder = (await import('./KnexBuilder.js')).default;
  mockKnexClient.where.mockImplementationOnce(() =>
    Promise.resolve([
      {
        name: 'steve',
      },
    ])
  );
  const request = {
    query: [{ select: ['*'] }, { where: ['name', 'steve'] }],
    tableName: 'table',
  };
  const res = await KnexBuilder({ request, connection });
  expect(knex.mock.calls).toEqual([
    [
      {
        client: 'pg',
        connection: 'connection',
      },
    ],
  ]);
  expect(mockKnexClient.mock.calls).toEqual([['table']]);
  expect(mockKnexClient.select.mock.calls).toEqual([['*']]);
  expect(mockKnexClient.where.mock.calls).toEqual([['name', 'steve']]);
  expect(res).toEqual([
    {
      name: 'steve',
    },
  ]);
});

test('KnexBuilder', async () => {
  const knex = (await import('knex')).default;
  const KnexBuilder = (await import('./KnexBuilder.js')).default;
  mockKnexClient.where.mockImplementationOnce(() =>
    Promise.resolve([
      {
        name: 'steve',
      },
    ])
  );
  const request = {
    query: [{ select: ['*'] }, { from: ['table'] }, { where: ['name', 'steve'] }],
  };
  const res = await KnexBuilder({ request, connection });
  expect(knex.mock.calls).toEqual([
    [
      {
        client: 'pg',
        connection: 'connection',
      },
    ],
  ]);
  expect(mockKnexClient.select.mock.calls).toEqual([['*']]);
  expect(mockKnexClient.from.mock.calls).toEqual([['table']]);
  expect(mockKnexClient.where.mock.calls).toEqual([['name', 'steve']]);
  expect(res).toEqual([
    {
      name: 'steve',
    },
  ]);
});

test('KnexBuilder, invalid method', async () => {
  const KnexBuilder = (await import('./KnexBuilder.js')).default;
  const request = {
    query: [{ invalid: ['*'] }],
  };
  await expect(KnexBuilder({ request, connection })).rejects.toThrow(
    'Invalid query builder method "invalid".'
  );
});

test('KnexBuilder, more than one method', async () => {
  const KnexBuilder = (await import('./KnexBuilder.js')).default;
  const request = {
    query: [{ select: ['*'], where: ['name', 'steve'] }],
  };
  await expect(KnexBuilder({ request, connection })).rejects.toThrow(
    'Invalid query, more than one method defined in a method object, received ["select","where"].'
  );
});

test('KnexBuilder, method args not an array', async () => {
  const KnexBuilder = (await import('./KnexBuilder.js')).default;
  const request = {
    query: [{ select: '*' }],
  };
  await expect(KnexBuilder({ request, connection })).rejects.toThrow(
    'Invalid query, method "select" arguments should be an array, received "*".'
  );
});

test('valid request', async () => {
  const KnexBuilder = (await import('./KnexBuilder.js')).default;
  const schema = KnexBuilder.schema;
  let request = {
    query: [{ select: ['*'] }, { from: ['table'] }],
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
  request = {
    query: [{ select: ['*'] }],
    tableName: 'table',
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
  request = {
    query: [{ select: ['*'] }],
    tableName: { t: 'table' },
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('query missing', async () => {
  const KnexBuilder = (await import('./KnexBuilder.js')).default;
  const schema = KnexBuilder.schema;
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'KnexBuilder request should have required property "query".'
  );
});

test('checkRead should be false', async () => {
  const KnexBuilder = (await import('./KnexBuilder.js')).default;
  const { checkRead } = KnexBuilder.meta;
  expect(checkRead).toBe(false);
});

test('checkWrite should be false', async () => {
  const KnexBuilder = (await import('./KnexBuilder.js')).default;
  const { checkWrite } = KnexBuilder.meta;
  expect(checkWrite).toBe(false);
});
