// import { jest } from '@jest/globals';

import runTest from '../test/runTest.js';

/*
try catch with successful try √
try catch with unsuccessful try √
try only, successful √
try only, fail √

try catch with unsuccessful try and catch fail
test throw in try
test reject in try
*/

test.only('try catch with successful try', async () => {
  const routine = {
    ':try': {
      id: 'request:test_endpoint:try_pass',
      type: 'TestRequest',
      connectionId: 'test',
      properties: {
        response: 'Success',
      },
    },
    ':catch': {
      id: 'request:test_endpoint:test_request_error',
      type: 'TestRequest',
      connectionId: 'test',
      properties: {
        response: 'Do this if fail',
      },
    },
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_control_try',
      },
    ],
    [
      {
        event: 'debug_start_step',
        step: {
          id: 'request:test_endpoint:try_pass',
          type: 'TestRequest',
          connectionId: 'test',
          properties: {
            response: 'Success',
          },
        },
      },
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('try catch with unsuccessful try', async () => {
  const routine = {
    ':try': {
      id: 'request:test_endpoint:try_fail',
      type: 'TestRequest',
      connectionId: 'test',
      properties: {
        response: 'Try and fail',
      },
    },
    ':catch': {
      id: 'request:test_endpoint:test_request_error',
      type: 'TestRequest',
      connectionId: 'test',
      properties: {
        response: 'Fallback thing',
      },
    },
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      id: 'request:test_endpoint:test_request_error',
      type: 'TestRequest',
      connectionId: 'test',
      properties: {
        response: 'Fallback thing',
      },
    },
  ]);
  expect(res.response).toEqual('Fallback thing');
});

test('try only, success', async () => {
  const routine = {
    ':try': {
      id: 'request:test_endpoint:try_pass',
      type: 'TestRequest',
      connectionId: 'test',
      properties: {
        response: 'Success',
      },
    },
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_happy_path',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'Success',
    },
  ]);
  expect(res.response).toEqual('Success');
});

test('try only, fail', async () => {
  const routine = {
    ':try': {
      id: 'request:test_endpoint:try_fail',
      type: 'TestRequest',
      connectionId: 'test',
      properties: {
        response: 'Success',
      },
    },
  };
  expect(async () => await runTest({ routine })).rejects.toThrow('TODO: uncaught error'); // ??
});
