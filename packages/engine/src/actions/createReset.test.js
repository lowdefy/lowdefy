/*
  Copyright 2020-2024 Lowdefy, Inc

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

import testContext from '../../test/testContext.js';

const lowdefy = {
  _internal: {
    actions: {
      Reset: ({ methods: { reset } }) => {
        return reset();
      },
    },
  },
};

test('Reset one field', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { textInput: 'init' },
        },
      ],
    },
    blocks: [
      {
        id: 'textInput',
        type: 'TextInput',
      },
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [{ id: 'a', type: 'Reset' }],
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  expect(context.state).toEqual({ textInput: 'init' });
  const button = context._internal.RootBlocks.map['button'];
  const textInput = context._internal.RootBlocks.map['textInput'];
  textInput.setValue('1');
  expect(context.state).toEqual({ textInput: '1' });
  button.triggerEvent({ name: 'onClick' });
  expect(context.state).toEqual({ textInput: 'init' });
});

test('Reset on primitive array after adding item', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: ['init'] },
        },
      ],
    },
    blocks: [
      {
        id: 'list',
        type: 'List',
        blocks: [
          {
            id: 'list.$',
            type: 'TextInput',
          },
        ],
      },
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [{ id: 'a', type: 'Reset' }],
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  expect(context.state).toEqual({ list: ['init'] });
  const button = context._internal.RootBlocks.map['button'];
  const list = context._internal.RootBlocks.map['list'];
  list.pushItem();
  expect(context.state).toEqual({ list: ['init', null] });
  button.triggerEvent({ name: 'onClick' });
  expect(context.state).toEqual({ list: ['init'] });
});

test('Reset on object array after removing item', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: [{ textInput: 'init' }] },
        },
      ],
    },
    blocks: [
      {
        id: 'list',
        type: 'List',
        blocks: [
          {
            id: 'list.$.textInput',
            type: 'TextInput',
            defaultValue: '123',
          },
        ],
      },
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [{ id: 'a', type: 'Reset' }],
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });

  const button = context._internal.RootBlocks.map['button'];
  const list = context._internal.RootBlocks.map['list'];

  expect(context.state).toEqual({ list: [{ textInput: 'init' }] });
  list.removeItem(0);
  expect(context.state).toEqual({ list: [] });
  button.triggerEvent({ name: 'onClick' });
  expect(context.state).toEqual({ list: [{ textInput: 'init' }] });
});
