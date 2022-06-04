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

import { jest } from '@jest/globals';

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
  await context._internal.Requests.callRequest({ requestId: 'req_one' });
  expect(context.requests).toEqual({
    req_one: {
      error: [],
      loading: false,
      response: 1,
    },
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
    requestId: 'req_one',
    event: { event: true },
    actions: { action1: 'action1' },
    arrayIndices: [1],
  });
  expect(mockCallRequest.mock.calls[0][0]).toEqual({
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
  const promise = context._internal.Requests.callRequests({
    actions,
    arrayIndices,
    event,
    params: { all: true },
  });
  expect(context.requests).toEqual({
    req_one: {
      error: [],
      loading: true,
      response: null,
    },
    req_error: {
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
  try {
    await promise;
  } catch (e) {
    // catch thrown errors
  }
  expect(context.requests).toEqual({
    req_one: {
      error: [],
      loading: false,
      response: 1,
    },
    req_error: {
      error: [new Error('mock error')],
      loading: false,
      response: null,
    },
    req_two: {
      error: [],
      loading: false,
      response: 2,
    },
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
    event,
    params: ['req_one'],
  });
  expect(context.requests).toEqual({
    req_one: {
      error: [],
      loading: true,
      response: null,
    },
  });
  await promise;
  expect(context.requests).toEqual({
    req_one: {
      error: [],
      loading: false,
      response: 1,
    },
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
    context._internal.Requests.callRequest({ requestId: 'req_error' })
  ).rejects.toThrow();
  expect(context.requests).toEqual({
    req_error: {
      error: [new Error('mock error')],
      loading: false,
      response: null,
    },
  });
  await expect(
    context._internal.Requests.callRequest({ requestId: 'req_error' })
  ).rejects.toThrow();
  expect(context.requests).toEqual({
    req_error: {
      error: [new Error('mock error'), new Error('mock error')],
      loading: false,
      response: null,
    },
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
    context._internal.Requests.callRequest({ requestId: 'req_does_not_exist' })
  ).rejects.toThrow('Configuration Error: Request req_does_not_exist not defined on page.');
  expect(context.requests).toEqual({
    req_does_not_exist: {
      error: [new Error('Configuration Error: Request req_does_not_exist not defined on page.')],
      loading: false,
      response: null,
    },
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
  await context._internal.Requests.callRequest({ requestId: 'req_one' });
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
  await context._internal.Requests.callRequest({ requestId: 'req_one', onlyNew: true });
  expect(mockCallRequest).toHaveBeenCalledTimes(1);
  await context._internal.Requests.fetch({ requestId: 'req_one' });
  expect(mockCallRequest).toHaveBeenCalledTimes(2);
});
