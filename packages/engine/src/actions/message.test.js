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

// Mock message
const mockMessage = jest.fn(() => () => undefined);

const lowdefy = {
  _internal: {
    actions: {
      Message: ({ methods: { message }, params }) => {
        return message(params);
      },
    },
    blockComponents: {
      Button: { meta: { category: 'display' } },
    },
    displayMessage: mockMessage,
  },
};

test('Message with content', async () => {
  const rootBlock = {
    id: 'block:root:root:0',
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      blocks: [
        {
          id: 'block:root:button:0',
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
                type: 'Message',
                params: { content: 'test' },
              },
            ],
          },
        },
      ],
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
  });
  const button = context._internal.RootBlocks.map['block:root:button:0'];
  button.triggerEvent({ name: 'onClick' });
  expect(mockMessage.mock.calls).toEqual([
    [
      {
        content: 'test',
      },
    ],
  ]);
});

test('Message with all params', async () => {
  const rootBlock = {
    id: 'block:root:root:0',
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      blocks: [
        {
          id: 'block:root:button:0',
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
                type: 'Message',
                params: {
                  content: 'content',
                  duration: 6,
                  icon: 'FireOutlined',
                  status: 'error',
                },
              },
            ],
          },
        },
      ],
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
  });
  const button = context._internal.RootBlocks.map['block:root:button:0'];
  button.triggerEvent({ name: 'onClick' });
  expect(mockMessage.mock.calls).toEqual([
    [
      {
        content: 'content',
        duration: 6,
        icon: 'FireOutlined',
        status: 'error',
      },
    ],
  ]);
});

test('Message with no params', async () => {
  const rootBlock = {
    id: 'block:root:root:0',
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      blocks: [
        {
          id: 'block:root:button:0',
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
                type: 'Message',
              },
            ],
          },
        },
      ],
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
  });
  const button = context._internal.RootBlocks.map['block:root:button:0'];
  button.triggerEvent({ name: 'onClick' });
  expect(mockMessage.mock.calls).toEqual([
    [
      {
        content: 'Success',
      },
    ],
  ]);
});
