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
      Action: ({ methods: { getInput }, params }) => {
        return getInput(params);
      },
    },
    blockComponents: {
      Button: { meta: { category: 'display' } },
    },
  },
  inputs: {
    test: { some: 'data' },
  },
};

const RealDate = Date;
const mockDate = jest.fn(() => ({ date: 0 }));
mockDate.now = jest.fn(() => 0);

// Comment out to use console
console.log = () => {};
console.error = () => {};

beforeEach(() => {
  global.Date = mockDate;
});

afterAll(() => {
  global.Date = RealDate;
});

test('getInput params is true', async () => {
  const rootBlock = {
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
              valueType: 'string',
            },
            events: {
              onClick: [
                {
                  id: 'a',
                  type: 'Action',
                  params: true,
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
  const button = context._internal.RootBlocks.map['button'];
  const res = await button.triggerEvent({ name: 'onClick' });
  expect(res).toEqual({
    blockId: 'button',
    bounced: false,
    endTimestamp: { date: 0 },
    event: undefined,
    eventName: 'onClick',
    responses: {
      a: {
        response: { some: 'data' },
        index: 0,
        type: 'Action',
      },
    },
    startTimestamp: { date: 0 },
    success: true,
  });
});

test('getInput params is some', async () => {
  const rootBlock = {
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
              valueType: 'string',
            },
            events: {
              onClick: [
                {
                  id: 'a',
                  type: 'Action',
                  params: 'some',
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
  const button = context._internal.RootBlocks.map['button'];
  const res = await button.triggerEvent({ name: 'onClick' });
  expect(res).toEqual({
    blockId: 'button',
    bounced: false,
    endTimestamp: { date: 0 },
    event: undefined,
    eventName: 'onClick',
    responses: {
      a: {
        index: 0,
        response: 'data',
        type: 'Action',
      },
    },
    startTimestamp: { date: 0 },
    success: true,
  });
});

test('getInput params is none', async () => {
  const rootBlock = {
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
              valueType: 'string',
            },
            events: {
              onClick: [
                {
                  id: 'a',
                  type: 'Action',
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
  const button = context._internal.RootBlocks.map['button'];
  const res = await button.triggerEvent({ name: 'onClick' });
  expect(res).toEqual({
    blockId: 'button',
    bounced: false,
    endTimestamp: { date: 0 },
    error: {
      action: { id: 'a', type: 'Action' },
      error: {
        error: new Error(
          'Method Error: getInput params must be of type string, integer, boolean or object. Received: undefined at button.'
        ),
        index: 0,
        type: 'Action',
      },
    },
    event: undefined,
    eventName: 'onClick',
    responses: {
      a: {
        error: new Error(
          'Method Error: getInput params must be of type string, integer, boolean or object. Received: undefined at button.'
        ),
        index: 0,
        type: 'Action',
      },
    },
    startTimestamp: { date: 0 },
    success: false,
  });
});

test('getInput params.key is null', async () => {
  const rootBlock = {
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
              valueType: 'string',
            },
            events: {
              onClick: [
                {
                  id: 'a',
                  type: 'Action',
                  params: {
                    key: null,
                    default: 'defaulto',
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
  const button = context._internal.RootBlocks.map['button'];
  const res = await button.triggerEvent({ name: 'onClick' });
  expect(res).toEqual({
    blockId: 'button',
    bounced: false,
    endTimestamp: { date: 0 },
    event: undefined,
    eventName: 'onClick',
    responses: {
      a: {
        response: 'defaulto',
        index: 0,
        type: 'Action',
      },
    },
    startTimestamp: { date: 0 },
    success: true,
  });
});

test('getInput params.all is true', async () => {
  const rootBlock = {
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
              valueType: 'string',
            },
            events: {
              onClick: [
                {
                  id: 'a',
                  type: 'Action',
                  params: {
                    all: true,
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
  const button = context._internal.RootBlocks.map['button'];
  const res = await button.triggerEvent({ name: 'onClick' });
  expect(res).toEqual({
    blockId: 'button',
    bounced: false,
    endTimestamp: { date: 0 },
    event: undefined,
    eventName: 'onClick',
    responses: {
      a: {
        response: { some: 'data' },
        index: 0,
        type: 'Action',
      },
    },
    startTimestamp: { date: 0 },
    success: true,
  });
});

test('getInput params.key is not string or int', async () => {
  const rootBlock = {
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
              valueType: 'string',
            },
            events: {
              onClick: [
                {
                  id: 'a',
                  type: 'Action',
                  params: {
                    key: {},
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
  const button = context._internal.RootBlocks.map['button'];
  const res = await button.triggerEvent({ name: 'onClick' });
  expect(res).toEqual({
    blockId: 'button',
    bounced: false,
    endTimestamp: { date: 0 },
    event: undefined,
    eventName: 'onClick',
    error: {
      action: {
        id: 'a',
        params: {
          key: {},
        },
        type: 'Action',
      },
      error: {
        error: new Error(
          'Method Error: getInput params.key must be of type string or integer. Received: {"key":{}} at button.'
        ),
        index: 0,
        type: 'Action',
      },
    },
    responses: {
      a: {
        error: new Error(
          'Method Error: getInput params.key must be of type string or integer. Received: {"key":{}} at button.'
        ),
        index: 0,
        type: 'Action',
      },
    },
    startTimestamp: { date: 0 },
    success: false,
  });
});

test('getInput params.key is some', async () => {
  const rootBlock = {
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
              valueType: 'string',
            },
            events: {
              onClick: [
                {
                  id: 'a',
                  type: 'Action',
                  params: {
                    key: 'some',
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
  const button = context._internal.RootBlocks.map['button'];
  const res = await button.triggerEvent({ name: 'onClick' });
  expect(res).toEqual({
    blockId: 'button',
    bounced: false,
    endTimestamp: { date: 0 },
    event: undefined,
    eventName: 'onClick',
    responses: {
      a: {
        response: 'data',
        index: 0,
        type: 'Action',
      },
    },
    startTimestamp: { date: 0 },
    success: true,
  });
});
