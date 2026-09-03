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
import { UserError } from '@lowdefy/errors';

import runTest from '../test/runTest.js';

test('single throw', async () => {
  const routine = {
    ':throw': true,
  };
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('error');
  expect(res.error).toEqual(new UserError('true'));
  expect(res.error).toBeInstanceOf(UserError);
  expect(res.error.isLowdefyError).toBe(true);
  expect(res.error.isReject).toBe(false);
});

test('throw at end of routine', async () => {
  const routine = [
    {
      id: 'request:test_endpoint:test_request_1',
      type: 'TestRequestWait',
      stepId: 'test_request_1',
      connectionId: 'test',
      properties: {
        ms: 10,
      },
    },
    {
      id: 'request:test_endpoint:test_request_2',
      type: 'TestRequestWait',
      stepId: 'test_request_2',
      connectionId: 'test',
      properties: {
        ms: 10,
      },
    },
    {
      ':throw': 'Error has occurred',
    },
  ];
  const { res, context } = await runTest({ routine });
  const error = new UserError('Error has occurred');
  expect(res.status).toEqual('error');
  expect(res.error).toEqual(error);
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_1',
          type: 'TestRequestWait',
          stepId: 'test_request_1',
          connectionId: 'test',
          properties: {
            ms: 10,
          },
        },
      },
    ],
    [
      expect.objectContaining({
        event: 'request_completed',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_1',
      },
    ],
    [
      expect.objectContaining({
        event: 'step_completed',
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
          type: 'TestRequestWait',
          stepId: 'test_request_2',
          connectionId: 'test',
          properties: {
            ms: 10,
          },
        },
      },
    ],
    [
      expect.objectContaining({
        event: 'request_completed',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_2',
      },
    ],
    [
      expect.objectContaining({
        event: 'step_completed',
        status: 'continue',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
  ]);
  expect(context.logger.warn.mock.calls).toEqual([[{ event: 'warn_control_throw', err: error }]]);
});

test('throw in the middle of routine', async () => {
  const routine = [
    {
      id: 'request:test_endpoint:test_request_1',
      type: 'TestRequestWait',
      stepId: 'test_request_1',
      connectionId: 'test',
      properties: {
        ms: 10,
      },
    },
    {
      ':throw': 'Error occurred between requests',
    },
    {
      id: 'request:test_endpoint:test_request_2',
      type: 'TestRequestWait',
      stepId: 'test_request_2',
      connectionId: 'test',
      properties: {
        ms: 10,
      },
    },
  ];
  const { res, context } = await runTest({ routine });
  const error = new UserError('Error occurred between requests');
  expect(res.status).toEqual('error');
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_1',
          type: 'TestRequestWait',
          stepId: 'test_request_1',
          connectionId: 'test',
          properties: {
            ms: 10,
          },
        },
      },
    ],
    [
      expect.objectContaining({
        event: 'request_completed',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_1',
      },
    ],
    [
      expect.objectContaining({
        event: 'step_completed',
        status: 'continue',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
  ]);
  expect(context.logger.warn.mock.calls).toEqual([[{ event: 'warn_control_throw', err: error }]]);
  expect(res.error).toEqual(error);
});

test('multiple throws in routine', async () => {
  const routine = [
    {
      id: 'request:test_endpoint:test_request_1',
      type: 'TestRequestWait',
      stepId: 'test_request_1',
      connectionId: 'test',
      properties: {
        ms: 10,
      },
    },
    {
      ':throw': 'Multiple throws in a routine',
    },
    {
      ':throw': {
        message: 'Second',
      },
    },
    {
      ':return': {
        message: 'Third',
      },
    },
  ];
  const { res, context } = await runTest({ routine });
  const error = new UserError('Multiple throws in a routine');
  expect(res.status).toEqual('error');
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_1',
          type: 'TestRequestWait',
          stepId: 'test_request_1',
          connectionId: 'test',
          properties: {
            ms: 10,
          },
        },
      },
    ],
    [
      expect.objectContaining({
        event: 'request_completed',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_1',
      },
    ],
    [
      expect.objectContaining({
        event: 'step_completed',
        status: 'continue',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
  ]);
  expect(context.logger.warn.mock.calls).toEqual([[{ event: 'warn_control_throw', err: error }]]);
  expect(res.error).toEqual(error);
});

test('truthy guard statement throw', async () => {
  const routine = [
    {
      ':if': true,
      ':then': [
        {
          id: 'request:test_endpoint:test_request_guard_statement',
          type: 'TestRequest',
          stepId: 'test_request_guard_statement',
          connectionId: 'test',
          properties: {
            response: 'guard statement',
          },
        },
        { ':throw': 'Error in guard statement' },
      ],
    },
    {
      id: 'request:test_endpoint:test_request_end',
      type: 'TestRequest',
      stepId: 'test_request_end',
      connectionId: 'test',
      properties: {
        response: 'end',
      },
    },
    { ':return': { message: 'made it to the end' } },
  ];
  const { res, context } = await runTest({ routine });
  const error = new UserError('Error in guard statement');
  expect(res.status).toEqual('error');
  expect(res.error).toEqual(error);
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_if', condition: { input: true, evaluated: true } }],
    [{ event: 'debug_control_if_run_then' }],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_guard_statement',
          type: 'TestRequest',
          stepId: 'test_request_guard_statement',
          connectionId: 'test',
          properties: {
            response: 'guard statement',
          },
        },
      },
    ],
    [
      expect.objectContaining({
        event: 'request_completed',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_guard_statement',
        result: 'guard statement',
      },
    ],
    [
      expect.objectContaining({
        event: 'step_completed',
        status: 'continue',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
  ]);
  expect(context.logger.warn.mock.calls).toEqual([[{ event: 'warn_control_throw', err: error }]]);
});

test('throw in a try block with catch return', async () => {
  const routine = [
    {
      ':try': [
        {
          id: 'request:test_endpoint:test_request_end',
          type: 'TestRequest',
          stepId: 'test_request_end',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
        { ':throw': 'Error occurred at the end' },
      ],
      ':catch': [{ ':return': { message: 'Error was caught' } }],
    },
  ];
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual({ message: 'Error was caught' });
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_try' }],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_end',
          type: 'TestRequest',
          stepId: 'test_request_end',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
      },
    ],
    [
      expect.objectContaining({
        event: 'request_completed',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_end',
        result: 'end',
      },
    ],
    [
      expect.objectContaining({
        event: 'step_completed',
        status: 'continue',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
    [{ event: 'debug_control_catch' }],
    [{ event: 'debug_control_return', response: { message: 'Error was caught' } }],
  ]);
});

test('throw in a try block with missing catch', async () => {
  const routine = [
    {
      ':try': [
        {
          id: 'request:test_endpoint:test_request_end',
          type: 'TestRequest',
          stepId: 'test_request_end',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
        { ':throw': 'Error occurred at the end' },
      ],
    },
  ];
  const { res, context } = await runTest({ routine });
  const error = new UserError('Error occurred at the end');
  expect(res.status).toEqual('error');
  expect(res.error).toEqual(error);
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_try' }],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_end',
          type: 'TestRequest',
          stepId: 'test_request_end',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
      },
    ],
    [
      expect.objectContaining({
        event: 'request_completed',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_end',
        result: 'end',
      },
    ],
    [
      expect.objectContaining({
        event: 'step_completed',
        status: 'continue',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
  ]);
  expect(context.logger.warn.mock.calls).toEqual([[{ event: 'warn_control_throw', err: error }]]);
});

test('throw in a try block with error in finally', async () => {
  const routine = [
    {
      ':try': [
        {
          id: 'request:test_endpoint:test_request_end',
          type: 'TestRequest',
          stepId: 'test_request_end',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
        { ':throw': 'Error occurred at the end' },
      ],
      ':catch': [{ ':throw': 'Error in catch' }],
      ':finally': [{ ':throw': 'Error in finally' }],
    },
  ];
  const { res, context } = await runTest({ routine });
  const error = new UserError('Error in finally');
  expect(res.status).toEqual('error');
  expect(res.error).toEqual(error);
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_try' }],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_end',
          type: 'TestRequest',
          stepId: 'test_request_end',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
      },
    ],
    [
      expect.objectContaining({
        event: 'request_completed',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_end',
        result: 'end',
      },
    ],
    [
      expect.objectContaining({
        event: 'step_completed',
        status: 'continue',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
    [{ event: 'debug_control_catch' }],
    [{ event: 'debug_control_finally' }],
  ]);
  expect(context.logger.warn.mock.calls).toEqual([
    [{ event: 'warn_control_throw', err: new UserError('Error occurred at the end') }],
    [{ event: 'warn_control_throw', err: new UserError('Error in catch') }],
    [{ event: 'warn_control_throw', err: error }],
  ]);
});

test('throw in try block with cause', async () => {
  const routine = [
    {
      ':try': [
        {
          id: 'request:test_endpoint:test_request_end',
          type: 'TestRequest',
          stepId: 'test_request_end',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
        { ':throw': 'Error occurred at the end of try', cause: { by: 'Error cause' } },
      ],
    },
  ];
  const { res, context } = await runTest({ routine });
  const error = new UserError('Error occurred at the end of try', { cause: { by: 'Error cause' } });
  expect(res.status).toEqual('error');
  expect(res.error).toEqual(error);
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_try' }],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_end',
          type: 'TestRequest',
          stepId: 'test_request_end',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
      },
    ],
    [
      expect.objectContaining({
        event: 'request_completed',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_end',
        result: 'end',
      },
    ],
    [
      expect.objectContaining({
        event: 'step_completed',
        status: 'continue',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
  ]);
  expect(context.logger.warn.mock.calls).toEqual([[{ event: 'warn_control_throw', err: error }]]);
});

test('throw in try block with empty catch', async () => {
  const routine = [
    {
      ':try': [
        {
          id: 'request:test_endpoint:test_request_end',
          type: 'TestRequest',
          stepId: 'test_request_end',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
        { ':throw': 'Error occurred at the end of try' },
      ],
      ':catch': [],
    },
  ];
  const { res, context } = await runTest({ routine });
  const error = new UserError('Error occurred at the end of try');
  expect(res.status).toEqual('continue');
  expect(res.response).toEqual(undefined);
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_try' }],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_end',
          type: 'TestRequest',
          stepId: 'test_request_end',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
      },
    ],
    [
      expect.objectContaining({
        event: 'request_completed',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_end',
        result: 'end',
      },
    ],
    [
      expect.objectContaining({
        event: 'step_completed',
        status: 'continue',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
    [{ event: 'debug_control_catch' }],
  ]);
  expect(context.logger.warn.mock.calls).toEqual([[{ event: 'warn_control_throw', err: error }]]);
});

test('throw in try block with return in finally block', async () => {
  const routine = [
    {
      ':try': [
        {
          id: 'request:test_endpoint:test_request_end',
          type: 'TestRequest',
          stepId: 'test_request_end',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
        { ':throw': 'Error occurred at the end of try' },
      ],
      ':finally': [{ ':return': { message: 'Error ignored' } }],
    },
  ];
  const { res, context } = await runTest({ routine });
  const error = new UserError('Error occurred at the end of try');
  expect(res.status).toEqual('return');
  expect(res.response).toEqual({ message: 'Error ignored' });
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_try' }],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_end',
          type: 'TestRequest',
          stepId: 'test_request_end',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
      },
    ],
    [
      expect.objectContaining({
        event: 'request_completed',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_end',
        result: 'end',
      },
    ],
    [
      expect.objectContaining({
        event: 'step_completed',
        status: 'continue',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
    [{ event: 'debug_control_finally' }],
    [{ event: 'debug_control_return', response: { message: 'Error ignored' } }],
  ]);
  expect(context.logger.warn.mock.calls).toEqual([[{ event: 'warn_control_throw', err: error }]]);
});

test('throw in try block with request in finally block', async () => {
  const routine = [
    {
      ':try': [
        {
          id: 'request:test_endpoint:test_request_end',
          type: 'TestRequest',
          stepId: 'test_request_end',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
        { ':throw': 'Error occurred at the end of try' },
      ],
      ':finally': [
        {
          id: 'request:test_endpoint:test_request_end_2',
          type: 'TestRequest',
          stepId: 'test_request_end_2',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
      ],
    },
  ];
  const { res, context } = await runTest({ routine });
  const error = new UserError('Error occurred at the end of try');
  expect(res.status).toEqual('error');
  expect(res.error).toEqual(error);
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_try' }],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_end',
          type: 'TestRequest',
          stepId: 'test_request_end',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
      },
    ],
    [
      expect.objectContaining({
        event: 'request_completed',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_end',
        result: 'end',
      },
    ],
    [
      expect.objectContaining({
        event: 'step_completed',
        status: 'continue',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
    [{ event: 'debug_control_finally' }],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_end_2',
          type: 'TestRequest',
          stepId: 'test_request_end_2',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
      },
    ],
    [
      expect.objectContaining({
        event: 'request_completed',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_end_2',
        result: 'end',
      },
    ],
    [
      expect.objectContaining({
        event: 'step_completed',
        status: 'continue',
        success: true,
        duration_ms: expect.any(Number),
      }),
    ],
  ]);
  expect(context.logger.warn.mock.calls).toEqual([[{ event: 'warn_control_throw', err: error }]]);
});
