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

test('single reject', async () => {
  const routine = {
    ':reject': true,
  };
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('reject');
  expect(res.response).toEqual(true);
});

test('reject null', async () => {
  const routine = {
    ':reject': null,
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('reject');
  expect(res.response).toEqual(null);
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_reject', response: null }],
  ]);
});

test('reject at end of routine', async () => {
  const routine = [
    {
      id: 'request:test_endpoint:test_request_1',
      type: 'TestRequestWait',
      requestId: 'test_request_1',
      connectionId: 'test',
      properties: {
        ms: 10,
      },
    },
    {
      id: 'request:test_endpoint:test_request_2',
      type: 'TestRequestWait',
      requestId: 'test_request_2',
      connectionId: 'test',
      properties: {
        ms: 10,
      },
    },
    {
      ':reject': {
        info: 'Rejected',
      },
    },
  ];
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('reject');
  expect(res.response).toEqual({ info: 'Rejected' });
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_1',
          type: 'TestRequestWait',
          requestId: 'test_request_1',
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
        id: 'request:test_endpoint:test_request_1',
      },
    ],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_2',
          type: 'TestRequestWait',
          requestId: 'test_request_2',
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
        id: 'request:test_endpoint:test_request_2',
      },
    ],
    [{ event: 'debug_control_reject', response: { info: 'Rejected' } }],
  ]);
});

test('reject in the middle of routine', async () => {
  const routine = [
    {
      id: 'request:test_endpoint:test_request_1',
      type: 'TestRequestWait',
      requestId: 'test_request_1',
      connectionId: 'test',
      properties: {
        ms: 10,
      },
    },
    {
      ':reject': {
        info: 'Rejected',
      },
    },
    {
      id: 'request:test_endpoint:test_request_2',
      type: 'TestRequestWait',
      requestId: 'test_request_2',
      connectionId: 'test',
      properties: {
        ms: 10,
      },
    },
  ];
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('reject');
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_1',
          type: 'TestRequestWait',
          requestId: 'test_request_1',
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
        id: 'request:test_endpoint:test_request_1',
      },
    ],
    [{ event: 'debug_control_reject', response: { info: 'Rejected' } }],
  ]);
  expect(res.response).toEqual({ info: 'Rejected' });
});

test('multiple rejects in routine', async () => {
  const routine = [
    {
      id: 'request:test_endpoint:test_request_1',
      type: 'TestRequestWait',
      requestId: 'test_request_1',
      connectionId: 'test',
      properties: {
        ms: 10,
      },
    },
    {
      ':reject': {
        info: 'First',
      },
    },
    {
      ':reject': {
        info: 'Second',
      },
    },
    {
      ':reject': {
        info: 'Third',
      },
    },
  ];
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('reject');
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_1',
          type: 'TestRequestWait',
          requestId: 'test_request_1',
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
        id: 'request:test_endpoint:test_request_1',
      },
    ],
    [{ event: 'debug_control_reject', response: { info: 'First' } }],
  ]);
  expect(res.response).toEqual({ info: 'First' });
});

test('truthy guard statement reject', async () => {
  const routine = [
    {
      ':if': true,
      ':then': [
        {
          id: 'request:test_endpoint:test_request_guard_statement',
          type: 'TestRequest',
          requestId: 'test_request_guard_statement',
          connectionId: 'test',
          properties: {
            response: 'guard statement',
          },
        },
        { ':reject': { info: 'rejected by guard statement' } },
      ],
    },
    {
      id: 'request:test_endpoint:test_request_end',
      type: 'TestRequest',
      requestId: 'test_request_end',
      connectionId: 'test',
      properties: {
        response: 'end',
      },
    },
    { ':reject': { info: 'made it to the end' } },
  ];
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('reject');
  expect(res.response).toEqual({ info: 'rejected by guard statement' });
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_if', condition: { input: true, evaluated: true } }],
    [{ event: 'debug_control_if_run_then' }],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_guard_statement',
          type: 'TestRequest',
          requestId: 'test_request_guard_statement',
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
        id: 'request:test_endpoint:test_request_guard_statement',
        result: 'guard statement',
      },
    ],
    [{ event: 'debug_control_reject', response: { info: 'rejected by guard statement' } }],
  ]);
});

test('falsy guard statement reject', async () => {
  const routine = [
    {
      ':if': false,
      ':then': [
        {
          id: 'request:test_endpoint:test_request_guard_statement',
          type: 'TestRequest',
          requestId: 'test_request_guard_statement',
          connectionId: 'test',
          properties: {
            response: 'guard statement',
          },
        },
        { ':reject': { info: 'rejected by guard statement' } },
      ],
    },
    {
      id: 'request:test_endpoint:test_request_end',
      type: 'TestRequest',
      requestId: 'test_request_end',
      connectionId: 'test',
      properties: {
        response: 'end',
      },
    },
    { ':reject': { info: 'made it to the end' } },
  ];
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('reject');
  expect(res.response).toEqual({ info: 'made it to the end' });
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_if', condition: { input: false, evaluated: false } }],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_end',
          type: 'TestRequest',
          requestId: 'test_request_end',
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
        id: 'request:test_endpoint:test_request_end',
        result: 'end',
      },
    ],
    [{ event: 'debug_control_reject', response: { info: 'made it to the end' } }],
  ]);
});

test('reject in a try catch block', async () => {
  const routine = [
    {
      ':try': [
        {
          id: 'request:test_endpoint:test_request_try_reject',
          type: 'TestRequest',
          requestId: 'test_request_try_reject',
          connectionId: 'test',
          properties: {
            response: 'try_reject_block',
          },
        },
        { ':reject': { info: 'reject in try block' } },
      ],
      catch: [{ ':return': { message: 'Caught rejection' } }],
    },
  ];
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('reject');
  expect(res.response).toEqual({ info: 'reject in try block' });
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_try' }],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_try_reject',
          type: 'TestRequest',
          requestId: 'test_request_try_reject',
          connectionId: 'test',
          properties: {
            response: 'try_reject_block',
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_try_reject',
        result: 'try_reject_block',
      },
    ],
    [{ event: 'debug_control_reject', response: { info: 'reject in try block' } }],
  ]);
});

test('deep nested reject', async () => {
  const routine = [
    {
      ':if': true,
      ':then': [
        {
          id: 'request:test_endpoint:test_request_first_if',
          type: 'TestRequest',
          requestId: 'test_request_first_if',
          connectionId: 'test',
          properties: {
            response: 'first if',
          },
        },
        {
          ':if': true,
          ':then': [
            {
              id: 'request:test_endpoint:test_request_second_if',
              type: 'TestRequest',
              requestId: 'test_request_second_if',
              connectionId: 'test',
              properties: {
                response: 'second if',
              },
            },
            { ':reject': { info: 'rejected by first if' } },
          ],
        },
        { ':reject': { info: 'rejected by second if' } },
      ],
    },
    {
      id: 'request:test_endpoint:test_request_end',
      type: 'TestRequest',
      requestId: 'test_request_end',
      connectionId: 'test',
      properties: {
        response: 'end',
      },
    },
    { ':reject': { info: 'made it to the end' } },
  ];
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('reject');
  expect(res.response).toEqual({ info: 'rejected by first if' });
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_if', condition: { input: true, evaluated: true } }],
    [{ event: 'debug_control_if_run_then' }],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_first_if',
          type: 'TestRequest',
          requestId: 'test_request_first_if',
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
        id: 'request:test_endpoint:test_request_first_if',
        result: 'first if',
      },
    ],
    [{ event: 'debug_control_if', condition: { input: true, evaluated: true } }],
    [{ event: 'debug_control_if_run_then' }],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_second_if',
          type: 'TestRequest',
          requestId: 'test_request_second_if',
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
        id: 'request:test_endpoint:test_request_second_if',
        result: 'second if',
      },
    ],
    [{ event: 'debug_control_reject', response: { info: 'rejected by first if' } }],
  ]);
});
