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

// Mock message
const mockMessageSuccess = jest.fn();
const mockMessageError = jest.fn();
const displayMessage = {
  loading: () => jest.fn(),
  error: mockMessageError,
  success: mockMessageSuccess,
};

const pageId = 'one';

const rootContext = {
  displayMessage,
};

test('Message with content', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
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
                  type: 'Message',
                  params: { content: 'test' },
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
  });
  const { button } = context.RootBlocks.map;
  button.triggerEvent({ name: 'onClick' });
  expect(mockMessageError.mock.calls).toEqual([]);
  expect(mockMessageSuccess.mock.calls).toEqual([
    [
      {
        duration: 5,
        content: 'test',
      },
    ],
  ]);
});

test('Message with status error and content', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
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
                  type: 'Message',
                  params: { content: 'err', status: 'error' },
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
  });
  const { button } = context.RootBlocks.map;
  button.triggerEvent({ name: 'onClick' });
  expect(mockMessageSuccess.mock.calls).toEqual([]);
  expect(mockMessageError.mock.calls).toEqual([
    [
      {
        duration: 5,
        content: 'err',
      },
    ],
  ]);
});

test('Message with no params', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
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
                  type: 'Message',
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
  });
  const { button } = context.RootBlocks.map;
  button.triggerEvent({ name: 'onClick' });
  expect(mockMessageError.mock.calls).toEqual([]);
  expect(mockMessageSuccess.mock.calls).toEqual([
    [
      {
        duration: 5,
        content: 'Success',
      },
    ],
  ]);
});
