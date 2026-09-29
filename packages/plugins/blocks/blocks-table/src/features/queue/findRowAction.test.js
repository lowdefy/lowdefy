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

import findNextRowId from './findNextRowId.js';
import findRowAction from './findRowAction.js';

const columns = [
  { key: 'name', field: 'name', type: 'text', cell: {} },
  {
    key: 'actions',
    field: 'actions',
    type: 'buttons',
    cell: {
      buttons: [
        { eventName: 'onArchive', title: 'Archive', key: 'a', hiddenField: 'archived' },
        { eventName: 'onAssign', title: 'Assign', key: 'a' },
        { eventName: 'onEmail', title: 'Email', key: 'e', disabled: true },
      ],
    },
  },
  {
    key: 'menu',
    field: 'menu',
    type: 'menu',
    cell: { items: [{ eventName: 'onSnooze', titleField: 'snoozeTitle', key: 's' }] },
  },
];

test('findRowAction returns the first shown button bound to the key with its click payload', () => {
  const row = { _id: 1, name: 'Ada', archived: false };
  assert.deepEqual(findRowAction({ columns, key: 'a', row, rowKey: 1 }), {
    name: 'onArchive',
    event: {
      row,
      rowKey: 1,
      value: undefined,
      button: { eventName: 'onArchive', title: 'Archive' },
      buttonIndex: 0,
    },
  });
});

test('findRowAction skips hidden and disabled controls', () => {
  const row = { _id: 2, archived: true };
  assert.equal(findRowAction({ columns, key: 'a', row, rowKey: 2 }).name, 'onAssign');
  assert.equal(findRowAction({ columns, key: 'e', row, rowKey: 2 }), null);
  assert.equal(findRowAction({ columns, key: 'x', row, rowKey: 2 }), null);
});

test('findRowAction finds menu items with the item payload', () => {
  const row = { _id: 3, snoozeTitle: 'Snooze a day' };
  assert.deepEqual(findRowAction({ columns, key: 's', row, rowKey: 3 }).event.item, {
    eventName: 'onSnooze',
    title: 'Snooze a day',
  });
  assert.equal(findRowAction({ columns, key: 's', row, rowKey: 3 }).event.itemIndex, 0);
});

test('findNextRowId skips group items and returns null at the end', () => {
  const rows = [{ id: '1' }, { kind: 'group', key: 'g' }, { id: '2' }];
  assert.equal(findNextRowId({ rows, id: '1' }), '2');
  assert.equal(findNextRowId({ rows, id: '2' }), null);
  assert.equal(findNextRowId({ rows, id: 'missing' }), null);
});
