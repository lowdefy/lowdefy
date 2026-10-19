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

import buildTreeIndex from './buildTreeIndex.js';
import buildTreeItems from './buildTreeItems.js';

const DATA = [
  { id: 'root', name: 'Root' },
  { id: 'b', name: 'Bravo', parent: 'root' },
  { id: 'a', name: 'Alpha', parent: 'root' },
  { id: 'a1', name: 'Alpha one', parent: 'a' },
  { id: 'other', name: 'Other' },
];

function setup() {
  const tanstackRows = DATA.map((original, index) => ({ id: original.id, original, index }));
  const rowsById = Object.fromEntries(tanstackRows.map((row) => [row.id, row]));
  const { parentOf, childrenOf } = buildTreeIndex({
    rows: DATA,
    getId: (row) => row.id,
    parentField: 'parent',
  });
  return { tanstackRows, rowsById, parentOf, childrenOf };
}

function ids(items) {
  return items.map((item) => `${'-'.repeat(item.depth)}${item.id}`);
}

test('buildTreeItems nests expanded rows under their parents with depths', () => {
  const { tanstackRows, rowsById, parentOf, childrenOf } = setup();
  const items = buildTreeItems({
    rows: tanstackRows,
    rowsById,
    parentOf,
    childrenOf,
    expandedIds: new Set(['root', 'a']),
    hasChildrenField: null,
    cache: new WeakMap(),
  });
  expect(ids(items)).toEqual(['root', '-b', '-a', '--a1', 'other']);
  expect(items[0]).toMatchObject({ kind: 'row', hasChildren: true, expanded: true, depth: 0 });
  expect(items[1]).toMatchObject({ hasChildren: false, expanded: false, parentId: 'root' });
});

test('buildTreeItems leaves out the children of collapsed rows', () => {
  const { tanstackRows, rowsById, parentOf, childrenOf } = setup();
  const items = buildTreeItems({
    rows: tanstackRows,
    rowsById,
    parentOf,
    childrenOf,
    expandedIds: new Set(['a']),
    hasChildrenField: null,
    cache: new WeakMap(),
  });
  expect(ids(items)).toEqual(['root', 'other']);
});

test('buildTreeItems sorts siblings within each level in the order rows arrive', () => {
  const { tanstackRows, rowsById, parentOf, childrenOf } = setup();
  const sorted = [...tanstackRows].sort((x, y) => x.original.name.localeCompare(y.original.name));
  const items = buildTreeItems({
    rows: sorted,
    rowsById,
    parentOf,
    childrenOf,
    expandedIds: new Set(['root', 'a']),
    hasChildrenField: null,
    cache: new WeakMap(),
  });
  expect(ids(items)).toEqual(['other', 'root', '-a', '--a1', '-b']);
});

test('buildTreeItems keeps the ancestors of rows a filter kept', () => {
  const { tanstackRows, rowsById, parentOf, childrenOf } = setup();
  const filtered = tanstackRows.filter((row) => row.id === 'a1' || row.id === 'other');
  const items = buildTreeItems({
    rows: filtered,
    rowsById,
    parentOf,
    childrenOf,
    expandedIds: new Set(['root', 'a']),
    hasChildrenField: null,
    cache: new WeakMap(),
  });
  expect(ids(items)).toEqual(['root', '-a', '--a1', 'other']);
  // "b" did not match and is not an ancestor of a match.
  expect(items.find((item) => item.id === 'b')).toBeUndefined();
});

test('buildTreeItems gives lazy rows a chevron before their children are loaded', () => {
  const data = [{ id: 'x', hasChildren: true }, { id: 'y' }];
  const tanstackRows = data.map((original, index) => ({ id: original.id, original, index }));
  const rowsById = Object.fromEntries(tanstackRows.map((row) => [row.id, row]));
  const items = buildTreeItems({
    rows: tanstackRows,
    rowsById,
    parentOf: new Map(),
    childrenOf: new Map(),
    expandedIds: new Set(['x']),
    hasChildrenField: 'hasChildren',
    cache: new WeakMap(),
  });
  expect(items[0]).toMatchObject({ hasChildren: true, expanded: true });
  expect(items[1]).toMatchObject({ hasChildren: false, expanded: false });
});

test('buildTreeItems keeps item identity for unchanged rows', () => {
  const { tanstackRows, rowsById, parentOf, childrenOf } = setup();
  const cache = new WeakMap();
  const args = {
    rows: tanstackRows,
    rowsById,
    parentOf,
    childrenOf,
    hasChildrenField: null,
    cache,
  };
  const first = buildTreeItems({ ...args, expandedIds: new Set(['root']) });
  const second = buildTreeItems({ ...args, expandedIds: new Set(['root', 'a']) });
  expect(second[1]).toBe(first[1]);
  expect(second[2]).not.toBe(first[2]);
});

test('buildTreeItems adds one skeleton child under a lazy row whose children are loading', () => {
  const data = [{ id: 'lazy', name: 'Lazy', hasChildren: true }];
  const tanstackRows = data.map((original, index) => ({ id: original.id, original, index }));
  const { parentOf, childrenOf } = buildTreeIndex({
    rows: data,
    getId: (row) => row.id,
    parentField: 'parent',
  });
  const args = {
    rows: tanstackRows,
    rowsById: { lazy: tanstackRows[0] },
    parentOf,
    childrenOf,
    expandedIds: new Set(['lazy']),
    hasChildrenField: 'hasChildren',
    cache: new WeakMap(),
  };
  const loading = buildTreeItems({
    ...args,
    childLoads: { loading: new Set(['lazy']), errors: new Map() },
  });
  expect(loading[0]).toMatchObject({ id: 'lazy', expanded: true, loading: true, error: null });
  expect(loading[1]).toEqual({ kind: 'skeleton', key: 'lazy:children', depth: 1 });
  const failed = buildTreeItems({
    ...args,
    expandedIds: new Set(),
    childLoads: { loading: new Set(), errors: new Map([['lazy', 'Down']]) },
  });
  expect(failed).toHaveLength(1);
  expect(failed[0]).toMatchObject({ expanded: false, loading: false, error: 'Down' });
});
