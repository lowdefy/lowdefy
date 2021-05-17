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

const gqlError = new Error('gqlError');

gqlError.graphQLErrors = [
  {
    extensions: {
      displayTitle: 'displayTitle',
      displayMessage: 'displayMessage',
    },
  },
];

// Mock apollo client
const mockReqResponses = {
  req_one: {
    data: {
      request: {
        id: 'req_one',
        success: true,
        response: 1,
      },
    },
  },
  req_two: {
    data: {
      request: {
        id: 'req_two',
        success: true,
        response: 2,
      },
    },
  },
  req_error: new Error('Request error'),
  req_gql_error: gqlError,
};

const mockQuery = jest.fn();
const mockQueryImp = ({ variables }) => {
  const { input } = variables;
  const { requestId } = input;
  return new Promise((resolve, reject) => {
    if (requestId.includes('error')) {
      reject(mockReqResponses[requestId]);
    }
    resolve(mockReqResponses[requestId]);
  });
};

const client = {
  query: mockQuery,
};
const pageId = 'one';
const lowdefy = {
  client,
  pageId,
};

const RealDate = Date;
const mockDate = jest.fn(() => ({ date: 0 }));
mockDate.now = jest.fn(() => 0);

// Comment out to use console.log
console.log = () => {};

beforeAll(() => {
  global.Date = mockDate;
});

afterAll(() => {
  global.Date = RealDate;
});

beforeEach(() => {
  mockQuery.mockReset();
  mockQuery.mockImplementation(mockQueryImp);
});

test('Request call one request', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
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
  const { button } = context.RootBlocks.map;
  const promise = button.triggerEvent({ name: 'onClick' });
  expect(context.requests.req_one).toEqual({
    error: [],
    loading: true,
    response: null,
  });
  const res = await promise;
  expect(context.requests.req_one).toEqual({
    error: [],
    loading: false,
    response: 1,
  });
  expect(res).toEqual({
    blockId: 'button',
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
      category: 'context',
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
  const { button } = context.RootBlocks.map;
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
      category: 'context',
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
  const { button } = context.RootBlocks.map;
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
      category: 'context',
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
  const { button } = context.RootBlocks.map;
  await button.triggerEvent({ name: 'onClick' });
  expect(context.requests).toEqual({});
});

test('Request call request error', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
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
  const { button } = context.RootBlocks.map;
  const res = await button.triggerEvent({ name: 'onClick' });

  expect(context.requests.req_error).toEqual({
    error: [new Error('Request error')],
    loading: false,
    response: null,
  });
  expect(res).toEqual({
    blockId: 'button',
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

test('Request call request graphql error', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    requests: [
      {
        requestId: 'req_gql_error',
      },
    ],
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
              onClick: [{ id: 'a', type: 'Request', params: 'req_gql_error' }],
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
  const res = await button.triggerEvent({ name: 'onClick' });
  expect(context.requests.req_gql_error).toEqual({
    error: [new Error('gqlError')],
    loading: false,
    response: null,
  });
  expect(res).toEqual({
    blockId: 'button',
    event: undefined,
    eventName: 'onClick',
    error: {
      action: {
        id: 'a',
        params: 'req_gql_error',
        type: 'Request',
      },
      error: {
        error: new Error('displayTitle: displayMessage'),
        index: 0,
        type: 'Request',
      },
    },
    responses: {
      a: {
        type: 'Request',
        index: 0,
        error: new Error('displayTitle: displayMessage'),
      },
    },
    success: false,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
});
