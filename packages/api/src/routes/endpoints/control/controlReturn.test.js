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

test('single return', async () => {
  const routine = {
    ':return': true,
  };
  const { res } = await runTest({ routine });
  expect(res.status).toBe('return');
  expect(res.response).toEqual(true);
});

test('return null', async () => {
  const routine = {
    ':return': null,
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toBe('return');
  expect(res.response).toEqual(null);
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_return', response: null }],
  ]);
});

test('return at end of routine', async () => {
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
      ':return': {
        message: 'Successful',
      },
    },
  ];
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual({ message: 'Successful' });
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
    [
      {
        event: 'debug_control_return',
        response: {
          message: 'Successful',
        },
      },
    ],
  ]);
});

test('return in the middle of routine', async () => {
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
      ':return': {
        message: 'Successful',
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
  ];
  const { res, context } = await runTest({ routine });
  expect(res.status).toBe('return');
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
    [{ event: 'debug_control_return', response: { message: 'Successful' } }],
  ]);
  expect(res.response).toEqual({ message: 'Successful' });
});

test('multiple returns in routine', async () => {
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
      ':return': {
        message: 'First',
      },
    },
    {
      ':return': {
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
  expect(res.status).toBe('return');
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
    [{ event: 'debug_control_return', response: { message: 'First' } }],
  ]);
  expect(res.response).toEqual({ message: 'First' });
});

test('truthy guard statement return', async () => {
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
        { ':return': { message: 'returned by guard statement' } },
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
  expect(res.status).toBe('return');
  expect(res.response).toEqual({ message: 'returned by guard statement' });
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
    [{ event: 'debug_control_return', response: { message: 'returned by guard statement' } }],
  ]);
});

test('falsy guard statement return', async () => {
  const routine = [
    {
      ':if': false,
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
        { ':return': { message: 'returned by guard statement' } },
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
  expect(res.status).toBe('return');
  expect(res.response).toEqual({ message: 'made it to the end' });
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_if', condition: { input: false, evaluated: false } }],
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
    [{ event: 'debug_control_return', response: { message: 'made it to the end' } }],
  ]);
});

test('deep nested return', async () => {
  const routine = [
    {
      ':if': true,
      ':then': [
        {
          id: 'request:test_request_first_if',
          type: 'TestRequest',
          requestId: 'request:test_request_first_if',
          connectionId: 'test',
          properties: {
            response: 'first if',
          },
        },
        {
          ':if': true,
          ':then': [
            {
              id: 'request:test_request_second_if',
              type: 'TestRequest',
              requestId: 'request:test_request_second_if',
              connectionId: 'test',
              properties: {
                response: 'second if',
              },
            },
            { ':return': { message: 'returned by first if' } },
          ],
        },
        { ':return': { message: 'returned by second if' } },
      ],
    },
    {
      id: 'test_request_end',
      type: 'TestRequest',
      requestId: 'test_request_end',
      connectionId: 'test',
      properties: {
        response: 'end',
      },
    },
    { ':return': { message: 'made it to the end' } },
  ];
  const { res, context } = await runTest({ routine });
  expect(res.status).toBe('return');
  expect(res.response).toEqual({ message: 'returned by first if' });
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_if', condition: { input: true, evaluated: true } }],
    [{ event: 'debug_control_if_run_then' }],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_request_first_if',
          type: 'TestRequest',
          requestId: 'request:test_request_first_if',
          connectionId: 'test',
          properties: {
            response: 'first if',
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        requestResult: 'first if',
      },
    ],
    [{ event: 'debug_control_if', condition: { input: true, evaluated: true } }],
    [{ event: 'debug_control_if_run_then' }],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_request_second_if',
          type: 'TestRequest',
          requestId: 'request:test_request_second_if',
          connectionId: 'test',
          properties: {
            response: 'second if',
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        requestResult: 'second if',
      },
    ],
    [{ event: 'debug_control_return', response: { message: 'returned by first if' } }],
  ]);
});
