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

import getMenuActions from './getMenuActions.js';

test('items become menu actions with their SF Symbols and attributes', () => {
  expect(
    getMenuActions({
      items: [
        { id: 'copy', title: 'Copy link', symbol: 'link' },
        { id: 'web', title: 'Open on web', symbol: 'safari' },
        { id: 'delete', title: 'Delete', symbol: 'trash', destructive: true, disabled: true },
        { id: 'secret', title: 'Secret', hidden: true },
      ],
    })
  ).toEqual([
    {
      id: 'copy',
      title: 'Copy link',
      image: 'link',
      state: undefined,
      attributes: { destructive: false, disabled: false, hidden: false },
    },
    {
      id: 'web',
      title: 'Open on web',
      image: 'safari',
      state: undefined,
      attributes: { destructive: false, disabled: false, hidden: false },
    },
    {
      id: 'delete',
      title: 'Delete',
      image: 'trash',
      state: undefined,
      attributes: { destructive: true, disabled: true, hidden: false },
    },
    {
      id: 'secret',
      title: 'Secret',
      image: undefined,
      state: undefined,
      attributes: { destructive: false, disabled: false, hidden: true },
    },
  ]);
});

test('checked items carry an on or off state', () => {
  const [on, off] = getMenuActions({
    items: [
      { id: 'a', title: 'A', checked: true },
      { id: 'b', title: 'B', checked: false },
    ],
  });
  expect(on.state).toBe('on');
  expect(off.state).toBe('off');
});

test('items with items are inline sections, or nested menus with submenu', () => {
  const [section, submenu] = getMenuActions({
    items: [
      { title: 'Sort by', items: [{ id: 'updated', title: 'Updated', checked: true }] },
      {
        id: 'state',
        title: 'Set state',
        symbol: 'circle.dashed',
        submenu: true,
        items: [{ id: 'done', title: 'Done' }],
      },
    ],
  });
  expect(section).toMatchObject({
    id: 'section_0',
    title: 'Sort by',
    displayInline: true,
    subactions: [{ id: 'updated', title: 'Updated', state: 'on' }],
  });
  expect(submenu).toMatchObject({
    id: 'state',
    title: 'Set state',
    image: 'circle.dashed',
    displayInline: false,
    subactions: [{ id: 'done', title: 'Done' }],
  });
});

test('an item with an avatar and no symbol shows the person symbol', () => {
  const [person, icon] = getMenuActions({
    items: [
      { id: 'ada', title: 'Ada', avatar: { name: 'Ada Lovelace' } },
      { id: 'me', title: 'Assign to me', symbol: 'person.fill', avatar: { name: 'Me' } },
    ],
  });
  expect(person.image).toBe('person.crop.circle');
  expect(icon.image).toBe('person.fill');
});
