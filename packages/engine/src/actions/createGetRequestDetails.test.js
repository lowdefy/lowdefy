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

// Mock apollo client
const mockReqResponses = {
  req_one: {
    id: 'req_one',
    success: true,
    response: 1,
  },
  req_error: new Error('Request error'),
};

const mockCallRequest = jest.fn();
const mockCallRequestImp = ({ requestId }) => {
  return new Promise((resolve, reject) => {
    if (requestId === 'req_error') {
      reject(mockReqResponses[requestId]);
    }
    resolve(mockReqResponses[requestId]);
  });
};

const lowdefy = {
  _internal: {
    actions: {
      Action: ({ methods: { getRequestDetails }, params }) => {
        return getRequestDetails(params);
      },
      Request: ({ methods: { request }, params }) => {
        return request(params);
      },
    },
    blockComponents: {
      Button: { meta: { category: 'display' } },
    },
    callRequest: mockCallRequest,
  },
};

const RealDate = Date;
const mockDate = jest.fn(() => ({ date: 0 }));
mockDate.now = jest.fn(() => 0);

// Comment out to use console
console.log = () => {};
console.error = () => {};

beforeAll(() => {
  global.Date = mockDate;
});

afterAll(() => {
  global.Date = RealDate;
});

beforeEach(() => {
  mockCallRequest.mockReset();
  mockCallRequest.mockImplementation(mockCallRequestImp);
});

test('getRequestDetails params is true', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    requests: [
      {
        requestId: 'req_one',
      },
    ],
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
                { id: 'a', type: 'Request', params: ['req_one'] },
                {
                  id: 'b',
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
        index: 0,
        response: [1],
        type: 'Request',
      },
      b: {
        response: {
          req_one: {
            error: [],
            loading: false,
            response: 1,
          },
        },
        index: 1,
        type: 'Action',
      },
    },
    startTimestamp: { date: 0 },
    success: true,
  });
});

test('getRequestDetails params is req_one', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    requests: [
      {
        requestId: 'req_one',
      },
    ],
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
                { id: 'a', type: 'Request', params: ['req_one'] },
                {
                  id: 'b',
                  type: 'Action',
                  params: 'req_one',
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
        response: [1],
        type: 'Request',
      },
      b: {
        response: {
          error: [],
          loading: false,
          response: 1,
        },
        index: 1,
        type: 'Action',
      },
    },
    startTimestamp: { date: 0 },
    success: true,
  });
});

test('getRequestDetails params is none', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    requests: [
      {
        requestId: 'req_one',
      },
    ],
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
                { id: 'a', type: 'Request', params: ['req_one'] },
                {
                  id: 'b',
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
      action: { id: 'b', type: 'Action' },
      error: {
        error: new Error(
          'Method Error: getRequestDetails params must be of type string, integer, boolean or object. Received: undefined at button.'
        ),
        index: 1,
        type: 'Action',
      },
    },
    event: undefined,
    eventName: 'onClick',
    responses: {
      a: {
        index: 0,
        response: [1],
        type: 'Request',
      },
      b: {
        error: new Error(
          'Method Error: getRequestDetails params must be of type string, integer, boolean or object. Received: undefined at button.'
        ),
        index: 1,
        type: 'Action',
      },
    },
    startTimestamp: { date: 0 },
    success: false,
  });
});

test('getRequestDetails params.key is null', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    requests: [
      {
        requestId: 'req_one',
      },
    ],
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
                { id: 'a', type: 'Request', params: ['req_one'] },
                {
                  id: 'b',
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
        index: 0,
        response: [1],
        type: 'Request',
      },
      b: {
        response: 'defaulto',
        index: 1,
        type: 'Action',
      },
    },
    startTimestamp: { date: 0 },
    success: true,
  });
});

test('getRequestDetails params.all is true', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    requests: [
      {
        requestId: 'req_one',
      },
    ],
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
                { id: 'a', type: 'Request', params: ['req_one'] },
                {
                  id: 'b',
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
        index: 0,
        response: [1],
        type: 'Request',
      },
      b: {
        response: {
          req_one: {
            error: [],
            loading: false,
            response: 1,
          },
        },
        index: 1,
        type: 'Action',
      },
    },
    startTimestamp: { date: 0 },
    success: true,
  });
});

test('getRequestDetails params.key is not string or int', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    requests: [
      {
        requestId: 'req_one',
      },
    ],
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
                { id: 'a', type: 'Request', params: ['req_one'] },
                {
                  id: 'b',
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
        id: 'b',
        params: {
          key: {},
        },
        type: 'Action',
      },
      error: {
        error: new Error(
          'Method Error: getRequestDetails params.key must be of type string or integer. Received: {"key":{}} at button.'
        ),
        index: 1,
        type: 'Action',
      },
    },
    responses: {
      a: {
        index: 0,
        response: [1],
        type: 'Request',
      },
      b: {
        error: new Error(
          'Method Error: getRequestDetails params.key must be of type string or integer. Received: {"key":{}} at button.'
        ),
        index: 1,
        type: 'Action',
      },
    },
    startTimestamp: { date: 0 },
    success: false,
  });
});

test('getRequestDetails params.key is req_one', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    requests: [
      {
        requestId: 'req_one',
      },
    ],
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
                { id: 'a', type: 'Request', params: ['req_one'] },
                {
                  id: 'b',
                  type: 'Action',
                  params: {
                    key: 'req_one',
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
        index: 0,
        response: [1],
        type: 'Request',
      },
      b: {
        response: {
          error: [],
          loading: false,
          response: 1,
        },
        index: 1,
        type: 'Action',
      },
    },
    startTimestamp: { date: 0 },
    success: true,
  });
});
