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

import testContext from '../testContext';

const pageId = 'one';

const lowdefy = { pageId };

test('SetState data to state', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            blockId: 'textInput',
            type: 'TextInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            blockId: 'button',
            type: 'Button',
            meta: {
              category: 'display',
              valueType: 'string',
            },
            events: {
              onClick: [{ id: 'a', type: 'SetState', params: { x: [1, 2, 3] } }],
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    lowdefy,
    rootBlock,
    initState: { textInput: 'init' },
  });
  expect(context.state).toEqual({ textInput: 'init' });
  const { button } = context.RootBlocks.map;
  expect(context.state).toEqual({ textInput: 'init' });
  button.triggerEvent({ name: 'onClick' });
  expect(context.state).toEqual({ textInput: 'init', x: [1, 2, 3] });
});

test('SetState field to state and update block value', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            blockId: 'textInput',
            type: 'TextInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            blockId: 'button',
            type: 'Button',
            meta: {
              category: 'display',
              valueType: 'string',
            },
            events: {
              onClick: [{ id: 'a', type: 'SetState', params: { textInput: 'new' } }],
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    lowdefy,
    rootBlock,
    initState: { textInput: 'init' },
  });
  expect(context.state).toEqual({ textInput: 'init' });
  const { button, textInput } = context.RootBlocks.map;

  expect(context.state).toEqual({ textInput: 'init' });
  button.triggerEvent({ name: 'onClick' });
  expect(context.state).toEqual({ textInput: 'new' });
  expect(textInput.value).toEqual('new');
});

test('SetState field to state with incorrect type - NOTE SetState IS NOT TYPE SAFE', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            blockId: 'textInput',
            type: 'TextInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            blockId: 'button',
            type: 'Button',
            meta: {
              category: 'display',
              valueType: 'string',
            },
            events: {
              onClick: [{ id: 'a', type: 'SetState', params: { textInput: 1 } }],
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    lowdefy,
    rootBlock,
    initState: { textInput: 'init' },
  });
  expect(context.state).toEqual({ textInput: 'init' });
  const { button, textInput } = context.RootBlocks.map;

  expect(context.state).toEqual({ textInput: 'init' });
  button.triggerEvent({ name: 'onClick' });
  expect(context.state).toEqual({ textInput: 1 });
  expect(textInput.value).toEqual(1);
});

test('SetState value on array and create new Blocks for array items', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
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
            blockId: 'button',
            type: 'Button',
            meta: {
              category: 'display',
              valueType: 'string',
            },
            events: {
              onClick: [
                {
                  id: 'a',
                  type: 'SetState',
                  params: { list: [{ textInput: '0' }, { textInput: '1' }, { textInput: '2' }] },
                },
              ],
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    lowdefy,
    rootBlock,
    initState: { list: [{ textInput: 'init' }] },
  });
  const { button } = context.RootBlocks.map;

  expect(context.state).toEqual({ list: [{ textInput: 'init' }] });

  button.triggerEvent({ name: 'onClick' });
  expect(context.state).toEqual({
    list: [{ textInput: '0' }, { textInput: '1' }, { textInput: '2' }],
  });

  const textInput0 = context.RootBlocks.map['list.0.textInput'];
  const textInput1 = context.RootBlocks.map['list.1.textInput'];
  const textInput2 = context.RootBlocks.map['list.2.textInput'];

  expect(textInput0.value).toEqual('0');
  expect(textInput1.value).toEqual('1');
  expect(textInput2.value).toEqual('2');
});
