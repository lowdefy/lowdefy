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

import normalizeColumns from '@lowdefy/blocks-antd/table/normalizeColumns.js';

import getColumnGroupRules from './getColumnGroupRules.js';
import getDisplayedVisibility from './getDisplayedVisibility.js';
import initCollapsedColumnGroups from '../features/visibility/initCollapsedColumnGroups.js';

function rules(columns) {
  return getColumnGroupRules({ headerGroups: normalizeColumns({ columns }).headerGroups });
}

function displayed({ columnGroups, collapsed, columnVisibility = {} }) {
  return getDisplayedVisibility({
    columnVisibility,
    collapsedColumnGroups: collapsed,
    conditionsByKey: columnGroups.conditionsByKey,
  });
}

const outcomes = [
  'project',
  {
    key: 'outcomes',
    title: 'Outcomes',
    collapsible: true,
    collapsed: true,
    children: [
      { key: 'total', showWhen: 'closed' },
      { key: 'opted_out', showWhen: 'open' },
      { key: 'not_reached', showWhen: 'open' },
      'completed',
    ],
  },
];

test('getColumnGroupRules lists collapsible groups with their start state and the columns they hide', () => {
  const columnGroups = rules(outcomes);
  expect(columnGroups.groups).toEqual([{ key: 'outcomes', collapsed: true }]);
  expect([...columnGroups.conditionsByKey.keys()]).toEqual(['total', 'opted_out', 'not_reached']);
});

test('a collapsed group shows its closed and always columns, an expanded one its open and always columns', () => {
  const columnGroups = rules(outcomes);
  expect(displayed({ columnGroups, collapsed: ['outcomes'] })).toEqual({
    opted_out: false,
    not_reached: false,
  });
  expect(displayed({ columnGroups, collapsed: [] })).toEqual({ total: false });
});

test('the view visibility is kept, and returned as is when no group can hide a column', () => {
  const columnGroups = rules(outcomes);
  expect(
    displayed({ columnGroups, collapsed: [], columnVisibility: { completed: false } })
  ).toEqual({ completed: false, total: false });
  const columnVisibility = { project: false };
  const plain = rules(['project', { title: 'Group', children: ['a', 'b'] }]);
  expect(displayed({ columnGroups: plain, collapsed: [], columnVisibility })).toBe(
    columnVisibility
  );
});

test('collapsing an outer group hides an inner group with showWhen open and every column under it', () => {
  const columnGroups = rules([
    {
      key: 'outer',
      title: 'Outer',
      collapsible: true,
      children: [
        { key: 'sum', showWhen: 'closed' },
        {
          key: 'inner',
          title: 'Inner',
          showWhen: 'open',
          collapsible: true,
          children: ['inner_total', { key: 'inner_detail', showWhen: 'open' }],
        },
        { title: 'Plain', showWhen: 'open', children: ['plain_a'] },
      ],
    },
  ]);
  expect(columnGroups.groups).toEqual([
    { key: 'outer', collapsed: false },
    { key: 'inner', collapsed: false },
  ]);
  expect(displayed({ columnGroups, collapsed: ['outer'] })).toEqual({
    inner_total: false,
    inner_detail: false,
    plain_a: false,
  });
  expect(displayed({ columnGroups, collapsed: ['inner'] })).toEqual({
    sum: false,
    inner_detail: false,
  });
  expect(displayed({ columnGroups, collapsed: [] })).toEqual({ sum: false });
});

test('showWhen outside a collapsible group has no effect', () => {
  const columnGroups = rules([
    { key: 'a', showWhen: 'open' },
    { title: 'G', children: ['b'] },
  ]);
  expect(columnGroups.groups).toEqual([]);
  expect(columnGroups.conditionsByKey.size).toBe(0);
});

test('getColumnGroupRules refuses a collapsible group that shows nothing when collapsed', () => {
  expect(() =>
    rules([
      {
        key: 'g',
        title: 'G',
        collapsible: true,
        children: [{ key: 'a', showWhen: 'open' }],
      },
    ])
  ).toThrow(
    'Table column group "g" is collapsible, but every column in it has showWhen "open", so it shows nothing when collapsed.'
  );
});

test('getColumnGroupRules refuses an unknown showWhen', () => {
  expect(() => rules([{ key: 'a', showWhen: 'sometimes' }])).toThrow(
    'Table column "a" has unknown showWhen "sometimes". Use always, open or closed.'
  );
});

test('a group without a key is named by its position', () => {
  const columnGroups = rules([
    'a',
    { title: 'G', collapsible: true, children: ['b', { key: 'c', showWhen: 'open' }] },
  ]);
  expect(columnGroups.groups).toEqual([{ key: 'group:1', collapsed: false }]);
});

test('initCollapsedColumnGroups reads the value, then defaultView, then the groups, in config order', () => {
  const config = {
    columnGroups: {
      groups: [
        { key: 'a', collapsed: true },
        { key: 'b', collapsed: false },
        { key: 'c', collapsed: true },
      ],
      conditionsByKey: new Map(),
    },
  };
  expect(initCollapsedColumnGroups({ value: null, defaultView: {}, config })).toEqual(['a', 'c']);
  expect(
    initCollapsedColumnGroups({
      value: null,
      defaultView: { collapsedColumnGroups: ['b'] },
      config,
    })
  ).toEqual(['b']);
  expect(
    initCollapsedColumnGroups({
      value: { view: { collapsedColumnGroups: ['c', 'gone', 'b'] } },
      defaultView: { collapsedColumnGroups: ['a'] },
      config,
    })
  ).toEqual(['b', 'c']);
  expect(
    initCollapsedColumnGroups({
      value: { view: { collapsedColumnGroups: [] } },
      defaultView: {},
      config,
    })
  ).toEqual([]);
});
