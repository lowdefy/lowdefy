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

import createSetGroup from './createSetGroup.js';
import groupingHeaderMenuItems from './groupingHeaderMenuItems.js';

function createApi(grouping) {
  const calls = [];
  return {
    calls,
    config: {
      columnsByKey: new Map([
        ['region', { key: 'region', groupable: true }],
        ['rep', { key: 'rep', groupable: true }],
        ['name', { key: 'name', groupable: false }],
      ]),
    },
    state: { grouping },
    actions: {
      setGroupKeys: (keys) => {
        calls.push(keys);
        return true;
      },
    },
  };
}

test('groupingHeaderMenuItems offers nothing for a column that is not groupable', () => {
  assert.deepEqual(groupingHeaderMenuItems({ column: { key: 'name' }, api: createApi([]) }), []);
});

test('groupingHeaderMenuItems "Group by this column" adds the column as the innermost level', () => {
  const api = createApi(['region']);
  const items = groupingHeaderMenuItems({ column: { key: 'rep' }, api });
  assert.deepEqual(
    items.map((item) => item.label),
    ['Group by this column']
  );
  items[0].onClick();
  assert.deepEqual(api.calls, [['region', 'rep']]);
});

test('groupingHeaderMenuItems "Remove grouping" removes a grouped column', () => {
  const api = createApi(['region', 'rep']);
  const items = groupingHeaderMenuItems({ column: { key: 'region' }, api });
  assert.deepEqual(
    items.map((item) => item.label),
    ['Remove grouping']
  );
  items[0].onClick();
  assert.deepEqual(api.calls, [['rep']]);
});

test('setGroup accepts keys and { key } entries and drops repeats', () => {
  const api = createApi([]);
  createSetGroup(api)(['region', { key: 'rep' }, 'region']);
  assert.deepEqual(api.calls, [['region', 'rep']]);
});

test('setGroup with null or an empty list removes the grouping', () => {
  const api = createApi(['region']);
  createSetGroup(api)(null);
  createSetGroup(api)([]);
  assert.deepEqual(api.calls, [[], []]);
});

test('setGroup throws for unknown and non-groupable columns', () => {
  const setGroup = createSetGroup(createApi([]));
  assert.throws(() => setGroup(['gone']), /setGroup: Table has no column "gone"\./);
  assert.throws(() => setGroup(['name']), /setGroup: column "name" is not groupable/);
  assert.throws(() => setGroup('region'), /Table group must be an array/);
});
