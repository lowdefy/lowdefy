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
import { serializer, type } from '@lowdefy/helpers';

import testContext from '../testContext.js';

const pageId = 'one';
const lowdefy = {
  pageId,
  _internal: {
    actions: {
      Reset: ({ methods: { reset } }) => reset(),
    },
  },
};

// Nested containers, and a list whose rows each hold a container, so a reset walks many Slots.
function createPageConfig() {
  return {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'setState',
        type: 'Button',
        events: {
          onClick: [
            {
              id: 'setState',
              type: 'SetState',
              params: { marker: 'b' },
            },
          ],
        },
      },
      {
        id: 'reset',
        type: 'Button',
        events: {
          onClick: [{ id: 'reset', type: 'Reset' }],
        },
      },
      {
        id: 'outer',
        type: 'Box',
        blocks: [
          {
            id: 'inner',
            type: 'Box',
            blocks: [{ id: 'innermost', type: 'Box', blocks: [{ id: 'text', type: 'TextInput' }] }],
          },
        ],
      },
      {
        id: 'list',
        type: 'List',
        blocks: [
          {
            id: 'list.$.row',
            type: 'Box',
            blocks: [{ id: 'list.$.name', type: 'TextInput' }],
          },
        ],
      },
    ],
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: {
            marker: 'a',
            text: 'hello',
            list: [{ name: 'one' }, { name: 'two' }, { name: 'three' }],
          },
        },
      ],
    },
  };
}

afterEach(() => {
  jest.restoreAllMocks();
});

function countStateCopies(copySpy) {
  return copySpy.mock.calls.filter(([value]) => type.isObject(value) && 'marker' in value).length;
}

test('SetState copies the page state once, not once per container and list row', async () => {
  const context = await testContext({ lowdefy, pageConfig: createPageConfig() });
  const { setState } = context._internal.RootSlots.map;
  const copySpy = jest.spyOn(serializer, 'copy');

  await setState.triggerEvent({ name: 'onClick' });

  expect(countStateCopies(copySpy)).toBe(1);
});

test('Reset copies the page state once, not once per container and list row', async () => {
  const context = await testContext({ lowdefy, pageConfig: createPageConfig() });
  const { reset } = context._internal.RootSlots.map;
  const copySpy = jest.spyOn(serializer, 'copy');

  await reset.triggerEvent({ name: 'onClick' });

  expect(countStateCopies(copySpy)).toBe(1);
});

test('Blocks in nested containers and list rows keep their values through SetState', async () => {
  const context = await testContext({ lowdefy, pageConfig: createPageConfig() });
  const { setState, text } = context._internal.RootSlots.map;

  text.setValue('changed');
  context._internal.RootSlots.map['list.1.name'].setValue('changed two');
  await setState.triggerEvent({ name: 'onClick' });

  expect(context.state).toEqual({
    marker: 'b',
    text: 'changed',
    list: [{ name: 'one' }, { name: 'changed two' }, { name: 'three' }],
  });
  expect(text.value).toBe('changed');
  expect(context._internal.RootSlots.map['list.1.name'].value).toBe('changed two');
});
