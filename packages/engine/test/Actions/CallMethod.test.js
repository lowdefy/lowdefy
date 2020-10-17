/*
   Copyright 2020 Lowdefy, Inc

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
const rootContext = {};

test('CallMethod with no args, synchronous method', async () => {
  const blockMethod = jest.fn((...args) => ({ args }));
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
            actions: {
              onClick: [
                {
                  id: 'a',
                  type: 'CallMethod',
                  params: { blockId: 'textInput', method: 'blockMethod' },
                },
              ],
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: { textInput: 'init' },
  });
  const { button, textInput } = context.RootBlocks.map;

  textInput.registerMethod('blockMethod', blockMethod);
  const res = await button.callAction({ action: 'onClick' });
  expect(res).toEqual([
    {
      args: undefined,
      id: 'a',
      params: {
        blockId: 'textInput',
        method: 'blockMethod',
      },
      response: {
        args: [undefined],
      },
      skipped: false,
      successMessage: undefined,
      type: 'CallMethod',
    },
  ]);
  expect(blockMethod.mock.calls).toEqual([[undefined]]);
});

test('CallMethod method return a promise', async () => {
  const timeout = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };
  const calls = [];
  const blockMethod = async (...args) => {
    calls.push(args);
    await timeout(300);
    return { args };
  };
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
            actions: {
              onClick: [
                {
                  id: 'a',
                  type: 'CallMethod',
                  params: { blockId: 'textInput', method: 'blockMethod', args: 'arg' },
                },
              ],
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: { textInput: 'init' },
  });
  const { button, textInput } = context.RootBlocks.map;

  textInput.registerMethod('blockMethod', blockMethod);
  const res = await button.callAction({ action: 'onClick' });
  expect(res).toEqual([
    {
      args: undefined,
      id: 'a',
      params: {
        blockId: 'textInput',
        method: 'blockMethod',
        args: 'arg',
      },
      response: {
        args: ['arg'],
      },
      skipped: false,
      successMessage: undefined,
      type: 'CallMethod',
    },
  ]);
  expect(calls).toEqual([['arg']]);
});

test('CallMethod with single arg, synchronous method', async () => {
  const blockMethod = jest.fn((...args) => ({ args }));
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
            actions: {
              onClick: [
                {
                  id: 'a',
                  type: 'CallMethod',
                  params: { blockId: 'textInput', method: 'blockMethod', args: 'arg' },
                },
              ],
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: { textInput: 'init' },
  });
  const { button, textInput } = context.RootBlocks.map;

  textInput.registerMethod('blockMethod', blockMethod);
  const res = await button.callAction({ action: 'onClick' });
  expect(res).toEqual([
    {
      args: undefined,
      id: 'a',
      params: {
        blockId: 'textInput',
        method: 'blockMethod',
        args: 'arg',
      },
      response: {
        args: ['arg'],
      },
      skipped: false,
      successMessage: undefined,
      type: 'CallMethod',
    },
  ]);
  expect(blockMethod.mock.calls).toEqual([['arg']]);
});

test('CallMethod with positional args, synchronous method', async () => {
  const blockMethod = jest.fn((...args) => ({ args }));
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
            actions: {
              onClick: [
                {
                  id: 'a',
                  type: 'CallMethod',
                  params: { blockId: 'textInput', method: 'blockMethod', args: ['arg1', 'arg2'] },
                },
              ],
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: { textInput: 'init' },
  });
  const { button, textInput } = context.RootBlocks.map;

  textInput.registerMethod('blockMethod', blockMethod);
  const res = await button.callAction({ action: 'onClick' });
  expect(res).toEqual([
    {
      args: undefined,
      id: 'a',
      params: {
        blockId: 'textInput',
        method: 'blockMethod',
        args: ['arg1', 'arg2'],
      },
      response: {
        args: ['arg1', 'arg2'],
      },
      skipped: false,
      successMessage: undefined,
      type: 'CallMethod',
    },
  ]);
  expect(blockMethod.mock.calls).toEqual([['arg1', 'arg2']]);
});

test('CallMethod with object args, synchronous method', async () => {
  const blockMethod = jest.fn((...args) => ({ args }));
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
            actions: {
              onClick: [
                {
                  id: 'a',
                  type: 'CallMethod',
                  params: {
                    blockId: 'textInput',
                    method: 'blockMethod',
                    args: { a1: 'arg1', a2: 'arg2' },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: { textInput: 'init' },
  });
  const { button, textInput } = context.RootBlocks.map;

  textInput.registerMethod('blockMethod', blockMethod);
  const res = await button.callAction({ action: 'onClick' });
  expect(res).toEqual([
    {
      args: undefined,
      id: 'a',
      params: {
        blockId: 'textInput',
        method: 'blockMethod',
        args: { a1: 'arg1', a2: 'arg2' },
      },
      response: {
        args: [{ a1: 'arg1', a2: 'arg2' }],
      },
      skipped: false,
      successMessage: undefined,
      type: 'CallMethod',
    },
  ]);
  expect(blockMethod.mock.calls).toEqual([[{ a1: 'arg1', a2: 'arg2' }]]);
});

test('CallMethod of block in array by explicit id', async () => {
  const blockMethod0 = jest.fn((...args) => ({ args }));
  const blockMethod1 = jest.fn((...args) => ({ args }));
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
            actions: {
              onClick: [
                {
                  id: 'a',
                  type: 'CallMethod',
                  params: { blockId: 'list.0.textInput', method: 'blockMethod', args: 'arg' },
                },
              ],
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: { list: [{ textInput: '0' }, { textInput: '1' }] },
  });

  const { button } = context.RootBlocks.map;
  const textInput0 = context.RootBlocks.map['list.0.textInput'];
  const textInput1 = context.RootBlocks.map['list.1.textInput'];

  textInput0.registerMethod('blockMethod', blockMethod0);
  textInput1.registerMethod('blockMethod', blockMethod1);
  await button.callAction({ action: 'onClick' });
  expect(blockMethod0.mock.calls).toEqual([['arg']]);
  expect(blockMethod1.mock.calls).toEqual([]);
});

test('CallMethod of block in array by block with same indices and id pattern', async () => {
  const blockMethod0 = jest.fn((...args) => ({ args }));
  const blockMethod1 = jest.fn((...args) => ({ args }));
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
                  {
                    blockId: 'list.$.button',
                    type: 'Button',
                    meta: {
                      category: 'display',
                      valueType: 'string',
                    },
                    actions: {
                      onClick: [
                        {
                          id: 'a',
                          type: 'CallMethod',
                          params: {
                            blockId: 'list.$.textInput',
                            method: 'blockMethod',
                            args: 'arg',
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: { list: [{ textInput: '0' }, { textInput: '1' }] },
  });

  const textInput0 = context.RootBlocks.map['list.0.textInput'];
  const textInput1 = context.RootBlocks.map['list.1.textInput'];
  const button0 = context.RootBlocks.map['list.0.button'];
  const button1 = context.RootBlocks.map['list.1.button'];

  textInput0.registerMethod('blockMethod', blockMethod0);
  textInput1.registerMethod('blockMethod', blockMethod1);
  await button1.callAction({ action: 'onClick' });
  expect(blockMethod0.mock.calls).toEqual([]);
  expect(blockMethod1.mock.calls).toEqual([['arg']]);

  await button0.callAction({ action: 'onClick' });
  expect(blockMethod0.mock.calls).toEqual([['arg']]);
  expect(blockMethod1.mock.calls).toEqual([['arg']]);
});
