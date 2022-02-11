/*
  Copyright 2020-2021 Lowdefy, Inc

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

import testContext from '../../test/testContext.js';

const lowdefy = {
  _internal: {
    actions: {
      Reset: ({ methods: { reset } }) => {
        return reset();
      },
    },
    blockComponents: {
      Button: { meta: { category: 'display' } },
      List: { meta: { category: 'list', valueType: 'array' } },
      TextInput: { meta: { category: 'input', valueType: 'string' } },
    },
  },
};

test('Reset one field', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            id: 'textInput',
            blockId: 'textInput',
            type: 'TextInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            id: 'button',
            blockId: 'button',
            type: 'Button',
            meta: {
              category: 'display',
              valueType: 'string',
            },
            events: {
              onClick: [{ id: 'a', type: 'Reset' }],
            },
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { textInput: 'init' },
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
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            id: 'list',
            blockId: 'list',
            type: 'List',
            meta: {
              category: 'list',
              valueType: 'array',
            },
            areas: {
              content: {
                blocks: [
                  {
                    id: 'list.$',
                    blockId: 'list.$',
                    type: 'TextInput',
                    meta: {
                      category: 'input',
                      valueType: 'string',
                    },
                  },
                ],
              },
            },
          },
          {
            id: 'button',
            blockId: 'button',
            type: 'Button',
            meta: {
              category: 'display',
              valueType: 'string',
            },
            events: {
              onClick: [{ id: 'a', type: 'Reset' }],
            },
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { list: ['init'] },
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
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            id: 'list',
            blockId: 'list',
            type: 'List',
            meta: {
              category: 'list',
              valueType: 'array',
            },
            areas: {
              content: {
                blocks: [
                  {
                    id: 'list.$.textInput',
                    blockId: 'list.$.textInput',
                    type: 'TextInput',
                    defaultValue: '123',
                    meta: {
                      category: 'input',
                      valueType: 'string',
                    },
                  },
                ],
              },
            },
          },
          {
            id: 'button',
            blockId: 'button',
            type: 'Button',
            meta: {
              category: 'display',
              valueType: 'string',
            },
            events: {
              onClick: [{ id: 'a', type: 'Reset' }],
            },
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { list: [{ textInput: 'init' }] },
  });

  const button = context._internal.RootBlocks.map['button'];
  const list = context._internal.RootBlocks.map['list'];

  expect(context.state).toEqual({ list: [{ textInput: 'init' }] });
  list.removeItem(0);
  expect(context.state).toEqual({ list: [] });
  button.triggerEvent({ name: 'onClick' });
  expect(context.state).toEqual({ list: [{ textInput: 'init' }] });
});
