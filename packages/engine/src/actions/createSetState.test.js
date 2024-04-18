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

import testContext from '../../test/testContext.js';

const lowdefy = {
  _internal: {
    actions: {
      SetState: ({ methods: { setState }, params }) => {
        return setState(params);
      },
    },
  },
};

test('SetState data to state', async () => {
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
          onClick: [{ id: 'a', type: 'SetState', params: { x: [1, 2, 3] } }],
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
  expect(context.state).toEqual({ textInput: 'init' });
  button.triggerEvent({ name: 'onClick' });
  expect(context.state).toEqual({ textInput: 'init', x: [1, 2, 3] });
});

test('SetState field to state and update block value', async () => {
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
          onClick: [{ id: 'a', type: 'SetState', params: { textInput: 'new' } }],
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

  expect(context.state).toEqual({ textInput: 'init' });
  await button.triggerEvent({ name: 'onClick' });
  expect(context.state).toEqual({ textInput: 'new' });
  expect(textInput.value).toEqual('new');
});

test('SetState field to state with incorrect type - NOTE SetState IS NOT TYPE SAFE', async () => {
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
          onClick: [{ id: 'a', type: 'SetState', params: { textInput: 1 } }],
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

  expect(context.state).toEqual({ textInput: 'init' });
  await button.triggerEvent({ name: 'onClick' });
  expect(context.state).toEqual({ textInput: 1 });
  expect(textInput.value).toEqual(1);
});

test('SetState value on array and create new Blocks for array items', async () => {
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
          },
        ],
      },
      {
        id: 'button',
        type: 'Button',
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
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const button = context._internal.RootBlocks.map['button'];

  expect(context.state).toEqual({ list: [{ textInput: 'init' }] });

  await button.triggerEvent({ name: 'onClick' });
  expect(context.state).toEqual({
    list: [{ textInput: '0' }, { textInput: '1' }, { textInput: '2' }],
  });

  const textInput0 = context._internal.RootBlocks.map['list.0.textInput'];
  const textInput1 = context._internal.RootBlocks.map['list.1.textInput'];
  const textInput2 = context._internal.RootBlocks.map['list.2.textInput'];

  expect(textInput0.value).toEqual('0');
  expect(textInput1.value).toEqual('1');
  expect(textInput2.value).toEqual('2');
});
