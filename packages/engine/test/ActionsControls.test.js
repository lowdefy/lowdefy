/*
  Copyright 2020-2026 Lowdefy, Inc

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
import { OperatorError } from '@lowdefy/errors';

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

const setup = async (actions) => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  lowdefy._internal.actions = actions;
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  return context._internal.Actions;
};

test(':if takes the :then branch when the condition is truthy and skips :else', async () => {
  const actions = getActions();
  const Actions = await setup(actions);
  const res = await Actions.callActions({
    actions: [
      {
        ':if': true,
        ':then': [{ id: 'then_action', type: 'ActionSync', params: 'then' }],
        ':else': [{ id: 'else_action', type: 'ActionSync', params: 'else' }],
      },
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
    controls: [{ index: 0, type: ':if', taken: 'then' }],
    event: {},
    eventName: 'eventName',
    responses: {
      then_action: {
        type: 'ActionSync',
        index: 0,
        response: 'then',
      },
      else_action: {
        type: 'ActionSync',
        skipped: true,
        index: 1,
      },
    },
    success: true,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
  expect(actions.ActionSync.mock.calls.length).toBe(1);
});

test(':if takes the :else branch when the condition is falsy and skips :then', async () => {
  const actions = getActions();
  const Actions = await setup(actions);
  const res = await Actions.callActions({
    actions: [
      {
        ':if': { _event: 'missing' },
        ':then': [{ id: 'then_action', type: 'ActionSync', params: 'then' }],
        ':else': [{ id: 'else_action', type: 'ActionSync', params: 'else' }],
      },
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
    controls: [{ index: 0, type: ':if', taken: 'else' }],
    event: {},
    eventName: 'eventName',
    responses: {
      then_action: {
        type: 'ActionSync',
        skipped: true,
        index: 0,
      },
      else_action: {
        type: 'ActionSync',
        index: 1,
        response: 'else',
      },
    },
    success: true,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
});

test(':if without :else records taken "else" and the chain continues', async () => {
  const actions = getActions();
  const Actions = await setup(actions);
  const res = await Actions.callActions({
    actions: [
      {
        ':if': false,
        ':then': [{ id: 'then_action', type: 'ActionSync', params: 'then' }],
      },
      { id: 'after', type: 'ActionSync', params: 'after' },
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
    controls: [{ index: 0, type: ':if', taken: 'else' }],
    event: {},
    eventName: 'eventName',
    responses: {
      then_action: {
        type: 'ActionSync',
        skipped: true,
        index: 0,
      },
      after: {
        type: 'ActionSync',
        index: 1,
        response: 'after',
      },
    },
    success: true,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
});

test(':if condition uses JS truthiness, not skip strict equality', async () => {
  const actions = getActions();
  const Actions = await setup(actions);
  const res = await Actions.callActions({
    actions: [
      // skip: 1 is not skipped - skip requires strict === true
      { id: 'not_skipped', type: 'ActionSync', params: 'ran', skip: 1 },
      {
        // 1 is truthy - :then is taken
        ':if': 1,
        ':then': [{ id: 'then_action', type: 'ActionSync', params: 'then' }],
      },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res.responses.not_skipped).toEqual({ type: 'ActionSync', index: 0, response: 'ran' });
  expect(res.responses.then_action).toEqual({ type: 'ActionSync', index: 1, response: 'then' });
  expect(res.controls).toEqual([{ index: 0, type: ':if', taken: 'then' }]);
});

test('wrapping actions in a control does not change action indices', async () => {
  const actions = getActions();
  const Actions = await setup(actions);
  const res = await Actions.callActions({
    actions: [
      { id: 'a0', type: 'ActionSync', params: 'r0' },
      {
        ':if': true,
        ':then': [
          { id: 'a1', type: 'ActionSync', params: 'r1' },
          { id: 'a2', type: 'ActionSync', params: 'r2' },
        ],
        ':else': [{ id: 'a3', type: 'ActionSync', params: 'r3' }],
      },
      { id: 'a4', type: 'ActionSync', params: 'r4' },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res.responses).toEqual({
    a0: { type: 'ActionSync', index: 0, response: 'r0' },
    a1: { type: 'ActionSync', index: 1, response: 'r1' },
    a2: { type: 'ActionSync', index: 2, response: 'r2' },
    a3: { type: 'ActionSync', skipped: true, index: 3 },
    a4: { type: 'ActionSync', index: 4, response: 'r4' },
  });
});

test('nested :if controls assign depth-first action and control indices', async () => {
  const actions = getActions();
  const Actions = await setup(actions);
  const res = await Actions.callActions({
    actions: [
      {
        ':if': true,
        ':then': [
          {
            ':if': false,
            ':then': [{ id: 'b1', type: 'ActionSync', params: 'b1' }],
            ':else': [{ id: 'b2', type: 'ActionSync', params: 'b2' }],
          },
          { id: 'a1', type: 'ActionSync', params: 'a1' },
        ],
        ':else': [{ id: 'e1', type: 'ActionSync', params: 'e1' }],
      },
      { id: 'a2', type: 'ActionSync', params: 'a2' },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res.responses).toEqual({
    b1: { type: 'ActionSync', skipped: true, index: 0 },
    b2: { type: 'ActionSync', index: 1, response: 'b2' },
    a1: { type: 'ActionSync', index: 2, response: 'a1' },
    e1: { type: 'ActionSync', skipped: true, index: 3 },
    a2: { type: 'ActionSync', index: 4, response: 'a2' },
  });
  expect(res.controls).toEqual([
    { index: 0, type: ':if', taken: 'then' },
    { index: 1, type: ':if', taken: 'else' },
  ]);
  expect(res.success).toBe(true);
});

test(':switch takes the first truthy :case and never evaluates later cases', async () => {
  const actions = getActions();
  const Actions = await setup(actions);
  const res = await Actions.callActions({
    actions: [
      {
        ':switch': [
          {
            ':case': { _eq: [{ _event: 'mode' }, 'a'] },
            ':then': [{ id: 'case_a', type: 'ActionSync', params: 'a' }],
          },
          {
            ':case': { _event: 'truthy' },
            ':then': [{ id: 'case_b', type: 'ActionSync', params: 'b' }],
          },
          {
            // would throw an operator error if evaluated
            ':case': { _divide: [1] },
            ':then': [{ id: 'case_c', type: 'ActionSync', params: 'c' }],
          },
        ],
        ':default': [{ id: 'default_action', type: 'ActionSync', params: 'd' }],
      },
      { id: 'after', type: 'ActionSync', params: 'after' },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: { mode: 'b', truthy: 1 },
    eventName,
  });
  expect(res.responses).toEqual({
    case_a: { type: 'ActionSync', skipped: true, index: 0 },
    case_b: { type: 'ActionSync', index: 1, response: 'b' },
    case_c: { type: 'ActionSync', skipped: true, index: 2 },
    default_action: { type: 'ActionSync', skipped: true, index: 3 },
    after: { type: 'ActionSync', index: 4, response: 'after' },
  });
  expect(res.controls).toEqual([{ index: 0, type: ':switch', taken: 1 }]);
  expect(res.success).toBe(true);
});

test(':switch runs :default when no case matches', async () => {
  const actions = getActions();
  const Actions = await setup(actions);
  const res = await Actions.callActions({
    actions: [
      {
        ':switch': [
          {
            ':case': false,
            ':then': [{ id: 'case_a', type: 'ActionSync', params: 'a' }],
          },
        ],
        ':default': [{ id: 'default_action', type: 'ActionSync', params: 'd' }],
      },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res.responses).toEqual({
    case_a: { type: 'ActionSync', skipped: true, index: 0 },
    default_action: { type: 'ActionSync', index: 1, response: 'd' },
  });
  expect(res.controls).toEqual([{ index: 0, type: ':switch', taken: 'default' }]);
});

test(':switch with no match and no :default skips all case bodies and continues', async () => {
  const actions = getActions();
  const Actions = await setup(actions);
  const res = await Actions.callActions({
    actions: [
      {
        ':switch': [
          {
            ':case': false,
            ':then': [{ id: 'case_a', type: 'ActionSync', params: 'a' }],
          },
        ],
      },
      { id: 'after', type: 'ActionSync', params: 'after' },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res.responses).toEqual({
    case_a: { type: 'ActionSync', skipped: true, index: 0 },
    after: { type: 'ActionSync', index: 1, response: 'after' },
  });
  expect(res.controls).toEqual([{ index: 0, type: ':switch', taken: 'default' }]);
  expect(res.success).toBe(true);
});

test(':return ends the event successfully and skips all remaining actions', async () => {
  const actions = getActions();
  const Actions = await setup(actions);
  const res = await Actions.callActions({
    actions: [
      { id: 'a0', type: 'ActionSync', params: 'r0' },
      { ':return': { _event: 'value' } },
      { id: 'a1', type: 'ActionSync', params: 'r1' },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [{ id: 'catch_action', type: 'ActionSync', params: 'c' }],
    event: { value: 'done' },
    eventName,
  });
  expect(res).toEqual({
    blockId: 'blockId',
    bounced: false,
    controls: [{ index: 0, type: ':return', taken: 'done' }],
    event: { value: 'done' },
    eventName: 'eventName',
    responses: {
      a0: { type: 'ActionSync', index: 0, response: 'r0' },
      a1: { type: 'ActionSync', skipped: true, index: 1 },
    },
    success: true,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
  // the event catch does not run
  expect(res.responses.catch_action).toBe(undefined);
});

test(':return propagates up through nested controls to end the event', async () => {
  const actions = getActions();
  const Actions = await setup(actions);
  const res = await Actions.callActions({
    actions: [
      { id: 'a0', type: 'ActionSync', params: 'r0' },
      {
        ':if': true,
        ':then': [{ ':return': null }, { id: 'a1', type: 'ActionSync', params: 'r1' }],
        ':else': [{ id: 'a2', type: 'ActionSync', params: 'r2' }],
      },
      { id: 'a3', type: 'ActionSync', params: 'r3' },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res.responses).toEqual({
    a0: { type: 'ActionSync', index: 0, response: 'r0' },
    a1: { type: 'ActionSync', skipped: true, index: 1 },
    a2: { type: 'ActionSync', skipped: true, index: 2 },
    a3: { type: 'ActionSync', skipped: true, index: 3 },
  });
  expect(res.controls).toEqual([
    { index: 0, type: ':if', taken: 'then' },
    { index: 1, type: ':return', taken: null },
  ]);
  expect(res.success).toBe(true);
});

test(':return from a matched :switch case skips later case bodies and :default', async () => {
  const actions = getActions();
  const Actions = await setup(actions);
  const res = await Actions.callActions({
    actions: [
      {
        ':switch': [
          {
            ':case': true,
            ':then': [{ ':return': null }],
          },
          {
            ':case': true,
            ':then': [{ id: 'case_b', type: 'ActionSync', params: 'b' }],
          },
        ],
        ':default': [{ id: 'default_action', type: 'ActionSync', params: 'd' }],
      },
      { id: 'after', type: 'ActionSync', params: 'after' },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res.responses).toEqual({
    case_b: { type: 'ActionSync', skipped: true, index: 0 },
    default_action: { type: 'ActionSync', skipped: true, index: 1 },
    after: { type: 'ActionSync', skipped: true, index: 2 },
  });
  expect(res.controls).toEqual([
    { index: 0, type: ':switch', taken: 0 },
    { index: 1, type: ':return', taken: null },
  ]);
  expect(res.success).toBe(true);
});

test(':return inside a catch list ends the catch list the same way', async () => {
  const actions = getActions();
  const Actions = await setup(actions);
  const res = await Actions.callActions({
    actions: [{ id: 'try_error', type: 'ActionError', messages: { error: false } }],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [
      { id: 'catch_first', type: 'ActionSync', params: 'c0' },
      { ':return': null },
      { id: 'catch_after', type: 'ActionSync', params: 'c1' },
    ],
    event: {},
    eventName,
  });
  expect(res.success).toBe(false);
  expect(res.error).toEqual({
    action: { id: 'try_error', messages: { error: false }, type: 'ActionError' },
    error: expect.any(Error),
    index: 0,
  });
  expect(res.responses.catch_first).toEqual({ type: 'ActionSync', index: 0, response: 'c0' });
  expect(res.responses.catch_after).toEqual({ type: 'ActionSync', skipped: true, index: 1 });
  expect(res.controls).toEqual([{ index: 0, type: ':return', taken: null }]);
});

test('operator error in an :if condition aborts to the event catch', async () => {
  const actions = getActions();
  const Actions = await setup(actions);
  const res = await Actions.callActions({
    actions: [
      { id: 'a0', type: 'ActionSync', params: 'r0' },
      {
        ':if': { _divide: [1] },
        ':then': [{ id: 'then_action', type: 'ActionSync', params: 'then' }],
        '~k': 'if-key',
      },
      { id: 'a1', type: 'ActionSync', params: 'r1' },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [{ id: 'catch_action', type: 'ActionSync', params: 'c' }],
    event: {},
    eventName,
  });
  expect(res.success).toBe(false);
  expect(res.error.error).toBeInstanceOf(OperatorError);
  expect(res.error.error._message).toBe('_divide takes an array of length 2 as input.');
  expect(res.error.error.configKey).toBe('if-key');
  // an aborted chain records nothing for unreached actions
  expect(res.responses.then_action).toBe(undefined);
  expect(res.responses.a1).toBe(undefined);
  expect(res.responses.a0).toEqual({ type: 'ActionSync', index: 0, response: 'r0' });
  expect(res.responses.catch_action).toEqual({ type: 'ActionSync', index: 0, response: 'c' });
  expect(res.controls).toEqual([]);
});

test('operator error in a :case is reported against the case object', async () => {
  const actions = getActions();
  const Actions = await setup(actions);
  const res = await Actions.callActions({
    actions: [
      {
        ':switch': [
          {
            ':case': { _divide: [1] },
            ':then': [{ id: 'case_a', type: 'ActionSync', params: 'a' }],
            '~k': 'case-key',
          },
        ],
        '~k': 'switch-key',
      },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res.success).toBe(false);
  expect(res.error.error).toBeInstanceOf(OperatorError);
  expect(res.error.error.configKey).toBe('case-key');
});

test('operator error in a :return value aborts to the event catch', async () => {
  const actions = getActions();
  const Actions = await setup(actions);
  const res = await Actions.callActions({
    actions: [{ ':return': { _divide: [1] }, '~k': 'return-key' }],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res.success).toBe(false);
  expect(res.error.error).toBeInstanceOf(OperatorError);
  expect(res.error.error.configKey).toBe('return-key');
  expect(res.controls).toEqual([]);
});

test('sync error in a branch action aborts the chain and falls to the event catch', async () => {
  const actions = getActions();
  const Actions = await setup(actions);
  const res = await Actions.callActions({
    actions: [
      {
        ':if': true,
        ':then': [
          { id: 'branch_error', type: 'ActionError', messages: { error: false } },
          { id: 'branch_after', type: 'ActionSync', params: 'r1' },
        ],
      },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [{ id: 'catch_action', type: 'ActionSync', params: 'c' }],
    event: {},
    eventName,
  });
  expect(res.success).toBe(false);
  expect(res.error.action.id).toBe('branch_error');
  expect(res.error.index).toBe(0);
  expect(res.responses.branch_error.error).toBeDefined();
  // unreached actions record nothing on the error path
  expect(res.responses.branch_after).toBe(undefined);
  expect(res.responses.catch_action).toEqual({ type: 'ActionSync', index: 0, response: 'c' });
  expect(res.controls).toEqual([{ index: 0, type: ':if', taken: 'then' }]);
});

test('async: true actions inside a taken branch keep running after the chain returns', async () => {
  const actions = getActions();
  const Actions = await setup(actions);
  const res = await Actions.callActions({
    actions: [
      {
        ':if': true,
        ':then': [
          { id: 'slow', type: 'ActionAsync', async: true, params: { ms: 100 } },
          { id: 'fast', type: 'ActionSync', params: 'fast' },
        ],
      },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res.responses).toEqual({
    fast: { type: 'ActionSync', index: 1, response: 'fast' },
  });
  expect(res.success).toBe(true);
  await timeout(110);
  expect(res.responses.slow).toEqual({ type: 'ActionAsync', index: 0, response: { ms: 100 } });
});

test('condition operators read _actions responses of earlier actions', async () => {
  const actions = getActions();
  const Actions = await setup(actions);
  const res = await Actions.callActions({
    actions: [
      { id: 'a0', type: 'ActionSync', params: 'val' },
      {
        ':if': { _eq: [{ _actions: 'a0.response' }, 'val'] },
        ':then': [{ id: 'then_action', type: 'ActionSync', params: 'then' }],
      },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res.responses.then_action).toEqual({ type: 'ActionSync', index: 1, response: 'then' });
  expect(res.controls).toEqual([{ index: 0, type: ':if', taken: 'then' }]);
});

test('_actions lookups on unexecuted branch actions see skipped: true', async () => {
  const actions = getActions();
  const Actions = await setup(actions);
  const res = await Actions.callActions({
    actions: [
      {
        ':if': false,
        ':then': [{ id: 'then_action', type: 'ActionSync', params: 'then' }],
      },
      { id: 'reads_skipped', type: 'ActionSync', params: { _actions: 'then_action.skipped' } },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res.responses.reads_skipped).toEqual({ type: 'ActionSync', index: 1, response: true });
});

test('a condition referencing an action inside its own branches sees undefined', async () => {
  const actions = getActions();
  const Actions = await setup(actions);
  const res = await Actions.callActions({
    actions: [
      {
        ':if': { _eq: [{ _actions: 'then_action.response' }, undefined] },
        ':then': [{ id: 'then_action', type: 'ActionSync', params: 'then' }],
      },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect(res.controls).toEqual([{ index: 0, type: ':if', taken: 'then' }]);
  expect(res.responses.then_action).toEqual({ type: 'ActionSync', index: 0, response: 'then' });
});

test('flat chains without controls gain no controls key', async () => {
  const actions = getActions();
  const Actions = await setup(actions);
  const res = await Actions.callActions({
    actions: [{ id: 'test', type: 'ActionSync', params: 'params' }],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [],
    event: {},
    eventName,
  });
  expect('controls' in res).toBe(false);
});

test('control indices continue across try and catch lists', async () => {
  const actions = getActions();
  const Actions = await setup(actions);
  const res = await Actions.callActions({
    actions: [
      {
        ':if': true,
        ':then': [{ id: 'try_error', type: 'ActionError', messages: { error: false } }],
      },
    ],
    arrayIndices,
    block: { blockId: 'blockId' },
    catchActions: [
      {
        ':if': true,
        ':then': [{ id: 'catch_action', type: 'ActionSync', params: 'c' }],
      },
    ],
    event: {},
    eventName,
  });
  expect(res.success).toBe(false);
  expect(res.controls).toEqual([
    { index: 0, type: ':if', taken: 'then' },
    { index: 1, type: ':if', taken: 'then' },
  ]);
  // action indices still restart per list, matching flat-chain history
  expect(res.responses.catch_action).toEqual({ type: 'ActionSync', index: 0, response: 'c' });
});
