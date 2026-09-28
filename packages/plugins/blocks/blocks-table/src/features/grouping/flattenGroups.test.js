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
import flattenGroups from './flattenGroups.js';

function level(key) {
  return { key, accessor: createAccessor(key), order: 'appearance' };
}

const rows = [
  { region: 'EMEA', rep: 'Ada' },
  { region: 'APAC', rep: 'Ken' },
  { region: 'EMEA', rep: 'Grace' },
  { region: 'EMEA', rep: 'Ada' },
].map((original, i) => ({ id: String(i), original }));

const tree = buildGroupTree({ rows, levels: [level('region'), level('rep')], aggregates: [] });

function describe(items) {
  return items.map((item) => (item.kind === 'group' ? `${item.depth}:${item.key}` : item.id));
}

test('flattenGroups lists group headers before their rows, depth first', () => {
  const { items, groupIndices } = flattenGroups({ ...tree, collapsed: new Set() });
  assert.deepEqual(describe(items), [
    '0:["EMEA"]',
    '1:["EMEA","Ada"]',
    '0',
    '3',
    '1:["EMEA","Grace"]',
    '2',
    '0:["APAC"]',
    '1:["APAC","Ken"]',
    '1',
  ]);
  assert.deepEqual([...groupIndices], [0, 1, 4, 6, 7]);
});

test('flattenGroups group items carry count, aggregates, collapsed state and leaf range', () => {
  const { items } = flattenGroups({ ...tree, collapsed: new Set() });
  assert.deepEqual(items[0], {
    kind: 'group',
    key: '["EMEA"]',
    depth: 0,
    columnKey: 'region',
    value: 'EMEA',
    empty: false,
    count: 3,
    aggregates: {},
    collapsed: false,
    start: 0,
    end: 3,
  });
});

test('flattenGroups hides the rows and subgroups of collapsed groups', () => {
  const { items, groupIndices } = flattenGroups({
    ...tree,
    collapsed: new Set(['["EMEA","Ada"]', '["APAC"]']),
  });
  assert.deepEqual(describe(items), [
    '0:["EMEA"]',
    '1:["EMEA","Ada"]',
    '1:["EMEA","Grace"]',
    '2',
    '0:["APAC"]',
  ]);
  assert.equal(items[1].collapsed, true);
  assert.equal(items[1].count, 2);
  assert.deepEqual([...groupIndices], [0, 1, 2, 4]);
});

test('flattenGroups reuses the leaf row objects of the tree', () => {
  const { items } = flattenGroups({ ...tree, collapsed: new Set() });
  assert.equal(items[2], rows[0]);
});
