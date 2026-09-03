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

import runTest from './test/runTest.js';

test('single stage', async () => {
  const routine = {
    stepId: 'test_request',
    type: 'TestRequest',
    id: 'request:test_endpoint:test_request',
    connectionId: 'test',
    properties: {
      response: 1,
    },
  };
  const { res, context, routineContext } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(routineContext.steps).toEqual({ test_request: 1 });
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request',
          type: 'TestRequest',
          stepId: 'test_request',
          connectionId: 'test',
          properties: {
            response: 1,
          },
        },
      },
    ],
    [
      expect.objectContaining({
        event: 'request_completed',
        request_id: 'test_request',
        request_type: 'TestRequest',
        connection_id: 'test',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request',
        result: 1,
      },
    ],
    [
      expect.objectContaining({
        event: 'step_completed',
        step_id: 'test_request',
        step_type: 'TestRequest',
        status: 'continue',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('array with single stage', async () => {
  const routine = [
    {
      stepId: 'test_request',
      type: 'TestRequest',
      id: 'request:test_endpoint:test_request',
      connectionId: 'test',
      properties: {
        response: 1,
      },
    },
  ];
  const { res, context, routineContext } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(routineContext.steps).toEqual({ test_request: 1 });
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request',
          type: 'TestRequest',
          stepId: 'test_request',
          connectionId: 'test',
          properties: {
            response: 1,
          },
        },
      },
    ],
    [
      expect.objectContaining({
        event: 'request_completed',
        request_id: 'test_request',
        request_type: 'TestRequest',
        connection_id: 'test',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request',
        result: 1,
      },
    ],
    [
      expect.objectContaining({
        event: 'step_completed',
        step_id: 'test_request',
        step_type: 'TestRequest',
        status: 'continue',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('array with two stages', async () => {
  const routine = [
    {
      stepId: 'test_request_1',
      type: 'TestRequest',
      id: 'request:test_endpoint:test_request_1',
      connectionId: 'test',
      properties: {
        response: 1,
      },
    },
    {
      stepId: 'test_request_2',
      type: 'TestRequest',
      id: 'request:test_endpoint:test_request_2',
      connectionId: 'test',
      properties: {
        response: 2,
      },
    },
  ];
  const { res, context, routineContext } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(routineContext.steps).toEqual({ test_request_1: 1, test_request_2: 2 });
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_1',
          type: 'TestRequest',
          stepId: 'test_request_1',
          connectionId: 'test',
          properties: {
            response: 1,
          },
        },
      },
    ],
    [
      expect.objectContaining({
        event: 'request_completed',
        request_id: 'test_request_1',
        request_type: 'TestRequest',
        connection_id: 'test',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_1',
        result: 1,
      },
    ],
    [
      expect.objectContaining({
        event: 'step_completed',
        step_id: 'test_request_1',
        step_type: 'TestRequest',
        status: 'continue',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_2',
          type: 'TestRequest',
          stepId: 'test_request_2',
          connectionId: 'test',
          properties: {
            response: 2,
          },
        },
      },
    ],
    [
      expect.objectContaining({
        event: 'request_completed',
        request_id: 'test_request_2',
        request_type: 'TestRequest',
        connection_id: 'test',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_2',
        result: 2,
      },
    ],
    [
      expect.objectContaining({
        event: 'step_completed',
        step_id: 'test_request_2',
        step_type: 'TestRequest',
        status: 'continue',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('nested array', async () => {
  const routine = [
    [
      {
        stepId: 'test_request_1',
        type: 'TestRequest',
        id: 'request:test_endpoint:test_request_1',
        connectionId: 'test',
        properties: {
          response: 1,
        },
      },
      {
        stepId: 'test_request_2',
        type: 'TestRequest',
        id: 'request:test_endpoint:test_request_2',
        connectionId: 'test',
        properties: {
          response: 2,
        },
      },
    ],
    {
      stepId: 'test_request_3',
      type: 'TestRequest',
      id: 'request:test_endpoint:test_request_3',
      connectionId: 'test',
      properties: {
        response: 3,
      },
    },
  ];
  const { res, context, routineContext } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(routineContext.steps).toEqual({ test_request_1: 1, test_request_2: 2, test_request_3: 3 });
  expect(res.response).toEqual(undefined);
});

test('unknown control', async () => {
  const routine = {
    ':unknown': {
      stepId: 'test_request',
      type: 'TestRequest',
      id: 'request:test_endpoint:test_request_3',
      connectionId: 'test',
      properties: {
        response: 'test',
      },
    },
  };
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('error');
  expect(res.error).toEqual(new Error('Unexpected control.'));
});

test('_payload operator in request properties', async () => {
  const routine = {
    stepId: 'test_request',
    type: 'TestRequest',
    id: 'request:test_endpoint:test_request',
    connectionId: 'test',
    properties: {
      response: { _payload: 'value' },
    },
  };
  const { res, context, routineContext } = await runTest({
    routine,
    payload: { value: 'from_payload' },
  });
  expect(res.status).toEqual('continue');
  expect(routineContext.steps).toEqual({ test_request: 'from_payload' });
});

test('_payload operator with nested path', async () => {
  const routine = {
    stepId: 'test_request',
    type: 'TestRequest',
    id: 'request:test_endpoint:test_request',
    connectionId: 'test',
    properties: {
      response: { _payload: 'nested.deep.value' },
    },
  };
  const { res, context, routineContext } = await runTest({
    routine,
    payload: { nested: { deep: { value: 'deeply_nested' } } },
  });
  expect(res.status).toEqual('continue');
  expect(routineContext.steps).toEqual({ test_request: 'deeply_nested' });
});

test('_step operator accesses previous step result', async () => {
  const routine = [
    {
      stepId: 'first_request',
      type: 'TestRequest',
      id: 'request:test_endpoint:first_request',
      connectionId: 'test',
      properties: {
        response: 'first_value',
      },
    },
    {
      stepId: 'second_request',
      type: 'TestRequest',
      id: 'request:test_endpoint:second_request',
      connectionId: 'test',
      properties: {
        response: { _step: 'first_request' },
      },
    },
  ];
  const { res, context, routineContext } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(routineContext.steps).toEqual({
    first_request: 'first_value',
    second_request: 'first_value',
  });
});

test('_secret operator in request properties', async () => {
  const routine = {
    stepId: 'test_request',
    type: 'TestRequest',
    id: 'request:test_endpoint:test_request',
    connectionId: 'test',
    properties: {
      response: { _secret: 'REQUEST' },
    },
  };
  const { res, context, routineContext } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(routineContext.steps).toEqual({ test_request: 'requestSecret' });
});

test('_user operator in request properties', async () => {
  const routine = {
    stepId: 'test_request',
    type: 'TestRequest',
    id: 'request:test_endpoint:test_request',
    connectionId: 'test',
    properties: {
      response: { _user: 'id' },
    },
  };
  const { res, context, routineContext } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(routineContext.steps).toEqual({ test_request: 'id' });
});

test('_sum operator computes sum of payload values', async () => {
  const routine = {
    stepId: 'test_request',
    type: 'TestRequest',
    id: 'request:test_endpoint:test_request',
    connectionId: 'test',
    properties: {
      response: {
        _sum: [{ _payload: 'a' }, { _payload: 'b' }],
      },
    },
  };
  const { res, context, routineContext } = await runTest({ routine, payload: { a: 10, b: 5 } });
  expect(res.status).toEqual('continue');
  expect(routineContext.steps).toEqual({ test_request: 15 });
});

test('catch routes a single thrown error through handleError once and it comes back handled', async () => {
  // ':unknown' triggers handleControl to throw synchronously, exercising the
  // catch in runRoutine. The catch should call context.handleError exactly once,
  // and handleError is what marks the error handled.
  const routine = { ':unknown': {} };
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('error');
  expect(res.error.handled).toBe(true);
  // handleError in testContext calls logger.error(error). Filter by direct
  // error arg so we count handleError invocations, not other logger.error calls.
  const handleErrorCalls = context.logger.error.mock.calls.filter((call) => call[0] === res.error);
  expect(handleErrorCalls.length).toBe(1);
});

test('handleError skipped when error.handled is already true', async () => {
  const { default: runRoutine } = await import('./runRoutine.js');
  // The real sink (servers' createHandleError) marks the error handled once it
  // has logged it; runRoutine's guard reads that flag rather than setting it.
  const handleError = jest.fn(async (error) => {
    error.handled = true;
  });
  const context = { handleError };
  // First pass: null routine triggers `throw new Error('Invalid routine.')`
  // inside runRoutine's try block. The catch calls handleError once, which sets
  // handled=true.
  const res1 = await runRoutine(context, {}, { routine: null });
  expect(res1.status).toBe('error');
  expect(res1.error.handled).toBe(true);
  expect(handleError).toHaveBeenCalledTimes(1);
});

test('an invalid routine throws a LowdefyInternalError', async () => {
  const { default: runRoutine } = await import('./runRoutine.js');
  const handleError = jest.fn();
  const res = await runRoutine({ handleError }, {}, { routine: null });
  expect(res.status).toBe('error');
  expect(res.error.name).toBe('LowdefyInternalError');
  expect(res.error.message).toBe('Invalid routine.');
});

test('a UserError is returned as an error status without going through handleError', async () => {
  const { default: runRoutine } = await import('./runRoutine.js');
  const { UserError } = await import('@lowdefy/errors');
  const handleError = jest.fn();
  const error = new UserError('Nested throw.');
  const routine = {
    id: 'endpoint:nested',
    stepId: 'call_nested',
  };
  const context = {
    handleError,
    logger: { debug: jest.fn(), info: jest.fn() },
    evaluateOperators: () => {
      throw error;
    },
  };
  const res = await runRoutine(context, {}, { routine });
  expect(res).toEqual({ status: 'error', error });
  expect(handleError).not.toHaveBeenCalled();
});

test('combined operators in request properties', async () => {
  const routine = {
    stepId: 'test_request',
    type: 'TestRequest',
    id: 'request:test_endpoint:test_request',
    connectionId: 'test',
    properties: {
      response: {
        fromPayload: { _payload: 'input' },
        fromSecret: { _secret: 'REQUEST' },
        fromUser: { _user: 'id' },
      },
    },
  };
  const { res, context, routineContext } = await runTest({
    routine,
    payload: { input: 'test_input' },
  });
  expect(res.status).toEqual('continue');
  expect(routineContext.steps).toEqual({
    test_request: {
      fromPayload: 'test_input',
      fromSecret: 'requestSecret',
      fromUser: 'id',
    },
  });
});

test('routineContext.trace gains one entry per request step, carrying its stepId', async () => {
  const routine = [
    {
      stepId: 'first',
      type: 'TestRequest',
      id: 'request:test_endpoint:first',
      connectionId: 'test',
      properties: { response: 1 },
    },
    { ':set_state': { a: 1 } },
    {
      stepId: 'second',
      type: 'TestRequest',
      id: 'request:test_endpoint:second',
      connectionId: 'test',
      properties: { response: 2 },
    },
  ];
  const { res, routineContext } = await runTest({ routine, trace: [] });
  expect(res).toEqual({ status: 'continue' });
  expect(routineContext.trace).toEqual([
    {
      stepId: 'first',
      rewritten: [],
      connection: { id: 'test', type: 'TestConnection', tenant: null },
      requestType: 'TestRequest',
      properties: { response: 1 },
      dispatched: true,
    },
    {
      stepId: 'second',
      rewritten: [],
      connection: { id: 'test', type: 'TestConnection', tenant: null },
      requestType: 'TestRequest',
      properties: { response: 2 },
      dispatched: true,
    },
  ]);
});

test('a routine without trace leaves routineContext.trace undefined', async () => {
  const routine = {
    stepId: 'only',
    type: 'TestRequest',
    id: 'request:test_endpoint:only',
    connectionId: 'test',
    properties: { response: 1 },
  };
  const { routineContext } = await runTest({ routine });
  expect(routineContext.trace).toBeUndefined();
});

test('runRoutine stops between steps when the request is aborted', async () => {
  // Aborted after the first step: the routine gets no further.
  let checks = 0;
  const signal = {
    get aborted() {
      checks += 1;
      return checks > 2;
    },
  };
  const routine = [{ ':set_state': { first: true } }, { ':set_state': { second: true } }];
  const { res, routineContext } = await runTest({ routine, signal });
  expect(res.status).toEqual('error');
  expect(res.error.name).toEqual('ServiceError');
  expect(res.error.message).toContain('The request was aborted before the next step ran.');
  expect(routineContext.state).toEqual({ first: true });
});

test('runRoutine runs every step when the request is not aborted', async () => {
  const routine = [{ ':set_state': { first: true } }, { ':set_state': { second: true } }];
  const { res, routineContext } = await runTest({
    routine,
    signal: new AbortController().signal,
  });
  expect(res.status).toEqual('continue');
  expect(routineContext.state).toEqual({ first: true, second: true });
});
