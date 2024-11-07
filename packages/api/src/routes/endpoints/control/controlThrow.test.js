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
import runTest from '../test/runTest.js';

test('single throw', async () => {
  const routine = {
    ':throw': true,
  };
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('error');
  expect(res.error).toEqual(new Error('true'));
});

test('throw at end of routine', async () => {
  const routine = [
    {
      id: 'request:test_request_1',
      type: 'TestRequestWait',
      requestId: 'request:test_request_1',
      connectionId: 'test',
      properties: {
        ms: 10,
      },
    },
    {
      id: 'request:test_request_2',
      type: 'TestRequestWait',
      requestId: 'request:test_request_2',
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
  const error = new Error('Error has occurred');
  expect(res.status).toEqual('error');
  expect(res.error).toEqual(error);
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_request_1',
          type: 'TestRequestWait',
          requestId: 'request:test_request_1',
          connectionId: 'test',
          properties: {
            ms: 10,
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
      },
    ],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_request_2',
          type: 'TestRequestWait',
          requestId: 'request:test_request_2',
          connectionId: 'test',
          properties: {
            ms: 10,
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
      },
    ],
  ]);
  expect(context.logger.error.mock.calls).toEqual([[{ event: 'error_control_throw', error }]]);
});

test('throw in the middle of routine', async () => {
  const routine = [
    {
      id: 'request:test_request_1',
      type: 'TestRequestWait',
      requestId: 'request:test_request_1',
      connectionId: 'test',
      properties: {
        ms: 10,
      },
    },
    {
      ':throw': 'Error occurred between requests',
    },
    {
      id: 'request:test_request_2',
      type: 'TestRequestWait',
      requestId: 'request:test_request_2',
      connectionId: 'test',
      properties: {
        ms: 10,
      },
    },
    [
      {
        event: 'debug_end_request',
      },
    ],
  ];
  const { res, context } = await runTest({ routine });
  const error = new Error('Error occurred between requests');
  expect(res.status).toEqual('error');
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_request_1',
          type: 'TestRequestWait',
          requestId: 'request:test_request_1',
          connectionId: 'test',
          properties: {
            ms: 10,
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
      },
    ],
  ]);
  expect(context.logger.error.mock.calls).toEqual([[{ event: 'error_control_throw', error }]]);
  expect(res.error).toEqual(error);
});

test('multiple throws in routine', async () => {
  const routine = [
    {
      id: 'request:test_request_1',
      type: 'TestRequestWait',
      requestId: 'request:test_request_1',
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
  const error = new Error('Multiple throws in a routine');
  expect(res.status).toEqual('error');
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_request_1',
          type: 'TestRequestWait',
          requestId: 'request:test_request_1',
          connectionId: 'test',
          properties: {
            ms: 10,
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
      },
    ],
  ]);
  expect(context.logger.error.mock.calls).toEqual([[{ event: 'error_control_throw', error }]]);
  expect(res.error).toEqual(error);
});

test('truthy guard statement throw', async () => {
  const routine = [
    {
      ':if': true,
      ':then': [
        {
          id: 'request:test_request_guard_statement',
          type: 'TestRequest',
          requestId: 'request:test_request_guard_statement',
          connectionId: 'test',
          properties: {
            response: 'guard statement',
          },
        },
        { ':throw': 'Error in guard statement' },
      ],
    },
    {
      id: 'request:test_request_end',
      type: 'TestRequest',
      requestId: 'request:test_request_end',
      connectionId: 'test',
      properties: {
        response: 'end',
      },
    },
    { ':return': { message: 'made it to the end' } },
  ];
  const { res, context } = await runTest({ routine });
  const error = new Error('Error in guard statement');
  expect(res.status).toEqual('error');
  expect(res.error).toEqual(error);
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_if', condition: { input: true, evaluated: true } }],
    [{ event: 'debug_control_if_run_then' }],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_request_guard_statement',
          type: 'TestRequest',
          requestId: 'request:test_request_guard_statement',
          connectionId: 'test',
          properties: {
            response: 'guard statement',
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        requestResult: 'guard statement',
      },
    ],
  ]);
  expect(context.logger.error.mock.calls).toEqual([[{ event: 'error_control_throw', error }]]);
});

test('throw in a try block with catch return', async () => {
  const routine = [
    {
      ':try': [
        {
          id: 'request:test_request_end',
          type: 'TestRequest',
          requestId: 'request:test_request_end',
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
          id: 'request:test_request_end',
          type: 'TestRequest',
          requestId: 'request:test_request_end',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        requestResult: 'end',
      },
    ],
    [{ event: 'debug_control_catch' }],
    [{ event: 'debug_control_return', response: { message: 'Error was caught' } }],
  ]);
});

test.only('throw in a try block with missing catch', async () => {
  const routine = [
    {
      ':try': [
        {
          id: 'request:test_request_end',
          type: 'TestRequest',
          requestId: 'request:test_request_end',
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
  const error = new Error('Error occurred at the end');
  expect(res.status).toEqual('error');
  expect(res.error).toEqual(error);
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_try' }],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_request_end',
          type: 'TestRequest',
          requestId: 'request:test_request_end',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
      },
    ],
  ]);
  expect(context.logger.error.mock.calls).toEqual([[{ event: 'error_control_throw', error }]]);
});

test('throw in a try block with error in finally', async () => {
  const routine = [
    {
      ':try': [
        {
          id: 'request:test_request_end',
          type: 'TestRequest',
          requestId: 'request:test_request_end',
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
  const error = new Error('Error in finally');
  expect(res.status).toEqual('error');
  expect(res.error).toEqual(error);
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_try' }],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_request_end',
          type: 'TestRequest',
          requestId: 'request:test_request_end',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
      },
    ],
    [{ event: 'debug_control_catch' }],
    [{ event: 'debug_control_finally' }],
  ]);
  expect(context.logger.error.mock.calls).toEqual([
    [{ event: 'error_control_throw', error: new Error('Error occurred at the end') }],
    [{ event: 'error_control_throw', error: new Error('Error in catch') }],
    [{ event: 'error_control_throw', error }],
  ]);
});

test('throw in try block with cause', async () => {
  const routine = [
    {
      ':try': [
        {
          id: 'request:test_request_end',
          type: 'TestRequest',
          requestId: 'request:test_request_end',
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
  const error = new Error('Error occurred at the end of try', { cause: { by: 'Error cause' } });
  expect(res.status).toEqual('error');
  expect(res.error).toEqual(error);
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_try' }],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_request_end',
          type: 'TestRequest',
          requestId: 'request:test_request_end',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
      },
    ],
  ]);
  expect(context.logger.error.mock.calls).toEqual([[{ event: 'error_control_throw', error }]]);
});

test('throw in try block with empty catch', async () => {
  const routine = [
    {
      ':try': [
        {
          id: 'request:test_request_end',
          type: 'TestRequest',
          requestId: 'request:test_request_end',
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
  const error = new Error('Error occurred at the end of try');
  expect(res.status).toEqual('continue');
  expect(res.response).toEqual(undefined);
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_try' }],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_request_end',
          type: 'TestRequest',
          requestId: 'request:test_request_end',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
      },
    ],
    [{ event: 'debug_control_catch' }],
  ]);
  expect(context.logger.error.mock.calls).toEqual([[{ event: 'error_control_throw', error }]]);
});

test('throw in try block with return in finally block', async () => {
  const routine = [
    {
      ':try': [
        {
          id: 'request:test_request_end',
          type: 'TestRequest',
          requestId: 'request:test_request_end',
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
  const error = new Error('Error occurred at the end of try');
  expect(res.status).toEqual('return');
  expect(res.response).toEqual({ message: 'Error ignored' });
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_try' }],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_request_end',
          type: 'TestRequest',
          requestId: 'request:test_request_end',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
      },
    ],
    [{ event: 'debug_control_finally' }],
    [{ event: 'debug_control_return', response: { message: 'Error ignored' } }],
  ]);
  expect(context.logger.error.mock.calls).toEqual([[{ event: 'error_control_throw', error }]]);
});

test('throw in try block with request in finally block', async () => {
  const routine = [
    {
      ':try': [
        {
          id: 'request:test_request_end',
          type: 'TestRequest',
          requestId: 'request:test_request_end',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
        { ':throw': 'Error occurred at the end of try' },
      ],
      ':finally': [
        {
          id: 'request:test_request_end_2',
          type: 'TestRequest',
          requestId: 'request:test_request_end_2',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
      ],
    },
  ];
  const { res, context } = await runTest({ routine });
  const error = new Error('Error occurred at the end of try');
  expect(res.status).toEqual('error');
  expect(res.error).toEqual(error);
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_try' }],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_request_end',
          type: 'TestRequest',
          requestId: 'request:test_request_end',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
      },
    ],
    [{ event: 'debug_control_finally' }],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_request_end_2',
          type: 'TestRequest',
          requestId: 'request:test_request_end_2',
          connectionId: 'test',
          properties: {
            response: 'end',
          },
        },
      },
    ],
  ]);
  expect(context.logger.error.mock.calls).toEqual([[{ event: 'error_control_throw', error }]]);
});
