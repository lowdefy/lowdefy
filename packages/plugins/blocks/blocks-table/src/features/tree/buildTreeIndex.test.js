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

const getId = (row) => String(row.id);

test('buildTreeIndex links rows to the row named by parentField', () => {
  const rows = [{ id: 1 }, { id: 2, parent: 1 }, { id: 3, parent: 1 }, { id: 4, parent: 2 }];
  const { parentOf, childrenOf } = buildTreeIndex({ rows, getId, parentField: 'parent' });
  expect(parentOf.get('4')).toBe('2');
  expect(childrenOf.get('1')).toEqual(['2', '3']);
  expect(childrenOf.get('2')).toEqual(['4']);
  expect(parentOf.has('1')).toBe(false);
});

test('buildTreeIndex makes rows whose parent is missing roots', () => {
  const rows = [
    { id: 1, parent: 99 },
    { id: 2, parent: null },
  ];
  const { parentOf } = buildTreeIndex({ rows, getId, parentField: 'parent' });
  expect(parentOf.size).toBe(0);
});

test('buildTreeIndex breaks parent cycles', () => {
  const rows = [
    { id: 1, parent: 2 },
    { id: 2, parent: 1 },
    { id: 3, parent: 3 },
  ];
  const { parentOf } = buildTreeIndex({ rows, getId, parentField: 'parent' });
  expect(parentOf.has('3')).toBe(false);
  // One link of the 1 <-> 2 cycle is removed, so both rows are reachable from a root.
  expect(parentOf.size).toBe(1);
});

test('buildTreeIndex uses the parents found while flattening nested rows', () => {
  const rows = [{ id: 1 }, { id: 2 }];
  const { childrenOf } = buildTreeIndex({
    rows,
    getId,
    parentField: null,
    parentOf: new Map([['2', '1']]),
  });
  expect(childrenOf.get('1')).toEqual(['2']);
});
