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

import filterMenuList from './filterMenuList.js';

// The fake gate reads the outcome the test stamped on each item.
const context = { authorizeOutcome: (item) => item.outcome };

test('a MenuLink whose gate returns deny is dropped', () => {
  const menuList = [{ id: 'a', type: 'MenuLink', outcome: 'deny' }];
  expect(filterMenuList(context, { menuList })).toEqual([]);
});

test('a MenuLink whose gate returns allow is kept', () => {
  const item = { id: 'a', type: 'MenuLink', outcome: 'allow' };
  expect(filterMenuList(context, { menuList: [item] })).toEqual([item]);
});

test('a MenuLink whose gate returns enrol_required is kept', () => {
  const item = { id: 'a', type: 'MenuLink', outcome: 'enrol_required' };
  expect(filterMenuList(context, { menuList: [item] })).toEqual([item]);
});

test('a MenuGroup whose links are all denied is pruned', () => {
  const menuList = [
    {
      id: 'g',
      type: 'MenuGroup',
      links: [{ id: 'a', type: 'MenuLink', outcome: 'deny' }],
    },
  ];
  expect(filterMenuList(context, { menuList })).toEqual([]);
});

test('a MenuGroup keeps only its authorized links', () => {
  const kept = { id: 'a', type: 'MenuLink', outcome: 'allow' };
  const menuList = [
    {
      id: 'g',
      type: 'MenuGroup',
      links: [kept, { id: 'b', type: 'MenuLink', outcome: 'deny' }],
    },
  ];
  expect(filterMenuList(context, { menuList })).toEqual([
    { id: 'g', type: 'MenuGroup', links: [kept] },
  ]);
});

test('leading, trailing and consecutive dividers are removed', () => {
  const link1 = { id: 'a', type: 'MenuLink', outcome: 'allow' };
  const link2 = { id: 'b', type: 'MenuLink', outcome: 'allow' };
  const menuList = [
    { id: 'd0', type: 'MenuDivider' },
    link1,
    { id: 'd1', type: 'MenuDivider' },
    { id: 'd2', type: 'MenuDivider' },
    link2,
    { id: 'd3', type: 'MenuDivider' },
  ];
  expect(filterMenuList(context, { menuList })).toEqual([
    link1,
    { id: 'd1', type: 'MenuDivider' },
    link2,
  ]);
});
