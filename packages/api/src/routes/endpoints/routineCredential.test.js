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

// A value a routine marks with _credential reaches its caller but no log line. The logger here
// writes each call as one JSON line through scrubCredentials, as the servers' streamWrite hooks do.

import { jest } from '@jest/globals';
import { runInCredentialScope, scrubCredentials } from '@lowdefy/node-utils';
import { operatorsServer } from '@lowdefy/operators-js';

import buildEndpointResult from '../../response/buildEndpointResult.js';
import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import runRoutine from './runRoutine.js';
import testContext from '../../test/testContext.js';

const newKey = 'runtime-made-app-key-0001';
// Made at runtime, as a new key is, so the config itself never holds it.
const makeKey = { '_string.concat': ['runtime-made-', 'app-key-0001'] };
const rootSecret = 'support-root-secret-value';

const mockEcho = jest.fn(({ request }) => request);
mockEcho.schema = {};
mockEcho.meta = { checkRead: false, checkWrite: false };

const endpointConfigs = {
  make_key: {
    endpointId: 'make_key',
    type: 'Api',
    auth: { public: true },
    routine: {
      ':return': {
        key: { _credential: makeKey },
        webhook_secret: {
          _credential: {
            '_hmac.sha256': { key: { _secret: 'SUPPORT_ROOT' }, data: 'app:app_1' },
          },
        },
      },
    },
  },
};

function createLogger(lines) {
  function write(level) {
    return (obj, msg) => {
      lines.push(scrubCredentials(JSON.stringify({ level, ...obj, msg })));
    };
  }
  return {
    debug: write('debug'),
    error: write('error'),
    info: write('info'),
    warn: write('warn'),
  };
}

function createContext(lines) {
  const context = testContext({
    connections: { TestConnection: { schema: {}, requests: { Echo: mockEcho } } },
    logger: createLogger(lines),
    operators: operatorsServer,
    readConfigFile: jest.fn(async (path) => {
      if (path === 'connections/test.json') {
        return { id: 'connection:test', type: 'TestConnection', connectionId: 'test' };
      }
      const match = path.match(/^api\/(.+)\.json$/);
      return match ? endpointConfigs[match[1]] ?? null : null;
    }),
    secrets: { SUPPORT_ROOT: rootSecret },
    user: { id: 'user_1' },
  });
  context.endpointId = 'create_app';
  context.evaluateOperators = createEvaluateOperators(context);
  return context;
}

async function run(routine) {
  const lines = [];
  const context = createContext(lines);
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
  return { context, lines, res, routineContext };
}

test('A credential marked in :set_state is redacted in every later log line and returned whole', async () => {
  const { context, lines, res } = await runInCredentialScope(() =>
    run([
      { ':set_state': { key: { _credential: makeKey } } },
      {
        id: 'request:create_app:save',
        type: 'Echo',
        stepId: 'save',
        connectionId: 'test',
        properties: { key: { _state: 'key' } },
      },
      { ':return': { key: { _state: 'key' } } },
    ])
  );
  const events = lines.map((line) => JSON.parse(line).event);
  expect(events).toEqual(
    expect.arrayContaining(['debug_control_set_state', 'debug_end_request', 'debug_control_return'])
  );
  lines.forEach((line) => expect(line).not.toContain(newKey));
  const setState = JSON.parse(lines.find((line) => line.includes('debug_control_set_state')));
  expect(setState.evaluated.key).toEqual('[REDACTED]');
  expect(res.response).toEqual({ key: newKey });
  expect(buildEndpointResult(context, res).response).toEqual({ key: newKey });
});

test('Credentials a called endpoint marks are redacted in the CallApi step result and the caller :return', async () => {
  const { lines, res } = await runInCredentialScope(() =>
    run([
      {
        id: 'endpoint:create_app:make',
        type: 'CallApi',
        stepId: 'make',
        properties: { endpointId: 'make_key' },
      },
      { ':set_state': { app: { _step: 'make' } } },
      { ':return': { _step: 'make' } },
    ])
  );
  const events = lines.map((line) => JSON.parse(line).event);
  expect(events).toEqual(
    expect.arrayContaining([
      'debug_end_endpoint_call',
      'debug_control_set_state',
      'debug_control_return',
    ])
  );
  const webhookSecret = res.response.webhook_secret;
  expect(res.response.key).toEqual(newKey);
  expect(webhookSecret).toMatch(/^[0-9a-f]{64}$/);
  lines.forEach((line) => {
    expect(line).not.toContain(newKey);
    expect(line).not.toContain(webhookSecret);
  });
  const endCall = JSON.parse(lines.find((line) => line.includes('debug_end_endpoint_call')));
  expect(endCall.response).toEqual({ key: '[REDACTED]', webhook_secret: '[REDACTED]' });
});

test('A credential in a failed request properties is redacted in the logged error and its received', async () => {
  mockEcho.mockImplementationOnce(() => {
    throw new Error(`Upstream refused key ${newKey}.`);
  });
  const { lines, res } = await runInCredentialScope(() =>
    run({
      id: 'request:create_app:save',
      type: 'Echo',
      stepId: 'save',
      connectionId: 'test',
      properties: { key: { _credential: makeKey } },
    })
  );
  expect(res.status).toEqual('error');
  lines.forEach((line) => expect(line).not.toContain(newKey));
  const errorLine = JSON.parse(lines.find((line) => JSON.parse(line).level === 'error'));
  expect(errorLine.received).toEqual({ key: '[REDACTED]' });
});

test('_credential outside a credential scope throws', async () => {
  const { res } = await run({ ':return': { key: { _credential: makeKey } } });
  expect(res.status).toEqual('error');
  expect(res.error.message).toContain(
    'A credential can only be marked while the server handles a request.'
  );
});
