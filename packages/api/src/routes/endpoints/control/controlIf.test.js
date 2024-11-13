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

test('if condition is true', async () => {
  const routine = {
    ':if': true,
    ':then': {
      id: 'request:test_endpoint:test_request_true',
      type: 'TestRequest',
      requestId: 'test_request_true',
      connectionId: 'test',
      properties: {
        response: 'Was true',
      },
    },
    ':else': {
      id: 'request:test_endpoint:test_request_false',
      type: 'TestRequest',
      requestId: 'test_request_true',
      connectionId: 'test',
      properties: {
        response: 'Was false',
      },
    },
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_control_if',
        condition: {
          input: true,
          evaluated: true,
        },
      },
    ],
    [
      {
        event: 'debug_control_if_run_then',
      },
    ],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_true',
          type: 'TestRequest',
          connectionId: 'test',
          requestId: 'test_request_true',
          properties: {
            response: 'Was true',
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_true',
        result: 'Was true',
      },
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('if condition is false', async () => {
  const routine = {
    ':if': false,
    ':then': {
      id: 'request:test_endpoint:test_request_true',
      type: 'TestRequest',
      requestId: 'test_request_true',
      connectionId: 'test',
      properties: {
        response: 'Was true',
      },
    },
    ':else': {
      id: 'request:test_endpoint:test_request_false',
      type: 'TestRequest',
      requestId: 'test_request_false',
      connectionId: 'test',
      properties: {
        response: 'Was false',
      },
    },
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toBe('continue');
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_control_if',
        condition: {
          input: false,
          evaluated: false,
        },
      },
    ],
    [
      {
        event: 'debug_control_if_run_else',
      },
    ],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_false',
          type: 'TestRequest',
          requestId: 'test_request_false',
          connectionId: 'test',
          properties: {
            response: 'Was false',
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_false',
        result: 'Was false',
      },
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('if condition is truthy', async () => {
  const routine = {
    ':if': 1,
    ':then': {
      id: 'request:test_endpoint:test_request_true',
      type: 'TestRequest',
      requestId: 'test_request_true',
      connectionId: 'test',
      properties: {
        response: 'Was true',
      },
    },
    ':else': {
      id: 'request:test_endpoint:test_request_false',
      type: 'TestRequest',
      requestId: 'test_request_false',
      connectionId: 'test',
      properties: {
        response: 'Was false',
      },
    },
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toBe('continue');
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_control_if',
        condition: {
          input: 1,
          evaluated: 1,
        },
      },
    ],
    [
      {
        event: 'debug_control_if_run_then',
      },
    ],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_true',
          type: 'TestRequest',
          requestId: 'test_request_true',
          connectionId: 'test',
          properties: {
            response: 'Was true',
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_true',
        result: 'Was true',
      },
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('if condition is falsey', async () => {
  const routine = {
    ':if': 0,
    ':then': {
      id: 'request:test_endpoint:test_request_true',
      type: 'TestRequest',
      requestId: 'test_request_true',
      connectionId: 'test',
      properties: {
        response: 'Was true',
      },
    },
    ':else': {
      id: 'request:test_endpoint:test_request_false',
      type: 'TestRequest',
      requestId: 'test_request_false',
      connectionId: 'test',
      properties: {
        response: 'Was false',
      },
    },
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toBe('continue');
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_control_if',
        condition: {
          input: 0,
          evaluated: 0,
        },
      },
    ],
    [
      {
        event: 'debug_control_if_run_else',
      },
    ],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_false',
          type: 'TestRequest',
          requestId: 'test_request_false',
          connectionId: 'test',
          properties: {
            response: 'Was false',
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_false',
        result: 'Was false',
      },
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('if condition is null', async () => {
  const routine = {
    ':if': null,
    ':then': {
      id: 'request:test_endpoint:test_request_true',
      type: 'TestRequest',
      requestId: 'test_request_true',
      connectionId: 'test',
      properties: {
        response: 'Was true',
      },
    },
    ':else': {
      id: 'request:test_endpoint:test_request_false',
      type: 'TestRequest',
      requestId: 'test_request_false',
      connectionId: 'test',
      properties: {
        response: 'Was false',
      },
    },
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toBe('continue');
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_control_if',
        condition: {
          input: null,
          evaluated: null,
        },
      },
    ],
    [
      {
        event: 'debug_control_if_run_else',
      },
    ],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_false',
          type: 'TestRequest',
          requestId: 'test_request_false',
          connectionId: 'test',
          properties: {
            response: 'Was false',
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_false',
        result: 'Was false',
      },
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('if condition operators are evaluated', async () => {
  const routine = {
    ':if': {
      _eq: [1, 2],
    },
    ':then': {
      id: 'request:test_endpoint:test_request_true',
      type: 'TestRequest',
      requestId: 'test_request_true',
      connectionId: 'test',
      properties: {
        response: 'Was true',
      },
    },
    ':else': {
      id: 'request:test_endpoint:test_request_false',
      type: 'TestRequest',
      requestId: 'test_request_false',
      connectionId: 'test',
      properties: {
        response: 'Was false',
      },
    },
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toBe('continue');
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_control_if',
        condition: {
          input: {
            _eq: [1, 2],
          },
          evaluated: false,
        },
      },
    ],
    [
      {
        event: 'debug_control_if_run_else',
      },
    ],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_false',
          type: 'TestRequest',
          requestId: 'test_request_false',
          connectionId: 'test',
          properties: {
            response: 'Was false',
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_false',
        result: 'Was false',
      },
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('if condition is false with no else', async () => {
  const routine = {
    ':if': false,
    ':then': {
      id: 'request:test_endpoint:test_request_true',
      type: 'TestRequest',
      requestId: 'test_request_true',
      connectionId: 'test',
      properties: {
        response: 'Was true',
      },
    },
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toBe('continue');
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_control_if',
        condition: {
          input: false,
          evaluated: false,
        },
      },
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('if condition is true with no else', async () => {
  const routine = {
    ':if': true,
    ':then': {
      id: 'request:test_endpoint:test_request_true',
      type: 'TestRequest',
      requestId: 'test_request_true',
      connectionId: 'test',
      properties: {
        response: 'Was true',
      },
    },
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toBe('continue');
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_control_if',
        condition: {
          input: true,
          evaluated: true,
        },
      },
    ],
    [
      {
        event: 'debug_control_if_run_then',
      },
    ],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:test_request_true',
          type: 'TestRequest',
          requestId: 'test_request_true',
          connectionId: 'test',
          properties: {
            response: 'Was true',
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:test_request_true',
        result: 'Was true',
      },
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

// TODO: NOt catching err in test
test('missing :then', async () => {
  const routine = {
    ':if': true,
  };
  const { res } = await runTest({ routine });
  expect(res.status).toBe('error');
  expect(res.error.message).toEqual('Invalid :if - missing :then.');
});
