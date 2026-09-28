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

import assert from 'node:assert/strict';
import test from 'node:test';

import buildGroupTree from './buildGroupTree.js';
import createAccessor from '../../core/createAccessor.js';
import createComparator from '../../core/createComparator.js';

const amountColumn = { key: 'amount', type: 'number', cell: {} };

function level(key, extra = {}) {
  return {
    key,
    accessor: createAccessor(key),
    compare: createComparator({ column: { key } }),
    desc: false,
    options: undefined,
    order: 'appearance',
    ...extra,
  };
}

function toRows(data) {
  return data.map((original, i) => ({ id: String(i), original }));
}

function summarize(groups) {
  return groups.map((group) => ({
    key: group.key,
    count: group.count,
    ...(group.children ? { children: summarize(group.children) } : {}),
  }));
}

const data = [
  { region: 'EMEA', rep: 'Ada', amount: 100 },
  { region: 'APAC', rep: 'Ken', amount: 200 },
  { region: 'EMEA', rep: 'Grace', amount: 300 },
  { rep: 'Alan', amount: 400 },
  { region: 'EMEA', rep: 'Ada', amount: 500 },
  { region: '', rep: 'Alan', amount: 600 },
];

test('buildGroupTree groups by one column in first-appearance order with empty values last', () => {
  const { groups, leaves } = buildGroupTree({
    rows: toRows(data),
    levels: [level('region')],
    aggregates: [],
  });
  assert.deepEqual(summarize(groups), [
    { key: '["EMEA"]', count: 3 },
    { key: '["APAC"]', count: 1 },
    { key: '[null]', count: 2 },
  ]);
  assert.equal(groups[2].empty, true);
  assert.equal(groups[2].value, null);
  assert.deepEqual(
    leaves.map((row) => row.id),
    ['0', '2', '4', '1', '3', '5']
  );
  assert.deepEqual(
    groups.map((group) => [group.start, group.end]),
    [
      [0, 3],
      [3, 4],
      [4, 6],
    ]
  );
});

test('buildGroupTree nests levels and gives each group one leaf range', () => {
  const { groups, groupsByKey, leaves } = buildGroupTree({
    rows: toRows(data),
    levels: [level('region'), level('rep')],
    aggregates: [],
  });
  assert.deepEqual(summarize(groups), [
    {
      key: '["EMEA"]',
      count: 3,
      children: [
        { key: '["EMEA","Ada"]', count: 2 },
        { key: '["EMEA","Grace"]', count: 1 },
      ],
    },
    { key: '["APAC"]', count: 1, children: [{ key: '["APAC","Ken"]', count: 1 }] },
    { key: '[null]', count: 2, children: [{ key: '[null,"Alan"]', count: 2 }] },
  ]);
  const ada = groupsByKey.get('["EMEA","Ada"]');
  assert.equal(ada.depth, 1);
  assert.equal(ada.columnKey, 'rep');
  assert.deepEqual(
    leaves.slice(ada.start, ada.end).map((row) => row.original.amount),
    [100, 500]
  );
  assert.equal(groupsByKey.size, 7);
});

test('buildGroupTree computes aggregates per group at every level in the same pass', () => {
  const { groups } = buildGroupTree({
    rows: toRows(data),
    levels: [level('region'), level('rep')],
    aggregates: [
      { key: 'amount', fn: 'sum', accessor: createAccessor('amount'), column: amountColumn },
      {
        key: 'rep',
        fn: 'countDistinct',
        accessor: createAccessor('rep'),
        column: { type: 'text' },
      },
    ],
  });
  assert.deepEqual(groups[0].aggregates, { amount: 900, rep: 2 });
  assert.deepEqual(groups[0].children[0].aggregates, { amount: 600, rep: 1 });
  assert.deepEqual(groups[2].aggregates, { amount: 1000, rep: 1 });
  assert.equal(groups[0].values, null);
});

test('buildGroupTree orders groups by the sort on the group column, empty last', () => {
  const ascending = buildGroupTree({
    rows: toRows(data),
    levels: [level('region', { order: 'sort' })],
    aggregates: [],
  });
  assert.deepEqual(
    ascending.groups.map((group) => group.key),
    ['["APAC"]', '["EMEA"]', '[null]']
  );
  const descending = buildGroupTree({
    rows: toRows(data),
    levels: [level('region', { order: 'sort', desc: true })],
    aggregates: [],
  });
  assert.deepEqual(
    descending.groups.map((group) => group.key),
    ['["EMEA"]', '["APAC"]', '[null]']
  );
});

test('buildGroupTree orders enum groups by option order, unlisted values after in appearance order', () => {
  const rows = toRows([
    { stage: 'won' },
    { stage: 'other' },
    { stage: 'lead' },
    { stage: null },
    { stage: 'qualified' },
    { stage: 'extra' },
  ]);
  const options = [
    { value: 'lead', label: 'Lead' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'won', label: 'Won' },
  ];
  const { groups } = buildGroupTree({
    rows,
    levels: [level('stage', { order: 'options', options })],
    aggregates: [],
  });
  assert.deepEqual(
    groups.map((group) => group.key),
    ['["lead"]', '["qualified"]', '["won"]', '["other"]', '["extra"]', '[null]']
  );
});

test('buildGroupTree keeps number and string values apart and groups arrays by their JSON', () => {
  const { groups } = buildGroupTree({
    rows: toRows([{ v: 1 }, { v: '1' }, { v: ['a', 'b'] }, { v: ['a', 'b'] }, { v: [] }]),
    levels: [level('v')],
    aggregates: [],
  });
  assert.deepEqual(
    groups.map((group) => [group.key, group.count]),
    [
      ['[1]', 1],
      ['["1"]', 1],
      ['["[\\"a\\",\\"b\\"]"]', 2],
      ['[null]', 1],
    ]
  );
});

test('buildGroupTree returns no groups for no rows', () => {
  const { groups, leaves } = buildGroupTree({
    rows: [],
    levels: [level('region')],
    aggregates: [],
  });
  assert.deepEqual(groups, []);
  assert.deepEqual(leaves, []);
});

test('buildGroupTree groups 100k rows by one column with an aggregate within the D10 budget', () => {
  const regions = ['EMEA', 'APAC', 'AMER', 'LATAM', 'ANZ', null];
  const rows = new Array(100000);
  for (let i = 0; i < rows.length; i++) {
    rows[i] = { id: String(i), original: { region: regions[i % 6], amount: i } };
  }
  const started = performance.now();
  const { groups, leaves } = buildGroupTree({
    rows,
    levels: [level('region')],
    aggregates: [
      { key: 'amount', fn: 'sum', accessor: createAccessor('amount'), column: amountColumn },
    ],
  });
  const elapsed = performance.now() - started;
  assert.equal(groups.length, 6);
  assert.equal(leaves.length, 100000);
  assert.ok(elapsed < 150, `grouping 100k rows took ${elapsed.toFixed(1)} ms`);
});
