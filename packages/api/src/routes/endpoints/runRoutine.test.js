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

import runTest from './test/runTest.js';

test('single stage', async () => {
  const routine = {
    requestId: 'test_request',
    type: 'TestRequest',
    id: 'request:test_endpoint:test_request',
    connectionId: 'test',
    properties: {
      response: 1,
    },
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(context.steps).toEqual({ test_request: 1 });
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request',
          type: 'TestRequest',
          requestId: 'test_request',
          connectionId: 'test',
          properties: {
            response: 1,
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request',
        result: 1,
      },
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('array with single stage', async () => {
  const routine = [
    {
      requestId: 'test_request',
      type: 'TestRequest',
      id: 'request:test_endpoint:test_request',
      connectionId: 'test',
      properties: {
        response: 1,
      },
    },
  ];
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(context.steps).toEqual({ test_request: 1 });
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request',
          type: 'TestRequest',
          requestId: 'test_request',
          connectionId: 'test',
          properties: {
            response: 1,
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request',
        result: 1,
      },
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('array with two stages', async () => {
  const routine = [
    {
      requestId: 'test_request_1',
      type: 'TestRequest',
      id: 'request:test_endpoint:test_request_1',
      connectionId: 'test',
      properties: {
        response: 1,
      },
    },
    {
      requestId: 'test_request_2',
      type: 'TestRequest',
      id: 'request:test_endpoint:test_request_2',
      connectionId: 'test',
      properties: {
        response: 2,
      },
    },
  ];
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(context.steps).toEqual({ test_request_1: 1, test_request_2: 2 });
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_1',
          type: 'TestRequest',
          requestId: 'test_request_1',
          connectionId: 'test',
          properties: {
            response: 1,
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_1',
        result: 1,
      },
    ],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_2',
          type: 'TestRequest',
          requestId: 'test_request_2',
          connectionId: 'test',
          properties: {
            response: 2,
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_2',
        result: 2,
      },
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('nested array', async () => {
  const routine = [
    [
      {
        requestId: 'test_request_1',
        type: 'TestRequest',
        id: 'request:test_endpoint:test_request_1',
        connectionId: 'test',
        properties: {
          response: 1,
        },
      },
      {
        requestId: 'test_request_2',
        type: 'TestRequest',
        id: 'request:test_endpoint:test_request_2',
        connectionId: 'test',
        properties: {
          response: 2,
        },
      },
    ],
    {
      requestId: 'test_request_3',
      type: 'TestRequest',
      id: 'request:test_endpoint:test_request_3',
      connectionId: 'test',
      properties: {
        response: 3,
      },
    },
  ];
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(context.steps).toEqual({ test_request_1: 1, test_request_2: 2, test_request_3: 3 });
  expect(res.response).toEqual(undefined);
});

test('unknown control', async () => {
  const routine = {
    ':unknown': {
      requestId: 'test_request',
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

test.todo('_payload operator');
test.todo('_state operator');
test.todo('_secrets operator');
test.todo('_user operator');
test.todo('_js operator');
