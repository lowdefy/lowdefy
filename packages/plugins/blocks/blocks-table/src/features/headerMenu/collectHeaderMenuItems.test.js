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

import collectHeaderMenuItems from './collectHeaderMenuItems.js';

const column = { key: 'name' };
const api = {};

function feature(name, items) {
  return { name, headerMenuItems: () => items };
}

test('collectHeaderMenuItems groups items by section in section order with dividers', () => {
  const onSort = () => 'sort';
  const { items, handlers } = collectHeaderMenuItems({
    column,
    api,
    features: [
      feature('columnManager', [{ key: 'columns', label: 'Columns…', section: 'manage' }]),
      { name: 'noItems' },
      feature('headerMenu', [
        { key: 'sortAsc', label: 'Sort ascending', section: 'sort', onClick: onSort },
        { key: 'hide', label: 'Hide', section: 'column', disabled: true },
      ]),
      feature('filtering', [{ key: 'filter', label: 'Filter…', section: 'filter' }]),
    ],
  });
  expect(items).toEqual([
    {
      key: 'headerMenu:sortAsc',
      label: 'Sort ascending',
      icon: undefined,
      danger: undefined,
      disabled: undefined,
    },
    { type: 'divider', key: 'divider:filter' },
    {
      key: 'filtering:filter',
      label: 'Filter…',
      icon: undefined,
      danger: undefined,
      disabled: undefined,
    },
    { type: 'divider', key: 'divider:column' },
    { key: 'headerMenu:hide', label: 'Hide', icon: undefined, danger: undefined, disabled: true },
    { type: 'divider', key: 'divider:manage' },
    {
      key: 'columnManager:columns',
      label: 'Columns…',
      icon: undefined,
      danger: undefined,
      disabled: undefined,
    },
  ]);
  expect(handlers.get('headerMenu:sortAsc')()).toBe('sort');
});

test('collectHeaderMenuItems puts sections it does not know before manage, by feature order', () => {
  const { items } = collectHeaderMenuItems({
    column,
    api,
    features: [
      feature('a', [{ key: 'x', label: 'X', section: 'manage' }]),
      feature('grouping', [{ key: 'group', label: 'Group by' }]),
      feature('other', [{ key: 'y', label: 'Y', section: 'custom' }]),
    ],
  });
  expect(items.filter((item) => item.type !== 'divider').map((item) => item.key)).toEqual([
    'grouping:group',
    'other:y',
    'a:x',
  ]);
});

test('collectHeaderMenuItems passes the column and api to each feature', () => {
  const calls = [];
  const headerMenuItems = (args) => {
    calls.push(args);
    return [];
  };
  collectHeaderMenuItems({ column, api, features: [{ name: 'f', headerMenuItems }] });
  expect(calls).toEqual([{ column, api }]);
});

test('collectHeaderMenuItems builds submenus from children and registers their handlers', () => {
  const { items, handlers } = collectHeaderMenuItems({
    column,
    api,
    features: [
      feature('enrichment', [
        {
          key: 'run',
          label: 'Run',
          section: 'column',
          children: [
            { key: 'all', label: 'All rows', onClick: () => 'all' },
            { key: 'errors', label: 'Errors', onClick: () => 'errors' },
          ],
        },
      ]),
    ],
  });
  expect(items).toEqual([
    {
      key: 'enrichment:run',
      label: 'Run',
      icon: undefined,
      danger: undefined,
      disabled: undefined,
      children: [
        {
          key: 'enrichment:run:all',
          label: 'All rows',
          icon: undefined,
          danger: undefined,
          disabled: undefined,
        },
        {
          key: 'enrichment:run:errors',
          label: 'Errors',
          icon: undefined,
          danger: undefined,
          disabled: undefined,
        },
      ],
    },
  ]);
  expect(handlers.has('enrichment:run')).toBe(false);
  expect(handlers.get('enrichment:run:errors')()).toBe('errors');
});
