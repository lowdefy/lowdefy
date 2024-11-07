import { RequestError } from '../../../context/errors.js';
import runTest from '../test/runTest.js';

/*
try catch with successful try √
try catch with unsuccessful try √
try only, successful √
try only, fail √
try with finally, without catch, successful try √
try with finally, without catch, unsuccessful try √
try catch finally, try pass √
try catch finally, try fail √
catch without try √
finally without try √

try catch with unsuccessful try and catch fail √
test throw in try
test reject in try
*/

test('try catch with successful try', async () => {
  const routine = {
    ':try': {
      id: 'request:test_endpoint:try_pass',
      type: 'TestRequest',
      requestId: 'request:test_endpoint:try_pass',
      connectionId: 'test',
      properties: {
        response: 'Success',
      },
    },
    ':catch': {
      id: 'request:test_endpoint:catch_error',
      type: 'TestRequest',
      requestId: 'request:test_endpoint:catch_error',
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
          requestId: 'request:test_endpoint:try_pass',
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
        requestResult: 'Success',
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
      requestId: 'request:test_endpoint:try_fail',
      connectionId: 'test',
      properties: {
        message: 'Try and fail',
      },
    },
    ':catch': {
      id: 'request:test_endpoint:catch_error',
      type: 'TestRequest',
      requestId: 'request:test_endpoint:catch_error',
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
          requestId: 'request:test_endpoint:try_fail',
          connectionId: 'test',
          properties: {
            message: 'Try and fail',
          },
        },
      },
    ],
    [
      {
        err: new RequestError('Try and fail'),
        params: {
          id: 'request:test_endpoint:try_fail',
          type: 'TestRequestError',
        },
      },
      'Try and fail',
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
          requestId: 'request:test_endpoint:catch_error',
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
        requestResult: 'Fallback thing',
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
      requestId: 'request:test_endpoint:try_pass',
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
          requestId: 'request:test_endpoint:try_pass',
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
        requestResult: 'Success',
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
      requestId: 'request:test_endpoint:try_fail',
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
          requestId: 'request:test_endpoint:try_fail',
          connectionId: 'test',
          properties: {
            message: 'Try and fail',
          },
        },
      },
    ],
    [
      {
        err: new RequestError('Try and fail'),
        params: {
          id: 'request:test_endpoint:try_fail',
          type: 'TestRequestError',
        },
      },
      'Try and fail',
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('try with finally, try pass', async () => {
  const routine = {
    ':try': {
      id: 'request:test_endpoint:try_pass',
      type: 'TestRequest',
      requestId: 'request:test_endpoint:try_pass',
      connectionId: 'test',
      properties: {
        response: 'Success',
      },
    },
    ':finally': {
      id: 'request:test_endpoint:try_finally',
      type: 'TestRequest',
      requestId: 'request:test_endpoint:try_finally',
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
          requestId: 'request:test_endpoint:try_pass',
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
        requestResult: 'Success',
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
          requestId: 'request:test_endpoint:try_finally',
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
        requestResult: 'Always do this',
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
      requestId: 'request:test_endpoint:try_fail',
      connectionId: 'test',
      properties: {
        message: 'Try and fail',
      },
    },
    ':finally': {
      id: 'request:test_endpoint:try_finally',
      type: 'TestRequest',
      requestId: 'request:test_endpoint:try_finally',
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
          requestId: 'request:test_endpoint:try_fail',
          connectionId: 'test',
          properties: {
            message: 'Try and fail',
          },
        },
      },
    ],
    [
      {
        err: new RequestError('Try and fail'),
        params: {
          id: 'request:test_endpoint:try_fail',
          type: 'TestRequestError',
        },
      },
      'Try and fail',
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
          requestId: 'request:test_endpoint:try_finally',
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
        requestResult: 'Always do this',
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
      requestId: 'request:test_endpoint:try_pass',
      connectionId: 'test',
      properties: {
        response: 'Success',
      },
    },
    ':catch': {
      id: 'request:test_endpoint:catch_error',
      type: 'TestRequest',
      requestId: 'request:test_endpoint:catch_error',
      connectionId: 'test',
      properties: {
        response: 'Fallback thing',
      },
    },
    ':finally': {
      id: 'request:test_endpoint:try_finally',
      type: 'TestRequest',
      requestId: 'request:test_endpoint:try_finally',
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
          requestId: 'request:test_endpoint:try_pass',
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
        requestResult: 'Success',
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
          requestId: 'request:test_endpoint:try_finally',
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
        requestResult: 'Always do this',
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
      requestId: 'request:test_endpoint:try_fail',
      connectionId: 'test',
      properties: {
        message: 'Try and fail',
      },
    },
    ':catch': {
      id: 'request:test_endpoint:catch_error',
      type: 'TestRequest',
      requestId: 'request:test_endpoint:catch_error',
      connectionId: 'test',
      properties: {
        response: 'Fallback thing',
      },
    },
    ':finally': {
      id: 'request:test_endpoint:try_finally',
      type: 'TestRequest',
      requestId: 'request:test_endpoint:try_finally',
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
          requestId: 'request:test_endpoint:try_fail',
          connectionId: 'test',
          properties: {
            message: 'Try and fail',
          },
        },
      },
    ],
    [
      {
        err: new RequestError('Try and fail'),
        params: {
          id: 'request:test_endpoint:try_fail',
          type: 'TestRequestError',
        },
      },
      'Try and fail',
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
          requestId: 'request:test_endpoint:catch_error',
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
        requestResult: 'Fallback thing',
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
          requestId: 'request:test_endpoint:try_finally',
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
        requestResult: 'Always do this',
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
      requestId: 'request:test_endpoint:try_fail',
      connectionId: 'test',
      properties: {
        message: 'Try and fail',
      },
    },
    ':catch': {
      id: 'request:test_endpoint:catch_error',
      type: 'TestRequestError',
      requestId: 'request:test_endpoint:catch_error',
      connectionId: 'test',
      properties: {
        message: 'Fallback thing fail',
      },
    },
    ':finally': {
      id: 'request:test_endpoint:try_finally',
      type: 'TestRequest',
      requestId: 'request:test_endpoint:try_finally',
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
          requestId: 'request:test_endpoint:try_fail',
          connectionId: 'test',
          properties: {
            message: 'Try and fail',
          },
        },
      },
    ],
    [
      {
        err: new RequestError('Try and fail'),
        params: {
          id: 'request:test_endpoint:try_fail',
          type: 'TestRequestError',
        },
      },
      'Try and fail',
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
          requestId: 'request:test_endpoint:catch_error',
          connectionId: 'test',
          properties: {
            message: 'Fallback thing fail',
          },
        },
      },
    ],
    [
      {
        err: new RequestError('Fallback thing fail'),
        params: {
          id: 'request:test_endpoint:catch_error',
          type: 'TestRequestError',
        },
      },
      'Fallback thing fail',
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
          requestId: 'request:test_endpoint:try_finally',
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
        requestResult: 'Always do this',
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
      requestId: 'request:test_endpoint:catch_error',
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
          requestId: 'request:test_endpoint:catch_error',
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
        requestResult: 'Fallback thing',
      },
    ],
  ]);
  expect(res.response).toEqual(undefined);
});

test('try catch with reject in try', async () => {
  const routine = {
    ':try': {
      ':reject': {
        info: 'Rejected',
      },
    },
    ':catch': {
      id: 'request:test_endpoint:catch_error',
      type: 'TestRequest',
      requestId: 'request:test_endpoint:catch_error',
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
    [{ event: 'debug_control_reject', response: { info: 'Rejected' } }],
  ]);
  expect(res.response).toEqual({ info: 'Rejected' });
});
