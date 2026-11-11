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

import { afterAll, expect, test } from 'vitest';

import { destroyKnexClients } from '../getKnex.js';
import KnexRaw from './KnexRaw.js';

// Runs against a real in-memory SQLite database, so it loads the better-sqlite3 native binary.
const connection = {
  client: 'sqlite',
  connection: { filename: ':memory:' },
  useNullAsDefault: true,
};

afterAll(async () => {
  await destroyKnexClients();
});

test('KnexRaw runs queries against a SQLite database', async () => {
  await KnexRaw({
    request: { query: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)' },
    connection,
  });
  await KnexRaw({
    request: { query: 'INSERT INTO users (name) VALUES (?), (?)', parameters: ['Ann', 'Bob'] },
    connection,
  });
  const res = await KnexRaw({
    request: {
      query: 'SELECT id, name FROM users WHERE name = :name',
      parameters: { name: 'Bob' },
    },
    connection,
  });
  expect(res).toEqual([{ id: 2, name: 'Bob' }]);
});

test('KnexRaw rejects with the SQLite error for an invalid query', async () => {
  await expect(
    KnexRaw({ request: { query: 'SELECT * FROM missing_table' }, connection })
  ).rejects.toThrow('no such table: missing_table');
});
