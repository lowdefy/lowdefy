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

import testContext from './testContext.js';
import DisplayMessage from './DisplayMessage.js';

const displayMessage = jest.fn();
const lowdefy = {
  _internal: {
    actions: {
      DisplayMessage,
    },
    blockComponents: {
      Button: { meta: { category: 'display' } },
    },
    displayMessage,
  },
};

const RealDate = Date;
const mockDate = jest.fn(() => ({ date: 0 }));
mockDate.now = jest.fn(() => 0);

// Comment out to use console
console.log = () => {};
console.error = () => {};

beforeEach(() => {
  displayMessage.mockReset();
});

beforeAll(() => {
  global.Date = mockDate;
});

afterAll(() => {
  global.Date = RealDate;
});

test('DisplayMessage params is not object', async () => {
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
            id: 'block:root:button:0',
            blockId: 'button',
            type: 'Button',
            meta: {
              category: 'display',
            },
            events: {
              onClick: [
                {
                  id: 'a',
                  type: 'DisplayMessage',
                  params: 1,
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
  });
  const button = context._internal.RootBlocks.map['block:root:button:0'];
  await button.triggerEvent({ name: 'onClick' });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    event: undefined,
    eventName: 'onClick',
    error: {
      action: {
        id: 'a',
        type: 'DisplayMessage',
        params: 1,
      },
      error: {
        error: new Error(
          'Invalid DisplayMessage, check action params. Params must be an object, received "1".'
        ),
        index: 0,
        type: 'DisplayMessage',
      },
    },
    responses: {
      a: {
        error: new Error(
          'Invalid DisplayMessage, check action params. Params must be an object, received "1".'
        ),
        type: 'DisplayMessage',
        index: 0,
      },
    },
    endTimestamp: { date: 0 },
    startTimestamp: { date: 0 },
    success: false,
  });
});

test('DisplayMessage params is null or undefined', async () => {
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
            id: 'block:root:button:0',
            blockId: 'button',
            type: 'Button',
            meta: {
              category: 'display',
            },
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
      },
    },
  };
  const context = testContext({
    lowdefy,
    rootBlock,
  });
  const button = context._internal.RootBlocks.map['block:root:button:0'];
  await button.triggerEvent({ name: 'onClick' });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    event: undefined,
    eventName: 'onClick',
    responses: {
      a: {
        response: undefined,
        type: 'DisplayMessage',
        index: 0,
      },
    },
    endTimestamp: { date: 0 },
    startTimestamp: { date: 0 },
    success: true,
  });
  expect(displayMessage.mock.calls).toEqual([[{ content: 'Success' }]]);
});

test('DisplayMessage params.content is none', async () => {
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
            id: 'block:root:button:0',
            blockId: 'button',
            type: 'Button',
            meta: {
              category: 'display',
            },
            events: {
              onClick: [
                {
                  id: 'a',
                  type: 'DisplayMessage',
                  params: {
                    status: 'info',
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
    lowdefy,
    rootBlock,
  });
  const button = context._internal.RootBlocks.map['block:root:button:0'];
  await button.triggerEvent({ name: 'onClick' });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    event: undefined,
    eventName: 'onClick',
    responses: {
      a: {
        response: undefined,
        type: 'DisplayMessage',
        index: 0,
      },
    },
    endTimestamp: { date: 0 },
    startTimestamp: { date: 0 },
    success: true,
  });
  expect(displayMessage.mock.calls).toEqual([[{ content: 'Success', status: 'info' }]]);
});

test('DisplayMessage params.content is ""', async () => {
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
            id: 'block:root:button:0',
            blockId: 'button',
            type: 'Button',
            meta: {
              category: 'display',
            },
            events: {
              onClick: [
                {
                  id: 'a',
                  type: 'DisplayMessage',
                  params: {
                    content: '',
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
    lowdefy,
    rootBlock,
  });
  const button = context._internal.RootBlocks.map['block:root:button:0'];
  await button.triggerEvent({ name: 'onClick' });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    event: undefined,
    eventName: 'onClick',
    responses: {
      a: {
        response: undefined,
        type: 'DisplayMessage',
        index: 0,
      },
    },
    endTimestamp: { date: 0 },
    startTimestamp: { date: 0 },
    success: true,
  });
  expect(displayMessage.mock.calls).toEqual([[{ content: '' }]]);
});

test('DisplayMessage params.content is falsy', async () => {
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
            id: 'block:root:button:0',
            blockId: 'button',
            type: 'Button',
            meta: {
              category: 'display',
            },
            events: {
              onClick: [
                {
                  id: 'a',
                  type: 'DisplayMessage',
                  params: {
                    content: 0,
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
    lowdefy,
    rootBlock,
  });
  const button = context._internal.RootBlocks.map['block:root:button:0'];
  await button.triggerEvent({ name: 'onClick' });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    event: undefined,
    eventName: 'onClick',
    responses: {
      a: {
        response: undefined,
        type: 'DisplayMessage',
        index: 0,
      },
    },
    endTimestamp: { date: 0 },
    startTimestamp: { date: 0 },
    success: true,
  });
  expect(displayMessage.mock.calls).toEqual([[{ content: 0 }]]);
});
