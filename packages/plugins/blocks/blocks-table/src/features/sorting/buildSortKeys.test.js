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

import createComparator from '@lowdefy/blocks-antd/table/createComparator.js';
import createSortKeyGetter from '@lowdefy/blocks-antd/table/createSortKeyGetter.js';
import normalizeColumns from '@lowdefy/blocks-antd/table/normalizeColumns.js';

import createAccessor from '../../core/createAccessor.js';
import buildSortKeys from './buildSortKeys.js';
import getCachedSortKeys from './getCachedSortKeys.js';
import prepareSortKeys from './prepareSortKeys.js';
import sortIndices from './sortIndices.js';

function createRandom(seed) {
  let state = seed;
  return function random() {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function pick(random, values) {
  return values[Math.floor(random() * values.length)];
}

function makeColumn(config) {
  return normalizeColumns({ columns: [{ key: 'x', ...config }] }).columns[0];
}

function makeRows(values) {
  return values.map((x) => ({ original: { x } }));
}

// The order the Table's index sort gives, as source indices.
function tableOrder({ column, values, desc }) {
  const rows = makeRows(values);
  const keys = buildSortKeys({
    rows,
    accessor: createAccessor('x'),
    getSortKey: createSortKeyGetter({ column }),
    columnType: column.type,
  });
  return Array.from(sortIndices({ count: rows.length, entries: [{ keys, desc }] }));
}

// The order a stable sort with the shared comparator gives (TableLight's sortRows).
function comparatorOrder({ column, values, desc }) {
  const compare = createComparator({ column, desc });
  return values.map((value, index) => index).sort((a, b) => compare(values[a], values[b]) || a - b);
}

const EMPTIES = [null, undefined, '', []];

const FAMILIES = [
  {
    name: 'text',
    config: { type: 'text' },
    value: (random) =>
      pick(random, [
        ...EMPTIES,
        'apple',
        'Apple',
        'APPLE',
        'banana',
        'Item 2',
        'item 10',
        'éclair',
        'eclair',
        'zebra',
        42,
        7,
        true,
        { name: 'Object' },
      ]),
  },
  {
    name: 'text enum (options order)',
    config: {
      type: 'tag',
      options: [
        { value: 'won', label: 'Won' },
        { value: 'lead', label: 'Lead' },
        { value: 'lost', label: 'Lost' },
      ],
    },
    value: (random) => pick(random, [...EMPTIES, 'won', 'lead', 'lost', 'unknown', 'Other', 3]),
  },
  {
    name: 'number',
    config: { type: 'number' },
    value: (random) =>
      pick(random, [
        ...EMPTIES,
        Math.round(random() * 2000 - 1000) / 10,
        0,
        -0,
        '12',
        '1e3',
        'n/a',
        true,
        Infinity,
        -Infinity,
        [5],
      ]),
  },
  {
    name: 'currency',
    config: { type: 'currency' },
    value: (random) => pick(random, [null, Math.round(random() * 1e6) / 100, 0, '']),
  },
  {
    name: 'date',
    config: { type: 'date' },
    value: (random) =>
      pick(random, [
        ...EMPTIES,
        new Date(1.6e12 + Math.floor(random() * 1e11)).toISOString().slice(0, 10),
        new Date(1.6e12 + Math.floor(random() * 1e11)),
        1.6e12 + Math.floor(random() * 1e11),
        'not a date',
      ]),
  },
  {
    name: 'boolean',
    config: { type: 'boolean' },
    value: (random) => pick(random, [...EMPTIES, true, false, 'yes', 0, 1]),
  },
  {
    name: 'tags (array)',
    config: { type: 'tags', options: [{ value: 'a', label: 'Alpha' }] },
    value: (random) =>
      pick(random, [...EMPTIES, ['a'], ['b', 'a'], ['B'], 'a', ['c', 'd'], [{ name: 'x' }]]),
  },
  {
    name: 'people (array of objects)',
    config: { type: 'people' },
    value: (random) =>
      pick(random, [...EMPTIES, [{ name: 'Ann' }], [{ name: 'bob' }, { name: 'Cy' }], 'Dee']),
  },
  {
    name: 'json (other)',
    config: { type: 'json' },
    value: (random) => pick(random, [...EMPTIES, { a: 1 }, { a: 2 }, 'text', 3, [1, 2]]),
  },
  {
    name: 'buttons (action)',
    config: { type: 'buttons', sortable: true },
    value: (random) => pick(random, [...EMPTIES, 'x', 1]),
  },
];

FAMILIES.forEach((family) => {
  [false, true].forEach((desc) => {
    test(`Table sort order equals createComparator order for ${family.name}, ${
      desc ? 'descending' : 'ascending'
    }`, () => {
      const random = createRandom(family.name.length * 97 + (desc ? 1 : 0));
      const values = Array.from({ length: 400 }, () => family.value(random));
      const column = makeColumn(family.config);
      expect(tableOrder({ column, values, desc })).toEqual(
        comparatorOrder({ column, values, desc })
      );
    });
  });
});

test('Table sort keeps empty values last in both directions', () => {
  const column = makeColumn({ type: 'number' });
  const values = [3, null, 1, '', 2, 'n/a', undefined];
  expect(tableOrder({ column, values, desc: false }).map((i) => values[i])).toEqual([
    1,
    2,
    3,
    null,
    '',
    'n/a',
    undefined,
  ]);
  expect(tableOrder({ column, values, desc: true }).map((i) => values[i])).toEqual([
    3,
    2,
    1,
    null,
    '',
    'n/a',
    undefined,
  ]);
});

test('prepareSortKeys builds the same keys in slices for a large text column', async () => {
  const random = createRandom(7);
  const values = Array.from({ length: 12000 }, (_, i) =>
    i % 50 === 0 ? null : `Name ${Math.floor(random() * 1e6)} ${pick(random, ['a', 'B', 'é'])}`
  );
  const column = makeColumn({ type: 'text' });
  const rows = makeRows(values);
  const tanstackColumn = {
    id: 'x',
    columnDef: {
      meta: {
        accessor: createAccessor('x'),
        getSortKey: createSortKeyGetter({ column }),
        column,
      },
    },
  };
  await prepareSortKeys({ rows, column: tanstackColumn });
  const sliced = getCachedSortKeys({ rows, columnId: 'x' });
  const direct = buildSortKeys({
    rows,
    accessor: createAccessor('x'),
    getSortKey: createSortKeyGetter({ column }),
    columnType: 'text',
  });
  expect(Array.from(sliced)).toEqual(Array.from(direct));
  const order = Array.from(
    sortIndices({ count: rows.length, entries: [{ keys: sliced, desc: true }] })
  );
  expect(order).toEqual(comparatorOrder({ column, values, desc: true }));
});

test('multi-column sort orders by the first key, then the second', () => {
  const team = makeColumn({ type: 'text' });
  const age = makeColumn({ type: 'number' });
  const people = [
    { team: 'Blue', age: 30 },
    { team: 'red', age: 20 },
    { team: 'blue', age: 25 },
    { team: 'Red', age: null },
    { team: 'Red', age: 10 },
  ];
  const rows = people.map((original) => ({ original }));
  const keys = (column, field) =>
    buildSortKeys({
      rows,
      accessor: createAccessor(field),
      getSortKey: createSortKeyGetter({ column }),
      columnType: column.type,
    });
  const order = sortIndices({
    count: rows.length,
    entries: [
      { keys: keys(team, 'team'), desc: false },
      { keys: keys(age, 'age'), desc: true },
    ],
  });
  expect(Array.from(order)).toEqual([0, 2, 1, 4, 3]);
});
