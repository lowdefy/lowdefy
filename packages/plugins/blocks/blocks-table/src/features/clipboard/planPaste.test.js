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

import applyChanges from '../editing/applyChanges.js';
import applyChangeUpdates from '../editing/applyChangeUpdates.js';
import createEmptyChanges from '../editing/createEmptyChanges.js';
import createEditSpecs from '../editing/createEditSpecs.js';
import planPaste from './planPaste.js';

function column(key, type = 'text') {
  return { key, field: key, type, cell: {}, editable: false, validate: [] };
}

const columns = [column('name'), column('age', 'number'), column('city'), column('id')];
const specs = createEditSpecs({
  columns,
  rawColumns: [
    { key: 'name', editable: true },
    { key: 'age', type: 'number', editable: true, validate: [{ pass: { op: 'lt', value: 150 } }] },
    { key: 'city', editable: { when: { key: 'locked', op: 'isFalse' } } },
    { key: 'id' },
  ],
});
const accessor = (key) => (row) => row[key];
const cols = [
  { key: '__select', special: 'select' },
  ...columns.map((col) => ({ key: col.key, accessor: accessor(col.key) })),
];
const data = [
  { id: 1, name: 'Ann', age: 30, city: 'Berlin' },
  { id: 2, name: 'Ben', age: 40, city: 'Austin', locked: true },
  { id: 3, name: 'Cat', age: 50, city: 'Durban' },
];
// Display order differs from the data order (sorted by name descending).
const rows = [data[2], data[1], data[0]].map((original) => ({ id: String(original.id), original }));
const getKey = (row) => row.id;

test('planPaste maps the grid from the focused cell onto rows by key, in display order', () => {
  const { updates, skipped } = planPaste({
    grid: [
      ['Cara', '51'],
      ['Bea', '41'],
    ],
    rows,
    cols,
    specs,
    getKey,
    startRow: 0,
    startCol: 1,
  });
  expect(skipped).toEqual([]);
  expect(updates).toEqual([
    { rowKey: 3, field: 'name', value: 'Cara' },
    { rowKey: 3, field: 'age', value: 51 },
    { rowKey: 2, field: 'name', value: 'Bea' },
    { rowKey: 2, field: 'age', value: 41 },
  ]);
  const changes = applyChangeUpdates({
    changes: createEmptyChanges(),
    updates,
    dataByKey: new Map(data.map((row) => [String(row.id), row])),
  });
  expect(changes.updated).toEqual({ 3: { name: 'Cara', age: 51 }, 2: { name: 'Bea', age: 41 } });
  const next = applyChanges({ rows: data, changes, getKey, keyField: 'id', cache: new WeakMap() });
  expect(next.map((row) => row.name)).toEqual(['Ann', 'Bea', 'Cara']);
  expect(next[0]).toBe(data[0]);
});

test('planPaste skips cells that do not coerce, fail validation or are not editable', () => {
  const { updates, skipped } = planPaste({
    grid: [
      ['old', 'Cape Town', '7'],
      ['200', 'Paris', '8'],
      ['x', 'y'],
    ],
    rows,
    cols,
    specs,
    getKey,
    startRow: 0,
    startCol: 2,
  });
  expect(updates).toEqual([
    { rowKey: 3, field: 'city', value: 'Cape Town' },
    { rowKey: 1, field: 'city', value: 'y' },
  ]);
  expect(skipped.map((cell) => [cell.rowKey, cell.column, cell.reason])).toEqual([
    [3, 'age', '"old" is not a number.'],
    [3, 'id', 'Not editable.'],
    [2, 'age', 'Invalid value.'],
    [2, 'city', 'Not editable.'],
    [2, 'id', 'Not editable.'],
    [1, 'age', '"x" is not a number.'],
  ]);
});

test('planPaste skips the part of the grid that falls outside the table', () => {
  const { updates, skipped } = planPaste({
    grid: [
      ['a', 'b'],
      ['c', 'd'],
    ],
    rows,
    cols,
    specs,
    getKey,
    startRow: 2,
    startCol: 4,
  });
  expect(updates).toEqual([]);
  expect(skipped.map((cell) => [cell.column, cell.reason])).toEqual([
    ['id', 'Not editable.'],
    [null, 'Outside the table.'],
    ['id', 'Outside the table.'],
    [null, 'Outside the table.'],
  ]);
});
