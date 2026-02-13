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

import { PluginError } from '@lowdefy/errors/server';

import runTest from '../test/runTest.js';

test('try catch with successful try', async () => {
  const routine = {
    ':try': {
      id: 'request:test_endpoint:try_pass',
      type: 'TestRequest',
      requestId: 'try_pass',
      connectionId: 'test',
      properties: {
        response: 'Success',
      },
    },
    ':catch': {
      id: 'request:test_endpoint:catch_error',
      type: 'TestRequest',
      requestId: 'catch_error',
      connectionId: 'test',
      properties: {
        response: 'Fallback thing',
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
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:try_pass',
          type: 'TestRequest',
          requestId: 'try_pass',
          connectionId: 'test',
          properties: {
            response: 'Success',
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:try_pass',
        result: 'Success',
      },
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('try catch with unsuccessful try', async () => {
  const routine = {
    ':try': {
      id: 'request:test_endpoint:try_fail',
      type: 'TestRequestError',
      requestId: 'try_fail',
      connectionId: 'test',
      properties: {
        message: 'Try and fail',
      },
    },
    ':catch': {
      id: 'request:test_endpoint:catch_error',
      type: 'TestRequest',
      requestId: 'catch_error',
      connectionId: 'test',
      properties: {
        response: 'Fallback thing',
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
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:try_fail',
          type: 'TestRequestError',
          requestId: 'try_fail',
          connectionId: 'test',
          properties: {
            message: 'Try and fail',
          },
        },
      },
    ],
    [
      {
        err: new PluginError({
          error: new Error('Try and fail'),
          location: 'test/try_fail',
        }),
        params: {
          id: 'try_fail',
          type: 'TestRequestError',
        },
      },
      'Try and fail at test/try_fail.',
    ],
    [
      {
        event: 'debug_control_catch',
      },
    ],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:catch_error',
          type: 'TestRequest',
          requestId: 'catch_error',
          connectionId: 'test',
          properties: {
            response: 'Fallback thing',
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:catch_error',
        result: 'Fallback thing',
      },
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('try only, success', async () => {
  const routine = {
    ':try': {
      id: 'request:test_endpoint:try_pass',
      type: 'TestRequest',
      requestId: 'try_pass',
      connectionId: 'test',
      properties: {
        response: 'Success',
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
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:try_pass',
          type: 'TestRequest',
          requestId: 'try_pass',
          connectionId: 'test',
          properties: {
            response: 'Success',
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:try_pass',
        result: 'Success',
      },
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('try only, fail', async () => {
  const routine = {
    ':try': {
      id: 'request:test_endpoint:try_fail',
      type: 'TestRequestError',
      requestId: 'try_fail',
      connectionId: 'test',
      properties: {
        message: 'Try and fail',
      },
    },
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('error');
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_control_try',
      },
    ],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:try_fail',
          type: 'TestRequestError',
          requestId: 'try_fail',
          connectionId: 'test',
          properties: {
            message: 'Try and fail',
          },
        },
      },
    ],
    [
      {
        err: new PluginError({
          error: new Error('Try and fail'),
          location: 'test/try_fail',
        }),
        params: {
          id: 'try_fail',
          type: 'TestRequestError',
        },
      },
      'Try and fail at test/try_fail.',
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('try with finally, try pass', async () => {
  const routine = {
    ':try': {
      id: 'request:test_endpoint:try_pass',
      type: 'TestRequest',
      requestId: 'try_pass',
      connectionId: 'test',
      properties: {
        response: 'Success',
      },
    },
    ':finally': {
      id: 'request:test_endpoint:try_finally',
      type: 'TestRequest',
      requestId: 'try_finally',
      connectionId: 'test',
      properties: {
        response: 'Always do this',
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
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:try_pass',
          type: 'TestRequest',
          requestId: 'try_pass',
          connectionId: 'test',
          properties: {
            response: 'Success',
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:try_pass',
        result: 'Success',
      },
    ],
    [
      {
        event: 'debug_control_finally',
      },
    ],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:try_finally',
          type: 'TestRequest',
          requestId: 'try_finally',
          connectionId: 'test',
          properties: {
            response: 'Always do this',
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:try_finally',
        result: 'Always do this',
      },
    ],
  ]);
  expect(res.response).toEqual(undefined);
});
test('try with finally, try fail', async () => {
  const routine = {
    ':try': {
      id: 'request:test_endpoint:try_fail',
      type: 'TestRequestError',
      requestId: 'try_fail',
      connectionId: 'test',
      properties: {
        message: 'Try and fail',
      },
    },
    ':finally': {
      id: 'request:test_endpoint:try_finally',
      type: 'TestRequest',
      requestId: 'try_finally',
      connectionId: 'test',
      properties: {
        response: 'Always do this',
      },
    },
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('error');
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_control_try',
      },
    ],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:try_fail',
          type: 'TestRequestError',
          requestId: 'try_fail',
          connectionId: 'test',
          properties: {
            message: 'Try and fail',
          },
        },
      },
    ],
    [
      {
        err: new PluginError({
          error: new Error('Try and fail'),
          location: 'test/try_fail',
        }),
        params: {
          id: 'try_fail',
          type: 'TestRequestError',
        },
      },
      'Try and fail at test/try_fail.',
    ],
    [
      {
        event: 'debug_control_finally',
      },
    ],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:try_finally',
          type: 'TestRequest',
          requestId: 'try_finally',
          connectionId: 'test',
          properties: {
            response: 'Always do this',
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:try_finally',
        result: 'Always do this',
      },
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('try catch finally, try pass', async () => {
  const routine = {
    ':try': {
      id: 'request:test_endpoint:try_pass',
      type: 'TestRequest',
      requestId: 'try_pass',
      connectionId: 'test',
      properties: {
        response: 'Success',
      },
    },
    ':catch': {
      id: 'request:test_endpoint:catch_error',
      type: 'TestRequest',
      requestId: 'catch_error',
      connectionId: 'test',
      properties: {
        response: 'Fallback thing',
      },
    },
    ':finally': {
      id: 'request:test_endpoint:try_finally',
      type: 'TestRequest',
      requestId: 'try_finally',
      connectionId: 'test',
      properties: {
        response: 'Always do this',
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
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:try_pass',
          type: 'TestRequest',
          requestId: 'try_pass',
          connectionId: 'test',
          properties: {
            response: 'Success',
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:try_pass',
        result: 'Success',
      },
    ],
    [
      {
        event: 'debug_control_finally',
      },
    ],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:try_finally',
          type: 'TestRequest',
          requestId: 'try_finally',
          connectionId: 'test',
          properties: {
            response: 'Always do this',
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:try_finally',
        result: 'Always do this',
      },
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('try catch finally, try fail', async () => {
  const routine = {
    ':try': {
      id: 'request:test_endpoint:try_fail',
      type: 'TestRequestError',
      requestId: 'try_fail',
      connectionId: 'test',
      properties: {
        message: 'Try and fail',
      },
    },
    ':catch': {
      id: 'request:test_endpoint:catch_error',
      type: 'TestRequest',
      requestId: 'catch_error',
      connectionId: 'test',
      properties: {
        response: 'Fallback thing',
      },
    },
    ':finally': {
      id: 'request:test_endpoint:try_finally',
      type: 'TestRequest',
      requestId: 'try_finally',
      connectionId: 'test',
      properties: {
        response: 'Always do this',
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
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:try_fail',
          type: 'TestRequestError',
          requestId: 'try_fail',
          connectionId: 'test',
          properties: {
            message: 'Try and fail',
          },
        },
      },
    ],
    [
      {
        err: new PluginError({
          error: new Error('Try and fail'),
          location: 'test/try_fail',
        }),
        params: {
          id: 'try_fail',
          type: 'TestRequestError',
        },
      },
      'Try and fail at test/try_fail.',
    ],
    [
      {
        event: 'debug_control_catch',
      },
    ],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:catch_error',
          type: 'TestRequest',
          requestId: 'catch_error',
          connectionId: 'test',
          properties: {
            response: 'Fallback thing',
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:catch_error',
        result: 'Fallback thing',
      },
    ],
    [
      {
        event: 'debug_control_finally',
      },
    ],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:try_finally',
          type: 'TestRequest',
          requestId: 'try_finally',
          connectionId: 'test',
          properties: {
            response: 'Always do this',
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:try_finally',
        result: 'Always do this',
      },
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('try catch finally, try and catch fail', async () => {
  const routine = {
    ':try': {
      id: 'request:test_endpoint:try_fail',
      type: 'TestRequestError',
      requestId: 'try_fail',
      connectionId: 'test',
      properties: {
        message: 'Try and fail',
      },
    },
    ':catch': {
      id: 'request:test_endpoint:catch_error',
      type: 'TestRequestError',
      requestId: 'catch_error',
      connectionId: 'test',
      properties: {
        message: 'Fallback thing fail',
      },
    },
    ':finally': {
      id: 'request:test_endpoint:try_finally',
      type: 'TestRequest',
      requestId: 'try_finally',
      connectionId: 'test',
      properties: {
        response: 'Always do this',
      },
    },
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('error');
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_control_try',
      },
    ],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:try_fail',
          type: 'TestRequestError',
          requestId: 'try_fail',
          connectionId: 'test',
          properties: {
            message: 'Try and fail',
          },
        },
      },
    ],
    [
      {
        err: new PluginError({
          error: new Error('Try and fail'),
          location: 'test/try_fail',
        }),
        params: {
          id: 'try_fail',
          type: 'TestRequestError',
        },
      },
      'Try and fail at test/try_fail.',
    ],
    [
      {
        event: 'debug_control_catch',
      },
    ],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:catch_error',
          type: 'TestRequestError',
          requestId: 'catch_error',
          connectionId: 'test',
          properties: {
            message: 'Fallback thing fail',
          },
        },
      },
    ],
    [
      {
        err: new PluginError({
          error: new Error('Fallback thing fail'),
          location: 'test/catch_error',
        }),
        params: {
          id: 'catch_error',
          type: 'TestRequestError',
        },
      },
      'Fallback thing fail at test/catch_error.',
    ],
    [
      {
        event: 'debug_control_finally',
      },
    ],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:try_finally',
          type: 'TestRequest',
          requestId: 'try_finally',
          connectionId: 'test',
          properties: {
            response: 'Always do this',
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:try_finally',
        result: 'Always do this',
      },
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('try catch with throw in try', async () => {
  const routine = {
    ':try': {
      ':throw': 'Error has occurred',
    },
    ':catch': {
      id: 'request:test_endpoint:catch_error',
      type: 'TestRequest',
      requestId: 'catch_error',
      connectionId: 'test',
      properties: {
        response: 'Fallback thing',
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
        event: 'debug_control_catch',
      },
    ],
    [
      {
        event: 'debug_start_request',
        request: {
          id: 'request:test_endpoint:catch_error',
          type: 'TestRequest',
          requestId: 'catch_error',
          connectionId: 'test',
          properties: {
            response: 'Fallback thing',
          },
        },
      },
    ],
    [
      {
        event: 'debug_end_request',
        id: 'request:test_endpoint:catch_error',
        result: 'Fallback thing',
      },
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('try catch with reject in try', async () => {
  const routine = {
    ':try': {
      ':reject': 'Rejected',
    },
    ':catch': {
      id: 'request:test_endpoint:catch_error',
      type: 'TestRequest',
      requestId: 'catch_error',
      connectionId: 'test',
      properties: {
        response: 'Fallback thing',
      },
    },
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('reject');
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_control_try',
      },
    ],
  ]);
  expect(res.error).toEqual(new Error('Rejected'));
});
