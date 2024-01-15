/* eslint-disable prefer-promise-reject-errors */

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

import testContext from './testContext.js';

const timeout = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const pageId = 'one';

const RealDate = Date;
const mockDate = jest.fn(() => ({ date: 0 }));
mockDate.now = jest.fn(() => 0);

const getActions = () => {
  return {
    ActionSync: jest.fn(({ params }) => params),
    ActionAsync: jest.fn(async ({ params }) => {
      await timeout(params.ms ?? 1);
      return params;
    }),
    ActionError: jest.fn(() => {
      throw new Error('Test error');
    }),
    CatchActionError: jest.fn(() => {
      throw new Error('Test catch error');
    }),
    ActionAsyncError: jest.fn(async ({ params }) => {
      await timeout(params.ms ?? 1);
      throw new Error('Test error');
    }),
  };
};

const closeLoader = jest.fn();
const displayMessage = jest.fn();
const lowdefy = {
  _internal: {
    displayMessage,
  },
  pageId,
};
const arrayIndices = [];
const eventName = 'eventName';

// Comment out to use console.log
console.log = () => {};
console.error = () => {};

beforeEach(() => {
  global.Date = mockDate;
  displayMessage.mockReset();
  closeLoader.mockReset();
  displayMessage.mockImplementation(() => closeLoader);
});

afterAll(() => {
  global.Date = RealDate;
});

test('call a synchronous action', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  const res = await Actions.callActions({
    actions: [{ id: 'test', type: 'ActionSync', params: 'params' }],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res).toEqual({
    blockId: 'blockId',
    bounced: false,
    event: {},
    eventName: 'eventName',
    responses: {
      test: {
        type: 'ActionSync',
        index: 0,
        response: 'params',
      },
    },
    success: true,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
  expect(actions.ActionSync.mock.calls.length).toBe(1);
});

test('call a asynchronous action', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  const res = await Actions.callActions({
    actions: [{ id: 'test', type: 'ActionAsync', params: 'params' }],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res).toEqual({
    blockId: 'blockId',
    bounced: false,
    event: {},
    eventName: 'eventName',
    responses: {
      test: {
        type: 'ActionAsync',
        index: 0,
        response: 'params',
      },
    },
    success: true,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
  expect(actions.ActionAsync.mock.calls.length).toBe(1);
});

test('call 2 actions', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  const res = await Actions.callActions({
    actions: [
      { id: 'test1', type: 'ActionSync', params: 'params1' },
      { id: 'test2', type: 'ActionAsync', params: 'params2' },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res).toEqual({
    blockId: 'blockId',
    bounced: false,
    event: {},
    eventName: 'eventName',
    responses: {
      test1: {
        type: 'ActionSync',
        index: 0,
        response: 'params1',
      },
      test2: {
        type: 'ActionAsync',
        index: 1,
        response: 'params2',
      },
    },
    success: true,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
});

test('operators are evaluated in params, skip and messages', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  await Actions.callActions({
    actions: [
      {
        id: 'test',
        type: 'ActionSync',
        params: { _event: 'arr.$' },
        skip: { _event: 'skip' },
        messages: { _event: 'messages' },
      },
      {
        id: 'test',
        type: 'ActionError',
        params: { _event: 'arr.$' },
        skip: { _event: 'skip' },
        messages: { _event: 'messages' },
      },
    ],
    catchActions: [],
    arrayIndices: [1],
    block: { blockId: 'blockId' },
    event: {
      arr: [1, 2, 3],
      skip: false,
      messages: {
        success: 'suc',
        error: 'err',
        loading: 'load',
      },
    },
    eventName,
  });
  expect(actions.ActionSync.mock.calls[0][0].params).toBe(2);
  expect(displayMessage.mock.calls).toEqual([
    [
      {
        content: 'load',
        duration: 0,
        status: 'loading',
      },
    ],
    [
      {
        content: 'suc',
        duration: undefined,
        status: 'success',
      },
    ],
    [
      {
        content: 'load',
        duration: 0,
        status: 'loading',
      },
    ],
    [
      {
        content: 'err',
        duration: 6,
        status: 'error',
      },
    ],
  ]);
});

test('operators are evaluated in error messages after error', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  await Actions.callActions({
    actions: [
      {
        id: 'test',
        type: 'ActionError',
        messages: {
          success: 'suc',
          error: {
            '_json.stringify': [
              {
                data: 1234,
              },
            ],
          },
        },
      },
    ],
    catchActions: [],
    arrayIndices: [1],
    block: { blockId: 'blockId' },
    event: {},
    eventName,
  });
  expect(displayMessage.mock.calls).toEqual([
    [
      {
        content: `{
  "data": 1234
}`,
        duration: 6,
        status: 'error',
      },
    ],
  ]);
});

test('action error in error messages from same action id', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  await Actions.callActions({
    actions: [
      {
        id: 'one',
        type: 'ActionSync',
        params: 'one response',
      },
      {
        id: 'two',
        type: 'ActionError',
        messages: {
          success: 'suc',
          error: {
            '_string.concat': [
              'Result one: ',
              {
                _actions: 'one.response',
              },
              ' - Result two: ',
              {
                _actions: 'two.error',
              },
            ],
          },
        },
      },
    ],
    catchActions: [],
    arrayIndices: [1],
    block: { blockId: 'blockId' },
    event: {},
    eventName,
  });
  expect(displayMessage.mock.calls).toEqual([
    [
      {
        content: 'Result one: one response - Result two: Error: Test error',
        duration: 6,
        status: 'error',
      },
    ],
  ]);
});

test('action error in error parser', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  const res = await Actions.callActions({
    actions: [
      {
        id: 'two',
        type: 'ActionError',
        messages: {
          success: 'suc',
          error: {
            _divide: [
              3,
              {
                _if_none: [
                  {
                    _actions: 'two.error',
                  },
                  1,
                ],
              },
            ],
          },
        },
      },
    ],
    catchActions: [],
    arrayIndices: [1],
    block: { blockId: 'blockId' },
    event: {},
    eventName,
  });
  expect(res.responses.two.error).toEqual(
    new Error(
      'Operator Error: _divide takes an array of 2 numbers. Received: [3,{"name":"Error"}] at blockId.'
    )
  );
  expect(res.error.error.error).toEqual(
    new Error(
      'Operator Error: _divide takes an array of 2 numbers. Received: [3,{"name":"Error"}] at blockId.'
    )
  );
});

test('error with messages undefined', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  await Actions.callActions({
    actions: [
      {
        id: 'test',
        type: 'ActionError',
      },
    ],
    catchActions: [],
    arrayIndices: [1],
    block: { blockId: 'blockId' },
    event: {},
    eventName,
  });
  expect(displayMessage.mock.calls).toEqual([
    [
      {
        content: 'Test error',
        duration: 6,
        status: 'error',
      },
    ],
  ]);
});

test('skip a action', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  const res = await Actions.callActions({
    actions: [{ id: 'test', type: 'ActionSync', skip: true }],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res).toEqual({
    blockId: 'blockId',
    bounced: false,
    event: {},
    eventName: 'eventName',
    responses: {
      test: {
        type: 'ActionSync',
        index: 0,
        skipped: true,
      },
    },
    success: true,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
  expect(actions.ActionSync.mock.calls.length).toBe(0);
});

test('action throws a error', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  const res = await Actions.callActions({
    actions: [{ id: 'test', type: 'ActionError', params: 'params' }],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res).toEqual({
    blockId: 'blockId',
    bounced: false,
    event: {},
    eventName: 'eventName',
    error: {
      action: {
        id: 'test',
        params: 'params',
        type: 'ActionError',
      },
      error: {
        error: new Error('Test error'),
        index: 0,
        type: 'ActionError',
      },
    },
    responses: {
      test: {
        type: 'ActionError',
        index: 0,
        error: new Error('Test error'),
      },
    },
    success: false,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
  expect(actions.ActionError.mock.calls.length).toBe(1);
});

test('actions after a error are not called throws a error', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  const res = await Actions.callActions({
    actions: [
      { id: 'test', type: 'ActionError', params: 'params' },
      { id: 'test', type: 'ActionSync', params: 'params' },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res).toEqual({
    blockId: 'blockId',
    bounced: false,
    event: {},
    eventName: 'eventName',
    error: {
      action: {
        id: 'test',
        params: 'params',
        type: 'ActionError',
      },
      error: {
        error: new Error('Test error'),
        index: 0,
        type: 'ActionError',
      },
    },
    responses: {
      test: {
        type: 'ActionError',
        index: 0,
        error: new Error('Test error'),
      },
    },
    success: false,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
  expect(actions.ActionError.mock.calls.length).toBe(1);
  expect(actions.ActionSync.mock.calls.length).toBe(0);
});

test('Invalid action type', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  const res = await Actions.callActions({
    actions: [{ id: 'test', type: 'Invalid', params: 'params' }],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res).toEqual({
    blockId: 'blockId',
    bounced: false,
    event: {},
    eventName: 'eventName',
    error: {
      action: {
        id: 'test',
        params: 'params',
        type: 'Invalid',
      },
      error: {
        error: new Error('Invalid action type "Invalid" at "blockId".'),
        index: 0,
        type: 'Invalid',
      },
    },
    responses: {
      test: {
        type: 'Invalid',
        index: 0,
        error: new Error('Invalid action type "Invalid" at "blockId".'),
      },
    },
    success: false,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
});

test('Parser error in action', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  const res = await Actions.callActions({
    actions: [{ id: 'test', type: 'ActionSync', params: { _state: [] } }],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res).toEqual({
    blockId: 'blockId',
    bounced: false,
    event: {},
    eventName: 'eventName',
    error: {
      action: {
        id: 'test',
        params: {
          _state: [],
        },
        type: 'ActionSync',
      },
      error: {
        error: new Error(
          'Operator Error: _state params must be of type string, integer, boolean or object. Received: [] at blockId.'
        ),
        index: 0,
        type: 'ActionSync',
      },
    },
    responses: {
      test: {
        type: 'ActionSync',
        index: 0,
        error: new Error(
          'Operator Error: _state params must be of type string, integer, boolean or object. Received: [] at blockId.'
        ),
      },
    },
    success: false,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
});

test('Display default loading and success messages when value == true ', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  await Actions.callActions({
    actions: [
      {
        id: 'test',
        type: 'ActionSync',
        messages: { loading: true, success: true },
      },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(displayMessage.mock.calls).toEqual([
    [
      {
        content: 'Loading',
        duration: 0,
        status: 'loading',
      },
    ],
    [
      {
        content: 'Success',
        duration: undefined,
        status: 'success',
      },
    ],
  ]);
  expect(closeLoader.mock.calls).toEqual([[]]);
});

test('Display custom loading and success messages when value is a string ', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  await Actions.callActions({
    actions: [
      {
        id: 'test',
        type: 'ActionSync',
        messages: { loading: 'My loading', success: 'My success' },
      },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(displayMessage.mock.calls).toEqual([
    [
      {
        content: 'My loading',
        duration: 0,
        status: 'loading',
      },
    ],
    [
      {
        content: 'My success',
        duration: undefined,
        status: 'success',
      },
    ],
  ]);
  expect(closeLoader.mock.calls).toEqual([[]]);
});

test('Do not display loading and success messages by default', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  await Actions.callActions({
    actions: [
      {
        id: 'test',
        type: 'ActionSync',
      },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(displayMessage.mock.calls).toEqual([]);
  expect(closeLoader.mock.calls).toEqual([]);
});

test('Display error message by default', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  await Actions.callActions({
    actions: [
      {
        id: 'test',
        type: 'ActionError',
      },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(displayMessage.mock.calls).toEqual([
    [
      {
        content: 'Test error',
        duration: 6,
        status: 'error',
      },
    ],
  ]);
});

test('Display custom error message', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  await Actions.callActions({
    actions: [
      {
        id: 'test',
        type: 'ActionError',
        messages: {
          error: 'My error',
        },
      },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(displayMessage.mock.calls).toEqual([
    [
      {
        content: 'My error',
        duration: 6,
        status: 'error',
      },
    ],
  ]);
});

test('Do not display an error message if message === false', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  await Actions.callActions({
    actions: [
      {
        id: 'test',
        type: 'ActionError',
        messages: {
          error: false,
        },
      },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(displayMessage.mock.calls).toEqual([]);
});

test('Call catchActions when actions throws error', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  const res = await Actions.callActions({
    actions: [
      {
        id: 'try_error',
        type: 'ActionError',
        messages: {
          error: false,
        },
      },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [
      {
        id: 'catch_test',
        type: 'ActionAsync',
        params: 'params',
      },
    ],
    event: {},
    eventName,
  });
  expect(res).toEqual({
    blockId: 'blockId',
    bounced: false,
    endTimestamp: {
      date: 0,
    },
    error: {
      action: {
        id: 'try_error',
        messages: {
          error: false,
        },
        type: 'ActionError',
      },
      error: {
        error: new Error('Test error'),
        index: 0,
        type: 'ActionError',
      },
    },
    event: {},
    eventName: 'eventName',
    responses: {
      catch_test: {
        index: 0,
        response: 'params',
        type: 'ActionAsync',
      },
      try_error: {
        error: new Error('Test error'),
        index: 0,
        type: 'ActionError',
      },
    },
    startTimestamp: {
      date: 0,
    },
    success: false,
  });
  expect(actions.ActionAsync.mock.calls.length).toBe(1);
});

test('Call catchActions when actions throws error and catchActions throws error', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  const res = await Actions.callActions({
    actions: [
      {
        id: 'try_error',
        type: 'ActionError',
        messages: {
          error: false,
        },
      },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },

    catchActions: [
      {
        id: 'catch_test',
        type: 'ActionAsync',
        params: 'params',
      },
      {
        id: 'catch_error',
        type: 'CatchActionError',
        messages: {
          error: false,
        },
      },
    ],
    event: {},
    eventName,
  });
  expect(res).toEqual({
    blockId: 'blockId',
    bounced: false,
    endTimestamp: {
      date: 0,
    },
    error: {
      action: {
        id: 'try_error',
        messages: {
          error: false,
        },
        type: 'ActionError',
      },
      error: {
        error: new Error('Test error'),
        index: 0,
        type: 'ActionError',
      },
    },
    errorCatch: {
      action: {
        id: 'catch_error',
        messages: {
          error: false,
        },
        type: 'CatchActionError',
      },
      error: {
        error: new Error('Test catch error'),
        index: 1,
        type: 'CatchActionError',
      },
    },
    event: {},
    eventName: 'eventName',
    responses: {
      catch_test: {
        index: 0,
        response: 'params',
        type: 'ActionAsync',
      },
      try_error: {
        error: new Error('Test error'),
        index: 0,
        type: 'ActionError',
      },
      catch_error: {
        error: new Error('Test catch error'),
        index: 1,
        type: 'CatchActionError',
      },
    },
    startTimestamp: {
      date: 0,
    },
    success: false,
  });
  expect(actions.ActionAsync.mock.calls.length).toBe(1);
});

test('call 2 actions, first with async: true', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  const res = await Actions.callActions({
    actions: [
      { id: 'test1', type: 'ActionAsync', async: true, params: { ms: 100 } },
      { id: 'test2', type: 'ActionSync', params: 'params2' },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res).toEqual({
    blockId: 'blockId',
    bounced: false,
    event: {},
    eventName: 'eventName',
    responses: {
      test2: {
        type: 'ActionSync',
        index: 1,
        response: 'params2',
      },
    },
    success: true,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
  await timeout(110);
  expect(res).toEqual({
    blockId: 'blockId',
    bounced: false,
    event: {},
    eventName: 'eventName',
    responses: {
      test1: {
        type: 'ActionAsync',
        index: 0,
        response: { ms: 100 },
      },
      test2: {
        type: 'ActionSync',
        index: 1,
        response: 'params2',
      },
    },
    success: true,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
});

test('call async: true with error', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  const res = await Actions.callActions({
    actions: [
      { id: 'test1', type: 'ActionAsyncError', async: true, params: { ms: 100 } },
      { id: 'test2', type: 'ActionSync', params: 'params2' },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res).toEqual({
    blockId: 'blockId',
    bounced: false,
    event: {},
    eventName: 'eventName',
    responses: {
      test2: {
        type: 'ActionSync',
        response: 'params2',
        index: 1,
      },
    },
    endTimestamp: { date: 0 },
    startTimestamp: { date: 0 },
    success: true,
  });
  await timeout(110);
  expect(res).toEqual({
    blockId: 'blockId',
    bounced: false,
    event: {},
    eventName: 'eventName',
    responses: {
      test2: {
        type: 'ActionSync',
        response: 'params2',
        index: 1,
      },
      test1: {
        type: 'ActionAsyncError',
        error: new Error('Test error'),
        index: 0,
      },
    },
    success: true,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
});

test('call 2 actions, first with async: false', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  const res = await Actions.callActions({
    actions: [
      { id: 'test1', type: 'ActionAsync', async: false, params: { ms: 100 } },
      { id: 'test2', type: 'ActionSync', params: 'params2' },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res).toEqual({
    blockId: 'blockId',
    bounced: false,
    event: {},
    eventName: 'eventName',
    responses: {
      test1: {
        type: 'ActionAsync',
        index: 0,
        response: { ms: 100 },
      },
      test2: {
        type: 'ActionSync',
        index: 1,
        response: 'params2',
      },
    },
    success: true,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
});

test('call 2 actions, first with async: null', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const actions = getActions();
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const Actions = context._internal.Actions;
  const res = await Actions.callActions({
    actions: [
      { id: 'test1', type: 'ActionAsync', async: null, params: { ms: 100 } },
      { id: 'test2', type: 'ActionSync', params: 'params2' },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res).toEqual({
    blockId: 'blockId',
    bounced: false,
    event: {},
    eventName: 'eventName',
    responses: {
      test1: {
        type: 'ActionAsync',
        index: 0,
        response: { ms: 100 },
      },
      test2: {
        type: 'ActionSync',
        index: 1,
        response: 'params2',
      },
    },
    success: true,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
});
