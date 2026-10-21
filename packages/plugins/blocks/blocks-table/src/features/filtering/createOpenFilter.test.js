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

import { jest } from '@jest/globals';

import createOpenFilter from './createOpenFilter.js';

const columns = [
  { key: 'stage', type: 'status', filterable: true, options: [{ value: 'won', label: 'Won' }] },
  { key: 'closeDate', type: 'date', filterable: true },
  { key: 'notes', type: 'text', filterable: false },
];

function makeApi({ toolbar = { filter: true }, mounted = true, filter = null } = {}) {
  const calls = { opened: [], filters: [] };
  const api = {
    blockId: 'deals_table',
    state: { filter },
    config: { toolbar, columnsByKey: new Map(columns.map((column) => [column.key, column])) },
    actions: {
      applyFiltering: ({ filter: update }) => calls.filters.push(update(filter)),
    },
  };
  if (mounted) api.filterButton = { open: (options) => calls.opened.push(options) };
  return { api, calls };
}

test('openFilter opens the builder', () => {
  const { api, calls } = makeApi();
  createOpenFilter(api)();
  expect(calls.opened).toEqual([{ focus: null }]);
  expect(calls.filters).toEqual([]);
});

test('openFilter { key } adds an empty condition on that column and focuses it', () => {
  const { api, calls } = makeApi({ filter: { key: 'stage', op: 'in', value: ['won'] } });
  createOpenFilter(api)({ key: 'closeDate' });
  expect(calls.filters).toEqual([
    {
      and: [
        { key: 'stage', op: 'in', value: ['won'] },
        { key: 'closeDate', op: 'before' },
      ],
    },
  ]);
  expect(calls.opened).toEqual([{ focus: { key: 'closeDate', existing: 0 } }]);
});

test('openFilter { key } on a column the filter already has focuses the new condition only', () => {
  const { api, calls } = makeApi({
    filter: {
      or: [{ key: 'stage', op: 'eq', value: 'won' }, { and: [{ key: 'stage', op: 'empty' }] }],
    },
  });
  createOpenFilter(api)({ key: 'stage' });
  expect(calls.opened).toEqual([{ focus: { key: 'stage', existing: 2 } }]);
});

test('openFilter { key } refuses a key that is not a filterable column', () => {
  const { api } = makeApi();
  expect(() => createOpenFilter(api)({ key: 'notes' })).toThrow(/filterable column/);
  expect(() => createOpenFilter(api)({ key: 'missing' })).toThrow(/filterable column/);
});

test('openFilter without the toolbar filter item warns and does nothing', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  for (const setup of [
    { toolbar: null, mounted: false },
    { toolbar: { filter: false }, mounted: false },
  ]) {
    const { api, calls } = makeApi(setup);
    createOpenFilter(api)({ key: 'stage' });
    expect(calls).toEqual({ opened: [], filters: [] });
  }
  expect(warn).toHaveBeenCalledTimes(2);
  expect(warn.mock.calls[0][0]).toMatch(/deals_table.*toolbar: \{ filter: true \}/);
  warn.mockRestore();
});
