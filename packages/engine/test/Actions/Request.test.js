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
};

const mockQuery = jest.fn();
const mockQueryImp = ({ variables }) => {
  const { input } = variables;
  const { requestId } = input;
  return new Promise((resolve, reject) => {
    if (requestId === 'req_error') {
      reject(mockReqResponses[requestId]);
    }
    resolve(mockReqResponses[requestId]);
  });
};

const client = {
  query: mockQuery,
};
const pageId = 'one';
const rootContext = {
  client,
};

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
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
  });
  const { button } = context.RootBlocks.map;
  await context.Requests.callRequests();
  expect(context.requests.req_one).toEqual({
    error: [null],
    loading: false,
    response: 1,
  });
  const promise = button.triggerEvent({ name: 'onClick' });
  expect(context.requests.req_one).toEqual({
    error: [null],
    loading: true,
    response: 1,
  });
  await promise;
  expect(context.requests.req_one).toEqual({
    error: [null, null],
    loading: false,
    response: 1,
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
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
  });
  const { button } = context.RootBlocks.map;
  await context.Requests.callRequests();
  expect(context.requests).toEqual({
    req_one: {
      error: [null],
      loading: false,
      response: 1,
    },
    req_two: {
      error: [null],
      loading: false,
      response: 2,
    },
  });
  const promise = button.triggerEvent({ name: 'onClick' });
  expect(context.requests).toEqual({
    req_one: {
      error: [null],
      loading: true,
      response: 1,
    },
    req_two: {
      error: [null],
      loading: true,
      response: 2,
    },
  });
  await promise;
  expect(context.requests).toEqual({
    req_one: {
      error: [null, null],
      loading: false,
      response: 1,
    },
    req_two: {
      error: [null, null],
      loading: false,
      response: 2,
    },
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
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
  });
  const { button } = context.RootBlocks.map;
  await context.Requests.callRequests();
  expect(context.requests).toEqual({
    req_one: {
      error: [null],
      loading: false,
      response: 1,
    },
    req_two: {
      error: [null],
      loading: false,
      response: 2,
    },
  });
  const promise = button.triggerEvent({ name: 'onClick' });
  expect(context.requests).toEqual({
    req_one: {
      error: [null],
      loading: true,
      response: 1,
    },
    req_two: {
      error: [null],
      loading: true,
      response: 2,
    },
  });
  await promise;
  expect(context.requests).toEqual({
    req_one: {
      error: [null, null],
      loading: false,
      response: 1,
    },
    req_two: {
      error: [null, null],
      loading: false,
      response: 2,
    },
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
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
  });
  const { button } = context.RootBlocks.map;
  await context.Requests.callRequests();
  expect(context.requests).toEqual({
    req_one: {
      error: [null],
      loading: false,
      response: 1,
    },
    req_two: {
      error: [null],
      loading: false,
      response: 2,
    },
  });
  await button.triggerEvent({ name: 'onClick' });
  expect(context.requests).toEqual({
    req_one: {
      error: [null],
      loading: false,
      response: 1,
    },
    req_two: {
      error: [null],
      loading: false,
      response: 2,
    },
  });
});
