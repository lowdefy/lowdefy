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

import normalizeColumns from './normalizeColumns.js';

test('normalizeColumns fills every leaf default from the key', () => {
  const { columns } = normalizeColumns({ columns: [{ key: 'first_name' }] });
  expect(columns).toEqual([
    {
      key: 'first_name',
      field: 'first_name',
      title: 'First name',
      type: 'text',
      cell: {},
      width: undefined,
      minWidth: undefined,
      maxWidth: undefined,
      flex: undefined,
      align: 'start',
      pinned: undefined,
      hidden: false,
      sortable: true,
      filterable: true,
      resizable: true,
      groupable: false,
      editable: false,
      searchable: false,
      ellipsis: undefined,
      wrap: false,
      aggregate: undefined,
      options: undefined,
      tooltip: undefined,
      headerTooltip: undefined,
      rules: [],
      validate: [],
      path: [],
    },
  ]);
});

test('normalizeColumns takes the key from field and the field from key', () => {
  const { columns } = normalizeColumns({
    columns: [{ field: 'owner.name' }, { key: 'amount' }, 'stage'],
  });
  expect(columns.map(({ key, field }) => ({ key, field }))).toEqual([
    { key: 'owner.name', field: 'owner.name' },
    { key: 'amount', field: 'amount' },
    { key: 'stage', field: 'stage' },
  ]);
  expect(columns[0].title).toBe('Owner name');
});

test('normalizeColumns keeps an explicit title and html titles', () => {
  const { columns } = normalizeColumns({ columns: [{ key: 'a', title: '<b>A</b>' }] });
  expect(columns[0].title).toBe('<b>A</b>');
});

test('normalizeColumns aligns number, currency and percent columns to the end', () => {
  const { columns } = normalizeColumns({
    columns: [
      { key: 'a', type: 'number' },
      { key: 'b', type: 'currency' },
      { key: 'c', type: 'percent' },
      { key: 'd', type: 'progress' },
      { key: 'e', type: 'number', align: 'center' },
    ],
  });
  expect(columns.map((column) => column.align)).toEqual(['end', 'end', 'end', 'start', 'center']);
});

test('normalizeColumns applies defaultColumn and lets a column override it', () => {
  const { columns } = normalizeColumns({
    columns: [{ key: 'a' }, { key: 'b', sortable: true, resizable: false }],
    defaultColumn: { sortable: false, groupable: true },
  });
  expect(columns[0]).toMatchObject({ sortable: false, groupable: true, resizable: true });
  expect(columns[1]).toMatchObject({ sortable: true, groupable: true, resizable: false });
});

test('normalizeColumns turns data features off for action columns unless set', () => {
  const { columns } = normalizeColumns({
    columns: [
      { key: 'actions', type: 'buttons' },
      { key: 'more', type: 'menu', sortable: true },
    ],
  });
  expect(columns[0]).toMatchObject({
    sortable: false,
    filterable: false,
    groupable: false,
    editable: false,
    resizable: true,
  });
  expect(columns[1].sortable).toBe(true);
});

test('normalizeColumns flattens header groups and records their path', () => {
  const { columns, headerGroups, columnsByKey } = normalizeColumns({
    columns: [
      { key: 'name' },
      {
        title: 'Q1',
        children: [{ key: 'jan' }, { title: 'Late', children: [{ key: 'feb' }, { key: 'mar' }] }],
      },
    ],
  });
  expect(columns.map((column) => column.key)).toEqual(['name', 'jan', 'feb', 'mar']);
  expect(columnsByKey.mar.path).toEqual(['Q1', 'Late']);
  expect(columnsByKey.jan.path).toEqual(['Q1']);
  expect(headerGroups).toHaveLength(2);
  expect(headerGroups[0]).toBe(columnsByKey.name);
  expect(headerGroups[1]).toMatchObject({ group: true, key: 'group:1', title: 'Q1', path: [] });
  expect(headerGroups[1].children[1]).toMatchObject({
    group: true,
    key: 'group:1.1',
    title: 'Late',
    path: ['Q1'],
  });
  expect(headerGroups[1].children[1].children[0]).toBe(columnsByKey.feb);
});

test('normalizeColumns normalises options from an array and from a map', () => {
  const { columnsByKey } = normalizeColumns({
    columns: [
      { key: 'a', type: 'tag', options: ['lead', { value: 'won', label: 'Won', color: 'green' }] },
      { key: 'b', type: 'tag', options: { lead: 'Lead', won: { label: 'Won', color: 'green' } } },
    ],
  });
  expect(columnsByKey.a.options).toEqual([
    { value: 'lead', label: 'lead' },
    { value: 'won', label: 'Won', color: 'green' },
  ]);
  expect(columnsByKey.b.options).toEqual([
    { value: 'lead', label: 'Lead' },
    { value: 'won', label: 'Won', color: 'green' },
  ]);
});

test('normalizeColumns reads ellipsis, wrap and rules from the column and cell', () => {
  const rule = { when: { op: 'gt', value: 1 }, color: 'error' };
  const cellRule = { when: { op: 'lt', value: 0 }, color: 'success' };
  const { columns } = normalizeColumns({
    columns: [
      { key: 'a', ellipsis: 2, rules: [rule], cell: { rules: [cellRule] } },
      { key: 'b', ellipsis: true, wrap: true },
      { key: 'c', ellipsis: 0 },
    ],
  });
  expect(columns[0].ellipsis).toBe(2);
  expect(columns[0].rules).toEqual([rule, cellRule]);
  expect(columns[1]).toMatchObject({ ellipsis: 1, wrap: true });
  expect(columns[2].ellipsis).toBeUndefined();
});

test('normalizeColumns returns no columns when columns are not loaded yet', () => {
  expect(normalizeColumns({ columns: null })).toEqual({
    columns: [],
    columnsByKey: {},
    headerGroups: [],
  });
});

test('normalizeColumns throws when a column has neither key nor field', () => {
  expect(() => normalizeColumns({ columns: [{ title: 'Name' }] })).toThrow(
    'Table column requires a "key" or "field" string. Received {"title":"Name"}.'
  );
});

test('normalizeColumns throws on duplicate column keys', () => {
  expect(() => normalizeColumns({ columns: [{ key: 'a' }, { field: 'a' }] })).toThrow(
    'Duplicate table column key "a".'
  );
});

test('normalizeColumns throws on an unknown cell type', () => {
  expect(() => normalizeColumns({ columns: [{ key: 'a', type: 'txt' }] })).toThrow(
    'Table column "a" has unknown type "txt".'
  );
});

test('normalizeColumns throws on an unknown aggregate', () => {
  expect(() => normalizeColumns({ columns: [{ key: 'a', aggregate: 'total' }] })).toThrow(
    'Table column "a" has unknown aggregate "total".'
  );
});

test('normalizeColumns throws when columns is not an array', () => {
  expect(() => normalizeColumns({ columns: { a: 1 } })).toThrow('Table columns must be an array.');
});
