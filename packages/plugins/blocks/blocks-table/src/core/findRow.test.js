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

import findRow from './findRow.js';

function createTable({ prePaginated = {}, core = {} }) {
  return {
    getPrePaginatedRowModel: () => ({ rowsById: prePaginated }),
    getCoreRowModel: () => ({ rowsById: core }),
  };
}

test('findRow returns the row from the pre-paginated model', () => {
  const row = { id: 'a' };
  expect(findRow({ table: createTable({ prePaginated: { a: row } }), id: 'a' })).toBe(row);
});

test('findRow falls back to the core model for a filtered out row', () => {
  const row = { id: 'a' };
  expect(findRow({ table: createTable({ core: { a: row } }), id: 'a' })).toBe(row);
});

test('findRow returns null for an unknown id instead of throwing', () => {
  expect(findRow({ table: createTable({}), id: 'missing' })).toBe(null);
});

test('findRow returns null for an undefined id (a row element without a row key)', () => {
  expect(findRow({ table: createTable({ core: { a: { id: 'a' } } }), id: undefined })).toBe(null);
});
