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
import getHeaderAncestors from './getHeaderAncestors.js';
import getHeaderLevels from './getHeaderLevels.js';
import { expect, test } from 'vitest';

// The group row count of a table with these columns, `collapsed` column groups and the view's
// `columnVisibility`, as the grid lays it out: from the displayed columns only.
function depthOf({ columns, collapsed = [], columnVisibility = {}, special = [] }) {
  const normalized = normalizeColumns({ columns });
  const columnGroups = getColumnGroupRules({ headerGroups: normalized.headerGroups });
  const displayed = getDisplayedVisibility({
    columnVisibility,
    collapsedColumnGroups: collapsed,
    conditionsByKey: columnGroups.conditionsByKey,
  });
  const cols = [
    ...special,
    ...normalized.columns
      .filter((column) => displayed[column.key] !== false)
      .map((column) => ({ key: column.key })),
  ];
  return getHeaderLevels({
    ancestorsByKey: getHeaderAncestors({ headerGroups: normalized.headerGroups }),
    cols,
  }).depth;
}

const channels = [
  'project',
  {
    key: 'unusable',
    title: 'Unusable',
    collapsible: true,
    collapsed: true,
    children: [
      'total',
      {
        key: 'email',
        title: 'Email',
        showWhen: 'open',
        children: ['email_missing', 'email_invalid'],
      },
      {
        key: 'phone',
        title: 'Phone',
        showWhen: 'open',
        children: ['phone_missing', 'phone_invalid'],
      },
    ],
  },
];

test('a collapsed group whose nested groups it hides takes one group row, not one per nested level', () => {
  expect(depthOf({ columns: channels, collapsed: ['unusable'] })).toBe(1);
});

test('an expanded group with nested groups takes a group row per level', () => {
  expect(depthOf({ columns: channels, collapsed: [] })).toBe(2);
});

test('a group showing only ungrouped columns keeps its own group row', () => {
  expect(
    depthOf({
      columns: [{ title: 'Group', children: ['a', { title: 'Inner', children: ['b'] }] }],
      columnVisibility: { b: false },
    })
  ).toBe(1);
});

test('hiding every column under the grouped columns leaves no group row', () => {
  expect(
    depthOf({
      columns: ['a', { title: 'Group', children: ['b', 'c'] }],
      columnVisibility: { b: false, c: false },
    })
  ).toBe(0);
});

test('a table without column groups has no group row, and special columns add none', () => {
  const special = [{ key: '__select', special: 'select' }];
  expect(depthOf({ columns: ['a', 'b'], special })).toBe(0);
});
