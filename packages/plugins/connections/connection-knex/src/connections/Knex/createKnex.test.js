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

const mockKnex = jest.fn(() => ({}));

jest.unstable_mockModule('knex', () => ({ default: mockKnex }));

beforeEach(() => {
  mockKnex.mockClear();
});

test('createKnex passes pg connection through unchanged', async () => {
  const createKnex = (await import('./createKnex.js')).default;
  const connection = { client: 'pg', connection: 'connection' };
  createKnex(connection);
  expect(mockKnex.mock.calls).toEqual([[{ client: 'pg', connection: 'connection' }]]);
});

test('createKnex remaps client "sqlite" to "better-sqlite3"', async () => {
  const createKnex = (await import('./createKnex.js')).default;
  createKnex({ client: 'sqlite', connection: { filename: './db.sqlite' } });
  expect(mockKnex.mock.calls).toEqual([
    [{ client: 'better-sqlite3', connection: { filename: './db.sqlite' } }],
  ]);
});

test('createKnex passes "better-sqlite3" through unchanged', async () => {
  const createKnex = (await import('./createKnex.js')).default;
  createKnex({ client: 'better-sqlite3', connection: { filename: './db.sqlite' } });
  expect(mockKnex.mock.calls).toEqual([
    [{ client: 'better-sqlite3', connection: { filename: './db.sqlite' } }],
  ]);
});

test('createKnex throws for client "sqlite3" with migration message', async () => {
  const createKnex = (await import('./createKnex.js')).default;
  expect(() => createKnex({ client: 'sqlite3', connection: { filename: './db.sqlite' } })).toThrow(
    'Knex connection "client: sqlite3" is no longer supported. Use "client: better-sqlite3" or "client: sqlite" instead.'
  );
  expect(mockKnex).not.toHaveBeenCalled();
});

test('createKnex throws for client "mysql" with migration message', async () => {
  const createKnex = (await import('./createKnex.js')).default;
  expect(() => createKnex({ client: 'mysql', connection: 'mysql://u:p@h/db' })).toThrow(
    'Knex connection "client: mysql" is no longer supported. Use "client: mysql2" instead.'
  );
  expect(mockKnex).not.toHaveBeenCalled();
});

test('createKnex passes "mysql2" through unchanged', async () => {
  const createKnex = (await import('./createKnex.js')).default;
  createKnex({ client: 'mysql2', connection: 'mysql://u:p@h/db' });
  expect(mockKnex.mock.calls).toEqual([[{ client: 'mysql2', connection: 'mysql://u:p@h/db' }]]);
});
