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

import { expect, jest } from '@jest/globals';

import testContext from './testContext.js';

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

  req_error: new Error('mock error'),
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

const getPageConfig = () => {
  return {
    id: 'page1',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { state: true },
        },
      ],
    },
    requests: [
      {
        id: 'req_one',
        type: 'Fetch',
        payload: {
          event: {
            _event: true,
          },
          action: {
            _actions: 'action1',
          },
          sum: {
            _sum: [1, 1],
          },
          arrayIndices: {
            _global: 'array.$',
          },
        },
      },
      {
        id: 'req_error',
        type: 'Fetch',
      },
      {
        id: 'req_two',
        type: 'Fetch',
      },
    ],
  };
};

const actions = {};
const event = {};
const arrayIndices = [];
const lowdefy = {
  lowdefyGlobal: { array: ['a', 'b', 'c'] },
};
const blockId = 'block_id';

// Comment out to use console
console.log = () => {};
console.error = () => {};

beforeEach(() => {
  mockCallRequest.mockReset();
  mockCallRequest.mockImplementation(mockCallRequestImp);
});

test('callRequest', async () => {
  const pageConfig = getPageConfig();
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  context._internal.lowdefy._internal.callRequest = mockCallRequest;
  await context._internal.Requests.callRequest({ requestId: 'req_one', blockId });
  expect(context.requests).toEqual({
    req_one: [
      {
        blockId: 'block_id',
        loading: false,
        response: 1,
        requestId: 'req_one',
        payload: {
          action: null,
          arrayIndices: null,
          sum: 2,
        },
        responseTime: expect.any(Number),
      },
    ],
  });
});

test('callRequest, payload operators are evaluated', async () => {
  const pageConfig = getPageConfig();

  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  context._internal.lowdefy._internal.callRequest = mockCallRequest;
  await context._internal.Requests.callRequest({
    blockId,
    requestId: 'req_one',
    event: { event: true },
    actions: { action1: 'action1' },
    arrayIndices: [1],
  });
  expect(mockCallRequest.mock.calls[0][0]).toEqual({
    blockId: 'block_id',
    pageId: 'page1',
    requestId: 'req_one',
    payload: {
      event: { event: true },
      action: 'action1',
      sum: 2,
      arrayIndices: 'b',
    },
  });
});

test('callRequests all requests', async () => {
  const pageConfig = getPageConfig();
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  context._internal.lowdefy._internal.callRequest = mockCallRequest;
  let before;
  try {
    const promise = context._internal.Requests.callRequests({
      actions,
      arrayIndices,
      blockId,
      event,
      params: { all: true },
    });
    before = JSON.parse(JSON.stringify(context.requests));
    await promise;
  } catch (e) {
    // catch thrown errors
  }
  expect(before).toEqual({
    req_error: [
      {
        blockId: 'block_id',
        loading: true,
        payload: {},
        requestId: 'req_error',
        response: null,
      },
    ],
    req_one: [
      {
        blockId: 'block_id',
        loading: true,
        payload: {
          action: null,
          arrayIndices: null,
          event: {},
          sum: 2,
        },
        requestId: 'req_one',
        response: null,
      },
    ],
    req_two: [
      {
        blockId: 'block_id',
        loading: true,
        payload: {},
        requestId: 'req_two',
        response: null,
      },
    ],
  });
  expect(context.requests).toEqual({
    req_error: [
      {
        blockId: 'block_id',
        error: new Error('mock error'),
        loading: false,
        payload: {},
        requestId: 'req_error',
        response: null,
        responseTime: expect.any(Number),
      },
    ],
    req_one: [
      {
        blockId: 'block_id',
        loading: false,
        payload: {
          action: null,
          arrayIndices: null,
          event: {},
          sum: 2,
        },
        requestId: 'req_one',
        response: 1,
        responseTime: expect.any(Number),
      },
    ],
    req_two: [
      {
        blockId: 'block_id',
        loading: false,
        payload: {},
        requestId: 'req_two',
        response: 2,
        responseTime: expect.any(Number),
      },
    ],
  });
  expect(mockCallRequest).toHaveBeenCalledTimes(3);
});

test('callRequests', async () => {
  const pageConfig = getPageConfig();
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  context._internal.lowdefy._internal.callRequest = mockCallRequest;
  const promise = context._internal.Requests.callRequests({
    actions,
    arrayIndices,
    blockId,
    event,
    params: ['req_one'],
  });
  expect(context.requests).toEqual({
    req_one: [
      {
        blockId: 'block_id',
        loading: true,
        payload: {
          action: null,
          arrayIndices: null,
          event: {},
          sum: 2,
        },
        requestId: 'req_one',
        response: null,
      },
    ],
  });
  await promise;
  expect(context.requests).toEqual({
    req_one: [
      {
        blockId: 'block_id',
        loading: false,
        payload: {
          action: null,
          arrayIndices: null,
          event: {},
          sum: 2,
        },
        requestId: 'req_one',
        response: 1,
        responseTime: expect.any(Number),
      },
    ],
  });
  expect(mockCallRequest).toHaveBeenCalledTimes(1);
});

test('callRequest error', async () => {
  const pageConfig = getPageConfig();
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  context._internal.lowdefy._internal.callRequest = mockCallRequest;
  await expect(
    context._internal.Requests.callRequest({ requestId: 'req_error', blockId })
  ).rejects.toThrow();
  expect(context.requests).toEqual({
    req_error: [
      {
        blockId: 'block_id',
        error: new Error('mock error'),
        loading: false,
        payload: {},
        requestId: 'req_error',
        response: null,
        responseTime: expect.any(Number),
      },
    ],
  });
  await expect(
    context._internal.Requests.callRequest({ requestId: 'req_error', blockId })
  ).rejects.toThrow();
  expect(context.requests).toEqual({
    req_error: [
      {
        blockId: 'block_id',
        error: new Error('mock error'),
        loading: false,
        payload: {},
        requestId: 'req_error',
        response: null,
        responseTime: expect.any(Number),
      },
      {
        blockId: 'block_id',
        error: new Error('mock error'),
        loading: false,
        payload: {},
        requestId: 'req_error',
        response: null,
        responseTime: expect.any(Number),
      },
    ],
  });
});

test('callRequest request does not exist', async () => {
  const pageConfig = getPageConfig();
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  context._internal.lowdefy._internal.callRequest = mockCallRequest;
  await expect(
    context._internal.Requests.callRequest({ requestId: 'req_does_not_exist', blockId })
  ).rejects.toThrow('Configuration Error: Request req_does_not_exist not defined on page.');
  expect(context.requests).toEqual({
    req_does_not_exist: [
      {
        blockId: 'block_id',
        error: new Error('Configuration Error: Request req_does_not_exist not defined on page.'),
        loading: false,
        requestId: 'req_does_not_exist',
        response: null,
      },
    ],
  });
});

test('update function should be called', async () => {
  const pageConfig = getPageConfig();
  const updateFunction = jest.fn();
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  context._internal.lowdefy._internal.callRequest = mockCallRequest;
  context._internal.update = updateFunction;
  await context._internal.Requests.callRequest({ requestId: 'req_one', blockId });
  expect(updateFunction).toHaveBeenCalledTimes(1);
});

test('update function should be called before all requests are fired and once for every request return', async () => {
  const pageConfig = getPageConfig();
  const updateFunction = jest.fn();
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  context._internal.update = updateFunction;
  await context._internal.Requests.callRequests({
    actions: { params: ['req_one', 'req_two'] },
    arrayIndices,
    blockId,
    event,
    params: { all: true },
  });
  expect(updateFunction).toHaveBeenCalledTimes(3);
});

test('update function should be called if error', async () => {
  const pageConfig = getPageConfig();
  const updateFunction = jest.fn();
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  context._internal.lowdefy._internal.callRequest = mockCallRequest;
  context._internal.update = updateFunction;
  try {
    await context._internal.Requests.callRequest({ requestId: 'req_error' });
  } catch (e) {
    // catch thrown errors
    console.log(e);
  }
  expect(updateFunction).toHaveBeenCalledTimes(1);
});

test('fetch should set call query every time it is called', async () => {
  const pageConfig = getPageConfig();
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  context._internal.lowdefy._internal.callRequest = mockCallRequest;
  context._internal.RootBlocks = {
    update: jest.fn(),
  };
  await context._internal.Requests.callRequest({ requestId: 'req_one', onlyNew: true, blockId });
  expect(mockCallRequest).toHaveBeenCalledTimes(1);
  await context._internal.Requests.fetch({ requestId: 'req_one' });
  expect(mockCallRequest).toHaveBeenCalledTimes(2);
});

test('trigger request from event end to end and parse payload', async () => {
  const pageConfig = {
    id: 'page1',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: {
            a: 1,
          },
        },
      ],
    },
    requests: [
      {
        id: 'req_one',
        type: 'Fetch',
        payload: {
          _state: true,
        },
      },
      {
        id: 'req_error',
        type: 'Fetch',
      },
      {
        id: 'req_two',
        type: 'Fetch',
      },
    ],
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [
            {
              id: 'click',
              type: 'Request',
              params: ['req_one'],
            },
          ],
        },
      },
      {
        id: 'inc',
        type: 'Button',
        events: {
          onClick: [
            {
              id: 'add',
              type: 'SetState',
              params: {
                a: {
                  _sum: [{ _state: 'a' }, 1],
                },
              },
            },
          ],
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  context._internal.lowdefy._internal.callRequest = mockCallRequest;
  const { button, inc } = context._internal.RootBlocks.map;
  await button.triggerEvent({ name: 'onClick' });
  expect(context.requests).toEqual({
    req_one: [
      {
        blockId: 'button',
        loading: false,
        payload: {
          a: 1,
        },
        requestId: 'req_one',
        response: 1,
        responseTime: expect.any(Number),
      },
    ],
  });
  await inc.triggerEvent({ name: 'onClick' });
  await button.triggerEvent({ name: 'onClick' });
  expect(context.requests).toEqual({
    req_one: [
      {
        blockId: 'button',
        loading: false,
        payload: {
          a: 2,
        },
        requestId: 'req_one',
        response: 1,
        responseTime: expect.any(Number),
      },
      {
        blockId: 'button',
        loading: false,
        payload: {
          a: 1,
        },
        requestId: 'req_one',
        response: 1,
        responseTime: expect.any(Number),
      },
    ],
  });
});
