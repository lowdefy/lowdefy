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

// Mock message
const mockMessage = jest.fn(() => () => undefined);

const lowdefy = {
  _internal: {
    actions: {
      DisplayMessage: ({ methods: { displayMessage }, params }) => {
        return displayMessage({
          ...params,
          content: params ? params.content : 'Success',
        });
      },
    },
    displayMessage: mockMessage,
  },
};

test('DisplayMessage with content', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [
            {
              id: 'a',
              type: 'DisplayMessage',
              params: { content: 'test' },
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
  button.triggerEvent({ name: 'onClick' });
  expect(mockMessage.mock.calls).toEqual([
    [
      {
        content: 'test',
      },
    ],
  ]);
});

test('DisplayMessage with all params', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [
            {
              id: 'a',
              type: 'DisplayMessage',
              params: {
                content: 'content',
                duration: 6,
                icon: 'AiOutlineFire',
                status: 'error',
              },
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
  button.triggerEvent({ name: 'onClick' });
  expect(mockMessage.mock.calls).toEqual([
    [
      {
        content: 'content',
        duration: 6,
        icon: 'AiOutlineFire',
        status: 'error',
      },
    ],
  ]);
});

test('DisplayMessage with no params', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [
            {
              id: 'a',
              type: 'DisplayMessage',
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
  button.triggerEvent({ name: 'onClick' });
  expect(mockMessage.mock.calls).toEqual([
    [
      {
        content: 'Success',
      },
    ],
  ]);
});
