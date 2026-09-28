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

const mockKnex = jest.fn(() => ({
  client: { connectionSettings: {} },
  destroy: jest.fn(() => Promise.resolve()),
}));

jest.unstable_mockModule('knex', () => ({ default: mockKnex }));

const { default: getKnex, destroyKnexClients } = await import('./getKnex.js');

afterEach(async () => {
  await destroyKnexClients();
  mockKnex.mockClear();
});

test('getKnex reuses one knex instance for requests with the same connection config', () => {
  const first = getKnex({ client: 'pg', connection: 'postgres://host/db' });
  const second = getKnex({ client: 'pg', connection: 'postgres://host/db' });
  expect(second).toBe(first);
  expect(mockKnex).toHaveBeenCalledTimes(1);
});

test('getKnex creates separate knex instances for different connection configs', () => {
  const first = getKnex({ client: 'pg', connection: 'postgres://host/one' });
  const second = getKnex({ client: 'pg', connection: 'postgres://host/two' });
  expect(second).not.toBe(first);
  expect(mockKnex).toHaveBeenCalledTimes(2);
});

test('getKnex does not cache a connection config that createKnex rejects', () => {
  expect(() => getKnex({ client: 'sqlite3', connection: { filename: './db.sqlite' } })).toThrow(
    'no longer supported'
  );
  expect(() => getKnex({ client: 'sqlite3', connection: { filename: './db.sqlite' } })).toThrow(
    'no longer supported'
  );
});

test('destroyKnexClients destroys every cached pool and clears the cache', async () => {
  const client = getKnex({ client: 'pg', connection: 'postgres://host/db' });
  await destroyKnexClients();
  expect(client.destroy).toHaveBeenCalledTimes(1);
  getKnex({ client: 'pg', connection: 'postgres://host/db' });
  expect(mockKnex).toHaveBeenCalledTimes(2);
});
