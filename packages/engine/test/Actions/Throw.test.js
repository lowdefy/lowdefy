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
import { ThrowActionError } from '../../src/actions/Throw';

const pageId = 'one';

const closeLoader = jest.fn();
const displayMessage = jest.fn();
const lowdefy = {
  displayMessage,
  pageId,
};

const RealDate = Date;
const mockDate = jest.fn(() => ({ date: 0 }));
mockDate.now = jest.fn(() => 0);

// Comment out to use console
console.log = () => {};
console.error = () => {};

beforeEach(() => {
  displayMessage.mockReset();
  closeLoader.mockReset();
  displayMessage.mockImplementation(() => closeLoader);
});

beforeAll(() => {
  global.Date = mockDate;
});

afterAll(() => {
  global.Date = RealDate;
});

test('Throw no params', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            blockId: 'text',
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
            },
            events: {
              onClick: [
                {
                  id: 'throw',
                  type: 'Throw',
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
  const { button } = context.RootBlocks.map;
  await button.triggerEvent({ name: 'onClick' });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    event: undefined,
    eventName: 'onClick',
    responses: {
      throw: {
        type: 'Throw',
        response: undefined,
        index: 0,
      },
    },
    endTimestamp: { date: 0 },
    startTimestamp: { date: 0 },
    success: true,
  });
  expect(displayMessage.mock.calls).toMatchInlineSnapshot(`Array []`);
});

test('Throw throw true no message or metaData', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            blockId: 'text',
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
            },
            events: {
              onClick: [
                {
                  id: 'throw',
                  type: 'Throw',
                  params: { throw: true },
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
  const { button } = context.RootBlocks.map;
  await button.triggerEvent({ name: 'onClick' });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    error: {
      error: {
        type: 'Throw',
        error: new ThrowActionError(undefined, { blockId: 'button', context: context }),
        index: 0,
      },
      action: {
        id: 'throw',
        type: 'Throw',
        params: { throw: true },
      },
    },
    event: undefined,
    eventName: 'onClick',
    responses: {
      throw: {
        type: 'Throw',
        error: new ThrowActionError(undefined, { blockId: 'button', context: context }),
        index: 0,
      },
    },
    endTimestamp: { date: 0 },
    startTimestamp: { date: 0 },
    success: false,
  });
  expect(displayMessage.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "content": "",
          "duration": 6,
          "status": "error",
        },
      ],
    ]
  `);
});

test('Throw throw true message no metaData', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            blockId: 'text',
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
            },
            events: {
              onClick: [
                {
                  id: 'throw',
                  type: 'Throw',
                  params: { throw: true, message: 'My error message' },
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
  const { button } = context.RootBlocks.map;
  await button.triggerEvent({ name: 'onClick' });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    error: {
      error: {
        type: 'Throw',
        error: new ThrowActionError('My error message', { blockId: 'button', context: context }),
        index: 0,
      },
      action: {
        id: 'throw',
        type: 'Throw',
        params: { throw: true, message: 'My error message' },
      },
    },
    event: undefined,
    eventName: 'onClick',
    responses: {
      throw: {
        type: 'Throw',
        error: new ThrowActionError('My error message', { blockId: 'button', context: context }),
        index: 0,
      },
    },
    endTimestamp: { date: 0 },
    startTimestamp: { date: 0 },
    success: false,
  });
  expect(displayMessage.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "content": "My error message",
          "duration": 6,
          "status": "error",
        },
      ],
    ]
  `);
});

test('Throw throw true message metaData string', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            blockId: 'text',
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
            },
            events: {
              onClick: [
                {
                  id: 'throw',
                  type: 'Throw',
                  params: { throw: true, message: 'My error message', metaData: 'Meta string' },
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
  const { button } = context.RootBlocks.map;
  await button.triggerEvent({ name: 'onClick' });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    error: {
      error: {
        type: 'Throw',
        error: new ThrowActionError('My error message', {
          blockId: 'button',
          context: context,
          metaData: 'Meta string',
        }),
        index: 0,
      },
      action: {
        id: 'throw',
        type: 'Throw',
        params: { throw: true, message: 'My error message', metaData: 'Meta string' },
      },
    },
    event: undefined,
    eventName: 'onClick',
    responses: {
      throw: {
        type: 'Throw',
        error: new ThrowActionError('My error message', {
          blockId: 'button',
          context: context,
          metaData: 'Meta string',
        }),
        index: 0,
      },
    },
    endTimestamp: { date: 0 },
    startTimestamp: { date: 0 },
    success: false,
  });
  expect(displayMessage.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "content": "My error message",
          "duration": 6,
          "status": "error",
        },
      ],
    ]
  `);
});

test('Throw throw true message metaData object', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            blockId: 'text',
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
            },
            events: {
              onClick: [
                {
                  id: 'throw',
                  type: 'Throw',
                  params: { throw: true, message: 'My error message', metaData: { key: 'value' } },
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
  const { button } = context.RootBlocks.map;
  await button.triggerEvent({ name: 'onClick' });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    error: {
      error: {
        type: 'Throw',
        error: new ThrowActionError('My error message', {
          blockId: 'button',
          context: context,
          metaData: { key: 'value' },
        }),
        index: 0,
      },
      action: {
        id: 'throw',
        type: 'Throw',
        params: { throw: true, message: 'My error message', metaData: { key: 'value' } },
      },
    },
    event: undefined,
    eventName: 'onClick',
    responses: {
      throw: {
        type: 'Throw',
        error: new ThrowActionError('My error message', {
          blockId: 'button',
          context: context,
          metaData: 'Meta string',
        }),
        index: 0,
      },
    },
    endTimestamp: { date: 0 },
    startTimestamp: { date: 0 },
    success: false,
  });
  expect(displayMessage.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "content": "My error message",
          "duration": 6,
          "status": "error",
        },
      ],
    ]
  `);
});

test('Throw throw false', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            blockId: 'text',
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
            },
            events: {
              onClick: [
                {
                  id: 'throw',
                  type: 'Throw',
                  params: { throw: false },
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
  const { button } = context.RootBlocks.map;
  await button.triggerEvent({ name: 'onClick' });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    event: undefined,
    eventName: 'onClick',
    responses: {
      throw: {
        type: 'Throw',
        response: undefined,
        index: 0,
      },
    },
    endTimestamp: { date: 0 },
    startTimestamp: { date: 0 },
    success: true,
  });
  expect(displayMessage.mock.calls).toMatchInlineSnapshot(`Array []`);
});

test('Throw throw invalid', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            blockId: 'text',
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
            },
            events: {
              onClick: [
                {
                  id: 'throw',
                  type: 'Throw',
                  params: { throw: 'invalid' },
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
  const { button } = context.RootBlocks.map;
  await button.triggerEvent({ name: 'onClick' });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    error: {
      error: {
        type: 'Throw',
        error: new Error('Invalid Throw, check action params. Received "{"throw":"invalid"}".'),
        index: 0,
      },
      action: {
        id: 'throw',
        type: 'Throw',
        params: { throw: 'invalid' },
      },
    },
    event: undefined,
    eventName: 'onClick',
    responses: {
      throw: {
        type: 'Throw',
        error: new Error('Invalid Throw, check action params. Received "{"throw":"invalid"}".'),
        index: 0,
      },
    },
    endTimestamp: { date: 0 },
    startTimestamp: { date: 0 },
    success: false,
  });
  expect(displayMessage.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "content": "Invalid Throw, check action params. Received \\"{\\"throw\\":\\"invalid\\"}\\".",
          "duration": 6,
          "status": "error",
        },
      ],
    ]
  `);
});
