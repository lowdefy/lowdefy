/*
  Copyright 2020-2022 Lowdefy, Inc

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

import testContext from './testContext.js';
import Link from './Link.js';

const mockActionMethod = jest.fn();

const lowdefy = {
  _internal: {
    actions: {
      Link,
    },
    blockComponents: {
      Button: { meta: { category: 'display' } },
    },
    link: (params) => {
      if (params.pageId === 'error') {
        throw new Error('Param error');
      } else mockActionMethod(params);
    },
  },
};

// Comment out to use console
console.log = () => {};
console.error = () => {};

const RealDate = Date;
const mockDate = jest.fn(() => ({ date: 0 }));
mockDate.now = jest.fn(() => 0);

beforeEach(() => {
  mockActionMethod.mockReset();
});

beforeAll(() => {
  global.Date = mockDate;
});

afterAll(() => {
  global.Date = RealDate;
});

test('action invocation', async () => {
  const rootBlock = {
    id: 'block:root:root:0',
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            id: 'button',
            blockId: 'button',
            type: 'Button',
            meta: {
              category: 'display',
            },
            events: {
              onClick: [
                {
                  id: 'action',
                  type: 'Link',
                  params: 'call',
                },
              ],
            },
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
  });
  const button = context._internal.RootBlocks.map['button'];
  await button.triggerEvent({ name: 'onClick' });
  expect(mockActionMethod.mock.calls).toEqual([[{ pageId: 'call' }]]);
});

test('error params action invocation', async () => {
  const rootBlock = {
    id: 'block:root:root:0',
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            id: 'button',
            blockId: 'button',
            type: 'Button',
            meta: {
              category: 'display',
            },
            events: {
              onClick: [
                {
                  id: 'action',
                  type: 'Link',
                  params: 'error',
                },
              ],
            },
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
  });
  const button = context._internal.RootBlocks.map['button'];
  await button.triggerEvent({ name: 'onClick' });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    event: undefined,
    eventName: 'onClick',
    error: {
      action: {
        id: 'action',
        type: 'Link',
        params: 'error',
      },
      error: {
        error: new Error('Invalid Link, check action params. Received ""error"".'),
        index: 0,
        type: 'Link',
      },
    },
    responses: {
      action: {
        error: new Error('Invalid Link, check action params. Received ""error"".'),
        type: 'Link',
        index: 0,
      },
    },
    endTimestamp: { date: 0 },
    startTimestamp: { date: 0 },
    success: false,
  });
});
