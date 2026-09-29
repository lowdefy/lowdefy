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

import buildServerItems from './buildServerItems.js';
import createBlockCache from './createBlockCache.js';

function fill({ cache, listKey, index, entries, total }) {
  const { generation } = cache.startLoad(listKey, index);
  cache.finishLoad({ listKey, index, generation, rows: entries, total });
}

const getId = (row) => String(row.id);

function rowsByIdFor(entries) {
  return Object.fromEntries(entries.map((row) => [String(row.id), { id: String(row.id), row }]));
}

test('buildServerItems leaves holes for rows that are not loaded', () => {
  const cache = createBlockCache({ blockSize: 2, maxBlocks: 10 });
  const loaded = [{ id: 4 }, { id: 5 }];
  fill({ cache, listKey: '[]', index: 2, entries: loaded, total: 7 });
  const { items, segments } = buildServerItems({
    blockCache: cache,
    groupKeys: [],
    expandedGroups: new Set(),
    rowsById: rowsByIdFor(loaded),
    getId,
    itemCache: new WeakMap(),
  });
  expect(items).toHaveLength(7);
  expect(items[3]).toBeUndefined();
  expect(items[4].id).toBe('4');
  expect(items[5].id).toBe('5');
  expect(segments).toEqual([
    { itemStart: 0, length: 7, listKey: '[]', groupPath: [], listStart: 0 },
  ]);
});

test('buildServerItems shows no rows before the root list size is known', () => {
  const cache = createBlockCache({ blockSize: 2, maxBlocks: 10 });
  const { items } = buildServerItems({
    blockCache: cache,
    groupKeys: [],
    expandedGroups: new Set(),
    rowsById: {},
    getId,
    itemCache: new WeakMap(),
  });
  expect(items).toEqual([]);
});

test('buildServerItems nests an expanded group list under its group item', () => {
  const cache = createBlockCache({ blockSize: 10, maxBlocks: 10 });
  fill({
    cache,
    listKey: '[]',
    index: 0,
    entries: [
      { key: 'lead', count: 2, aggregates: { amount: 30 } },
      { key: 'won', count: 5 },
    ],
    total: 2,
  });
  const leaves = [{ id: 'a' }, { id: 'b' }];
  fill({ cache, listKey: '["lead"]', index: 0, entries: leaves, total: 2 });
  const { items, segments } = buildServerItems({
    blockCache: cache,
    groupKeys: ['stage'],
    expandedGroups: new Set(['["lead"]', '["won"]']),
    rowsById: rowsByIdFor(leaves),
    getId,
    itemCache: new WeakMap(),
  });
  expect(items[0]).toMatchObject({
    kind: 'group',
    key: '["lead"]',
    depth: 0,
    groupPath: ['lead'],
    columnKey: 'stage',
    value: 'lead',
    empty: false,
    count: 2,
    aggregates: { amount: 30 },
    collapsed: false,
  });
  expect(items[1].id).toBe('a');
  expect(items[2].id).toBe('b');
  expect(items[3]).toMatchObject({ kind: 'group', value: 'won', collapsed: false });
  // The expanded "won" list has not loaded: one placeholder loads it.
  expect(items[4]).toBeUndefined();
  expect(items).toHaveLength(5);
  expect(segments).toEqual([
    { itemStart: 0, length: 1, listKey: '[]', groupPath: [], listStart: 0 },
    { itemStart: 1, length: 2, listKey: '["lead"]', groupPath: ['lead'], listStart: 0 },
    { itemStart: 3, length: 1, listKey: '[]', groupPath: [], listStart: 1 },
    { itemStart: 4, length: 1, listKey: '["won"]', groupPath: ['won'], listStart: 0 },
  ]);
});

test('buildServerItems keeps group item identity while nothing about the group changes', () => {
  const cache = createBlockCache({ blockSize: 10, maxBlocks: 10 });
  fill({ cache, listKey: '[]', index: 0, entries: [{ key: 'x', count: 1 }], total: 1 });
  const itemCache = new WeakMap();
  const args = {
    blockCache: cache,
    groupKeys: ['stage'],
    rowsById: {},
    getId,
    itemCache,
  };
  const first = buildServerItems({ ...args, expandedGroups: new Set() }).items[0];
  const second = buildServerItems({ ...args, expandedGroups: new Set() }).items[0];
  const expanded = buildServerItems({ ...args, expandedGroups: new Set(['["x"]']) }).items[0];
  expect(second).toBe(first);
  expect(expanded).not.toBe(first);
  expect(first.collapsed).toBe(true);
  expect(expanded.collapsed).toBe(false);
});
