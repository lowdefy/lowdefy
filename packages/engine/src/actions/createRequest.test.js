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
  req_two: {
    id: 'req_two',
    success: true,
    response: 2,
  },
  req_error: new Error('Request error'),
};

const mockCallRequest = jest.fn();
const mockCallRequestImp = ({ requestId }) => {
  if (requestId === 'req_error') throw mockReqResponses['req_error'];
  return mockReqResponses[requestId];
};

const lowdefy = {
  _internal: {
    actions: {
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

test('Request call one request', async () => {
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
              onClick: [{ id: 'a', type: 'Request', params: 'req_one' }],
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
  const promise = button.triggerEvent({ name: 'onClick' });
  expect(context.requests.req_one).toEqual({
    error: [],
    loading: true,
    response: null,
  });
  const res = await promise;
  expect(res).toEqual({
    blockId: 'button',
    bounced: false,
    event: undefined,
    eventName: 'onClick',
    responses: {
      a: {
        type: 'Request',
        index: 0,
        response: [1],
      },
    },
    success: true,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
});

test('Request call all requests', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    requests: [
      {
        requestId: 'req_one',
      },
      {
        requestId: 'req_two',
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
              onClick: [{ id: 'a', type: 'Request', params: { all: true } }],
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
  const promise = button.triggerEvent({ name: 'onClick' });
  expect(context.requests).toEqual({
    req_one: {
      error: [],
      loading: true,
      response: null,
    },
    req_two: {
      error: [],
      loading: true,
      response: null,
    },
  });
  const res = await promise;
  expect(context.requests).toEqual({
    req_one: {
      error: [],
      loading: false,
      response: 1,
    },
    req_two: {
      error: [],
      loading: false,
      response: 2,
    },
  });
  expect(res).toEqual({
    blockId: 'button',
    bounced: false,
    event: undefined,
    eventName: 'onClick',
    responses: {
      a: {
        type: 'Request',
        index: 0,
        response: [1, 2],
      },
    },
    success: true,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
});

test('Request call array of requests', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    requests: [
      {
        requestId: 'req_one',
      },
      {
        requestId: 'req_two',
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
              onClick: [{ id: 'a', type: 'Request', params: ['req_one', 'req_two'] }],
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
  const promise = button.triggerEvent({ name: 'onClick' });
  expect(context.requests).toEqual({
    req_one: {
      error: [],
      loading: true,
      response: null,
    },
    req_two: {
      error: [],
      loading: true,
      response: null,
    },
  });
  const res = await promise;
  expect(context.requests).toEqual({
    req_one: {
      error: [],
      loading: false,
      response: 1,
    },
    req_two: {
      error: [],
      loading: false,
      response: 2,
    },
  });
  expect(res).toEqual({
    blockId: 'button',
    bounced: false,
    event: undefined,
    eventName: 'onClick',
    responses: {
      a: {
        type: 'Request',
        index: 0,
        response: [1, 2],
      },
    },
    success: true,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
});

test('Request pass if params are none', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    requests: [
      {
        requestId: 'req_one',
      },
      {
        requestId: 'req_two',
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
              onClick: [{ id: 'a', type: 'Request' }],
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
  expect(context.requests).toEqual({});
});

test('Request call request error', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    requests: [
      {
        requestId: 'req_error',
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
              onClick: [{ id: 'a', type: 'Request', params: 'req_error' }],
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
  const res = await button.triggerEvent({ name: 'onClick' });
  expect(context.requests.req_error).toEqual({
    error: [new Error('Request error')],
    loading: false,
    response: null,
  });
  expect(res).toEqual({
    blockId: 'button',
    bounced: false,
    event: undefined,
    eventName: 'onClick',
    error: {
      action: {
        id: 'a',
        params: 'req_error',
        type: 'Request',
      },
      error: {
        error: new Error('Request error'),
        index: 0,
        type: 'Request',
      },
    },
    responses: {
      a: {
        type: 'Request',
        index: 0,
        error: new Error('Request error'),
      },
    },
    success: false,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
});
