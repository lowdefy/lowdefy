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

// End-to-end checks of the value `_error` reads in a routine: what it resolves to in each position,
// and what reaches the browser when config sends it on. These run the real server operators
// through runRoutine and buildEndpointResult.

import { jest } from '@jest/globals';
import { UserError } from '@lowdefy/errors';
import { wait } from '@lowdefy/helpers';
import { operatorsServer } from '@lowdefy/operators-js';

import buildEndpointResult from '../../response/buildEndpointResult.js';
import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import runRoutine from './runRoutine.js';
import testContext from '../../test/testContext.js';

const secret = 'planted-secret-value';

const mockEcho = jest.fn(({ request }) => request);
const mockFail = jest.fn(async ({ request }) => {
  await wait(request.ms ?? 0);
  const error = new Error(request.message);
  error.received = { token: 'runtime-token' };
  error.source = 'config/file.yaml:3';
  throw error;
});
// The shape AxiosHttp throws for a non-2xx response.
const mockFailHttp = jest.fn(() => {
  const cause = new Error('Request failed with status code 404');
  cause.code = 'ERR_BAD_REQUEST';
  const error = new Error('Http response "404: Not Found".', { cause });
  error.code = cause.code;
  error.statusCode = 404;
  throw error;
});
const mockFailUser = jest.fn(({ request }) => {
  throw new UserError(request.message);
});
const mockWait = jest.fn(({ request }) => wait(request.ms));
[mockEcho, mockFail, mockFailHttp, mockFailUser, mockWait].forEach((resolver) => {
  resolver.schema = {};
  resolver.meta = { checkRead: false, checkWrite: false };
});

const connections = {
  TestConnection: {
    schema: {},
    requests: {
      Echo: mockEcho,
      Fail: mockFail,
      FailHttp: mockFailHttp,
      FailUser: mockFailUser,
      Wait: mockWait,
    },
  },
};

function createContext() {
  const context = testContext({
    connections,
    logger: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
    operators: operatorsServer,
    readConfigFile: jest.fn(async (path) => {
      if (path === 'connections/test.json') {
        return { id: 'connection:test', type: 'TestConnection', connectionId: 'test' };
      }
      return null;
    }),
    scrubSecrets: (value) => value.replaceAll(secret, '[REDACTED]'),
    user: { id: 'user_1' },
  });
  context.endpointId = 'endpointId';
  context.evaluateOperators = createEvaluateOperators(context);
  return context;
}

async function run(routine) {
  const context = createContext();
  const routineContext = {
    arrayIndices: [],
    endpointDepth: 0,
    error: null,
    items: {},
    payload: {},
    state: {},
    steps: {},
  };
  const res = await runRoutine(context, routineContext, { routine });
  return { context, res, routineContext };
}

async function runToBrowser(routine) {
  const { context, res } = await run(routine);
  return buildEndpointResult(context, res);
}

function step({ stepId, type, properties }) {
  return {
    id: `request:endpointId:${stepId}`,
    type,
    stepId,
    connectionId: 'test',
    properties,
  };
}

function fail(stepId, message, ms) {
  return step({ stepId, type: 'Fail', properties: { message, ms } });
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('_error returns the caught error in :catch and null outside it', async () => {
  const { res, routineContext } = await run([
    { ':set_state': { before: { _error: true } } },
    {
      ':try': fail('try_fail', 'Try failed.'),
      ':catch': {
        ':set_state': { message: { _error: 'message' }, name: { _error: 'name' } },
      },
    },
    { ':set_state': { after: { _error: true }, afterMessage: { _error: 'message' } } },
  ]);
  expect(res.status).toEqual('continue');
  expect(routineContext.state).toEqual({
    before: null,
    message: 'Try failed. at test/try_fail.',
    name: 'RequestError',
    after: null,
    afterMessage: null,
  });
});

test('_error resolves to the innermost catch and to the outer error again after an inner try', async () => {
  const { res, routineContext } = await run({
    ':try': fail('outer_fail', 'Outer failed.'),
    ':catch': [
      {
        ':try': fail('inner_fail', 'Inner failed.'),
        ':catch': { ':set_state': { inner: { _error: 'message' } } },
        ':finally': { ':set_state': { innerFinally: { _error: 'message' } } },
      },
      { ':set_state': { afterInner: { _error: 'message' } } },
    ],
    ':finally': { ':set_state': { outerFinally: { _error: true } } },
  });
  expect(res.status).toEqual('continue');
  expect(routineContext.state).toEqual({
    inner: 'Inner failed. at test/inner_fail.',
    innerFinally: 'Outer failed. at test/outer_fail.',
    afterInner: 'Outer failed. at test/outer_fail.',
    outerFinally: null,
  });
});

test('_error in two :parallel branches that both catch reads each branch its own error', async () => {
  // Branch A fails first and reads after branch B has caught, so a shared error field would
  // hand A the error of B.
  const { res, routineContext } = await run({
    ':parallel': [
      {
        ':try': fail('fail_a', 'Branch A failed.', 0),
        ':catch': [
          step({ stepId: 'wait_a', type: 'Wait', properties: { ms: 30 } }),
          { ':set_state': { a: { _error: 'message' } } },
        ],
      },
      {
        ':try': fail('fail_b', 'Branch B failed.', 10),
        ':catch': { ':set_state': { b: { _error: 'message' } } },
      },
    ],
  });
  expect(res.status).toEqual('continue');
  expect(routineContext.state.a).toEqual('Branch A failed. at test/fail_a.');
  expect(routineContext.state.b).toEqual('Branch B failed. at test/fail_b.');
});

test('_error never holds a reject, because :reject bypasses :catch', async () => {
  const { res, routineContext } = await run({
    ':try': { ':reject': 'Rejected.' },
    ':catch': { ':set_state': { caught: { _error: true } } },
  });
  expect(res.status).toEqual('reject');
  expect(routineContext.state).toEqual({});
});

test('_error resolves in a request step inside a :for inside a :catch', async () => {
  const { res, routineContext } = await run({
    ':try': fail('try_fail', 'Try failed.'),
    ':catch': {
      ':for': 'value',
      ':in': [1, 2],
      ':do': step({
        stepId: 'echo',
        type: 'Echo',
        properties: { caught: { _error: 'message' }, value: { _item: 'value' } },
      }),
    },
  });
  expect(res.status).toEqual('continue');
  expect(routineContext.steps.echo).toEqual([
    { caught: 'Try failed. at test/try_fail.', value: 1 },
    { caught: 'Try failed. at test/try_fail.', value: 2 },
  ]);
});

test('_error statusCode is 404 for an AxiosHttp 404 wrapped in a RequestError', async () => {
  const { routineContext } = await run({
    ':try': step({ stepId: 'http', type: 'FailHttp', properties: {} }),
    ':catch': {
      ':set_state': {
        name: { _error: 'name' },
        statusCode: { _error: 'statusCode' },
        code: { _error: 'code' },
      },
    },
  });
  expect(routineContext.state).toEqual({
    name: 'RequestError',
    statusCode: 404,
    code: 'ERR_BAD_REQUEST',
  });
});

test('_error carries no received, source, config, configKey or location', async () => {
  const { res, routineContext } = await run({
    ':try': fail('try_fail', 'Try failed.'),
    ':catch': {
      ':set_state': {
        whole: { _error: true },
        received: { _error: 'received' },
        causeReceived: { _error: 'cause.received' },
        source: { _error: 'source' },
        causeSource: { _error: 'cause.source' },
        config: { _error: 'config' },
        configKey: { _error: 'configKey' },
        location: { _error: 'location' },
      },
    },
  });
  const { whole, ...reads } = routineContext.state;
  expect(res.status).toEqual('continue');
  expect(reads).toEqual({
    received: null,
    causeReceived: null,
    source: null,
    causeSource: null,
    config: null,
    configKey: null,
    location: null,
  });
  expect(whole).toBeInstanceOf(Error);
  ['received', 'source', 'config', 'configKey', 'location', 'stack'].forEach((key) => {
    expect(Object.hasOwn(whole, key)).toBe(false);
    expect(Object.hasOwn(whole.cause, key)).toBe(false);
  });
});

test('_error scrubs a known secret from the caught message', async () => {
  const { routineContext } = await run({
    ':try': fail('try_fail', `Connect failed with ${secret}.`),
    ':catch': { ':set_state': { message: { _error: 'message' } } },
  });
  expect(routineContext.state.message).toEqual('Connect failed with [REDACTED]. at test/try_fail.');
});

test('_error placed in request properties is sent without its message', async () => {
  const { routineContext } = await run({
    ':try': fail('try_fail', 'Try failed.'),
    ':catch': step({
      stepId: 'post',
      type: 'Echo',
      properties: { body: { error: { _error: true } } },
    }),
  });
  const sent = JSON.parse(JSON.stringify(routineContext.steps.post));
  expect(sent.body.error.message).toBeUndefined();
  expect(sent.body.error.name).toEqual('RequestError');
});

test(':throw with :cause _error reaches the browser with the cause in the generic wire shape', async () => {
  const result = await runToBrowser({
    ':try': fail('try_fail', 'Try failed.'),
    ':catch': { ':throw': 'Could not save.', ':cause': { _error: true } },
  });
  expect(result.status).toEqual('error');
  expect(result.error['~e'].name).toEqual('UserError');
  expect(result.error['~e'].message).toEqual('Could not save.');
  expect(result.error['~e'].cause).toMatchObject({
    name: 'RequestError',
    message: 'Something went wrong.',
    isLowdefyError: true,
  });
  expect(JSON.stringify(result)).not.toContain('Try failed.');
});

test(':return of _error reaches the browser in the generic wire shape', async () => {
  const result = await runToBrowser({
    ':try': fail('try_fail', 'Try failed.'),
    ':catch': { ':return': { _error: true } },
  });
  expect(result.status).toEqual('success');
  expect(result.response['~e'].name).toEqual('RequestError');
  expect(result.response['~e'].message).toEqual('Something went wrong.');
  expect(JSON.stringify(result)).not.toContain('Try failed.');
});

test(':throw of _error message reaches the browser with the real message', async () => {
  const result = await runToBrowser({
    ':try': fail('try_fail', 'Try failed.'),
    ':catch': { ':throw': { _error: 'message' } },
  });
  expect(result.error['~e'].name).toEqual('UserError');
  expect(result.error['~e'].message).toEqual('Try failed. at test/try_fail.');
});

test(':throw of _error reaches the browser generic, keeping statusCode, handled and isLowdefyError', async () => {
  const result = await runToBrowser({
    ':try': step({ stepId: 'http', type: 'FailHttp', properties: {} }),
    ':catch': { ':throw': { _error: true } },
  });
  expect(result.status).toEqual('error');
  expect(result.error['~e']).toMatchObject({
    name: 'RequestError',
    message: 'Something went wrong.',
    code: 'ERR_BAD_REQUEST',
    statusCode: 404,
    handled: true,
    isLowdefyError: true,
  });
  expect(JSON.stringify(result)).not.toContain('Not Found');
});

test(':throw of a caught UserError keeps its message', async () => {
  const result = await runToBrowser({
    ':try': step({ stepId: 'user', type: 'FailUser', properties: { message: 'Name taken.' } }),
    ':catch': { ':throw': { _error: true } },
  });
  expect(result.error['~e']).toMatchObject({
    name: 'UserError',
    message: 'Name taken.',
    isLowdefyError: true,
  });
});

test(':reject of _error rejects with the generic message for a plugin error', async () => {
  const result = await runToBrowser({
    ':try': fail('try_fail', 'Try failed.'),
    ':catch': { ':reject': { _error: true } },
  });
  expect(result.status).toEqual('reject');
  expect(result.error['~e']).toMatchObject({
    name: 'UserError',
    message: 'Something went wrong.',
    isReject: true,
  });
  expect(JSON.stringify(result)).not.toContain('Try failed.');
});
