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
import KnexRaw from '../KnexRaw/KnexRaw.js';
import KnexBuilder from './KnexBuilder.js';

// Runs against a real in-memory SQLite database, so it loads the better-sqlite3 native binary.
const connection = {
  client: 'better-sqlite3',
  connection: { filename: ':memory:' },
  useNullAsDefault: true,
};

afterAll(async () => {
  await destroyKnexClients();
});

test('KnexBuilder builds and runs queries against a SQLite database', async () => {
  await KnexRaw({
    request: { query: 'CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price INTEGER)' },
    connection,
  });
  await KnexBuilder({
    request: {
      tableName: 'products',
      query: [
        {
          insert: [
            [
              { name: 'Pen', price: 2 },
              { name: 'Book', price: 12 },
              { name: 'Lamp', price: 30 },
            ],
          ],
        },
      ],
    },
    connection,
  });
  const res = await KnexBuilder({
    request: {
      tableName: 'products',
      query: [
        { select: ['name', 'price'] },
        { where: ['price', '>', 5] },
        { orderBy: ['price', 'desc'] },
      ],
    },
    connection,
  });
  expect(res).toEqual([
    { name: 'Lamp', price: 30 },
    { name: 'Book', price: 12 },
  ]);
});
