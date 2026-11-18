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

import { journeyTargetSelectors } from '@lowdefy/helpers';
import { expect, test } from 'vitest';

import { buildMenuItems } from './buildMenuItems.js';

const { controlAttributes } = journeyTargetSelectors;

const components = { Icon: () => null, Link: () => null, ShortcutBadge: () => null };

const links = [
  { id: 'home', pageId: 'home', type: 'MenuLink' },
  {
    id: 'admin',
    type: 'MenuGroup',
    links: [{ id: 'users', pageId: 'users', type: 'MenuLink' }],
  },
];

function markAttributes(item) {
  return Object.keys(item).filter((key) => Object.values(controlAttributes).includes(key));
}

test('buildMenuItems marks every link item, nested ones included, with the menu block and its key', () => {
  const items = buildMenuItems({
    blockId: 'nav',
    links,
    components,
    getKey: (link) => link.pageId ?? link.id,
  });
  expect(items[0]).toMatchObject({
    [controlAttributes.blockId]: 'nav',
    [controlAttributes.control]: 'home',
  });
  expect(items[1].children[0]).toMatchObject({
    [controlAttributes.blockId]: 'nav',
    [controlAttributes.control]: 'users',
  });
});

test('buildMenuItems marks no item without a block id, as a page layout draws its nav menu', () => {
  const items = buildMenuItems({ links, components });
  expect(markAttributes(items[0])).toEqual([]);
  expect(markAttributes(items[1])).toEqual([]);
  expect(markAttributes(items[1].children[0])).toEqual([]);
});
