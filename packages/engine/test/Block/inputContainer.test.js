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

import testContext from '../testContext.js';

const pageId = 'one';
const lowdefy = {
  pageId,
  _internal: {
    blocks: { Table: {} },
    blockMetas: { Table: { category: 'input-container', valueType: 'object' } },
  },
};

const createPageConfig = () => ({
  id: 'root',
  type: 'Box',
  blocks: [
    {
      type: 'Box',
      id: 'container',
      visible: { _if_none: [{ _state: 'show' }, true] },
      blocks: [
        {
          type: 'Table',
          id: 'table',
          slots: {
            bulkActions: {
              blocks: [{ type: 'TextInput', id: 'note' }],
            },
          },
        },
      ],
    },
    {
      type: 'Button',
      id: 'hide',
      events: { onClick: [{ id: 'a', type: 'SetState', params: { show: false } }] },
    },
    {
      type: 'Button',
      id: 'reveal',
      events: { onClick: [{ id: 'a', type: 'SetState', params: { show: true } }] },
    },
  ],
});

test('input-container block writes its value and its slot blocks their own', async () => {
  const context = await testContext({ lowdefy, pageConfig: createPageConfig() });
  const { table, note } = context._internal.RootSlots.map;
  table.setValue({ selected: ['a'] });
  note.setValue('hello');
  expect(context.state).toEqual({ table: { selected: ['a'] }, note: 'hello' });
});

test('input-container block republishes its value when it becomes visible again', async () => {
  const context = await testContext({ lowdefy, pageConfig: createPageConfig() });
  const { table, note, hide, reveal } = context._internal.RootSlots.map;
  table.setValue({ selected: ['a'] });
  note.setValue('hello');

  await hide.triggerEvent({ name: 'onClick' });
  expect(context.state).toEqual({ show: false });

  await reveal.triggerEvent({ name: 'onClick' });
  expect(table.value).toEqual({ selected: ['a'] });
  expect(context.state).toEqual({ show: true, table: { selected: ['a'] }, note: 'hello' });
});
