/* eslint-disable prefer-promise-reject-errors */

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
import actions from '../../src/actions/index.js';

jest.mock('../../src/actions/index.js', () => ({
  ActionSync: jest.fn(({ params }) => params),
  ActionAsync: jest.fn(({ params }) => Promise.resolve(params)),
  ActionError: jest.fn(() => {
    throw new Error('Test error');
  }),
}));

const pageId = 'one';

const RealDate = Date;
const mockDate = jest.fn(() => ({ date: 0 }));
mockDate.now = jest.fn(() => 0);

const closeLoader = jest.fn();
const displayMessage = jest.fn();
const lowdefy = {
  displayMessage,
  pageId,
};
const arrayIndices = [];
const eventName = 'eventName';

// Comment out to use console.log
console.log = () => {};

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
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
  };
  const context = testContext({
    lowdefy,
    rootBlock,
  });
  const Actions = context.Actions;
  const res = await Actions.callActions({
    actions: [{ id: 'test', type: 'ActionSync', params: 'params' }],
    arrayIndices,
    block: { blockId: 'blockId' },
    event: {},
    eventName,
  });
  expect(res).toEqual({
    blockId: 'blockId',
    event: {},
    eventName: 'eventName',
    responses: [
      {
        actionId: 'test',
        actionType: 'ActionSync',
        response: 'params',
      },
    ],
    success: true,
    timestamp: {
      date: 0,
    },
  });
  expect(actions.ActionSync.mock.calls.length).toBe(1);
});

test('call a asynchronous action', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
  };
  const context = testContext({
    lowdefy,
    rootBlock,
  });
  const Actions = context.Actions;
  const res = await Actions.callActions({
    actions: [{ id: 'test', type: 'ActionAsync', params: 'params' }],
    arrayIndices,
    block: { blockId: 'blockId' },
    event: {},
    eventName,
  });
  expect(res).toEqual({
    blockId: 'blockId',
    event: {},
    eventName: 'eventName',
    responses: [
      {
        actionId: 'test',
        actionType: 'ActionAsync',
        response: 'params',
      },
    ],
    success: true,
    timestamp: {
      date: 0,
    },
  });
  expect(actions.ActionAsync.mock.calls.length).toBe(1);
});

test('call 2 actions', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
  };
  const context = testContext({
    lowdefy,
    rootBlock,
  });
  const Actions = context.Actions;
  const res = await Actions.callActions({
    actions: [
      { id: 'test1', type: 'ActionSync', params: 'params1' },
      { id: 'test2', type: 'ActionAsync', params: 'params2' },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    event: {},
    eventName,
  });
  expect(res).toEqual({
    blockId: 'blockId',
    event: {},
    eventName: 'eventName',
    responses: [
      {
        actionId: 'test1',
        actionType: 'ActionSync',
        response: 'params1',
      },
      {
        actionId: 'test2',
        actionType: 'ActionAsync',
        response: 'params2',
      },
    ],
    success: true,
    timestamp: {
      date: 0,
    },
  });
});

test('operators are evaluated in params, skip and messages', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
  };
  const context = testContext({
    lowdefy,
    rootBlock,
  });
  const Actions = context.Actions;
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

test('skip a action', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
  };
  const context = testContext({
    lowdefy,
    rootBlock,
  });
  const Actions = context.Actions;
  const res = await Actions.callActions({
    actions: [{ id: 'test', type: 'ActionSync', skip: true }],
    arrayIndices,
    block: { blockId: 'blockId' },
    event: {},
    eventName,
  });
  expect(res).toEqual({
    blockId: 'blockId',
    event: {},
    eventName: 'eventName',
    responses: [
      {
        actionId: 'test',
        actionType: 'ActionSync',
        skipped: true,
      },
    ],
    success: true,
    timestamp: {
      date: 0,
    },
  });
  expect(actions.ActionSync.mock.calls.length).toBe(0);
});

test('action throws a error', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
  };
  const context = testContext({
    lowdefy,
    rootBlock,
  });
  const Actions = context.Actions;
  const res = await Actions.callActions({
    actions: [{ id: 'test', type: 'ActionError', params: 'params' }],
    arrayIndices,
    block: { blockId: 'blockId' },
    event: {},
    eventName,
  });
  expect(res).toEqual({
    blockId: 'blockId',
    event: {},
    eventName: 'eventName',
    responses: [
      {
        actionId: 'test',
        actionType: 'ActionError',
        error: new Error('Test error'),
      },
    ],
    success: false,
    timestamp: {
      date: 0,
    },
  });
  expect(actions.ActionError.mock.calls.length).toBe(1);
});

test('actions after a error are not called throws a error', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
  };
  const context = testContext({
    lowdefy,
    rootBlock,
  });
  const Actions = context.Actions;
  const res = await Actions.callActions({
    actions: [
      { id: 'test', type: 'ActionError', params: 'params' },
      { id: 'test', type: 'ActionSync', params: 'params' },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    event: {},
    eventName,
  });
  expect(res).toEqual({
    blockId: 'blockId',
    event: {},
    eventName: 'eventName',
    responses: [
      {
        actionId: 'test',
        actionType: 'ActionError',
        error: new Error('Test error'),
      },
    ],
    success: false,
    timestamp: {
      date: 0,
    },
  });
  expect(actions.ActionError.mock.calls.length).toBe(1);
  expect(actions.ActionSync.mock.calls.length).toBe(0);
});

test('Invalid action type', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
  };
  const context = testContext({
    lowdefy,
    rootBlock,
  });
  const Actions = context.Actions;
  const res = await Actions.callActions({
    actions: [{ id: 'test', type: 'Invalid', params: 'params' }],
    arrayIndices,
    block: { blockId: 'blockId' },
    event: {},
    eventName,
  });
  expect(res).toEqual({
    blockId: 'blockId',
    event: {},
    eventName: 'eventName',
    responses: [
      {
        actionId: 'test',
        actionType: 'Invalid',
        error: new Error('Invalid action type "Invalid" at "blockId".'),
      },
    ],
    success: false,
    timestamp: {
      date: 0,
    },
  });
});

test('Parser error in action', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
  };
  const context = testContext({
    lowdefy,
    rootBlock,
  });
  const Actions = context.Actions;
  const res = await Actions.callActions({
    actions: [{ id: 'test', type: 'ActionSync', params: { _state: [] } }],
    arrayIndices,
    block: { blockId: 'blockId' },
    event: {},
    eventName,
  });
  expect(res).toEqual({
    blockId: 'blockId',
    event: {},
    eventName: 'eventName',
    responses: [
      {
        actionId: 'test',
        actionType: 'ActionSync',
        error: new Error(
          'Operator Error: _state params must be of type string, integer, boolean or object. Received: [] at blockId.'
        ),
      },
    ],
    success: false,
    timestamp: {
      date: 0,
    },
  });
});

test('Display default loading and success messages when value == true ', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
  };
  const context = testContext({
    lowdefy,
    rootBlock,
  });
  const Actions = context.Actions;
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
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
  };
  const context = testContext({
    lowdefy,
    rootBlock,
  });
  const Actions = context.Actions;
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
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
  };
  const context = testContext({
    lowdefy,
    rootBlock,
  });
  const Actions = context.Actions;
  await Actions.callActions({
    actions: [
      {
        id: 'test',
        type: 'ActionSync',
      },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    event: {},
    eventName,
  });
  expect(displayMessage.mock.calls).toEqual([]);
  expect(closeLoader.mock.calls).toEqual([]);
});

test('Display error message by default', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
  };
  const context = testContext({
    lowdefy,
    rootBlock,
  });
  const Actions = context.Actions;
  await Actions.callActions({
    actions: [
      {
        id: 'test',
        type: 'ActionError',
      },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    event: {},
    eventName,
  });
  expect(displayMessage.mock.calls).toEqual([
    [
      {
        content: 'Action unsuccessful',
        duration: 6,
        status: 'error',
      },
    ],
  ]);
});

test('Display custom error message', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
  };
  const context = testContext({
    lowdefy,
    rootBlock,
  });
  const Actions = context.Actions;
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
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
  };
  const context = testContext({
    lowdefy,
    rootBlock,
  });
  const Actions = context.Actions;
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
    event: {},
    eventName,
  });
  expect(displayMessage.mock.calls).toEqual([]);
});
