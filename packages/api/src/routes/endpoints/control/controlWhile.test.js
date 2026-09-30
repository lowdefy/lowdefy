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

import runTest from '../test/runTest.js';

function whileLogs(context) {
  return context.logger.debug.mock.calls
    .map((call) => call[0])
    .filter((log) => log.event === 'debug_control_while');
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('while loop runs until the condition is false', async () => {
  const routine = [
    {
      ':set_state': { count: 0 },
    },
    {
      ':while': { _lt: [{ _state: 'count' }, 3] },
      ':do': {
        ':set_state': {
          count: { _sum: [{ _state: 'count' }, 1] },
        },
      },
    },
  ];
  const { res, context, routineContext } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(routineContext.state.count).toEqual(3);
  // Three truthy evaluations, plus the falsy one that ends the loop.
  const logs = whileLogs(context);
  expect(logs.length).toEqual(4);
  expect(logs.map((log) => log.iteration)).toEqual([0, 1, 2, 3]);
  expect(logs.map((log) => log.condition.evaluated)).toEqual([true, true, true, false]);
});

test('while loop does not run when the condition is false initially', async () => {
  const routine = {
    ':while': false,
    ':do': {
      id: 'request:test_endpoint:test_request',
      type: 'TestRequest',
      stepId: 'test_request',
      connectionId: 'test',
      properties: {
        response: 'should not run',
      },
    },
  };
  const { res, context, routineContext } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(routineContext.steps).toEqual({});
  expect(whileLogs(context)).toEqual([
    {
      event: 'debug_control_while',
      condition: { input: false, evaluated: false },
      iteration: 0,
    },
  ]);
});

test('while loop evaluates the condition with operators against current state', async () => {
  const routine = [
    {
      ':set_state': { done: false },
    },
    {
      ':while': { _not: { _state: 'done' } },
      ':do': {
        ':set_state': { done: true },
      },
    },
  ];
  const { res, context, routineContext } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(routineContext.state.done).toEqual(true);
  expect(whileLogs(context).map((log) => log.condition.evaluated)).toEqual([true, false]);
});

test('while loop returns a :return result from its body immediately', async () => {
  const routine = [
    {
      ':set_state': { count: 0 },
    },
    {
      ':while': true,
      ':do': [
        {
          ':set_state': {
            count: { _sum: [{ _state: 'count' }, 1] },
          },
        },
        {
          ':if': { _eq: [{ _state: 'count' }, 2] },
          ':then': {
            ':return': { result: 'done' },
          },
        },
      ],
    },
  ];
  const { res, context, routineContext } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual({ result: 'done' });
  expect(routineContext.state.count).toEqual(2);
  expect(whileLogs(context).length).toEqual(2);
});

test('while loop returns a :reject result from its body immediately', async () => {
  const routine = {
    ':while': true,
    ':do': {
      ':reject': 'Rejected in while.',
    },
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('reject');
  expect(res.error.message).toEqual('Rejected in while.');
  expect(whileLogs(context).length).toEqual(1);
});

test('while loop propagates an error status from its body', async () => {
  const routine = {
    ':while': true,
    ':do': {
      id: 'request:test_endpoint:test_request',
      type: 'TestRequestError',
      stepId: 'test_request',
      connectionId: 'test',
      properties: {
        message: 'Thrown in while.',
      },
    },
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('error');
  expect(res.error.message).toContain('Thrown in while.');
  expect(whileLogs(context).length).toEqual(1);
});

test('while loop throws when :do is missing', async () => {
  const routine = {
    ':while': true,
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('error');
  expect(res.error.message).toContain(':while');
  expect(res.error.message).toContain('missing :do');
  // The guard runs before the first condition evaluation.
  expect(whileLogs(context)).toEqual([]);
});

test('while loop overwrites the step result of each iteration', async () => {
  const routine = [
    {
      ':set_state': { count: 0 },
    },
    {
      ':while': { _lt: [{ _state: 'count' }, 3] },
      ':do': [
        {
          ':set_state': {
            count: { _sum: [{ _state: 'count' }, 1] },
          },
        },
        {
          id: 'request:test_endpoint:test_request',
          type: 'TestRequest',
          stepId: 'test_request',
          connectionId: 'test',
          properties: {
            response: { _state: 'count' },
          },
        },
      ],
    },
    {
      ':return': { last: { _step: 'test_request' } },
    },
  ];
  const { res, routineContext } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual({ last: 3 });
  expect(routineContext.steps.test_request).toEqual(3);
});
