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

import filterRowModel from './filterRowModel.js';
import prepareFilterResult from './prepareFilterResult.js';

const columns = [
  { key: 'name', field: 'name', type: 'text', cell: {} },
  { key: 'amount', field: 'amount', type: 'number', cell: {} },
];
const context = {
  columns,
  columnsByKey: { name: columns[0], amount: columns[1] },
  user: { id: 'u1' },
};

function createTable({ data, filter = null, search = null }) {
  const rows = data.map((original, index) => ({ id: String(index), index, original }));
  const model = { rows, flatRows: rows, rowsById: {} };
  return {
    rows,
    model,
    table: {
      getPreFilteredRowModel: () => model,
      options: { state: { filter, search }, lowdefyFiltering: context },
      atoms: { columnVisibility: { get: () => ({}) } },
    },
  };
}

const data = [
  { name: 'Acme', amount: 5 },
  { name: 'Globex', amount: 50 },
  { name: 'Acme two', amount: 500 },
];

test('filterRowModel returns the rows unchanged without a filter or search', () => {
  const { table, model } = createTable({ data });
  expect(filterRowModel(table)).toBe(model);
});

test('filterRowModel keeps rows matching the filter and the search, keeping Row objects', () => {
  const { table, rows } = createTable({
    data,
    filter: { and: [{ key: 'amount', op: 'gte', value: 10 }] },
    search: 'acme',
  });
  const result = filterRowModel(table);
  expect(result.rows).toEqual([rows[2]]);
  expect(result.rows[0]).toBe(rows[2]);
  expect(result.rowsById).toEqual({ 2: rows[2] });
});

test('filterRowModel ignores incomplete conditions', () => {
  const { table, model } = createTable({
    data,
    filter: { and: [{ key: 'amount', op: 'in', value: [] }] },
  });
  expect(filterRowModel(table)).toBe(model);
});

test('filterRowModel resolves $user values from the user', () => {
  const { table, rows } = createTable({
    data: [{ name: 'u1' }, { name: 'u2' }],
    filter: { key: 'name', op: 'eq', value: { $user: 'id' } },
  });
  expect(filterRowModel(table).rows).toEqual([rows[0]]);
});

test('filterRowModel reads a prepared result instead of testing rows again', async () => {
  const filter = { key: 'amount', op: 'lt', value: 100 };
  const { table, rows, model } = createTable({ data, filter });
  await prepareFilterResult({
    rows: model.rows,
    condition: filter,
    search: null,
    context,
    searchColumns: columns,
  });
  // Changing a row behind the table's back shows the prepared flags are what is read.
  rows[0].original = { name: 'Acme', amount: 1000 };
  expect(filterRowModel(table).rows).toEqual([rows[0], rows[1]]);
});

test('prepareFilterResult narrows a longer search from the earlier result', async () => {
  const { model } = createTable({ data });
  await prepareFilterResult({
    rows: model.rows,
    condition: null,
    search: 'ac',
    context,
    searchColumns: columns,
  });
  const { table } = createTable({ data, search: 'acme t' });
  // Same rows array, so the prepared results are shared.
  table.getPreFilteredRowModel = () => model;
  await prepareFilterResult({
    rows: model.rows,
    condition: null,
    search: 'acme t',
    context,
    searchColumns: columns,
  });
  expect(filterRowModel(table).rows).toEqual([model.rows[2]]);
});
