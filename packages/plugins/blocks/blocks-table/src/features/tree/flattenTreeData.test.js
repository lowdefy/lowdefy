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

import flattenTreeData from './flattenTreeData.js';

const getId = (row) => String(row.id);

test('flattenTreeData lists nested rows depth first with their parents', () => {
  const data = [
    { id: 1, children: [{ id: 2, children: [{ id: 3 }] }, { id: 4 }] },
    { id: 5, children: [] },
  ];
  const { rows, parentOf } = flattenTreeData({ data, childrenField: 'children', getId });
  expect(rows.map((row) => row.id)).toEqual([1, 2, 3, 4, 5]);
  expect([...parentOf]).toEqual([
    ['2', '1'],
    ['3', '2'],
    ['4', '1'],
  ]);
});

test('flattenTreeData reads children from a dot path and skips values that are not rows', () => {
  const data = [{ id: 'a', meta: { kids: [{ id: 'b' }, null, 'x'] } }];
  const { rows } = flattenTreeData({ data, childrenField: 'meta.kids', getId });
  expect(rows.map((row) => row.id)).toEqual(['a', 'b']);
});
