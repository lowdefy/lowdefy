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
      Request: ({ methods: { request }, params }) => {
        return request(params);
      },
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
  const pageConfig = {
    id: 'root',
    type: 'Box',
    requests: [
      {
        id: 'req_one',
        type: 'Fetch',
      },
    ],
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [{ id: 'a', type: 'Request', params: 'req_one' }],
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const button = context._internal.RootBlocks.map['button'];
  const promise = button.triggerEvent({ name: 'onClick' });
  expect(context.requests.req_one).toEqual([
    {
      blockId: 'button',
      loading: true,
      payload: {},
      requestId: 'req_one',
      response: null,
    },
  ]);
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
  const pageConfig = {
    id: 'root',
    type: 'Box',
    requests: [
      {
        id: 'req_one',
        type: 'Fetch',
      },
      {
        id: 'req_two',
        type: 'Fetch',
        payload: {
          x: 1,
        },
      },
    ],
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [{ id: 'a', type: 'Request', params: { all: true } }],
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const button = context._internal.RootBlocks.map['button'];
  const promise = button.triggerEvent({ name: 'onClick' });
  expect(context.requests).toEqual({
    req_one: [
      {
        blockId: 'button',
        loading: true,
        payload: {},
        requestId: 'req_one',
        response: null,
      },
    ],
    req_two: [
      {
        blockId: 'button',
        loading: true,
        payload: {
          x: 1,
        },
        requestId: 'req_two',
        response: null,
      },
    ],
  });
  const res = await promise;
  expect(context.requests).toEqual({
    req_one: [
      {
        blockId: 'button',
        loading: false,
        payload: {},
        requestId: 'req_one',
        response: 1,
        responseTime: 0,
      },
    ],
    req_two: [
      {
        blockId: 'button',
        loading: false,
        payload: {
          x: 1,
        },
        requestId: 'req_two',
        response: 2,
        responseTime: 0,
      },
    ],
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
  const pageConfig = {
    id: 'root',
    type: 'Box',
    requests: [
      {
        id: 'req_one',
        type: 'Fetch',
      },
      {
        id: 'req_two',
        type: 'Fetch',
        payload: { x: 1 },
      },
    ],
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [{ id: 'a', type: 'Request', params: ['req_one', 'req_two'] }],
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const button = context._internal.RootBlocks.map['button'];
  const promise = button.triggerEvent({ name: 'onClick' });
  expect(context.requests).toEqual({
    req_one: [
      {
        blockId: 'button',
        loading: true,
        payload: {},
        requestId: 'req_one',
        response: null,
      },
    ],
    req_two: [
      {
        blockId: 'button',
        loading: true,
        payload: {
          x: 1,
        },
        requestId: 'req_two',
        response: null,
      },
    ],
  });
  const res = await promise;
  expect(context.requests).toEqual({
    req_one: [
      {
        blockId: 'button',
        loading: false,
        payload: {},
        requestId: 'req_one',
        response: 1,
        responseTime: 0,
      },
    ],
    req_two: [
      {
        blockId: 'button',
        loading: false,
        payload: {
          x: 1,
        },
        requestId: 'req_two',
        response: 2,
        responseTime: 0,
      },
    ],
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
  const pageConfig = {
    id: 'root',
    type: 'Box',
    requests: [
      {
        id: 'req_one',
        type: 'Fetch',
      },
      {
        id: 'req_two',
        type: 'Fetch',
        payload: { x: 1 },
      },
    ],
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [{ id: 'a', type: 'Request' }],
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const button = context._internal.RootBlocks.map['button'];
  await button.triggerEvent({ name: 'onClick' });
  expect(context.requests).toEqual({});
});

test('Request call request error', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    requests: [
      {
        id: 'req_error',
        type: 'Fetch',
      },
    ],
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [{ id: 'a', type: 'Request', params: 'req_error' }],
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const button = context._internal.RootBlocks.map['button'];
  const res = await button.triggerEvent({ name: 'onClick' });
  expect(context.requests.req_error).toEqual([
    {
      blockId: 'button',
      error: new Error('Request error'),
      loading: false,
      payload: {},
      requestId: 'req_error',
      response: null,
      responseTime: 0,
    },
  ]);
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
